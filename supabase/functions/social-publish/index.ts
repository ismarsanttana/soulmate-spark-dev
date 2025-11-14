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

    const { postIds } = await req.json();
    console.log(`Publishing ${postIds.length} posts`);

    const results: Array<{ postId: string; success?: boolean; postUrl?: string; error?: string }> = [];

    for (const postId of postIds) {
      try {
        const result = await publishPost(postId, supabase);
        results.push(result);
      } catch (error: any) {
        console.error(`Error publishing post ${postId}:`, error);
        results.push({ postId, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in social-publish:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function publishPost(postId: string, supabase: any) {
  // Buscar dados do post
  const { data: post, error: postError } = await supabase
    .from("social_media_posts")
    .select(`
      *,
      account:social_media_accounts(*)
    `)
    .eq("id", postId)
    .single();

  if (postError || !post) {
    throw new Error("Post não encontrado");
  }

  const { platform } = post;
  const accessToken = post.account.access_token_encrypted;

  console.log(`Publishing to ${platform}`);

  let postUrl = "";
  let externalPostId = "";

  switch (platform) {
    case "facebook":
      const fbResult = await publishToFacebook(post, accessToken);
      postUrl = fbResult.url;
      externalPostId = fbResult.id;
      break;

    case "instagram":
      const igResult = await publishToInstagram(post, accessToken);
      postUrl = igResult.url;
      externalPostId = igResult.id;
      break;

    case "twitter":
      const twResult = await publishToTwitter(post, accessToken);
      postUrl = twResult.url;
      externalPostId = twResult.id;
      break;

    case "linkedin":
      const liResult = await publishToLinkedIn(post, accessToken);
      postUrl = liResult.url;
      externalPostId = liResult.id;
      break;

    default:
      throw new Error(`Plataforma não suportada: ${platform}`);
  }

  // Atualizar status do post
  await supabase
    .from("social_media_posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      post_id: externalPostId,
      post_url: postUrl,
      error_message: null,
    })
    .eq("id", postId);

  return { postId, success: true, postUrl };
}

async function publishToFacebook(post: any, accessToken: string) {
  const pageId = post.account.page_id;
  const text = post.custom_text || "";

  const formData = new FormData();
  formData.append("message", text);
  formData.append("access_token", accessToken);

  // Se houver mídia, fazer upload primeiro
  if (post.media_urls && post.media_urls.length > 0) {
    formData.append("url", post.media_urls[0]);
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/photos`,
      { method: "POST", body: formData }
    );
    const data = await response.json();
    return { id: data.id, url: `https://facebook.com/${data.id}` };
  }

  // Post de texto apenas
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    { method: "POST", body: formData }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  return { id: data.id, url: `https://facebook.com/${data.id}` };
}

async function publishToInstagram(post: any, accessToken: string) {
  const igUserId = post.account.account_id;
  const text = post.custom_text || "";
  const imageUrl = post.media_urls?.[0];

  if (!imageUrl) {
    throw new Error("Instagram requer pelo menos uma imagem");
  }

  // Criar container de mídia
  const containerResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: text,
        access_token: accessToken,
      }),
    }
  );

  const containerData = await containerResponse.json();
  if (containerData.error) throw new Error(containerData.error.message);

  // Publicar
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken,
      }),
    }
  );

  const publishData = await publishResponse.json();
  if (publishData.error) throw new Error(publishData.error.message);

  return { id: publishData.id, url: `https://instagram.com/p/${publishData.id}` };
}

async function publishToTwitter(post: any, accessToken: string) {
  const text = post.custom_text || "";

  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  if (data.errors) throw new Error(data.errors[0].message);

  return {
    id: data.data.id,
    url: `https://twitter.com/i/web/status/${data.data.id}`,
  };
}

async function publishToLinkedIn(post: any, accessToken: string) {
  const text = post.custom_text || "";
  const authorId = post.account.account_id;

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${authorId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.message);

  return { id: data.id, url: `https://linkedin.com/feed/update/${data.id}` };
}