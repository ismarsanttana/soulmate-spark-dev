import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { getSecretariaBySlug } from "@/lib/secretarias";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const Agricultura = () => {
  const secretaria = getSecretariaBySlug("agricultura");

  const [visitaSuccess, setVisitaSuccess] = useState<string | null>(null);
  const [servicoSuccess, setServicoSuccess] = useState<string | null>(null);
  const visitaSuccessRef = useRef<HTMLDivElement | null>(null);
  const servicoSuccessRef = useRef<HTMLDivElement | null>(null);

  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [assistantFeedback, setAssistantFeedback] = useState<string | null>(null);
  const assistantInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!assistantOpen) return;
    const t = setTimeout(() => assistantInputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [assistantOpen]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setAssistantOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const minDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0] ?? "";
  }, []);

  const handleVisitaSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const dateValue = (data.get("date") as string | null) ?? "";
    const timeValue = (data.get("time") as string | null) ?? "";
    const property = (data.get("property") as string | null) ?? "";
    const topicValue = (data.get("topic") as string | null) ?? "";

    if (!dateValue || !timeValue || !property || !topicValue) return;

    const topicSelect = form.elements.namedItem("topic") as HTMLSelectElement | null;
    const topicLabel = topicSelect?.selectedOptions?.[0]?.textContent ?? topicValue;

    const formattedDate = new Date(`${dateValue}T00:00:00`).toLocaleDateString("pt-BR");

    setVisitaSuccess(
      `✅ Visita técnica para "${topicLabel}" agendada na propriedade "${property}" para ${formattedDate} às ${timeValue}.`
    );

    setTimeout(() => {
      visitaSuccessRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    form.reset();
  };

  const handleServicoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const service = (data.get("service") as string | null) ?? "";
    if (!service) return;

    const serviceSelect = form.elements.namedItem("service") as HTMLSelectElement | null;
    const serviceLabel = serviceSelect?.selectedOptions?.[0]?.textContent ?? service;

    setServicoSuccess(
      `✅ Solicitação de "${serviceLabel}" registrada. Nossa equipe entrará em contato para confirmar logística e prazos.`
    );

    setTimeout(() => {
      servicoSuccessRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    form.reset();
  };

  const handleAssistantSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!assistantMessage.trim()) return;
    setAssistantFeedback("Recebemos sua mensagem. Um técnico retornará em breve com orientações.");
    setAssistantMessage("");
  };

  const openAssistant = () => {
    setAssistantFeedback(null);
    setAssistantOpen(true);
  };

  if (!secretaria) {
    return (
      <Layout>
        <div className="rounded-2xl border border-dashed border-border bg-card/70 p-6 text-center text-sm text-muted-foreground shadow-sm">
          Não foi possível carregar as informações da secretaria de agricultura no momento.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header pageTitle="Secretaria de Agricultura" />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Agricultura</h2>
          <p className="text-xs text-muted-foreground">
            Programas de apoio ao produtor rural, assistência técnica, patrulha mecanizada e incentivo à agricultura familiar.
          </p>
        </div>

        {/* ATER + status */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Assistência Técnica e Extensão Rural (ATER)
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Acompanhe visitas, orientações de plantio e sanidade animal.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-[11px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <i className="fas fa-tractor text-[10px]"></i>
              Equipe no campo
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-muted-foreground">
            <article className="rounded-xl border border-border bg-background/70 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">Produtor acompanhado</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Última atualização em 05 out 2025</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <i className="fas fa-circle-check text-[10px]"></i>
                  Ativo
                </span>
              </div>
              <ul className="mt-3 space-y-2 text-[11px] text-muted-foreground">
                <li className="flex items-center gap-2">
                  <i className="fas fa-calendar-check text-primary"></i>
                  Visita técnica agendada para 24 out, 08h
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-seedling text-primary"></i>
                  Plano de manejo — Etapa 2 de 4
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-flask text-primary"></i>
                  Análise de solo: coleta realizada, aguardando laudo
                </li>
              </ul>
            </article>

            <article className="rounded-xl border border-border bg-background/70 p-3">
              <header className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Agenda de visita técnica</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Escolha data, horário e tema da visita</p>
                </div>
              </header>

              <form className="mt-3 space-y-3 text-sm" onSubmit={handleVisitaSubmit}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Data
                    </label>
                    <input
                      name="date"
                      type="date"
                      min={minDate}
                      required
                      className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Horário
                    </label>
                    <select
                      name="time"
                      required
                      className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Selecione</option>
                      <option value="07:30">07:30</option>
                      <option value="09:00">09:00</option>
                      <option value="13:30">13:30</option>
                      <option value="15:00">15:00</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Tema
                    </label>
                    <select
                      name="topic"
                      required
                      className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Selecione</option>
                      <option value="Manejo de solo e adubação">Manejo de solo e adubação</option>
                      <option value="Sanidade animal e vacinação">Sanidade animal e vacinação</option>
                      <option value="Irrigação e convivência com o Semiárido">
                        Irrigação e convivência com o Semiárido
                      </option>
                      <option value="Organização de agroindústria familiar">
                        Organização de agroindústria familiar
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Propriedade / Localidade
                    </label>
                    <input
                      name="property"
                      placeholder="Ex: Sítio Barra Verde"
                      required
                      className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:bg-primary/90 active:scale-95"
                >
                  Confirmar visita
                </button>
              </form>

              {visitaSuccess && (
                <div
                  ref={visitaSuccessRef}
                  className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                >
                  {visitaSuccess}
                </div>
              )}
            </article>
          </div>
        </section>

        {/* Solicitar serviços rurais */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Solicitar serviços rurais</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Patrulha mecanizada, análises e programas de apoio ao produtor.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <i className="fas fa-wheat-awn text-[10px]"></i>
              Prioridade safra
            </span>
          </div>

          <form className="mt-3 space-y-3 text-sm" onSubmit={handleServicoSubmit}>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tipo de serviço
              </label>
              <select
                name="service"
                required
                className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Selecione</option>
                <option value="Horas de trator / gradeação">Horas de trator / gradeação</option>
                <option value="Transporte de silagem / ensiladeira">Transporte de silagem / ensiladeira</option>
                <option value="Análise de solo">Análise de solo</option>
                <option value="Emissão/Atualização de CAF">Emissão/Atualização de CAF</option>
                <option value="Cadastro Garantia-Safra">Cadastro Garantia-Safra</option>
                <option value="Vacinação e manejo de rebanho">Vacinação e manejo de rebanho</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Área (ha)
                </label>
                <input
                  name="area"
                  placeholder="Ex: 2,5"
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Localidade
                </label>
                <input
                  name="local"
                  placeholder="Comunidade / Sítio"
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Observações
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Detalhe a demanda: cultura, época de plantio, acesso à propriedade..."
                className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:bg-primary/90 active:scale-95"
            >
              Enviar solicitação
            </button>
          </form>

          {servicoSuccess && (
            <div
              ref={servicoSuccessRef}
              className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              {servicoSuccess}
            </div>
          )}
        </section>

        {/* Serviços ao produtor (cards) */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Serviços ao produtor</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Acesso rápido a programas e orientações agrícolas.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              <i className="fas fa-lightbulb text-[10px]"></i>
              Em destaque
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
            <article className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <i className="fas fa-leaf"></i>
              </div>
              <div className="flex-1">
                <header className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Garantia-Safra</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <i className="fas fa-clock text-[9px]"></i>
                    Adesão anual
                  </span>
                </header>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Confira requisitos e faça seu pré-cadastro pelo app
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  É necessário CAF ativo e área plantada informada. Documentos serão conferidos pela equipe.
                </p>
                <button
                  type="button"
                  onClick={openAssistant}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition-transform duration-150 hover:bg-primary/90 active:scale-95"
                >
                  <i className="fas fa-clipboard-check"></i>
                  Fazer pré-cadastro
                </button>
              </div>
            </article>

            <article className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                <i className="fas fa-basket-shopping"></i>
              </div>
              <div className="flex-1">
                <header className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>PNAE / PAA — Vendas institucionais</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <i className="fas fa-seedling text-[9px]"></i>
                    30% merenda escolar
                  </span>
                </header>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Como vender sua produção para a merenda e programas sociais
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Saiba como emitir DAP/CAF, notas fiscais e organizar grupos formais ou informais.
                </p>
                <Link
                  to="/editais"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-transform duration-150 hover:bg-emerald-700 active:scale-95"
                >
                  <i className="fas fa-file-lines"></i>
                  Ver editais abertos
                </Link>
              </div>
            </article>

            <article className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                <i className="fas fa-cow"></i>
              </div>
              <div className="flex-1">
                <header className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Vacinação e sanidade animal</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    <i className="fas fa-syringe text-[9px]"></i>
                    Campanhas por período
                  </span>
                </header>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Calendário de vacinação e suporte para emissão de GTA
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• Bovinocultura: campanhas de aftosa e outras zoonoses</li>
                  <li>• Caprinovinocultura: vermifugação e controle de ectoparasitas</li>
                  <li>• Emissão de GTA via órgão estadual — orientação e agendamento</li>
                </ul>
              </div>
            </article>
          </div>
        </section>

        {/* Locais de atendimento */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Locais de atendimento</h3>
          <p className="mt-1 text-xs text-muted-foreground">Unidades presenciais e contatos úteis.</p>

          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <article className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div>
                <p className="font-semibold text-foreground">Sede da Secretaria de Agricultura</p>
                <p className="text-xs text-muted-foreground">Centro Administrativo — Sala 12</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Atendimento: seg a sex, 08h às 17h · Telefone: (83) 0000-0000
                </p>
              </div>
            </article>

            <article className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                <i className="fas fa-warehouse"></i>
              </div>
              <div>
                <p className="font-semibold text-foreground">Pátio da Patrulha Mecanizada</p>
                <p className="text-xs text-muted-foreground">Garagem municipal — Setor de Máquinas</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Atendimento: agendamento prévio · Telefone: (83) 0000-0001
                </p>
              </div>
            </article>
          </div>
        </section>
      </div>

      {/* FAB: Assistente Virtual */}
      <div className="fixed bottom-56 right-6 z-40 flex flex-col items-end gap-3">
        <div
          id="assistant-panel"
          aria-hidden={!assistantOpen}
          className={`w-72 max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur transition-all duration-200 ${
            assistantOpen ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Assistente virtual</p>
              <h4 className="text-sm font-semibold text-foreground">Como podemos ajudar?</h4>
            </div>
            <button
              id="assistant-close"
              type="button"
              onClick={() => setAssistantOpen(false)}
              className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Fechar assistente"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="mt-3 space-y-3 text-xs text-muted-foreground">
            <div className="rounded-xl bg-primary/10 p-3">
              <p className="mb-1 font-semibold text-primary">Sugestões rápidas</p>
              <ul className="space-y-1">
                <li>• Agendar visita técnica</li>
                <li>• Solicitar horas de trator</li>
                <li>• Consultar Garantia-Safra</li>
              </ul>
            </div>

            <form className="space-y-2" onSubmit={handleAssistantSubmit}>
              <label
                htmlFor="assistant-message"
                className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Faça sua pergunta
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="assistant-message"
                  ref={assistantInputRef}
                  type="text"
                  value={assistantMessage}
                  onChange={(e) => setAssistantMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition-transform duration-150 hover:bg-primary/90 active:scale-95"
                >
                  Enviar
                </button>
              </div>
            </form>

            {assistantFeedback && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                {assistantFeedback}
              </div>
            )}
          </div>
        </div>

        <button
          id="assistant-toggle"
          type="button"
          aria-expanded={assistantOpen}
          onClick={() => {
            setAssistantFeedback(null);
            setAssistantOpen((prev) => !prev);
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl text-white shadow-xl transition-transform duration-150 hover:bg-primary/90 active:scale-95"
        >
          <i className={`fas ${assistantOpen ? "fa-times" : "fa-comments"}`}></i>
        </button>
      </div>
    </Layout>
  );
};

export default Agricultura;
