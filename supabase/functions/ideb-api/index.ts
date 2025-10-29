import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, codigo_inep, ano, municipio_ibge } = await req.json();

    console.log('IDEB API action:', action);

    // Check cache first
    const cacheKey = JSON.stringify({ action, codigo_inep, ano, municipio_ibge });
    const { data: cachedData } = await supabase
      .from('api_cache')
      .select('response_data')
      .eq('api_source', 'ideb')
      .eq('endpoint', action)
      .eq('parameters', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log('Returning cached IDEB data');
      return new Response(JSON.stringify(cachedData.response_data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let responseData;

    switch (action) {
      case 'get-ideb-school': {
        // Buscar dados do IDEB para uma escola específica
        const { data: idebData } = await supabase
          .from('ideb_data')
          .select('*')
          .eq('codigo_inep', codigo_inep)
          .order('ano', { ascending: false });

        if (!idebData || idebData.length === 0) {
          // Retornar dados mock se não houver dados importados
          responseData = {
            warning: 'Dados não encontrados localmente. Importe os dados do INEP primeiro.',
            data: []
          };
        } else {
          responseData = { data: idebData };
        }
        break;
      }

      case 'get-ideb-municipality': {
        // Buscar IDEB médio do município
        const { data: schools } = await supabase
          .from('schools')
          .select('codigo_inep')
          .eq('codigo_municipio', municipio_ibge);

        if (!schools) {
          throw new Error('Nenhuma escola encontrada para este município');
        }

        const inepCodes = schools.map(s => s.codigo_inep);
        const { data: idebData } = await supabase
          .from('ideb_data')
          .select('*')
          .in('codigo_inep', inepCodes)
          .eq('ano', ano || 2023);

        // Calcular médias
        const calculateAverage = (field: string) => {
          const values = idebData?.filter(d => d[field]).map(d => parseFloat(d[field])) || [];
          return values.length > 0 
            ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
            : null;
        };

        responseData = {
          ano: ano || 2023,
          total_escolas: idebData?.length || 0,
          media_anos_iniciais: calculateAverage('nota_anos_iniciais'),
          media_anos_finais: calculateAverage('nota_anos_finais'),
          media_ensino_medio: calculateAverage('nota_ensino_medio'),
          escolas: idebData || []
        };
        break;
      }

      case 'import-ideb-csv': {
        // Simular importação de dados CSV do INEP
        // Em produção, isso receberia o arquivo CSV e processaria
        responseData = {
          message: 'Para importar dados IDEB, baixe os microdados do INEP e faça upload',
          link: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais/ideb'
        };
        break;
      }

      default:
        throw new Error('Invalid action');
    }

    // Cache the response for 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await supabase.from('api_cache').insert({
      api_source: 'ideb',
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
    console.error('Error in ideb-api:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});