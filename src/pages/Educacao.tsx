import { Layout } from "@/components/Layout";
import { cn } from "@/lib/utils";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

type GradeSummary = Record<string, string>;

type BoletimInfo = {
  student: string;
  grades: GradeSummary;
};

type MatriculaSummary = {
  student: string;
  record: string;
  school?: string;
  shift?: string;
  guardian?: string;
  contact?: string;
  notes?: string;
};

type CalendarCell =
  | { type: "placeholder"; label: string }
  | {
      type: "day";
      label: string;
      description: string;
      variant?: "default" | "exam" | "holiday";
    };

type TransportRoute = {
  id: string;
  title: string;
  subtitle: string;
  status: {
    label: string;
    icon: string;
    tone: "emerald" | "amber";
  };
  tags: Array<{
    icon: string;
    text: string;
    tone: "primary" | "sky" | "muted";
  }>;
  timeline: Array<{
    dot: string;
    title: string;
    description: string;
  }>;
};

const boletimMock: Record<string, BoletimInfo> = {
  "2025-67890": {
    student: "Maria Fernanda",
    grades: {
      PortuguÃªs: "9,2",
      MatemÃ¡tica: "8,8",
      CiÃªncias: "9,5",
      HistÃ³ria: "9,0",
      Geografia: "9,1",
    },
  },
  default: {
    student: "JoÃ£o Pedro",
    grades: {
      PortuguÃªs: "8,5",
      MatemÃ¡tica: "9,0",
      CiÃªncias: "8,7",
      HistÃ³ria: "8,8",
      Geografia: "8,6",
    },
  },
};

const transportRoutes: TransportRoute[] = [
  {
    id: "rota-02",
    title: "Rota 02 â€” Centro â‡„ SÃ­tio Malhada",
    subtitle: "Turno da manhÃ£ â€¢ Monitor: Ana LuÃ­sa",
    status: {
      label: "Em rota",
      icon: "fa-check-circle",
      tone: "emerald",
    },
    tags: [
      { icon: "fa-bus", text: "Ã”nibus 12", tone: "primary" },
      {
        icon: "fa-clock",
        text: "PrÃ³xima parada Ã s 07:20",
        tone: "sky",
      },
      {
        icon: "fa-circle-info",
        text: "Atualizado Ã s 07:05",
        tone: "muted",
      },
    ],
    timeline: [
      {
        dot: "bg-emerald-500",
        title: "Ponto 1 â€” Escola Municipal Maria do Carmo",
        description: "Embarque concluÃ­do Ã s 06:50",
      },
      {
        dot: "bg-primary",
        title: "Ponto 2 â€” PraÃ§a Central",
        description: "Em andamento â€” chegada prevista para 07:15",
      },
      {
        dot: "bg-amber-500",
        title: "Ponto 3 â€” Comunidade SÃ­tio Malhada",
        description: "PrÃ³xima parada â€” previsÃ£o 07:20",
      },
    ],
  },
  {
    id: "rota-05",
    title: "Rota 05 â€” Distrito Pindoba â‡„ Centro",
    subtitle: "Turno da tarde â€¢ Monitor: JosÃ© Carlos",
    status: {
      label: "Preparando saÃ­da",
      icon: "fa-hourglass-half",
      tone: "amber",
    },
    tags: [
      { icon: "fa-bus", text: "Ã”nibus 07", tone: "primary" },
      {
        icon: "fa-clock",
        text: "SaÃ­da programada Ã s 12:30",
        tone: "sky",
      },
    ],
    timeline: [
      {
        dot: "bg-muted-foreground/40",
        title: "Ponto 1 â€” Escola Municipal AntÃ´nio JerÃ´nimo",
        description: "Em formaÃ§Ã£o de fila",
      },
      {
        dot: "bg-muted-foreground/40",
        title: "Ponto 2 â€” Vila OperÃ¡ria",
        description: "PrevisÃ£o de chegada 12:45",
      },
      {
        dot: "bg-muted-foreground/40",
        title: "Ponto 3 â€” Distrito Pindoba",
        description: "Chegada estimada Ã s 13:10",
      },
    ],
  },
];

const calendarWeekdays = ["S", "T", "Q", "Q", "S", "S", "D"];

