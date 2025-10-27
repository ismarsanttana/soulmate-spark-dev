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
    const { vacancyId } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar a vaga
    const { data: vacancy, error: vacancyError } = await supabaseClient
      .from("job_vacancies")
      .select("*")
      .eq("id", vacancyId)
      .single();

    if (vacancyError || !vacancy) {
      throw new Error("Vaga não encontrada");
    }

    // Buscar todos os perfis de usuários com dados relevantes
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        cpf,
        birth_date,
        gender,
        endereco_completo,
        telefone,
        necessidades_especiais,
        lgbtqiapn
      `);

    if (profilesError) {
      throw new Error("Erro ao buscar perfis");
    }

    // Buscar funcionários para ver experiências
    const { data: employees } = await supabaseClient
      .from("secretaria_employees")
      .select("user_id, funcao, cargo, area");

    // Buscar matrículas para identificar nível de escolaridade
    const { data: enrollments } = await supabaseClient
      .from("student_enrollments")
      .select("student_id, grade_level");

    // Preparar prompt para IA analisar compatibilidade
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const aiPrompt = `
Analise a seguinte vaga de emprego e retorne os IDs dos perfis mais compatíveis (máximo 10 candidatos).

VAGA:
- Título: ${vacancy.title}
- Empresa: ${vacancy.company}
- Descrição: ${vacancy.description}
- Requisitos: ${vacancy.requirements || "Não especificado"}
- Localização: ${vacancy.location}
- Tipo: ${vacancy.job_type}
- Carga horária: ${vacancy.workload || "Não especificado"}

PERFIS DISPONÍVEIS:
${JSON.stringify(profiles?.slice(0, 50) || [])}

EXPERIÊNCIAS PROFISSIONAIS:
${JSON.stringify(employees || [])}

ESCOLARIDADE:
${JSON.stringify(enrollments || [])}

Retorne APENAS um array JSON com os IDs dos perfis mais compatíveis, ordenados por relevância.
Considere: localização, experiência, escolaridade, idade aproximada, necessidades especiais se a vaga for inclusiva.
Formato: ["id1", "id2", "id3", ...]
`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em RH e matching de candidatos. Retorne apenas JSON válido." },
          { role: "user", content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro na IA:", aiResponse.status, errorText);
      throw new Error("Erro ao analisar candidatos com IA");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "[]";
    
    // Extrair JSON da resposta
    let matchedIds: string[] = [];
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        matchedIds = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Erro ao parsear resposta da IA:", e);
    }

    console.log(`Encontrados ${matchedIds.length} candidatos compatíveis`);

    // Enviar notificações para os candidatos compatíveis
    const notifications = matchedIds.map((userId) => ({
      user_id: userId,
      title: `Nova vaga: ${vacancy.title}`,
      message: `Identificamos uma vaga que combina com seu perfil! ${vacancy.company} está contratando para ${vacancy.title} em ${vacancy.location}.`,
      type: "job_match",
      notification_type: "system",
      link: `/?vaga=${vacancyId}#vagas`,
      target_audience: { specific: true }
    }));

    if (notifications.length > 0) {
      const { error: notifError } = await supabaseClient
        .from("notifications")
        .insert(notifications);

      if (notifError) {
        console.error("Erro ao enviar notificações:", notifError);
      } else {
        console.log(`${notifications.length} notificações enviadas`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        matchedCount: matchedIds.length,
        vacancyTitle: vacancy.title 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro em match-candidates:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
