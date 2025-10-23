import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";

type ServiceKey = "consulta" | "tfd" | "exames" | "receitas";

type HealthRequest = {
  id: string;
  service: ServiceKey;
  serviceLabel: string;
  patientName: string;
  submittedAt: string;
  status: "Recebido" | "Em análise" | "Concluído";
  summary: string;
};

const SERVICES: Record<ServiceKey, string> = {
  consulta: "Agendamento de Consulta",
  tfd: "Agendamento de TFD",
  exames: "Marcação de Exames",
  receitas: "Renovação de Receitas",
};

const HEALTH_UNITS = [
  {
    name: "Policlínica Municipal",
    address: "Rua da Saúde, 120 • Centro",
    hours: "Seg a Sex • 7h às 17h",
    phone: "(87) 3838-1001",
  },
  {
    name: "ESF Bairro São Francisco",
    address: "Rua Projetada, 90 • São Francisco",
    hours: "Seg a Sex • 7h30 às 16h30",
    phone: "(87) 3838-1012",
  },
  {
    name: "USF Vila Nova",
    address: "Av. João XXIII, 455 • Vila Nova",
    hours: "Seg a Sex • 8h às 17h",
    phone: "(87) 3838-1033",
  },
  {
    name: "Centro de Especialidades",
    address: "Rua Manoel Florentino, 210 • Centro",
    hours: "Seg a Sex • 8h às 18h",
    phone: "(87) 3838-1044",
  },
];

type HealthUnit = (typeof HEALTH_UNITS)[number];

const HEALTH_ACTIONS = [
  {
    icon: "fa-syringe",
    title: "Campanha Nacional de Vacinação",
    description:
      "Atualize o cartão de vacinação e garanta a proteção de toda a família. Fique atento aos dias de ação itinerante nos bairros.",
    period: "01 a 30 de novembro",
  },
  {
    icon: "fa-heartbeat",
    title: "Mutirão de Atendimento Cardiovascular",
    description:
      "Consultas com especialistas, exames de eletrocardiograma e orientações sobre cuidados com a hipertensão.",
    period: "Quartas-feiras • 14h às 18h",
  },
  {
    icon: "fa-ribbon",
    title: "Programa Saúde da Mulher",
    description:
      "Agende mamografia, preventivo e consultas com ginecologista sem precisar sair da plataforma.",
    period: "Atendimento contínuo • vagas limitadas",
  },
];

const PATIENT_HISTORY = [
  {
    icon: "fa-stethoscope",
    specialty: "Clínico Geral",
    title: "Avaliação preventiva anual",
    professional: "Dr. João Silva • Policlínica Municipal",
    date: "12 Set 2025",
    tone: "primary",
  },
  {
    icon: "fa-user-nurse",
    specialty: "Enfermagem",
    title: "Renovação de curativo",
    professional: "Enf. Maria Oliveira • ESF Bairro São Francisco",
    date: "03 Ago 2025",
    tone: "emerald",
  },
  {
    icon: "fa-flask",
    specialty: "Laboratório",
    title: "Coleta de exames laboratoriais",
    professional: "Centro de Especialidades",
    date: "22 Jul 2025",
    tone: "amber",
  },
];

const toneStyles: Record<string, { container: string; text: string; badge: string }> = {
  primary: {
    container: "bg-primary/10 text-primary",
    text: "text-primary",
    badge: "bg-primary text-white",
  },
  emerald: {
    container: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300",
    text: "text-emerald-600 dark:text-emerald-300",
    badge: "bg-emerald-500 text-white",
  },
  amber: {
    container: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300",
    text: "text-amber-600 dark:text-amber-300",
    badge: "bg-amber-500 text-white",
  },
};