const calendarCells: CalendarCell[] = [
  { type: "placeholder", label: "30" },
  { type: "placeholder", label: "1" },
  { type: "placeholder", label: "2" },
  { type: "placeholder", label: "3" },
  { type: "placeholder", label: "4" },
  {
    type: "day",
    label: "5",
    description: "ReuniÃ£o pedagÃ³gica â€“ Escolas em horÃ¡rio especial",
  },
  {
    type: "day",
    label: "6",
    description: "InÃ­cio das aulas â€“ Semestre 2025.2",
  },
  { type: "placeholder", label: "7" },
  {
    type: "day",
    label: "8",
    description: "Entrega de materiais didÃ¡ticos",
  },
  { type: "placeholder", label: "9" },
  { type: "placeholder", label: "10" },
  { type: "placeholder", label: "11" },
  {
    type: "day",
    label: "12",
    description: "Prova diagnÃ³stica - MatemÃ¡tica (6Âº ao 9Âº ano)",
    variant: "exam",
  },
  { type: "placeholder", label: "13" },
  { type: "placeholder", label: "14" },
  {
    type: "day",
    label: "15",
    description: "Feriado municipal - AniversÃ¡rio da cidade",
    variant: "holiday",
  },
  { type: "placeholder", label: "16" },
  { type: "placeholder", label: "17" },
  {
    type: "day",
    label: "18",
    description: "ReuniÃ£o com responsÃ¡veis - EducaÃ§Ã£o Infantil",
  },
  { type: "placeholder", label: "19" },
  {
    type: "day",
    label: "20",
    description: "AvaliaÃ§Ã£o de LÃ­ngua Portuguesa - 3Âº ano",
    variant: "exam",
  },
  { type: "placeholder", label: "21" },
  { type: "placeholder", label: "22" },
  { type: "placeholder", label: "23" },
  { type: "placeholder", label: "24" },
  {
    type: "day",
    label: "25",
    description: "Feira de CiÃªncias nas escolas rurais",
  },
  { type: "placeholder", label: "26" },
  {
    type: "day",
    label: "27",
    description: "Simulado ENEM - Alunos do ensino mÃ©dio",
    variant: "exam",
  },
  { type: "placeholder", label: "28" },
  { type: "placeholder", label: "29" },
  { type: "placeholder", label: "30" },
  { type: "placeholder", label: "31" },
  { type: "placeholder", label: "1" },
  { type: "placeholder", label: "2" },
  { type: "placeholder", label: "3" },
];

const statusStyles = {
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300",
  amber:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
};

const tagStyles = {
  primary:
    "bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary-100",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300",
  muted:
    "bg-muted text-muted-foreground dark:bg-muted/40 dark:text-muted-foreground/80",
};

