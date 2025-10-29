import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface INEPSchoolResponse {
  codigo_inep: string;
  nome_escola: string;
  municipio: string;
  uf: string;
  localizacao?: string;
  dependencia_administrativa?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autenticado');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Não autenticado');
    }

    const requestBody = await req.json();
    const { action, codigo_inep, codigo_municipio } = requestBody;

    console.log('INEP API - Action:', action, 'Body:', requestBody);

    switch (action) {
      case 'search-school': {
        const codigoInep = codigo_inep;
        if (!codigoInep) {
          throw new Error('Código INEP é obrigatório');
        }

        // Verificar cache primeiro
        const { data: cached } = await supabase
          .from('inep_cache')
          .select('*')
          .eq('endpoint', 'escola')
          .eq('parameters', JSON.stringify({ codigo_inep: codigoInep }))
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (cached) {
          console.log('Retornando dados do cache');
          return new Response(
            JSON.stringify({ data: cached.response_data, cached: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Buscar na API real do INEP (dados do Censo Escolar via Portal Brasileiro de Dados Abertos)
        console.log('Buscando na API do INEP:', codigoInep);
        
        try {
          // Tentar buscar dados do PDDE Info (dados oficiais do INEP)
          const inepUrl = `https://www.fnde.gov.br/pdeinterativo/pddeinfo/pddeinfo/escola/consultar?ano=2025&co_escola=${codigoInep}&cnpj=&co_esfera_adm=&sg_uf=&co_municipio_fnde=`;
          
          console.log('URL da API:', inepUrl);
          
          const response = await fetch(inepUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ConectaAfogados/1.0)',
              'Accept': 'application/json, text/html',
            }
          });

          if (!response.ok) {
            console.error('Erro na resposta da API INEP:', response.status);
            throw new Error(`Erro ao consultar API do INEP: ${response.status}`);
          }

          const html = await response.text();
          console.log('Resposta recebida (primeiros 500 chars):', html.substring(0, 500));

          // Extrair dados da resposta HTML usando regex
          const nomeMatch = html.match(/Nome Escola:<\/span>\s*<\/td>\s*<td[^>]*>\s*([^<]+)/i);
          const municipioMatch = html.match(/Município:<\/span>\s*<\/td>\s*<td[^>]*>\s*([^<]+)/i);
          const ufMatch = html.match(/UF:<\/span>\s*<\/td>\s*<td[^>]*>\s*([^<]+)/i);
          const redeMatch = html.match(/Rede de Ensino:<\/span>\s*<\/td>\s*<td[^>]*>\s*([^<]+)/i);

          if (!nomeMatch) {
            console.error('Escola não encontrada na base do INEP');
            throw new Error('Escola não encontrada na base de dados do INEP');
          }

          const schoolData: INEPSchoolResponse = {
            codigo_inep: codigoInep,
            nome_escola: nomeMatch[1].trim(),
            municipio: municipioMatch ? municipioMatch[1].trim() : '',
            uf: ufMatch ? ufMatch[1].trim() : '',
            localizacao: 'urbana',
            dependencia_administrativa: redeMatch ? redeMatch[1].toLowerCase().includes('municipal') ? 'municipal' : 'estadual' : 'municipal'
          };

          console.log('Dados extraídos:', schoolData);

          // Salvar no cache (24h)
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          await supabase.from('inep_cache').insert({
            endpoint: 'escola',
            parameters: { codigo_inep: codigoInep },
            response_data: schoolData,
            expires_at: expiresAt.toISOString(),
            created_by: user.id
          });

          return new Response(
            JSON.stringify({ data: schoolData, cached: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (apiError) {
          console.error('Erro ao buscar na API:', apiError);
          // Fallback para dados mockados em caso de erro
          const mockData: INEPSchoolResponse = {
            codigo_inep: codigoInep,
            nome_escola: `Escola - Código INEP ${codigoInep}`,
            municipio: 'Consulte o site do INEP para mais detalhes',
            uf: 'PE',
            localizacao: 'urbana',
            dependencia_administrativa: 'municipal'
          };

          return new Response(
            JSON.stringify({ 
              data: mockData, 
              cached: false,
              warning: 'Dados indisponíveis na API do INEP. Consulte o site oficial para verificar.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'search-by-municipality': {
        const codigoMunicipio = codigo_municipio;
        if (!codigoMunicipio) {
          throw new Error('Código do município é obrigatório');
        }

        // Verificar cache
        const { data: cached } = await supabase
          .from('inep_cache')
          .select('*')
          .eq('endpoint', 'municipio')
          .eq('parameters', JSON.stringify({ codigo_municipio: codigoMunicipio }))
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (cached) {
          return new Response(
            JSON.stringify({ data: cached.response_data, cached: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Dados mockados para demonstração
        const mockData = [
          {
            codigo_inep: '26000001',
            nome_escola: 'Escola Municipal João Paulo II',
            municipio: 'Afogados da Ingazeira',
            uf: 'PE'
          },
          {
            codigo_inep: '26000002',
            nome_escola: 'Escola Municipal São Francisco',
            municipio: 'Afogados da Ingazeira',
            uf: 'PE'
          }
        ];

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await supabase.from('inep_cache').insert({
          endpoint: 'municipio',
          parameters: { codigo_municipio: codigoMunicipio },
          response_data: mockData,
          expires_at: expiresAt.toISOString(),
          created_by: user.id
        });

        return new Response(
          JSON.stringify({ data: mockData, cached: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'import-school': {
        const { nome_escola, codigo_municipio_inep, municipio, uf, localizacao, dependencia_administrativa } = requestBody;

        if (!codigo_inep || !nome_escola) {
          throw new Error('Código INEP e nome da escola são obrigatórios');
        }

        console.log('Importando escola:', { codigo_inep, nome_escola });

        // Verificar se a escola já existe
        const { data: existing } = await supabase
          .from('schools')
          .select('id')
          .eq('codigo_inep', codigo_inep)
          .maybeSingle();

        if (existing) {
          return new Response(
            JSON.stringify({ error: 'Escola já cadastrada', id: existing.id }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Inserir escola
        const { data: school, error } = await supabase
          .from('schools')
          .insert({
            codigo_inep,
            nome_escola,
            codigo_municipio_inep: codigo_municipio_inep || null,
            municipio: municipio || null,
            uf: uf || null,
            situacao_funcionamento: 'ativa',
            dependencia_administrativa: dependencia_administrativa || 'municipal',
            localizacao: localizacao || 'urbana',
            created_by: user.id
          })
          .select()
          .single();

        if (error) {
          console.error('Erro ao inserir escola:', error);
          throw error;
        }

        console.log('Escola importada com sucesso:', school.id);

        // Registrar log de sincronização
        await supabase.from('inep_sync_log').insert({
          school_id: school.id,
          sync_type: 'import',
          status: 'success',
          details: { codigo_inep, nome_escola },
          synced_by: user.id
        });

        return new Response(
          JSON.stringify({ data: school }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-ideb': {
        const codigoInep = codigo_inep;
        if (!codigoInep) {
          throw new Error('Código INEP é obrigatório');
        }

        // Dados mockados de IDEB
        const mockIdeb = {
          codigo_inep: codigoInep,
          anos_iniciais: [
            { ano: 2019, nota: 5.2 },
            { ano: 2021, nota: 5.5 },
            { ano: 2023, nota: 5.8 }
          ],
          anos_finais: [
            { ano: 2019, nota: 4.8 },
            { ano: 2021, nota: 5.0 },
            { ano: 2023, nota: 5.3 }
          ]
        };

        return new Response(
          JSON.stringify({ data: mockIdeb }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Ação não reconhecida');
    }
  } catch (error) {
    console.error('Erro na INEP API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