const Saude = () => {
  const [user, setUser] = useState<User | null>(null);
  const [latestRequest, setLatestRequest] = useState<HealthRequest | null>(null);
  const [requests, setRequests] = useState<HealthRequest[]>([]);
  const [successMessages, setSuccessMessages] = useState<Partial<Record<ServiceKey, string>>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const patientName =
    profile?.full_name?.trim() ||
    profile?.nickname?.trim() ||
    "Cidadão Camalauense";

  const formatDateTime = (iso: string) => {
    const date = new Date(iso);
    return `${date.toLocaleDateString("pt-BR")} às ${date
      .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      .replace(":", "h")}`;
  };

  const handleSubmission = (service: ServiceKey, summary: string) => {
    const now = new Date().toISOString();
    const request: HealthRequest = {
      id: `REQ-${Date.now()}`,
      service,
      serviceLabel: SERVICES[service],
      patientName,
      submittedAt: now,
      status: "Recebido",
      summary,
    };

    setRequests((prev) => [request, ...prev]);
    setLatestRequest(request);
    setSuccessMessages((prev) => ({
      ...prev,
      [service]: "Solicitação enviada com sucesso. Status atualizado para \"Recebido\". Você será avisado nas notificações sempre que houver mudança.",
    }));
  };


  const unitsGrouped = useMemo(() => {
    const groups: HealthUnit[][] = [];
    HEALTH_UNITS.forEach((unit, index) => {
      const groupIndex = Math.floor(index / 2);
      if (!groups[groupIndex]) {
        groups[groupIndex] = [];
      }
      groups[groupIndex].push(unit);
    });
    return groups;
  }, []);

  return (
    <Layout>
      <Header />

      <div className="mb-4">
        <h2 className="font-semibold text-lg">Secretaria de Saúde</h2>
        <p className="text-xs text-muted-foreground">
          Informações, serviços e contatos da saúde municipal.
        </p>
      </div>

      {latestRequest && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-900/20 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                Solicitação recente
              </p>
              <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                {latestRequest.serviceLabel}
              </h3>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-200/80">
                {latestRequest.summary}
              </p>
            </div>
            <span className="inline-flex items-center rounded-xl bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm dark:bg-emerald-900 dark:text-emerald-200">
              <i className="fas fa-circle-notch mr-1.5 animate-spin"></i>
              {latestRequest.status}
            </span>
          </div>
          <p className="mt-3 text-[11px] text-emerald-700/80 dark:text-emerald-200/70">
            Atualizado em {formatDateTime(latestRequest.submittedAt)}. Todas as
            solicitações podem ser acompanhadas no seu perfil e qualquer mudança
            envia uma notificação automática.
          </p>
        </div>
       )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <a
          href="#consulta"
          className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm card-hover block"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <i className="fas fa-calendar-check text-primary"></i>
            <span>Consulta</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Clínico, pediatria, odontologia
          </p>
        </a>
        <a
          href="#tfd"
          className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm card-hover block"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <i className="fas fa-bus text-blue-600"></i>
            <span>TFD</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Tratamento fora do domicílio
          </p>
        </a>
        <a
          href="#exames"
          className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm card-hover block"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <i className="fas fa-vials text-amber-500"></i>
            <span>Exames</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Laboratoriais e imagem
          </p>
        </a>
        <a
          href="#receitas"
          className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm card-hover block"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <i className="fas fa-pills text-rose-500"></i>
            <span>Receitas contínuas</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Renovação simplificada
          </p>
        </a>
      </div>
      <section
        id="consulta"
        className="mb-4 rounded-2xl bg-card dark:bg-card p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{SERVICES.consulta}</h3>
            <p className="text-xs text-muted-foreground">
              Agende consultas nas unidades da rede municipal.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            Prioridade ESF
          </span>
        </div>

        <form
          className="mt-3 space-y-3 text-sm"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const unit = formData.get("unit") as string;
            const specialty = formData.get("specialty") as string;
            const date = formData.get("date") as string;
            if (!unit || !specialty || !date) return;

            handleSubmission(
              "consulta",
              `${patientName} solicitou consulta de ${specialty} na ${unit} para ${new Date(
                `${date}T00:00:00`
              ).toLocaleDateString("pt-BR")}`
            );
            form.reset();
          }}
        >
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Nome do paciente
            </label>
            <input
              name="patient"
              readOnly
              value={patientName}
              className="mt-1 w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Data desejada
            </label>
            <input
              name="date"
              type="date"
              required
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Unidade
              </label>
              <select
                name="unit"
                required
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Selecione</option>
                {HEALTH_UNITS.map((unit) => (
                  <option key={unit.name} value={unit.name}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Especialidade
              </label>
              <select
                name="specialty"
                required
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Escolha</option>
                <option value="Clínico Geral">Clínico Geral</option>
                <option value="Pediatria">Pediatria</option>
                <option value="Ginecologia/Obstetrícia">Ginecologia/Obstetrícia</option>
                <option value="Odontologia">Odontologia</option>
                <option value="Enfermagem">Enfermagem</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Observações (opcional)
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Informe sintomas, preferências de horário ou necessidades específicas"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            Solicitar consulta
          </button>
          {successMessages.consulta && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
              <i className="fas fa-check-circle mr-2 text-emerald-500"></i>
              {successMessages.consulta}
            </div>
          )}
        </form>
      </section>
      <section
        id="tfd"
        className="mb-4 rounded-2xl bg-card dark:bg-card p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{SERVICES.tfd}</h3>
            <p className="text-xs text-muted-foreground">
              Solicite deslocamento para atendimentos fora do município.
            </p>
          </div>
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-600">
            Transporte sanitário
          </span>
        </div>

        <form
          className="mt-3 space-y-3 text-sm"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const destination = formData.get("destination") as string;
            const motive = formData.get("motive") as string;
            const date = formData.get("travelDate") as string;
            if (!destination || !motive || !date) return;

            handleSubmission(
              "tfd",
              `${patientName} solicitou TFD para ${destination} em ${new Date(
                `${date}T00:00:00`
              ).toLocaleDateString("pt-BR")} (${motive})`
            );
            form.reset();
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Destino
              </label>
              <input
                name="destination"
                type="text"
                required
                placeholder="Ex.: Recife - Hospital das Clínicas"
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Data da viagem
              </label>
              <input
                name="travelDate"
                type="date"
                required
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Motivo do tratamento
            </label>
            <input
              name="motive"
              type="text"
              required
              placeholder="Informe o motivo da viagem"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Acompanhantes
              </label>
              <input
                name="companions"
                type="number"
                min={0}
                max={2}
                defaultValue={0}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Necessidades específicas
              </label>
              <input
                name="needs"
                type="text"
                placeholder="Ex.: cadeira de rodas, suporte clínico"
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Observações adicionais (opcional)
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Documentos anexados, horário preferencial de saída, etc."
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Solicitar transporte TFD
          </button>
          {successMessages.tfd && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
              <i className="fas fa-check-circle mr-2 text-blue-500"></i>
              {successMessages.tfd}
            </div>
          )}
        </form>
      </section>

      <section
        id="exames"
        className="mb-4 rounded-2xl bg-card dark:bg-card p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{SERVICES.exames}</h3>
            <p className="text-xs text-muted-foreground">
              Marque exames laboratoriais e de imagem sem sair do portal.
            </p>
          </div>
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-600">
            Resultados no perfil
          </span>
        </div>

        <form
          className="mt-3 space-y-3 text-sm"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const exam = formData.get("exam") as string;
            const unit = formData.get("unit") as string;
            const preferredDate = formData.get("preferredDate") as string;
            if (!exam || !unit || !preferredDate) return;

            handleSubmission(
              "exames",
              `${patientName} solicitou exame de ${exam} na ${unit} com preferência para ${new Date(
                `${preferredDate}T00:00:00`
              ).toLocaleDateString("pt-BR")}`
            );
            form.reset();
          }}
        >
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Exame desejado
            </label>
            <select
              name="exam"
              required
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              <option value="">Selecione</option>
              <option value="Hemograma completo">Hemograma completo</option>
              <option value="Glicemia em jejum">Glicemia em jejum</option>
              <option value="Ultrassonografia">Ultrassonografia</option>
              <option value="Raio-X">Raio-X</option>
              <option value="Mamografia">Mamografia</option>
              <option value="Teste rápido COVID/Influenza">Teste rápido COVID/Influenza</option>
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Unidade preferencial
              </label>
              <select
                name="unit"
                required
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="">Selecione</option>
                {HEALTH_UNITS.map((unit) => (
                  <option key={unit.name} value={unit.name}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Data preferida
              </label>
              <input
                name="preferredDate"
                type="date"
                required
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Observações (opcional)
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Informe jejum, condições de saúde ou solicitações médicas"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
          >
            Solicitar exame
          </button>
          {successMessages.exames && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <i className="fas fa-check-circle mr-2 text-amber-500"></i>
              {successMessages.exames}
            </div>
          )}
        </form>
      </section>

      <section
        id="receitas"
        className="mb-4 rounded-2xl bg-card dark:bg-card p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{SERVICES.receitas}</h3>
            <p className="text-xs text-muted-foreground">
              Atualize receitas de medicamentos de uso contínuo sem filas.
            </p>
          </div>
          <span className="rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-600">
            Entrega garantida
          </span>
        </div>

        <form
          className="mt-3 space-y-3 text-sm"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const medicine = formData.get("medicine") as string;
            const quantity = formData.get("quantity") as string;
            const lastVisit = formData.get("lastVisit") as string;
            if (!medicine || !quantity || !lastVisit) return;

            handleSubmission(
              "receitas",
              `${patientName} solicitou renovação para ${medicine} (${quantity}) com base na consulta de ${new Date(
                `${lastVisit}T00:00:00`
              ).toLocaleDateString("pt-BR")}`
            );
            form.reset();
          }}
        >
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Medicamento
            </label>
            <input
              name="medicine"
              type="text"
              required
              placeholder="Informe o medicamento de uso contínuo"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Quantidade solicitada
              </label>
              <input
                name="quantity"
                type="text"
                required
                placeholder="Ex.: 30 comprimidos"
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Última consulta
              </label>
              <input
                name="lastVisit"
                type="date"
                required
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Renovar por quanto tempo?
            </label>
            <select
              name="duration"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            >
              <option value="30 dias">30 dias</option>
              <option value="60 dias">60 dias</option>
              <option value="90 dias">90 dias</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Observações (opcional)
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Informar alergias, orientações médicas ou necessidades especiais"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
          >
            Solicitar renovação
          </button>
          {successMessages.receitas && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-200">
              <i className="fas fa-check-circle mr-2 text-rose-500"></i>
              {successMessages.receitas}
            </div>
          )}
        </form>
      </section>
      <section className="mb-4 rounded-2xl bg-card dark:bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Acompanhamento de solicitações</h3>
            <p className="text-xs text-muted-foreground">
              Visualize as últimas solicitações registradas nesta página. Todas também ficam disponíveis no perfil do usuário.
            </p>
          </div>
          <i className="fas fa-bell text-primary"></i>
        </div>
        <div className="mt-3 space-y-3">
          {requests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              Ainda não há solicitações registradas. Assim que você solicitar um serviço, o status aparecerá aqui e no seu perfil, com alertas nas notificações a cada atualização.
            </div>
          ) : (
            requests.slice(0, 3).map((request) => (
              <article
                key={request.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border px-3 py-3"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {request.serviceLabel}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {request.summary}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Registrado em {formatDateTime(request.submittedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded-xl bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                    {request.status}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
        <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
          Para acompanhar o histórico completo e anexar documentos, acesse o menu <span className="font-semibold text-foreground">Perfil do Usuário</span>. As notificações em tempo real informam qualquer mudança de status.
        </p>
      </section>

      <section className="mb-4 rounded-2xl bg-card dark:bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Unidades de Saúde</h3>
        <p className="text-xs text-muted-foreground">
          Encontre horários, endereços e contatos das unidades da rede municipal.
        </p>
        <div className="mt-3 space-y-3">
          {unitsGrouped.map((group, groupIndex) => (
            <div
              key={`unit-group-${groupIndex}`}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {group.map((unit) => (
                <div
                  key={unit.name}
                  className="rounded-xl border border-border p-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <i className="fas fa-clinic-medical text-sm"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{unit.name}</p>
                      <p className="text-[11px] text-muted-foreground">{unit.address}</p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                    <p>
                      <i className="fas fa-clock mr-2 text-primary"></i>
                      {unit.hours}
                    </p>
                    <p>
                      <i className="fas fa-phone-volume mr-2 text-primary"></i>
                      {unit.phone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-4 rounded-2xl bg-card dark:bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold">Ações em destaque da Secretaria de Saúde</h3>
          <i className="fas fa-bullhorn text-primary"></i>
        </div>
        <p className="text-xs text-muted-foreground">
          Campanhas, programas e mutirões ativos. Participe e mantenha a saúde em dia.
        </p>
        <div className="mt-3 space-y-3">
          {HEALTH_ACTIONS.map((action) => (
            <article
              key={action.title}
              className="flex gap-3 rounded-xl border border-border p-3"
            >
              <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <i className={`fas ${action.icon}`}></i>
              </div>
              <div className="text-sm">
                <header className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold text-foreground">{action.title}</h4>
                  <span className="text-[11px] font-semibold text-primary">{action.period}</span>
                </header>
                <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-4 rounded-2xl bg-card dark:bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold">Histórico de atendimentos</h3>
          <i className="fas fa-history text-primary"></i>
        </div>
        <p className="text-xs text-muted-foreground">
          Registro demonstrativo dos últimos atendimentos vinculados ao paciente logado.
        </p>
        <div className="mt-3 space-y-3">
          {PATIENT_HISTORY.map((item) => {
            const tone = toneStyles[item.tone] ?? toneStyles.primary;
            return (
              <article
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-border p-3"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tone.container}`}>
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <div className="flex-1 text-sm">
                  <header className="flex items-center justify-between gap-3">
                    <span className={`text-[11px] font-semibold uppercase tracking-wide ${tone.text}`}>
                      {item.specialty}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{item.date}</span>
                  </header>
                  <p className="mt-1 font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.professional}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-primary dark:border-primary/30 dark:bg-primary/10">
        <div className="flex items-start gap-3">
          <i className="fas fa-info-circle mt-1 text-primary"></i>
          <div>
            <h3 className="font-semibold text-primary">Acompanhe também pelo aplicativo</h3>
            <p className="text-xs text-primary/80">
              Todas as solicitações feitas aqui ficam disponíveis no seu perfil com documentos anexados, histórico de status e comprovantes. Ative as notificações para ser avisado sobre novas etapas como separação de medicamentos, confirmação de transporte ou liberação de exames.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Saude;










