import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CKAN_BASE_URL = 'https://dados.gov.br/api/3/action';

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

    const { action, query, organization, tags, limit } = await req.json();

    console.log('Dados Abertos API action:', action);

    // Check cache
    const cacheKey = JSON.stringify({ action, query, organization, tags, limit });
    const { data: cachedData } = await supabase
      .from('api_cache')
      .select('response_data')
      .eq('api_source', 'dados_abertos')
      .eq('endpoint', action)
      .eq('parameters', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log('Returning cached Dados Abertos data');
      return new Response(JSON.stringify(cachedData.response_data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let responseData;

    switch (action) {
      case 'search-datasets': {
        // Buscar datasets no dados.gov.br usando CKAN API
        let searchQuery = query || 'educação';
        let url = `${CKAN_BASE_URL}/package_search?q=${encodeURIComponent(searchQuery)}`;
        
        if (organization) {
          url += `&fq=organization:${organization}`;
        }
        if (tags) {
          url += `&fq=tags:${tags}`;
        }
        url += `&rows=${limit || 20}`;

        console.log('Fetching Dados Abertos:', url);

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Dados.gov.br API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error('CKAN API returned error');
        }

        responseData = {
          total: data.result.count,
          datasets: data.result.results.map((dataset: any) => ({
            id: dataset.id,
            name: dataset.name,
            title: dataset.title,
            notes: dataset.notes,
            organization: dataset.organization?.title || 'Não especificado',
            tags: dataset.tags?.map((t: any) => t.display_name) || [],
            resources_count: dataset.resources?.length || 0,
            resources: dataset.resources?.map((r: any) => ({
              id: r.id,
              name: r.name,
              format: r.format,
              size: r.size,
              url: r.url,
              created: r.created
            })) || [],
            metadata_created: dataset.metadata_created,
            metadata_modified: dataset.metadata_modified
          }))
        };
        break;
      }

      case 'get-dataset-details': {
        // Buscar detalhes de um dataset específico
        const datasetId = query;
        const url = `${CKAN_BASE_URL}/package_show?id=${datasetId}`;

        console.log('Fetching Dataset Details:', url);

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Dados.gov.br API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error('CKAN API returned error');
        }

        responseData = {
          dataset: {
            id: data.result.id,
            name: data.result.name,
            title: data.result.title,
            notes: data.result.notes,
            organization: data.result.organization?.title,
            tags: data.result.tags?.map((t: any) => t.display_name),
            resources: data.result.resources?.map((r: any) => ({
              id: r.id,
              name: r.name,
              description: r.description,
              format: r.format,
              size: r.size,
              url: r.url,
              created: r.created,
              last_modified: r.last_modified
            })),
            extras: data.result.extras,
            metadata_created: data.result.metadata_created,
            metadata_modified: data.result.metadata_modified
          }
        };
        break;
      }

      case 'search-inep-datasets': {
        // Buscar datasets específicos do INEP
        const url = `${CKAN_BASE_URL}/package_search?fq=organization:inep&q=censo+escolar+OR+ideb+OR+enem&rows=50`;

        console.log('Fetching INEP Datasets');

        const response = await fetch(url);
        const data = await response.json();

        responseData = {
          total: data.result.count,
          datasets: data.result.results.map((d: any) => ({
            id: d.id,
            title: d.title,
            notes: d.notes?.substring(0, 200),
            tags: d.tags?.map((t: any) => t.display_name),
            resources_count: d.resources?.length || 0,
            updated: d.metadata_modified
          }))
        };
        break;
      }

      default:
        throw new Error('Invalid action');
    }

    // Cache for 12 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12);

    await supabase.from('api_cache').insert({
      api_source: 'dados_abertos',
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
    console.error('Error in dados-abertos-api:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});