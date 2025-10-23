import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { useState } from "react";
import { Calendar, Clock, User, MapPin, Stethoscope, FileText, Video, Home, Phone, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";

const AgendarConsulta = () => {
  const [showResult, setShowResult] = useState(false);
  const [formData, setFormData] = useState({
    usuario: "",
    ubs: "",
    especialidade: "",
    data: "",
    horario: "",
    acompanhante: "",
    observacoes: ""
  });
  const [protocol, setProtocol] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const protoc = Math.random().toString(36).substring(2, 8).toUpperCase();
    setProtocol(protoc);
    setShowResult(true);
    
    setTimeout(() => {
      document.getElementById("agendar-resultado")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Layout>
      <Header pageTitle="Agendar Consulta" />

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Consultas disponíveis</p>
          <p className="mt-2 text-2xl font-semibold">146</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Horários nas próximas 2 semanas</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Teleatendimentos</p>
          <p className="mt-2 text-2xl font-semibold">24</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Clínica geral e psicologia</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tempo médio</p>
          <p className="mt-2 text-2xl font-semibold">4 dias</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Entre pedido e atendimento</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Cobertura ESF</p>
          <p className="mt-2 text-2xl font-semibold">95%</p>
          <div className="mt-2 h-2 rounded-full bg-primary/20 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-blue-500" style={{ width: "95%" }}></div>
          </div>
        </div>
      </div>

      {/* Formulário de agendamento */}
      <section className="bg-card rounded-2xl p-4 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold">Preencher dados da consulta</h3>
            <p className="text-xs text-muted-foreground mt-1">Informe seus dados, selecione unidade, dia e horário desejados.</p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
            <Stethoscope className="h-3 w-3" />
            Atendimento SUS
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="usuario" className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                Usuário / CPF
              </label>
              <input
                id="usuario"
                name="usuario"
                type="text"
                required
                value={formData.usuario}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nome completo ou CPF"
              />
            </div>
            <div>
              <label htmlFor="ubs" className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                Unidade de referência
              </label>
              <select
                id="ubs"
                name="ubs"
                required
                value={formData.ubs}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione</option>
                <option>ESF Centro</option>
                <option>ESF Vila Nova</option>
                <option>ESF Zona Rural</option>
                <option>Policlínica Municipal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="especialidade" className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                Especialidade
              </label>
              <select
                id="especialidade"
                name="especialidade"
                required
                value={formData.especialidade}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione</option>
                <option>Clínico Geral</option>
                <option>Pediatria</option>
                <option>Ginecologia/Obstetrícia</option>
                <option>Enfermagem (procedimentos)</option>
                <option>Odontologia</option>
              </select>
            </div>
            <div>
              <label htmlFor="data" className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                Data
              </label>
              <input
                id="data"
                name="data"
                type="date"
                required
                min={today}
                value={formData.data}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="horario" className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                Horário disponível
              </label>
              <select
                id="horario"
                name="horario"
                required
                value={formData.horario}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione</option>
                <option>08:00</option>
                <option>09:30</option>
                <option>13:00</option>
                <option>15:30</option>
              </select>
            </div>
            <div>
              <label htmlFor="acompanhante" className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                Acompanhante (opcional)
              </label>
              <input
                id="acompanhante"
                name="acompanhante"
                type="text"
                value={formData.acompanhante}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nome do acompanhante"
              />
            </div>
          </div>

          <div>
            <label htmlFor="observacoes" className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
              Observações
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={3}
              value={formData.observacoes}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Descreva sintomas, preferências ou necessidades especiais"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-xl text-sm font-semibold transition"
          >
            Confirmar agendamento
          </button>
        </form>

        {showResult && (
          <div id="agendar-resultado" className="mt-3 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
            ✅ Consulta para <strong>{formData.usuario}</strong> em <strong>{new Date(formData.data).toLocaleDateString('pt-BR')}</strong>, às <strong>{formData.horario}</strong>, na unidade <strong>{formData.ubs}</strong> ({formData.especialidade}) foi registrada. Protocolo <strong>#{protocol}</strong>.
          </div>
        )}
      </section>

      {/* Próximas consultas */}
      <section className="bg-card rounded-2xl p-4 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold">Próximas consultas</h3>
            <p className="text-xs text-muted-foreground mt-1">Visualize seus atendimentos futuros e prepare-se com antecedência.</p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            Agenda pessoal
          </span>
        </div>
        <div className="space-y-3">
          <article className="rounded-xl border border-border p-3 flex gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-semibold">OUT</span>
              <span className="text-sm font-bold -mt-1">27</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Clínico Geral • ESF Centro</h4>
              <p className="text-xs text-muted-foreground">08:00 • Dr. João Silva</p>
              <p className="text-xs text-muted-foreground mt-1">Documentos: cartão SUS, RG.</p>
            </div>
          </article>
          <article className="rounded-xl border border-border p-3 flex gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-semibold">OUT</span>
              <span className="text-sm font-bold -mt-1">30</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Pediatria • Policlínica</h4>
              <p className="text-xs text-muted-foreground">09:30 • Dra. Camila Rocha</p>
              <p className="text-xs text-muted-foreground mt-1">Levar caderneta da criança.</p>
            </div>
          </article>
        </div>
      </section>

      {/* Teleatendimento */}
      <section className="bg-card rounded-2xl p-4 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold">Teleatendimento e cuidados</h3>
            <p className="text-xs text-muted-foreground mt-1">Consulte orientações para consultas virtuais ou domiciliares.</p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
            <Video className="h-3 w-3" />
            Teleconsulta
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <article className="rounded-xl border border-border p-3 card-hover">
            <h4 className="text-sm font-semibold">Checklist antes do atendimento on-line</h4>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Teste câmera e microfone.</li>
              <li>• Separe exames e medicamentos em uso.</li>
              <li>• Fique em local silencioso e iluminado.</li>
            </ul>
          </article>
          <article className="rounded-xl border border-border p-3 card-hover">
            <h4 className="text-sm font-semibold">Atendimento domiciliar</h4>
            <p className="text-xs text-muted-foreground mt-1">Encaminhe comprovante de mobilidade reduzida para avaliação da equipe.</p>
            <button
              onClick={() => alert("Documento disponível em breve (demonstração).")}
              className="mt-2 inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold transition hover:bg-muted/80"
            >
              <FileText className="h-3 w-3" />
              Enviar documentos
            </button>
          </article>
        </div>
      </section>

      {/* Documentos necessários */}
      <section className="bg-card rounded-2xl p-4 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold">Documentos necessários</h3>
            <p className="text-xs text-muted-foreground mt-1">Verifique o que levar no dia da consulta.</p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold">
            <FileText className="h-3 w-3" />
            Checklist
          </span>
        </div>
        <div className="space-y-2">
          <details className="rounded-xl border border-border p-3">
            <summary className="font-semibold cursor-pointer text-sm">Consultas gerais</summary>
            <p className="mt-2 text-xs text-muted-foreground">Cartão SUS, documento oficial com foto, comprovante de residência atualizado.</p>
          </details>
          <details className="rounded-xl border border-border p-3">
            <summary className="font-semibold cursor-pointer text-sm">Consultas pediátricas</summary>
            <p className="mt-2 text-xs text-muted-foreground">Documento do responsável, certidão ou RG da criança, caderneta de vacinação.</p>
          </details>
          <details className="rounded-xl border border-border p-3">
            <summary className="font-semibold cursor-pointer text-sm">Exames especializados</summary>
            <p className="mt-2 text-xs text-muted-foreground">Pedido médico, exames anteriores, carteirinha do plano (caso exista).</p>
          </details>
        </div>
      </section>

      {/* Canais de suporte */}
      <section className="bg-card rounded-2xl p-4 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold">Canais de suporte</h3>
            <p className="text-xs text-muted-foreground mt-1">Central de marcação • (83) 3356-1180 • saude@afogados.pe.gov.br</p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300 text-[11px] font-semibold">
            <Phone className="h-3 w-3" />
            Atendimento
          </span>
        </div>
        <div className="space-y-3">
          <article className="rounded-xl border border-border p-3">
            <h4 className="text-sm font-semibold">Suporte via WhatsApp</h4>
            <p className="text-xs text-muted-foreground">(83) 9 9988-4411 • Resposta em até 15 minutos</p>
            <button
              onClick={() => window.open("https://wa.me/5583999884411", "_blank")}
              className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition"
            >
              <MessageSquare className="h-3 w-3" />
              Falar agora
            </button>
          </article>
          <article className="rounded-xl border border-border p-3">
            <h4 className="text-sm font-semibold">Reagendar ou cancelar</h4>
            <p className="text-xs text-muted-foreground">Informe com 24h de antecedência para liberar o horário.</p>
            <button
              onClick={() => alert("Documento disponível em breve (demonstração).")}
              className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold transition hover:bg-muted/80"
            >
              <Calendar className="h-3 w-3" />
              Solicitar reagendamento
            </button>
          </article>
        </div>
      </section>

      {/* Assistente Virtual Flutuante */}
      <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-3">
        <button
          onClick={() => setAssistantOpen(!assistantOpen)}
          className={`h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-2xl flex items-center justify-center transition ${
            assistantOpen ? "ring-4 ring-primary/20" : ""
          }`}
          aria-label="Assistente Virtual"
        >
          <MessageSquare className="h-6 w-6" />
        </button>

        {assistantOpen && (
          <div className="w-72 max-w-full rounded-2xl bg-card shadow-2xl border border-border">
            <div className="flex items-start justify-between p-4 border-b border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Assistente Saúde</p>
                <h2 className="text-sm font-semibold">Como podemos ajudar?</h2>
              </div>
              <button
                onClick={() => setAssistantOpen(false)}
                className="text-muted-foreground hover:text-foreground transition"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <p className="font-semibold text-primary text-xs mb-1">Sugestões rápidas</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Como cancelar uma consulta</li>
                  <li>• Teleconsulta: requisitos técnicos</li>
                  <li>• Exames necessários para especialidades</li>
                </ul>
              </div>
              <div className="space-y-2">
                <label htmlFor="assistant-message" className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                  Pergunte algo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="assistant-message"
                    type="text"
                    placeholder="Digite sua pergunta..."
                    className="flex-1 rounded-xl border border-border px-3 py-2 bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AgendarConsulta;
