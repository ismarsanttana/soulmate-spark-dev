import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SICONFI_BASE_URL = 'https://apidatalake.tesouro.gov.br/ords/siconfi/v1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    const { action, codigo_ibge, ano, bimestre } = await req.json();

    console.log('SICONFI API action:', action, { codigo_ibge, ano, bimestre });

    // Check cache
    const cacheKey = JSON.stringify({ action, codigo_ibge, ano, bimestre });
    const { data: cachedData } = await supabase
      .from('api_cache')
      .select('response_data')
      .eq('api_source', 'siconfi')
      .eq('endpoint', action)
      .eq('parameters', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log('Returning cached SICONFI data');
      return new Response(JSON.stringify(cachedData.response_data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let responseData;

    switch (action) {
      case 'get-rreo': {
        // Buscar Relatório Resumido de Execução Orçamentária (RREO)
        // Anexo 2 = Demonstrativo da Função Educação
        const url = `${SICONFI_BASE_URL}/rreo?id_ente=${codigo_ibge}&ano=${ano}&periodo=${bimestre || 6}&anexo=2`;
        
        console.log('Fetching SICONFI:', url);
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`SICONFI API error: ${response.status}`);
        }

        const data = await response.json();

        // Processar dados e salvar no banco
        if (data.items && data.items.length > 0) {
          const orcamentoData = data.items.map((item: any) => ({
            ano,
            bimestre: bimestre || 6,
            tipo: item.tipo_valor,
            categoria: item.conta,
            valor_previsto: parseFloat(item.valor_previsto || 0),
            valor_realizado: parseFloat(item.valor_realizado || 0),
            percentual_executado: item.percentual,
            fonte: 'siconfi',
            synced_by: user.id
          }));

          // Inserir/atualizar no banco
          for (const item of orcamentoData) {
            await supabase.from('orcamento_educacao').upsert(item, {
              onConflict: 'ano,bimestre,tipo,categoria'
            });
          }
        }

        responseData = {
          ano,
          bimestre: bimestre || 6,
          data: data.items || [],
          total_items: data.items?.length || 0
        };
        break;
      }

      case 'get-summary': {
        // Buscar resumo do orçamento da educação do banco local
        const { data: orcamento } = await supabase
          .from('orcamento_educacao')
          .select('*')
          .eq('ano', ano)
          .order('bimestre', { ascending: false });

        if (!orcamento || orcamento.length === 0) {
          responseData = {
            warning: 'Nenhum dado encontrado. Sincronize com SICONFI primeiro.',
            data: []
          };
        } else {
          const totalPrevisto = orcamento
            .filter(o => o.tipo === 'receita')
            .reduce((sum, o) => sum + parseFloat(o.valor_previsto || 0), 0);
          
          const totalRealizado = orcamento
            .filter(o => o.tipo === 'receita')
            .reduce((sum, o) => sum + parseFloat(o.valor_realizado || 0), 0);

          const despesasPrevistas = orcamento
            .filter(o => o.tipo === 'despesa')
            .reduce((sum, o) => sum + parseFloat(o.valor_previsto || 0), 0);

          const despesasRealizadas = orcamento
            .filter(o => o.tipo === 'despesa')
            .reduce((sum, o) => sum + parseFloat(o.valor_realizado || 0), 0);

          responseData = {
            ano,
            receitas: {
              previsto: totalPrevisto,
              realizado: totalRealizado,
              percentual: ((totalRealizado / totalPrevisto) * 100).toFixed(2)
            },
            despesas: {
              previsto: despesasPrevistas,
              realizado: despesasRealizadas,
              percentual: ((despesasRealizadas / despesasPrevistas) * 100).toFixed(2)
            },
            detalhes: orcamento
          };
        }
        break;
      }

      default:
        throw new Error('Invalid action');
    }

    // Cache for 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await supabase.from('api_cache').insert({
      api_source: 'siconfi',
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
    console.error('Error in siconfi-api:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});