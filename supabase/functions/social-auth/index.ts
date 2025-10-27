import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, platform, code, secretariaSlug } = await req.json();
    console.log(`Social auth action: ${action}, platform: ${platform}`);

    // Buscar configurações da API
    const { data: apiConfig } = await supabase
      .from("social_media_api_keys")
      .select("*")
      .eq("platform", platform)
      .eq("is_active", true)
      .single();

    if (!apiConfig) {
      throw new Error(`API não configurada para ${platform}`);
    }

    switch (action) {
      case "connect":
        return handleConnect(platform, apiConfig, secretariaSlug);
      case "callback":
        return handleCallback(platform, apiConfig, code, secretariaSlug, supabase);
      case "disconnect":
        return handleDisconnect(platform, secretariaSlug, supabase);
      default:
        throw new Error("Ação inválida");
    }
  } catch (error: any) {
    console.error("Error in social-auth:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function handleConnect(platform: string, apiConfig: any, secretariaSlug: string) {
  const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/social-auth`;
  let authUrl = "";

  switch (platform) {
    case "facebook":
    case "instagram":
      authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${apiConfig.app_id}&redirect_uri=${redirectUri}&scope=pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish&state=${secretariaSlug}`;
      break;
    case "twitter":
      // OAuth 2.0 para Twitter
      const twitterScopes = "tweet.read tweet.write users.read";
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${apiConfig.api_key_encrypted}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(twitterScopes)}&state=${secretariaSlug}&code_challenge=challenge&code_challenge_method=plain`;
      break;
    case "linkedin":
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${apiConfig.app_id}&redirect_uri=${redirectUri}&scope=w_member_social&state=${secretariaSlug}`;
      break;
  }

  return new Response(
    JSON.stringify({ authUrl }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCallback(
  platform: string,
  apiConfig: any,
  code: string,
  secretariaSlug: string,
  supabase: any
) {
  console.log(`Processing callback for ${platform}`);
  
  // Trocar o código por access token
  let tokenData: any = {};
  const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/social-auth`;

  switch (platform) {
    case "facebook":
    case "instagram":
      const fbTokenResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${apiConfig.app_id}&client_secret=${apiConfig.app_secret_encrypted}&code=${code}&redirect_uri=${redirectUri}`
      );
      tokenData = await fbTokenResponse.json();
      break;

    case "twitter":
      const twitterTokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${apiConfig.api_key_encrypted}:${apiConfig.api_secret_encrypted}`)}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          client_id: apiConfig.api_key_encrypted,
          redirect_uri: redirectUri,
          code_verifier: "challenge",
        }),
      });
      tokenData = await twitterTokenResponse.json();
      break;

    case "linkedin":
      const linkedinTokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: apiConfig.app_id,
          client_secret: apiConfig.app_secret_encrypted,
          redirect_uri: redirectUri,
        }),
      });
      tokenData = await linkedinTokenResponse.json();
      break;
  }

  if (tokenData.error || !tokenData.access_token) {
    throw new Error(`Erro ao obter token: ${tokenData.error_description || "Unknown error"}`);
  }

  // Buscar informações da conta
  let accountInfo: any = {};
  switch (platform) {
    case "facebook":
      const fbMe = await fetch(
        `https://graph.facebook.com/me?fields=id,name&access_token=${tokenData.access_token}`
      );
      accountInfo = await fbMe.json();
      break;
    case "instagram":
      const igMe = await fetch(
        `https://graph.facebook.com/me/accounts?access_token=${tokenData.access_token}`
      );
      const pages = await igMe.json();
      accountInfo = pages.data?.[0] || {};
      break;
    case "twitter":
      const twMe = await fetch("https://api.twitter.com/2/users/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const twData = await twMe.json();
      accountInfo = twData.data || {};
      break;
    case "linkedin":
      const liMe = await fetch("https://api.linkedin.com/v2/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      accountInfo = await liMe.json();
      break;
  }

  // Salvar conta conectada
  const { error } = await supabase.from("social_media_accounts").upsert({
    secretaria_slug: secretariaSlug,
    platform,
    account_name: accountInfo.name || accountInfo.username || "Conta Conectada",
    account_id: accountInfo.id,
    page_id: accountInfo.id,
    is_active: true,
    auto_publish: false,
    access_token_encrypted: tokenData.access_token,
    refresh_token_encrypted: tokenData.refresh_token,
    token_expires_at: tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null,
  });

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, accountName: accountInfo.name }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleDisconnect(platform: string, secretariaSlug: string, supabase: any) {
  const { error } = await supabase
    .from("social_media_accounts")
    .delete()
    .eq("platform", platform)
    .eq("secretaria_slug", secretariaSlug);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}