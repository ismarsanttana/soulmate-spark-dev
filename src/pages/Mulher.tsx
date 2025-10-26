import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { getSecretariaBySlug } from "@/lib/secretarias";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const Mulher = () => {
  const secretaria = getSecretariaBySlug("mulher");

  const [atendimentoSuccess, setAtendimentoSuccess] = useState<string | null>(null);
  const [apoioSuccess, setApoioSuccess] = useState<string | null>(null);
  const atendimentoSuccessRef = useRef<HTMLDivElement | null>(null);
  const apoioSuccessRef = useRef<HTMLDivElement | null>(null);

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

  const handleAtendimentoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const dateValue = (data.get("date") as string | null) ?? "";
    const timeValue = (data.get("time") as string | null) ?? "";
    const topicValue = (data.get("topic") as string | null) ?? "";
    const contactValue = (data.get("contact") as string | null) ?? "";

    if (!dateValue || !timeValue || !topicValue) return;

    const topicSelect = form.elements.namedItem("topic") as HTMLSelectElement | null;
    const topicLabel = topicSelect?.selectedOptions?.[0]?.textContent ?? topicValue;

    const formattedDate = new Date(`${dateValue}T00:00:00`).toLocaleDateString("pt-BR");

    setAtendimentoSuccess(
      `✅ Atendimento (${topicLabel}) agendado para ${formattedDate} às ${timeValue}${
        contactValue ? ` · Contato: ${contactValue}` : ""
      }.`
    );

    setTimeout(() => {
      atendimentoSuccessRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    form.reset();
  };

  const handleApoioSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const support = (data.get("support") as string | null) ?? "";
    if (!support) return;

    const supportSelect = form.elements.namedItem("support") as HTMLSelectElement | null;
    const supportLabel = supportSelect?.selectedOptions?.[0]?.textContent ?? support;

    setApoioSuccess(
      `✅ Solicitação de "${supportLabel}" registrada. Nossa equipe retornará com orientações em breve.`
    );

    setTimeout(() => {
      apoioSuccessRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    form.reset();
  };

  const handleAssistantSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!assistantMessage.trim()) return;
    setAssistantFeedback("Recebemos sua mensagem. Em breve retornaremos com orientações.");
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
          Não foi possível carregar as informações da Secretaria da Mulher no momento.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header pageTitle="Secretaria da Mulher" />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Direitos, proteção e autonomia</h2>
          <p className="text-xs text-muted-foreground">
            Políticas para as mulheres: enfrentamento às violências, acolhimento, orientação
            jurídica/psicossocial e promoção da autonomia econômica.
          </p>
        </div>

        {/* Atendimento especializado */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Atendimento especializado</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Agende atendimento psicossocial e/ou orientação jurídica.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              <i className="fas fa-user-shield text-[10px]"></i>
              Confidencial
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-muted-foreground">
            <article className="rounded-xl border border-border bg-background/70 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">Acompanhamento ativo</p>
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
                  Retorno com psicóloga agendado para 24 out, 10h
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-scale-balanced text-primary"></i>
                  Encaminhamento jurídico — acompanhamento em andamento
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-people-group text-primary"></i>
                  Grupo de apoio — encontros quinzenais
                </li>
              </ul>
            </article>

            <article className="rounded-xl border border-border bg-background/70 p-3">
              <header className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Agendar atendimento</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Escolha data, horário e o tipo de atendimento
                  </p>
                </div>
              </header>

              <form className="mt-3 space-y-3 text-sm" onSubmit={handleAtendimentoSubmit}>
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
                      <option value="08:30">08:30</option>
                      <option value="10:00">10:00</option>
                      <option value="14:00">14:00</option>
                      <option value="16:00">16:00</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Tipo de atendimento
                    </label>
                    <select
                      name="topic"
                      required
                      className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Selecione</option>
                      <option value="Psicológico">Psicológico</option>
                      <option value="Serviço Social">Serviço Social</option>
                      <option value="Orientação Jurídica">Orientação Jurídica</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Contato preferencial
                    </label>
                    <input
                      name="contact"
                      placeholder="Ex: WhatsApp (87) 9xxxx-xxxx"
                      className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:bg-primary/90 active:scale-95"
                >
                  Confirmar agendamento
                </button>
              </form>

              {atendimentoSuccess && (
                <div
                  ref={atendimentoSuccessRef}
                  className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                >
                  {atendimentoSuccess}
                </div>
              )}
            </article>
          </div>
        </section>

        {/* Solicitar apoio e encaminhamento */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Solicitar apoio e encaminhamento</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Registre uma demanda de orientação, encaminhamento ou participação em grupos.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              <i className="fas fa-exclamation-circle text-[10px]"></i>
              Prioridade
            </span>
          </div>

          <form className="mt-3 space-y-3 text-sm" onSubmit={handleApoioSubmit}>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tipo de apoio
              </label>
              <select
                name="support"
                required
                className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Selecione</option>
                <option value="Orientação sobre direitos e serviços">Orientação sobre direitos e serviços</option>
                <option value="Encaminhamento para rede de atendimento">Encaminhamento para rede de atendimento</option>
                <option value="Participação em grupos e oficinas">Participação em grupos e oficinas</option>
                <option value="Empreendedorismo e autonomia econômica">Empreendedorismo e autonomia econômica</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contato seguro
                </label>
                <input
                  name="safe_contact"
                  placeholder="Telefone/WhatsApp"
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Melhor horário para contato
                </label>
                <select
                  name="best_time"
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Indiferente</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Descrição (opcional)
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Conte brevemente sua necessidade. Suas informações são confidenciais."
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

          {apoioSuccess && (
            <div
              ref={apoioSuccessRef}
              className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              {apoioSuccess}
            </div>
          )}

          <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[11px] text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
            <i className="fas fa-triangle-exclamation mr-1"></i>
            <strong>Emergência:</strong> ligue <strong>190</strong> (Polícia) ou <strong>180</strong> (Central de
            Atendimento à Mulher).
          </div>
        </section>

        {/* Serviços para as mulheres */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Serviços para as mulheres</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Acesso rápido a programas, grupos e orientações.
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
                <i className="fas fa-shield-halved"></i>
              </div>
              <div className="flex-1">
                <header className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Direitos e proteção</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <i className="fas fa-scale-balanced text-[9px]"></i>
                    Orientação básica
                  </span>
                </header>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Informações sobre medidas protetivas e rede de atendimento
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Saiba como buscar apoio junto à Delegacia, Ministério Público e Defensoria.
                </p>
                <button
                  type="button"
                  onClick={openAssistant}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition-transform duration-150 hover:bg-primary/90 active:scale-95"
                >
                  <i className="fas fa-comments"></i>
                  Falar com a equipe
                </button>
              </div>
            </article>

            <article className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                <i className="fas fa-briefcase"></i>
              </div>
              <div className="flex-1">
                <header className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Autonomia econômica</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <i className="fas fa-chalkboard-user text-[9px]"></i>
                    Cursos e feiras
                  </span>
                </header>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Qualificação profissional, empreendedorismo e feiras locais
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Inscreva-se em oficinas, participe de redes e divulgue seus produtos.
                </p>
                <Link
                  to="/oportunidades"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-transform duration-150 hover:bg-emerald-700 active:scale-95"
                >
                  <i className="fas fa-file-lines"></i>
                  Ver oportunidades
                </Link>
              </div>
            </article>

            <article className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                <i className="fas fa-stethoscope"></i>
              </div>
              <div className="flex-1">
                <header className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Saúde da mulher</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    <i className="fas fa-calendar-days text-[9px]"></i>
                    Calendário
                  </span>
                </header>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Preventivo, mamografia e cuidado integral (em parceria com a Saúde)
                </p>
                <button
                  type="button"
                  onClick={openAssistant}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-transform duration-150 hover:bg-indigo-700 active:scale-95"
                >
                  <i className="fas fa-clipboard-check"></i>
                  Agendar pelo app
                </button>
              </div>
            </article>
          </div>
        </section>

        {/* Contato e Endereço */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Contato e endereço</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Atendimento presencial e canais oficiais.
          </p>

          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <article className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div>
                <p className="font-semibold text-foreground">Secretaria da Mulher</p>
                <p className="text-xs text-muted-foreground">
                  Endereço: Avenida Arthur Padilha, nº 767 — Centro — Afogados da Ingazeira
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Telefone: (87) 3838-1235 · E-mail:{" "}
                  <a
                    href="mailto:sic@afogadosdaingazeira.pe.gov.br"
                    className="font-medium text-foreground underline underline-offset-2"
                  >
                    sic@afogadosdaingazeira.pe.gov.br
                  </a>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Horário de atendimento: <span className="font-semibold text-foreground">08h às 17h</span>
                </p>
              </div>
            </article>
          </div>
        </section>
      </div>

      {/* FAB: Assistente Virtual */}
      <div className="fixed bottom-52 right-6 z-40 flex flex-col items-end gap-3">
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
                <li>• Agendar atendimento psicossocial</li>
                <li>• Pedir orientação sobre direitos</li>
                <li>• Participar de grupos e oficinas</li>
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

export default Mulher;