const calendarVariantClasses = {
  default:
    "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-100",
  exam: "bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/35 dark:text-sky-300",
  holiday:
    "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/35 dark:text-amber-300",
};
const Educacao = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [boletimMatricula, setBoletimMatricula] = useState("");
  const [boletim, setBoletim] = useState<BoletimInfo | null>(null);
  const [matriculaSummary, setMatriculaSummary] =
    useState<MatriculaSummary | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [calendarEvent, setCalendarEvent] = useState<{
    day: string;
    description: string;
  } | null>(null);
  const alunoInputRef = useRef<HTMLInputElement | null>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!calendarEvent) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [calendarEvent]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (calendarEvent) {
        event.preventDefault();
        setCalendarEvent(null);
        return;
      }

      if (assistantOpen) {
        event.preventDefault();
        setAssistantOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [assistantOpen, calendarEvent]);

  const formattedDate = useMemo(
    () =>
      currentDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [currentDate],
  );

  const formattedTime = useMemo(
    () =>
      currentDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [currentDate],
  );

  const handleBoletimSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const matricula = boletimMatricula.trim();
    if (!matricula) return;

    const result = boletimMock[matricula] ?? boletimMock.default;
    setBoletim(result);
  };

  const handleMatriculaSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const student = (data.get("aluno") as string | null)?.trim() ?? "";
    const record = (data.get("numero") as string | null)?.trim() ?? "";
    if (!student || !record) {
      return;
    }

    const school = (data.get("escola") as string | null) || undefined;
    const shift = (data.get("turno") as string | null) || undefined;
    const guardian =
      (data.get("responsavel") as string | null)?.trim() || undefined;
    const contact =
      (data.get("contato") as string | null)?.trim() || undefined;
    const notes =
      (data.get("observacoes") as string | null)?.trim() || undefined;

    setMatriculaSummary({
      student,
      record,
      school: school || undefined,
      shift: shift || undefined,
      guardian,
      contact,
      notes,
    });

    form.reset();
    setTimeout(() => alunoInputRef.current?.focus(), 0);
  };
  return (
    <Layout>
      <div className="space-y-5">
        <header className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-3">
              <img
                src="https://camalau.pb.gov.br/skins/avancado/template/2025/img/logos/logo.png"
                alt="Prefeitura de CamalaÃº"
                className="h-12 w-auto bg-white p-1 rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold">Conecta CamalaÃº</h1>
                <p className="text-xs opacity-90">Prefeitura de CamalaÃº</p>
              </div>
            </div>
            <button
              type="button"
              className="bg-white/15 p-2 rounded-xl hover:bg-white/20 transition"
              aria-label="Compartilhar"
            >
              <i className="fas fa-share-nodes text-white"></i>
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <i className="fas fa-sun"></i>
              <span>29Â°C - Ensolarado</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="far fa-calendar"></i>
              <span className="capitalize">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="far fa-clock"></i>
              <span>{formattedTime}</span>
            </div>
          </div>

          <div className="mt-4 relative">
            <input
              type="text"
              placeholder="Buscar serviÃ§os, protocolos, notÃ­cias..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl bg-white/90 text-gray-900 px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            <i className="fas fa-search absolute right-3 top-3.5 text-gray-400"></i>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3">
          <Link
            to="/notificacoes"
            className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm card-hover block focus:outline-none focus:ring-2 focus:ring-primary border border-border"
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                  <i className="fas fa-bell"></i>
                </div>
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full">
                  3
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">NotificaÃ§Ãµes</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  2 protocolos atualizados â€¢ 1 aviso
                </p>
              </div>
            </div>
          </Link>
          <Link
            to="/perfil"
            className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm card-hover block focus:outline-none focus:ring-2 focus:ring-primary border border-border"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-primary-600 flex items-center justify-center text-white font-semibold">
                BR
              </div>
              <div>
                <p className="text-sm font-semibold">OlÃ¡, Bira</p>
                <p className="text-xs text-muted-foreground">Ãrea do usuÃ¡rio</p>
              </div>
            </div>
          </Link>
        </section>

        <main className="space-y-4">
          <section>
            <h2 className="font-semibold text-lg">Secretaria de EducaÃ§Ã£o</h2>
            <p className="text-xs text-muted-foreground">
              MatrÃ­culas, transporte escolar e calendÃ¡rio.
            </p>
          </section>

          <section className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm border border-border space-y-3">
            <div>
              <h3 className="font-semibold">Boletim Escolar</h3>
              <p className="text-xs text-muted-foreground">
                Consulte as notas usando o nÃºmero de matrÃ­cula (demo).
              </p>
            </div>
            <form
              className="space-y-3 text-sm"
              onSubmit={handleBoletimSubmit}
            >
              <div>
                <label
                  htmlFor="boletim-matricula"
                  className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                >
                  NÃºmero da matrÃ­cula
                </label>
                <div className="flex gap-2">
                  <input
                    id="boletim-matricula"
                    value={boletimMatricula}
                    onChange={(event) => setBoletimMatricula(event.target.value)}
                    placeholder="Ex.: 2025-12345"
                    required
                    className="flex-1 rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition">
                    Consultar
                  </button>
                </div>
              </div>
            </form>
            {boletim && (
              <div className="mt-3 text-xs text-foreground/80 space-y-2 bg-primary/5 dark:bg-primary/20 border border-primary/20 dark:border-primary/40 rounded-xl p-3">
                <p className="font-semibold">
                  Aluno: <span>{boletim.student}</span>
                </p>
                <ul className="space-y-1">
                  {Object.entries(boletim.grades).map(([subject, grade]) => (
                    <li key={subject} className="flex justify-between gap-4">
                      <span>{subject}</span>
                      <span className="font-semibold text-primary">
                        {grade}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm border border-border space-y-3">
            <div>
              <h3 className="font-semibold">MatrÃ­cula Escolar</h3>
              <p className="text-xs text-muted-foreground">
                Preencha os dados completos do estudante para solicitar ou
                atualizar a matrÃ­cula (demonstraÃ§Ã£o).
              </p>
            </div>
            <form
              className="space-y-3 text-sm"
              onSubmit={handleMatriculaSubmit}
            >
              <div>
                <label
                  htmlFor="matricula-aluno"
                  className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                >
                  Nome completo do aluno
                </label>
                <input
                  id="matricula-aluno"
                  name="aluno"
                  ref={alunoInputRef}
                  required
                  placeholder="Digite o nome completo"
                  className="w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="matricula-nascimento"
                    className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                  >
                    Data de nascimento
                  </label>
                  <input
                    id="matricula-nascimento"
                    name="nascimento"
                    type="date"
                    required
                    className="w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="matricula-serie"
                    className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                  >
                    SÃ©rie/Etapa
                  </label>
                  <input
                    id="matricula-serie"
                    name="serie"
                    required
                    placeholder="Ex.: 6Âº ano â€¢ Ensino Fundamental"
                    className="w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="matricula-numero"
                    className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                  >
                    NÃºmero da matrÃ­cula
                  </label>
                  <input
                    id="matricula-numero"
                    name="numero"
                    required
                    placeholder="Ex.: 2025-12345"
                    className="w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="matricula-escola"
                    className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                  >
                    Escola de interesse
                  </label>
                  <select
                    id="matricula-escola"
                    name="escola"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    <option value="EM Maria do Carmo">EM Maria do Carmo</option>
                    <option value="EM AntÃ´nio JerÃ´nimo">
                      EM AntÃ´nio JerÃ´nimo
                    </option>
                    <option value="EM Francisco Pereira">
                      EM Francisco Pereira
                    </option>
                    <option value="Creche Municipal Pequenos Passos">
                      Creche Municipal Pequenos Passos
                    </option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="matricula-turno"
                    className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                  >
                    Turno pretendido
                  </label>
                  <select
                    id="matricula-turno"
                    name="turno"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="matricula-responsavel"
                    className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                  >
                    Nome do responsÃ¡vel
                  </label>
                  <input
                    id="matricula-responsavel"
                    name="responsavel"
                    required
                    placeholder="ResponsÃ¡vel legal"
                    className="w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="matricula-contato"
                  className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                >
                  Contato do responsÃ¡vel
                </label>
                <input
                  id="matricula-contato"
                  name="contato"
                  type="tel"
                  required
                  placeholder="(83) 99999-0000"
                  className="w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="matricula-observacoes"
                  className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                >
                  ObservaÃ§Ãµes (opcional)
                </label>
                <textarea
                  id="matricula-observacoes"
                  name="observacoes"
                  rows={3}
                  placeholder="Informe necessidades especÃ­ficas, transporte, alimentaÃ§Ã£o etc."
                  className="w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                ></textarea>
              </div>
              <button className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-xl text-sm font-semibold transition">
                Enviar solicitaÃ§Ã£o
              </button>
            </form>
            {matriculaSummary && (
              <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 space-y-1">
                <p className="font-semibold">
                  âœ… {matriculaSummary.student} â€¢ matrÃ­cula {matriculaSummary.record}
                  {matriculaSummary.school ? ` â€¢ escola ${matriculaSummary.school}` : ""}
                  {matriculaSummary.shift
                    ? ` â€¢ turno ${matriculaSummary.shift.toLowerCase()}`
                    : ""}
                </p>
                {(matriculaSummary.guardian || matriculaSummary.contact) && (
                  <p>
                    ðŸ‘¨â€ðŸ‘©â€ðŸ‘§ ResponsÃ¡vel: {matriculaSummary.guardian ?? "NÃ£o informado"}
                    {matriculaSummary.contact ? ` (${matriculaSummary.contact})` : ""}
                  </p>
                )}
                {matriculaSummary.notes && (
                  <p>ðŸ“ ObservaÃ§Ãµes: {matriculaSummary.notes}</p>
                )}
              </div>
            )}
          </section>
          <section className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm border border-border space-y-3">
            <div>
              <h3 className="font-semibold">Transporte Escolar</h3>
              <p className="text-xs text-muted-foreground">
                Acompanhe o status das rotas de Ã´nibus escolares.
              </p>
            </div>
            <div className="space-y-3">
              {transportRoutes.map((route) => (
                <article
                  key={route.id}
                  className="rounded-2xl border border-border bg-background dark:bg-card/60 p-3 space-y-3"
                >
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {route.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {route.subtitle}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
                        statusStyles[route.status.tone],
                      )}
                    >
                      <i className={`fas ${route.status.icon} text-[10px]`}></i>
                      {route.status.label}
                    </span>
                  </header>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {route.tags.map((tag) => (
                      <span
                        key={`${route.id}-${tag.text}`}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full",
                          tagStyles[tag.tone],
                        )}
                      >
                        <i className={`fas ${tag.icon} text-[10px]`}></i>
                        {tag.text}
                      </span>
                    ))}
                  </div>
                  <ol className="space-y-3 text-xs text-muted-foreground">
                    {route.timeline.map((item) => (
                      <li key={`${route.id}-${item.title}`} className="flex items-start gap-3">
                        <div className={`mt-1 h-2.5 w-2.5 rounded-full ${item.dot}`}></div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>

          <section className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm border border-border space-y-3">
            <div>
              <h3 className="font-semibold">CalendÃ¡rio Letivo</h3>
              <p className="text-xs text-muted-foreground">
                Datas de retorno, avaliaÃ§Ãµes e eventos especiais.
              </p>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {calendarWeekdays.map((weekday) => (
                <div
                  key={weekday}
                  className="font-semibold text-muted-foreground py-2 uppercase tracking-wide"
                >
                  {weekday}
                </div>
              ))}
              {calendarCells.map((cell, index) =>
                cell.type === "placeholder" ? (
                  <div
                    key={`placeholder-${index}`}
                    className="py-2 text-muted-foreground/60"
                  >
                    {cell.label}
                  </div>
                ) : (
                  <button
                    key={`day-${cell.label}-${index}`}
                    type="button"
                    onClick={() =>
                      setCalendarEvent({
                        day: cell.label,
                        description: cell.description,
                      })
                    }
                    className={cn(
                      "flex items-center justify-center rounded-xl px-2 py-2 font-semibold transition transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      calendarVariantClasses[cell.variant ?? "default"],
                    )}
                  >
                    {cell.label}
                  </button>
                ),
              )}
            </div>
          </section>
        </main>
      </div>
      {calendarEvent && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm rounded-2xl bg-card dark:bg-card border border-border shadow-2xl p-5">
            <button
              type="button"
              aria-label="Fechar evento"
              onClick={() => setCalendarEvent(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition"
            >
              <i className="fas fa-times"></i>
            </button>
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Evento do dia
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Dia {calendarEvent.day} â€” {calendarEvent.description}
            </p>
          </div>
        </div>
      )}

      <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-3">
        <div
          aria-hidden={!assistantOpen}
          className={cn(
            "w-72 max-w-full rounded-2xl border border-border bg-card dark:bg-card shadow-2xl transition-all duration-200 transform",
            assistantOpen
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-3 scale-95 pointer-events-none",
          )}
        >
          <div className="flex items-start justify-between p-4 border-b border-border">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Assistente Virtual
              </p>
              <h2 className="text-sm font-semibold text-foreground">
                Como posso ajudar?
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setAssistantOpen(false)}
              aria-label="Fechar assistente"
              className="text-muted-foreground hover:text-foreground transition"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="p-4 space-y-3 text-xs text-muted-foreground">
            <div className="rounded-xl bg-primary/10 dark:bg-primary/20 p-3">
              <p className="font-semibold text-primary dark:text-primary-100 mb-1">
                SugestÃµes rÃ¡pidas
              </p>
              <ul className="space-y-1">
                <li>â€¢ CalendÃ¡rio letivo atualizado</li>
                <li>â€¢ Como solicitar transporte escolar</li>
                <li>â€¢ Documentos para matrÃ­cula</li>
              </ul>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="assistant-message"
                className="block text-[11px] uppercase tracking-wide text-muted-foreground/80"
              >
                Pergunte algo
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="assistant-message"
                  type="text"
                  placeholder="Digite sua pergunta..."
                  className="flex-1 rounded-xl border border-border px-3 py-2 bg-muted/40 dark:bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={assistantOpen}
         
          onClick={() => setAssistantOpen((state) => !state)}
          className={cn(
            "h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-2xl flex items-center justify-center text-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
            assistantOpen && "ring-4 ring-primary/30",
          )}
        >
          <i className="fas fa-comments"></i>
        </button>
      </div>
    </Layout>
  );
};

export default Educacao;
