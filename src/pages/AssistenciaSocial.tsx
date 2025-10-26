import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { getSecretariaBySlug } from "@/lib/secretarias";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const formatHeaderDate = (date: Date) =>
  date
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(".", "");

const formatHeaderTime = (date: Date) =>
  date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const AssistenciaSocial = () => {
  const secretaria = getSecretariaBySlug("assistencia");
  const [atendimentoSuccess, setAtendimentoSuccess] = useState<string | null>(
    null
  );
  const [beneficioSuccess, setBeneficioSuccess] = useState<string | null>(null);
  const atendimentoSuccessRef = useRef<HTMLDivElement | null>(null);
  const beneficioSuccessRef = useRef<HTMLDivElement | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [assistantFeedback, setAssistantFeedback] = useState<string | null>(null);
  const assistantInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!assistantOpen) {
      return;
    }
    const focusTimeout = setTimeout(
      () => assistantInputRef.current?.focus(),
      150
    );
    return () => clearTimeout(focusTimeout);
  }, [assistantOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAssistantOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const minDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0] ?? "";
  }, []);

  const handleAtendimentoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const dateValue = (formData.get("date") as string | null) ?? "";
    const timeValue = (formData.get("time") as string | null) ?? "";
    const topicValue = (formData.get("topic") as string | null) ?? "";

    if (!dateValue || !timeValue || !topicValue) {
      return;
    }

    const topicSelect = form.elements.namedItem(
      "topic"
    ) as HTMLSelectElement | null;
    const topicLabel =
      topicSelect?.selectedOptions?.[0]?.textContent ?? topicValue;

    const formattedDate = new Date(`${dateValue}T00:00:00`).toLocaleDateString(
      "pt-BR"
    );

    setAtendimentoSuccess(
      `✅ Atendimento sobre "${topicLabel}" confirmado para ${formattedDate} às ${timeValue}.`
    );

    setTimeout(() => {
      atendimentoSuccessRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);

    form.reset();
  };

  const handleBeneficioSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const benefitValue = (formData.get("benefit") as string | null) ?? "";

    if (!benefitValue) {
      return;
    }

    const benefitSelect = form.elements.namedItem(
      "benefit"
    ) as HTMLSelectElement | null;
    const benefitLabel =
      benefitSelect?.selectedOptions?.[0]?.textContent ?? benefitValue;

    setBeneficioSuccess(
      `✅ Solicitação de "${benefitLabel}" registrada. A equipe fará contato em até 48h.`
    );

    setTimeout(() => {
      beneficioSuccessRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);

    form.reset();
  };

  const handleAssistantSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!assistantMessage.trim()) {
      return;
    }

    setAssistantFeedback(
      "Recebemos sua mensagem e retornaremos com orientações assim que possível."
    );
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
          Não foi possível carregar as informações da secretaria de assistência
          social no momento.
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Header pageTitle="Secretaria de Assistência Social" />

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Assistência Social
          </h2>
          <p className="text-sm text-muted-foreground">
            Programas sociais, benefícios e serviços de proteção ao cidadão.
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Acompanhamento CRAS
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Veja o status do seu acompanhamento familiar e agende novos
                atendimentos.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              <i className="fas fa-house-user text-[10px]"></i>
              CRAS Centro
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-muted-foreground">
            <article className="rounded-xl border border-border bg-background/70 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    Família cadastrada
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Última atualização em 05 out 2025
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <i className="fas fa-circle-check text-[10px]"></i>
                  Ativo
                </span>
              </div>
              <ul className="mt-3 space-y-2 text-[11px] text-muted-foreground">
                <li className="flex items-center gap-2">
                  <i className="fas fa-calendar-check text-primary"></i>
                  Visita domiciliar agendada para 24 out, 09h
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-people-group text-primary"></i>
                  Plano familiar em acompanhamento — Etapa 3 de 5
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-utensils text-primary"></i>
                  Inclusão no Programa Alimenta Camalaú confirmada
                </li>
              </ul>
            </article>

            <article className="rounded-xl border border-border bg-background/70 p-3">
              <header className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    Agenda de atendimentos
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Escolha data e horário com o assistente social
                  </p>
                </div>
              </header>
              <form
                className="mt-3 space-y-3 text-sm"
                onSubmit={handleAtendimentoSubmit}
              >
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
                      <option value="15:30">15:30</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Tema do atendimento
                  </label>
                  <select
                    name="topic"
                    required
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Selecione</option>
                    <option value="Atualização CadÚnico">
                      Atualização CadÚnico
                    </option>
                    <option value="Benefício eventual">Benefício eventual</option>
                    <option value="Acompanhamento familiar">
                      Acompanhamento familiar
                    </option>
                    <option value="Encaminhamento jurídico">
                      Encaminhamento jurídico
                    </option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:bg-primary/90 active:scale-95"
                >
                  Confirmar atendimento
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
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Solicitar benefício eventual
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Auxílio cesta básica, aluguel social, passagens e outros apoios
                emergenciais.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              <i className="fas fa-heart text-[10px]"></i>
              Atendimento prioritário
            </span>
          </div>
          <form
            className="mt-3 space-y-3 text-sm"
            onSubmit={handleBeneficioSubmit}
          >
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tipo de benefício
              </label>
              <select
                name="benefit"
                required
                className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Selecione</option>
                <option value="Cesta básica">Cesta básica</option>
                <option value="Aluguel social">Aluguel social</option>
                <option value="Passagem intermunicipal">
                  Passagem intermunicipal
                </option>
                <option value="Auxílio funeral">Auxílio funeral</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Número do NIS
                </label>
                <input
                  name="nis"
                  required
                  placeholder="000.0000.000-0"
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Composição familiar
                </label>
                <input
                  name="family"
                  required
                  placeholder="Quantidade de moradores"
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Justificativa
              </label>
              <textarea
                name="description"
                rows={3}
                required
                placeholder="Descreva a situação e anexos entregues no CRAS."
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
          {beneficioSuccess && (
            <div
              ref={beneficioSuccessRef}
              className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              {beneficioSuccess}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Serviços ao cidadão
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Acesso rápido aos programas municipais e federais.
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
                <i className="fas fa-id-card"></i>
              </div>
              <div className="flex-1">
                <header className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Atualização CadÚnico</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <i className="fas fa-exclamation-circle text-[9px]"></i>
                    A cada 2 anos
                  </span>
                </header>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Atualize seu cadastro sem sair do aplicativo
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Envie comprovante de endereço e documentos de todos os
                  moradores. A confirmação chega em até 5 dias úteis.
                </p>
                <button
                  type="button"
                  onClick={openAssistant}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition-transform duration-150 hover:bg-primary/90 active:scale-95"
                >
                  <i className="fas fa-upload"></i>
                  Enviar documentos
                </button>
              </div>
            </article>

            <article className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                <i className="fas fa-baby"></i>
              </div>
              <div className="flex-1">
                <header className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Programa Mãe Afogadense</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <i className="fas fa-heartbeat text-[9px]"></i>
                    Gestantes até 28 semanas
                  </span>
                </header>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Kit de enxoval, oficinas e acompanhamento nutricional
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cadastre-se com laudo médico, documentos pessoais e comprovante
                  de residência.
                </p>
                <button
                  type="button"
                  onClick={openAssistant}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-transform duration-150 hover:bg-emerald-700 active:scale-95"
                >
                  <i className="fas fa-clipboard-check"></i>
                  Fazer pré-cadastro
                </button>
              </div>
            </article>

            <article className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                <i className="fas fa-school"></i>
              </div>
              <div className="flex-1">
                <header className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Serviço de Convivência e Fortalecimento de Vínculos</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    <i className="fas fa-users text-[9px]"></i>
                    Crianças, adolescentes e idosos
                  </span>
                </header>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Horários das oficinas e atividades comunitárias
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• Segunda e quarta – Reforço escolar (13h30)</li>
                  <li>• Terça – Oficina de música e coral (14h)</li>
                  <li>• Quinta – Grupo de idosos e dança (15h)</li>
                </ul>
              </div>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">
            Centros de referência
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Locais de atendimento presencial e contatos úteis.
          </p>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <article className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div>
                <p className="font-semibold text-foreground">CRAS Centro</p>
                <p className="text-xs text-muted-foreground">
                  Rua José Bandeira, 122 — Centro
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Atendimento: seg a sex, 08h às 17h · Telefone: (83) 3356-1100
                </p>
              </div>
            </article>
            <article className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                <i className="fas fa-map-marker"></i>
              </div>
              <div>
                <p className="font-semibold text-foreground">CRAS Zona Rural</p>
                <p className="text-xs text-muted-foreground">
                  Sítio Malhada — Polo de convivência comunitária
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Atendimento itinerante toda terça e quinta · Telefone: (83)
                  3356-1105
                </p>
              </div>
            </article>
          </div>
        </section>
      </div>

      {/* FAB: Virtual Assistant */}
      <div className="fixed bottom-[335px] right-6 z-40 flex flex-col items-end gap-3">
        <div
          id="assistant-panel"
          aria-hidden={!assistantOpen}
          className={`w-72 max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur transition-all duration-200 ${
            assistantOpen
              ? "pointer-events-auto opacity-100 translate-y-0"
              : "pointer-events-none opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Assistente virtual
              </p>
              <h4 className="text-sm font-semibold text-foreground">
                Como podemos ajudar?
              </h4>
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
              <p className="mb-1 font-semibold text-primary">
                Sugestões rápidas
              </p>
              <ul className="space-y-1">
                <li>• Enviar documentos do CadÚnico</li>
                <li>• Agendar visita domiciliar</li>
                <li>• Solicitar benefício eventual</li>
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
                  onChange={(event) => setAssistantMessage(event.target.value)}
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

export default AssistenciaSocial;
