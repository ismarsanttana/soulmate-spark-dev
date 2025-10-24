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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { photo_base64, device_id, student_user_id, entry_type = "entrada" } = await req.json();

    // Validação básica
    if (!student_user_id) {
      return new Response(
        JSON.stringify({ error: "student_user_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const timestamp = new Date().toISOString();
    const today = timestamp.split("T")[0];

    console.log(`[FACIAL-RECOGNITION] Processando ${entry_type} para aluno ${student_user_id}`);

    // 1. Buscar informações do aluno e sua turma
    const { data: enrollmentData, error: enrollmentError } = await supabaseClient
      .from("student_enrollments")
      .select(`
        class_id,
        student:student_user_id(
          id,
          full_name
        )
      `)
      .eq("student_user_id", student_user_id)
      .eq("status", "active")
      .single();

    if (enrollmentError || !enrollmentData) {
      console.error("[FACIAL-RECOGNITION] Erro ao buscar matrícula:", enrollmentError);
      return new Response(
        JSON.stringify({ error: "Aluno não encontrado ou não matriculado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const student = enrollmentData.student as any;
    const classId = enrollmentData.class_id;

    console.log(`[FACIAL-RECOGNITION] Aluno: ${student.full_name}, Turma: ${classId}`);

    // 2. Registrar no histórico de entrada/saída
    const { error: entryLogError } = await supabaseClient
      .from("student_entry_log")
      .insert({
        student_user_id,
        entry_type,
        timestamp,
        device_id,
        photo_url: photo_base64 ? "facial_recognition" : null,
        recognition_confidence: 95.5, // Placeholder - seria retornado pela API de reconhecimento
        notes: `${entry_type === "entrada" ? "Entrada" : "Saída"} registrada via reconhecimento facial`,
      });

    if (entryLogError) {
      console.error("[FACIAL-RECOGNITION] Erro ao registrar log:", entryLogError);
    }

    // 3. Registrar presença (apenas para entrada)
    if (entry_type === "entrada") {
      // Verificar se já existe registro de presença hoje
      const { data: existingAttendance } = await supabaseClient
        .from("student_attendance")
        .select("id")
        .eq("student_user_id", student_user_id)
        .eq("class_id", classId)
        .eq("attendance_date", today)
        .single();

      if (!existingAttendance) {
        const { error: attendanceError } = await supabaseClient
          .from("student_attendance")
          .insert({
            student_user_id,
            class_id: classId,
            attendance_date: today,
            status: "presente",
            notes: `Presença registrada automaticamente via reconhecimento facial - Device: ${device_id}`,
          });

        if (attendanceError) {
          console.error("[FACIAL-RECOGNITION] Erro ao registrar presença:", attendanceError);
        } else {
          console.log("[FACIAL-RECOGNITION] Presença registrada com sucesso");
        }
      } else {
        console.log("[FACIAL-RECOGNITION] Presença já registrada hoje");
      }
    }

    // 4. Buscar responsáveis vinculados
    const { data: responsibles, error: responsiblesError } = await supabaseClient
      .from("user_relationships")
      .select("user_id, relationship_type")
      .eq("related_user_id", student_user_id)
      .in("relationship_type", ["pai", "mae", "responsavel", "tutor"]);

    if (responsiblesError) {
      console.error("[FACIAL-RECOGNITION] Erro ao buscar responsáveis:", responsiblesError);
    }

    // 5. Criar notificações para cada responsável
    if (responsibles && responsibles.length > 0) {
      const entryTime = new Date(timestamp).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const notifications = responsibles.map((resp: any) => ({
        user_id: resp.user_id,
        title: entry_type === "entrada" ? "🎒 Chegada na Escola" : "🏃 Saída da Escola",
        message: `${student.full_name} ${entry_type === "entrada" ? "chegou à" : "saiu da"} escola às ${entryTime}`,
        type: "attendance",
        notification_type: "facial_recognition",
        read: false,
        link: `/painel-pais`,
      }));

      const { error: notificationsError } = await supabaseClient
        .from("notifications")
        .insert(notifications);

      if (notificationsError) {
        console.error("[FACIAL-RECOGNITION] Erro ao criar notificações:", notificationsError);
      } else {
        console.log(`[FACIAL-RECOGNITION] ${notifications.length} notificações criadas`);
      }
    } else {
      console.log("[FACIAL-RECOGNITION] Nenhum responsável vinculado");
    }

    // 6. Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        student: student.full_name,
        entry_type,
        timestamp,
        notifications_sent: responsibles?.length || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[FACIAL-RECOGNITION] Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
