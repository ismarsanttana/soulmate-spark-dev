import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TRANSPARENCIA_BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('PORTAL_TRANSPARENCIA_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, codigo_ibge, ano, mes, programa } = await req.json();

    console.log('Transparência API action:', action);

    if (!apiKey) {
      return new Response(JSON.stringify({
        warning: 'API key do Portal da Transparência não configurada',
        message: 'Configure a chave de API para acessar os dados',
        link: 'https://api.portaldatransparencia.gov.br/'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check cache
    const cacheKey = JSON.stringify({ action, codigo_ibge, ano, mes, programa });
    const { data: cachedData } = await supabase
      .from('api_cache')
      .select('response_data')
      .eq('api_source', 'transparencia')
      .eq('endpoint', action)
      .eq('parameters', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log('Returning cached Transparência data');
      return new Response(JSON.stringify(cachedData.response_data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let responseData;

    switch (action) {
      case 'get-transferencias': {
        // Buscar transferências federais para o município
        let url = `${TRANSPARENCIA_BASE_URL}/transferencias?codigoIbge=${codigo_ibge}&ano=${ano}`;
        if (mes) url += `&mes=${mes}`;
        if (programa) url += `&programa=${programa}`;

        console.log('Fetching Transparência:', url);

        const response = await fetch(url, {
          headers: {
            'chave-api-dados': apiKey,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Portal Transparência API error: ${response.status}`);
        }

        const data = await response.json();

        // Salvar no banco
        if (Array.isArray(data) && data.length > 0) {
          const transferenciasData = data.map((item: any) => ({
            ano,
            mes: item.mesAnoTransferencia?.mes || mes,
            programa: item.funcao?.descricao || 'Não especificado',
            favorecido: item.favorecido?.nome || 'Não especificado',
            cnpj_favorecido: item.favorecido?.codigoFormatado || null,
            valor: parseFloat(item.valor || 0),
            data_pagamento: item.dataTransacao,
            orgao_superior: item.orgaoSuperior?.nome || 'Não especificado',
            fonte: 'portal_transparencia',
            synced_by: user.id
          }));

          for (const item of transferenciasData) {
            await supabase.from('transferencias_federais').insert(item);
          }
        }

        responseData = {
          ano,
          mes,
          total: data.length,
          transferencias: data
        };
        break;
      }

      case 'get-summary': {
        // Buscar resumo das transferências do banco local
        const { data: transferencias } = await supabase
          .from('transferencias_federais')
          .select('*')
          .eq('ano', ano)
          .order('mes', { ascending: false });

        if (!transferencias || transferencias.length === 0) {
          responseData = {
            warning: 'Nenhum dado encontrado. Sincronize com o Portal da Transparência primeiro.',
            data: []
          };
        } else {
          const totalPorPrograma = transferencias.reduce((acc: any, t) => {
            if (!acc[t.programa]) {
              acc[t.programa] = { total: 0, count: 0 };
            }
            acc[t.programa].total += parseFloat(t.valor || 0);
            acc[t.programa].count += 1;
            return acc;
          }, {});

          responseData = {
            ano,
            total_geral: transferencias.reduce((sum, t) => sum + parseFloat(t.valor || 0), 0),
            total_transferencias: transferencias.length,
            por_programa: totalPorPrograma,
            transferencias: transferencias.slice(0, 100) // Limitar a 100 registros
          };
        }
        break;
      }

      default:
        throw new Error('Invalid action');
    }

    // Cache for 6 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6);

    await supabase.from('api_cache').insert({
      api_source: 'transparencia',
      endpoint: action,
      parameters: cacheKey,
      response_data: responseData,
      expires_at: expiresAt.toISOString(),
      created_by: user.id
    });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in transparencia-api:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});