import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { useState } from "react";
import { Lightbulb, MapPin, Calendar, Phone, MessageSquare, Map, Users, Clock } from "lucide-react";

const IluminacaoPublica = () => {
  const [showResult, setShowResult] = useState(false);
  const [formData, setFormData] = useState({
    endereco: "",
    ponto: "",
    tipo: "",
    contato: "",
    descricao: "",
    foto: null as File | null
  });
  const [protocol, setProtocol] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar tamanho do arquivo
    if (formData.foto && formData.foto.size > 5 * 1024 * 1024) {
      alert(`O arquivo ${formData.foto.name} excede 5 MB. Reduza o tamanho e tente novamente.`);
      return;
    }

    const protoc = Math.random().toString().slice(2, 8).toUpperCase();
    setProtocol(protoc);
    setShowResult(true);
    
    setTimeout(() => {
      document.getElementById("iluminacao-resultado")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        foto: e.target.files[0]
      });
    }
  };

  return (
    <Layout>
      <Header pageTitle="Iluminação Pública" />

      {/* Cards de estatísticas */}
      <section className="grid grid-cols-2 gap-3 mb-5">
        <article className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Chamados abertos</p>
          <p className="mt-2 text-2xl font-semibold">48</p>
          <p className="mt-1 text-[11px] text-muted-foreground">78% dentro do prazo</p>
        </article>
        <article className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Equipes em campo</p>
          <p className="mt-2 text-2xl font-semibold">5</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Bairros: Centro, Vila Nova, Alto Alegre</p>
        </article>
        <article className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tempo médio de atendimento</p>
          <p className="mt-2 text-2xl font-semibold">48h</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Desde a abertura do protocolo</p>
        </article>
        <article className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Lâmpadas LED instaladas</p>
          <p className="mt-2 text-2xl font-semibold">2.310</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Cobertura LED: 65% da cidade</p>
        </article>
      </section>

      {/* Formulário de solicitação */}
      <section className="bg-card rounded-2xl p-4 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold">Solicitar troca de lâmpada queimada</h3>
            <p className="text-xs text-muted-foreground mt-1">Informe o endereço, ponto de referência e a situação observada.</p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
            <Lightbulb className="h-3 w-3" />
            Atendimento 24h
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="endereco" className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                Endereço completo
              </label>
              <input
                id="endereco"
                name="endereco"
                type="text"
                required
                value={formData.endereco}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Rua, número, bairro"
              />
            </div>
            <div>
              <label htmlFor="ponto" className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                Ponto de referência
              </label>
              <input
                id="ponto"
                name="ponto"
                type="text"
                value={formData.ponto}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Próximo a..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="tipo" className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                Tipo de problema
              </label>
              <select
                id="tipo"
                name="tipo"
                required
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione</option>
                <option>Lâmpada queimada</option>
                <option>Poste apagando intermitente</option>
                <option>Brilho fraco</option>
                <option>Luminária danificada</option>
                <option>Fiação exposta</option>
              </select>
            </div>
            <div>
              <label htmlFor="contato" className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                Contato
              </label>
              <input
                id="contato"
                name="contato"
                type="text"
                required
                value={formData.contato}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nome / Telefone"
              />
            </div>
          </div>

          <div>
            <label htmlFor="descricao" className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
              Descrição adicional
            </label>
            <textarea
              id="descricao"
              name="descricao"
              rows={3}
              value={formData.descricao}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex.: poste em frente ao nº 120, lâmpada completamente apagada."
            />
          </div>

          <div>
            <label htmlFor="foto" className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
              Foto da ocorrência (opcional)
            </label>
            <input
              id="foto"
              name="foto"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-xs text-foreground file:mr-3 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white file:text-xs file:font-semibold hover:file:bg-primary/90 cursor-pointer"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Anexe imagens até 5 MB (jpg ou png).</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <i className="fas fa-camera"></i>
            <span>Anexe uma foto ou complemente o protocolo pelo WhatsApp.</span>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-xl text-sm font-semibold transition"
          >
            Registrar solicitação
          </button>
        </form>

        {showResult && (
          <div id="iluminacao-resultado" className="mt-3 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
            ✅ Protocolo <strong>#{protocol}</strong> registrado para <strong>{formData.endereco}</strong> ({formData.tipo}). Equipe retornará em até 48h.
            {formData.foto && (
              <>
                <br />🖼️ 1 arquivo anexado.
              </>
            )}
          </div>
        )}
      </section>

      {/* Mapa de ocorrências */}
      <section className="bg-card rounded-2xl p-4 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold">Mapa de ocorrências</h3>
            <p className="text-xs text-muted-foreground mt-1">Visualize chamados recentes e equipes em atendimento.</p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold">
            <Map className="h-3 w-3" />
            Atualização a cada 30 min
          </span>
        </div>
        <div className="mt-3 rounded-2xl border border-border overflow-hidden h-48 relative bg-gradient-to-br from-blue-50/50 to-primary/10 dark:from-blue-950/30 dark:to-primary/5">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Map className="h-12 w-12 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Mapa interativo disponível no aplicativo oficial.</p>
              <p className="text-xs text-muted-foreground">Utilize os filtros para ver sua rua e o status da equipe.</p>
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
            Chamados em atendimento (14)
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            Resolvidos nas últimas 24h (32)
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            Pendentes aguardando material (6)
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-muted-foreground"></span>
            Chamados agendados (8)
          </div>
        </div>
      </section>

      {/* Cronograma de manutenção */}
      <section className="bg-card rounded-2xl p-4 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold">Cronograma de manutenção</h3>
            <p className="text-xs text-muted-foreground mt-1">Veja os bairros que receberão equipes nos próximos dias.</p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
            <Calendar className="h-3 w-3" />
            Programado
          </span>
        </div>
        <div className="space-y-3">
          <article className="rounded-xl border border-border p-3 flex gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-semibold">OUT</span>
              <span className="text-sm font-bold -mt-1">26</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Mutirão Bairro Centro</h4>
              <p className="text-xs text-muted-foreground">Troca para LED na Rua João Pessoa e travessas adjacentes.</p>
              <p className="text-xs text-muted-foreground mt-1">50 luminárias • Noite • Equipe 02</p>
            </div>
          </article>
          <article className="rounded-xl border border-border p-3 flex gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-semibold">OUT</span>
              <span className="text-sm font-bold -mt-1">28</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Manutenção preventiva Vila Nova</h4>
              <p className="text-xs text-muted-foreground">Substituição de reatores e verificação de fiação exposta.</p>
              <p className="text-xs text-muted-foreground mt-1">30 luminárias • Tarde • Equipe 03</p>
            </div>
          </article>
          <article className="rounded-xl border border-border p-3 flex gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-semibold">NOV</span>
              <span className="text-sm font-bold -mt-1">02</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Ampliação Alto Alegre</h4>
              <p className="text-xs text-muted-foreground">Instalação de postes e luminárias em novas ruas.</p>
              <p className="text-xs text-muted-foreground mt-1">18 pontos • Manhã • Equipe 01</p>
            </div>
          </article>
        </div>
      </section>

      {/* Canais de atendimento */}
      <section className="bg-card rounded-2xl p-4 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold">Canais de atendimento</h3>
            <p className="text-xs text-muted-foreground mt-1">Fale com a equipe de Iluminação ou acesse o atendimento expresso.</p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300 text-[11px] font-semibold">
            <Phone className="h-3 w-3" />
            Suporte dedicado
          </span>
        </div>
        <div className="space-y-3">
          <article className="rounded-xl border border-border p-3">
            <h4 className="text-sm font-semibold">Central de Iluminação</h4>
            <p className="text-xs text-muted-foreground">Telefone (83) 3356-1185 • segunda a sábado, 07h às 22h</p>
            <button
              onClick={() => setAssistantOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition"
            >
              <MessageSquare className="h-3 w-3" />
              Falar com atendente
            </button>
          </article>
          <article className="rounded-xl border border-border p-3">
            <h4 className="text-sm font-semibold">Atendimento WhatsApp</h4>
            <p className="text-xs text-muted-foreground">Envie fotos, localização e receba atualizações automáticas.</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <i className="fab fa-whatsapp text-green-500"></i>
              <span>(83) 9 9655-4411 • Atendimento 24h</span>
            </div>
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
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Assistente Iluminação</p>
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
                  <li>• Acompanhar protocolo da minha rua</li>
                  <li>• Como informar fio solto</li>
                  <li>• Agenda de manutenções desta semana</li>
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

export default IluminacaoPublica;
