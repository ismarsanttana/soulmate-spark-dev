import { useState, FormEvent } from "react";
import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send } from "lucide-react";

export default function Financas() {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [iptuResult, setIptuResult] = useState("");
  const [taxaResult, setTaxaResult] = useState("");
  const [alertaResult, setAlertaResult] = useState("");

  const handleIptuSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const matricula = formData.get("matricula") as string;
    const cpf = formData.get("cpf") as string;
    
    setIptuResult(
      `✅ Imóvel ${matricula} com débitos atualizados. Guia digital enviada para ${
        cpf.length > 11 ? "CNPJ" : "CPF"
      } informado.`
    );
    e.currentTarget.reset();
  };

  const handleTaxaSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tipo = formData.get("tipo") as string;
    const cadastro = formData.get("cadastro") as string;
    
    setTaxaResult(`✅ Guia da taxa "${tipo}" para ${cadastro} gerada e enviada para seu e-mail.`);
    e.currentTarget.reset();
  };

  const handleAlertaSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nome = formData.get("nome") as string;
    const email = formData.get("email") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const receberEmail = formData.get("receberEmail") === "on";
    const receberWhatsapp = formData.get("receberWhatsapp") === "on";
    const tributos = formData.getAll("tributos") as string[];

    if (!receberEmail && !receberWhatsapp) {
      setAlertaResult("⚠️ Selecione pelo menos um canal de contato (e-mail ou WhatsApp).");
      return;
    }

    if (receberEmail && !email) {
      setAlertaResult("⚠️ Informe um e-mail válido para receber os alertas.");
      return;
    }

    if (receberWhatsapp && !whatsapp) {
      setAlertaResult("⚠️ Informe um número de WhatsApp para receber os alertas.");
      return;
    }

    const canais = [];
    if (receberEmail) canais.push("e-mail");
    if (receberWhatsapp) canais.push("WhatsApp");
    const tributosLabel = tributos.join(", ");

    // Sanitizar entrada do usuário para evitar XSS
    const result = `✅ ${nome}, você receberá lembretes de ${tributosLabel} via ${canais.join(" e ")}.${email ? `\n📧 ${email}` : ''}${whatsapp ? `\n💬 ${whatsapp}` : ''}`;

    setAlertaResult(result);
    e.currentTarget.reset();
  };

  return (
    <Layout>
      <Header pageTitle="Finanças" />

      <main className="space-y-5">
        {/* Título da Seção */}
        <div>
          <h2 className="font-semibold text-2xl text-foreground">Finanças e Tributação</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe arrecadação, tributos e serviços financeiros da Prefeitura de Afogados da Ingazeira.
          </p>
        </div>

        {/* Indicadores Financeiros */}
        <section className="grid grid-cols-2 gap-3 text-xs">
          <Card className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Arrecadação anual</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">R$ 48,7 mi</p>
            <p className="mt-1 text-[11px] text-muted-foreground">+6,4% vs. 2024</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Receita do mês</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">R$ 3,2 mi</p>
            <p className="mt-1 text-[11px] text-muted-foreground">IPTU 38% • ISS 29% • FPM 33%</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Execução orçamentária</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">71%</p>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-blue-400" style={{ width: "71%" }} />
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Contratos empenhados</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">R$ 12,4 mi</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Obras 42% • Saúde 34% • Educação 24%</p>
          </Card>
        </section>

        {/* Tributos Municipais */}
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-lg text-foreground">Tributos municipais</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Emita guias, parcelamentos e certidões sem sair de casa.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold whitespace-nowrap">
              <i className="fas fa-receipt text-[10px]"></i>
              Autoatendimento
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {/* IPTU */}
            <div className="rounded-xl border border-border p-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-home"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">IPTU</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    2ª via, situação cadastral e atualização de débitos imobiliários.
                  </p>
                  <div className="mt-2 flex gap-2 text-xs flex-wrap">
                    <Button size="sm" className="h-8">
                      <i className="fas fa-magnifying-glass mr-1"></i>
                      Consultar débitos
                    </Button>
                    <Button size="sm" variant="secondary" className="h-8">
                      <i className="fas fa-download mr-1"></i>
                      Emitir DAM
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* ISS */}
            <div className="rounded-xl border border-border p-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-briefcase"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">ISS e MEI</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Guias, retenções e emissão de notas fiscais de serviços.
                  </p>
                  <div className="mt-2 flex gap-2 text-xs flex-wrap">
                    <Button size="sm" className="h-8">
                      <i className="fas fa-hand-holding-dollar mr-1"></i>
                      Acessar portal ISS
                    </Button>
                    <Button size="sm" variant="secondary" className="h-8">
                      <i className="fas fa-file-certificate mr-1"></i>
                      Certidão negativa
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Parcelamentos */}
            <div className="rounded-xl border border-border p-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-scale-balanced"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">Parcelamentos e Dívida Ativa</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Negocie débitos com condições especiais e acompanhe boletos enviados.
                  </p>
                  <div className="mt-2 flex gap-2 text-xs flex-wrap">
                    <Button size="sm" className="h-8">
                      <i className="fas fa-pencil mr-1"></i>
                      Simular parcelamento
                    </Button>
                    <Button size="sm" variant="secondary" className="h-8">
                      <i className="fas fa-envelope mr-1"></i>
                      Reemitir boleto
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Consultas Rápidas */}
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-lg text-foreground">Consultas rápidas</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Emita guias e acompanhe pendências diretamente pelo aplicativo.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[11px] font-semibold whitespace-nowrap">
              <i className="fas fa-bolt text-[10px]"></i>
              Tempo real
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {/* Consulta IPTU */}
            <div className="rounded-xl border border-border p-3">
              <h4 className="text-sm font-semibold text-foreground">Consulta IPTU</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Informe os dados para consultar situação do imóvel e imprimir guia.
              </p>
              <form onSubmit={handleIptuSubmit} className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    name="matricula"
                    placeholder="Inscrição / Matrícula"
                    required
                    className="h-9 text-sm"
                  />
                  <Input name="cpf" placeholder="CPF/CNPJ" required className="h-9 text-sm" />
                </div>
                <Button type="submit" className="w-full h-9 text-sm">
                  Consultar
                </Button>
              </form>
              {iptuResult && (
                <div className="mt-3 text-xs text-primary bg-primary/10 border border-primary/20 rounded-xl p-3">
                  {iptuResult}
                </div>
              )}
            </div>

            {/* Emissão de Taxa */}
            <div className="rounded-xl border border-border p-3">
              <h4 className="text-sm font-semibold text-foreground">Emissão de taxa</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Emita taxas diversas (alvará, feiras, publicidade) em poucos cliques.
              </p>
              <form onSubmit={handleTaxaSubmit} className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    name="tipo"
                    required
                    className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecione a taxa</option>
                    <option>Alvará de funcionamento</option>
                    <option>Taxa de publicidade</option>
                    <option>Taxa de feira livre</option>
                    <option>Taxa de expediente</option>
                  </select>
                  <Input
                    name="cadastro"
                    placeholder="Inscrição municipal / CNPJ"
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <Button type="submit" className="w-full h-9 text-sm">
                  Gerar guia
                </Button>
              </form>
              {taxaResult && (
                <div className="mt-3 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                  {taxaResult}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Alertas de Vencimento */}
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-lg text-foreground">Alertas de vencimento</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Receba lembretes de IPTU, ISS, taxas e parcelamentos.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-300 text-[11px] font-semibold whitespace-nowrap">
              <i className="fas fa-bell text-[10px]"></i>
              Gratuito
            </span>
          </div>

          <form onSubmit={handleAlertaSubmit} className="mt-3 space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="nome" className="text-xs text-muted-foreground uppercase tracking-wide">
                  Nome completo
                </Label>
                <Input id="nome" name="nome" placeholder="Seu nome" required className="mt-1 h-9" />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wide">
                  E-mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  className="mt-1 h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="whatsapp" className="text-xs text-muted-foreground uppercase tracking-wide">
                  WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  placeholder="(87) 90000-0000"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label htmlFor="tributos" className="text-xs text-muted-foreground uppercase tracking-wide">
                  Tributos de interesse
                </Label>
                <select
                  id="tributos"
                  name="tributos"
                  multiple
                  className="mt-1 w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="IPTU">IPTU</option>
                  <option value="ISS">ISS</option>
                  <option value="Taxas diversas">Taxas diversas</option>
                  <option value="Parcelamentos">Parcelamentos</option>
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">Selecione um ou mais tributos.</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2">
                <input
                  name="receberEmail"
                  type="checkbox"
                  defaultChecked
                  className="rounded border-input text-primary focus:ring-primary"
                />
                Receber por e-mail
              </label>
              <label className="flex items-center gap-2">
                <input
                  name="receberWhatsapp"
                  type="checkbox"
                  defaultChecked
                  className="rounded border-input text-primary focus:ring-primary"
                />
                Receber por WhatsApp
              </label>
            </div>

            <Button type="submit" className="w-full">
              Cadastrar alertas
            </Button>
          </form>

          {alertaResult && (
            <div className="mt-3 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
              {alertaResult}
            </div>
          )}
        </Card>

        {/* Transparência e Contato */}
        <Card className="p-4">
            <h3 className="font-semibold text-lg text-foreground">Transparência e contato</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Acesse relatórios oficiais, audiências e canais de atendimento da Secretaria de Finanças.
          </p>

          <div className="mt-3 space-y-3">
            {/* Portal da Transparência */}
            <div className="rounded-xl border border-border p-3 flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-file-contract"></i>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Portal da transparência</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Relatórios fiscais (RREO, RGF), LDO, LOA, PPA e audiências públicas.
                </p>
                <Button size="sm" className="mt-2 h-8 text-xs">
                  <i className="fas fa-file-arrow-down mr-1"></i>
                  Acessar documentos oficiais
                </Button>
              </div>
            </div>

            {/* Atendimento */}
            <div className="rounded-xl border border-border p-3 flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-headset"></i>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Atendimento tributário</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Secretaria de Finanças – (87) 3838-1177 • financas@afogados.pe.gov.br
                </p>
                <div className="mt-2 flex gap-2 text-xs flex-wrap">
                  <Button size="sm" className="h-8">
                    <i className="fas fa-comments mr-1"></i>
                    Falar com atendente
                  </Button>
                  <Button size="sm" variant="secondary" className="h-8">
                    <i className="fas fa-calendar mr-1"></i>
                    Agendar atendimento
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </main>

      {/* Assistente Virtual Flutuante */}
      <div className="fixed bottom-[335px] right-6 z-40 flex flex-col items-end gap-3">
        {assistantOpen && (
          <div className="w-72 max-w-full rounded-2xl bg-card shadow-2xl border border-border animate-in slide-in-from-right-5">
            <div className="flex items-start justify-between p-4 border-b border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Assistente Virtual</p>
                <h2 className="text-sm font-semibold">Finanças Municipais</h2>
              </div>
              <button
                type="button"
                onClick={() => setAssistantOpen(false)}
                className="text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="rounded-xl bg-primary/10 p-3">
                <p className="font-semibold text-primary mb-1">Sugestões rápidas</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Como emitir IPTU</li>
                  <li>• Parcelamento de dívida ativa</li>
                  <li>• Link do Portal da Transparência</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assistant-message" className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Pergunte algo
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="assistant-message"
                    type="text"
                    placeholder="Digite sua pergunta..."
                    className="flex-1 h-9 text-sm"
                  />
                  <Button size="sm" className="h-9 px-3">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setAssistantOpen(!assistantOpen)}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    </Layout>
  );
}
