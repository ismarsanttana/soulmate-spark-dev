import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { useState } from "react";
import { FileText, Receipt, Download, Mail, HelpCircle, Phone, MessageCircle, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

const Iptu = () => {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [inscricao, setInscricao] = useState("");
  const [documento, setDocumento] = useState("");
  const [ano, setAno] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Guia emitida com sucesso e enviada para o e-mail informado!");
  };

  return (
    <Layout>
      <Header pageTitle="2ª Via do IPTU" />

      <main className="pb-24">
        {/* Intro */}
        <div className="mb-4">
          <h2 className="font-semibold text-lg">2ª Via do IPTU</h2>
          <p className="text-xs text-muted-foreground">
            Emita guias, consulte débitos e acompanhe seu imóvel sem sair de casa.
          </p>
        </div>

        {/* Indicadores */}
        <section className="grid grid-cols-2 gap-3 mb-5">
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Imóveis cadastrados
              </p>
              <p className="mt-2 text-2xl font-semibold">3</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Selecione o imóvel desejado
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Débitos 2025
              </p>
              <p className="mt-2 text-2xl font-semibold">R$ 0,00</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Pagamento em dia
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Parcelamentos ativos
              </p>
              <p className="mt-2 text-2xl font-semibold">1</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Vencimento: 12/11/2025
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Certidão negativa
              </p>
              <p className="mt-2 text-2xl font-semibold">Disponível</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Atualizada em 15/10/2025
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Emitir Guia Rápida */}
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold">Emitir guia rápida</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Informe inscrição e CPF/CNPJ para gerar a 2ª via.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold whitespace-nowrap">
                <i className="fas fa-bolt text-[10px]"></i>
                Em segundos
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="inscricao" className="text-xs uppercase tracking-wide">
                    Inscrição / Matrícula
                  </Label>
                  <Input
                    id="inscricao"
                    placeholder="Ex.: 123456-78"
                    value={inscricao}
                    onChange={(e) => setInscricao(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="documento" className="text-xs uppercase tracking-wide">
                    CPF / CNPJ
                  </Label>
                  <Input
                    id="documento"
                    placeholder="Somente números"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ano" className="text-xs uppercase tracking-wide">
                  Ano de referência
                </Label>
                <Select value={ano} onValueChange={setAno} required>
                  <SelectTrigger id="ano" className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="email" className="text-xs uppercase tracking-wide">
                  E-mail para envio
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button type="submit" className="w-full">
                Gerar guia
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Débitos e Parcelamentos */}
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold">Débitos e parcelamentos</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Visualize débitos por exercício, parcelas e situação do imóvel.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-[11px] font-semibold">
                <FileText className="h-3 w-3" />
                Painel detalhado
              </span>
            </div>

            <div className="space-y-3">
              {/* Exercício 2025 - Pago */}
              <div className="rounded-xl border p-3">
                <header className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Exercício 2025</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Pago</span>
                </header>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3">
                  <span>Parcela única</span>
                  <span>Venc. 30/04/2025</span>
                </div>
                <div className="flex gap-2 text-xs flex-wrap">
                  <Button size="sm" className="h-8">
                    <Receipt className="h-3 w-3 mr-1" />
                    Ver comprovante
                  </Button>
                  <Button size="sm" variant="outline" className="h-8">
                    <Download className="h-3 w-3 mr-1" />
                    Baixar PDF
                  </Button>
                </div>
              </div>

              {/* Exercício 2023 - Parcelamento */}
              <div className="rounded-xl border p-3">
                <header className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Exercício 2023</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    Parcelamento (6/12)
                  </span>
                </header>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                  <span>Saldo: R$ 480,00</span>
                  <span>Próx. parcela: 12/11/2025</span>
                </div>
                <Progress value={50} className="h-2 mb-3" />
                <div className="flex gap-2 text-xs flex-wrap">
                  <Button size="sm" className="h-8">
                    <Calendar className="h-3 w-3 mr-1" />
                    Detalhes parcelas
                  </Button>
                  <Button size="sm" variant="outline" className="h-8">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Atualizar boleto
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certidões e Comprovantes */}
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold">Certidões e comprovantes</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Emitir certidão negativa, recibos e histórico de pagamentos.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                <FileText className="h-3 w-3" />
                Documentos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border p-3">
                <h4 className="text-sm font-semibold mb-2">Certidão negativa</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Emitida com validade de 30 dias para fins de comprovação.
                </p>
                <Button size="sm" className="w-full">
                  <FileText className="h-3 w-3 mr-1" />
                  Baixar certidão
                </Button>
              </div>

              <div className="rounded-xl border p-3">
                <h4 className="text-sm font-semibold mb-2">Comprovantes de pagamento</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Receba por e-mail ou faça o download dos recibos quitados.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Mail className="h-3 w-3 mr-1" />
                    E-mail
                  </Button>
                  <Button size="sm" className="flex-1">
                    <Download className="h-3 w-3 mr-1" />
                    Baixar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Perguntas Frequentes */}
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold">Perguntas frequentes</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Dúvidas sobre descontos, parcelamentos e documentação.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-[11px] font-semibold">
                <HelpCircle className="h-3 w-3" />
                FAQ
              </span>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-sm">
                  Como gerar 2ª via com desconto de cota única?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground">
                  Selecione o ano de referência 2025 e informe seu CPF/CNPJ. Descontos são
                  aplicados automaticamente antes do vencimento da cota única.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-sm">
                  Posso parcelar débitos anteriores?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground">
                  Débitos até 2023 podem ser parcelados em até 12 vezes. Clique em "Detalhes
                  parcelas" para simular e gerar o boleto atualizado.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-sm">
                  Como emitir certidão negativa de débitos?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground">
                  A certidão negativa pode ser emitida diretamente na seção "Certidões e
                  comprovantes". O documento tem validade de 30 dias.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Canais de Atendimento */}
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold">Canais de atendimento IPTU</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Secretaria de Finanças • (83) 3356-1177 • financas@afogados.pe.gov.br
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300 text-[11px] font-semibold">
                <Phone className="h-3 w-3" />
                Suporte
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border p-3">
                <h4 className="text-sm font-semibold mb-2">Chat rápido</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Tire dúvidas sobre IPTU diretamente no WhatsApp da Prefeitura.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Abrir WhatsApp
                </Button>
              </div>

              <div className="rounded-xl border p-3">
                <h4 className="text-sm font-semibold mb-2">Atendimento presencial</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Segunda a sexta, das 8h às 14h
                </p>
                <p className="text-xs text-muted-foreground">
                  Rua Principal, Centro - Afogados da Ingazeira
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Assistente Virtual Flutuante */}
      <button
        onClick={() => setAssistantOpen(!assistantOpen)}
        className={`fixed bottom-24 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center ${
          assistantOpen ? "scale-110" : ""
        }`}
        aria-label="Assistente Virtual"
      >
        <i className="fas fa-robot text-xl"></i>
      </button>

      {assistantOpen && (
        <div className="fixed bottom-40 right-6 w-72 bg-card rounded-2xl shadow-2xl p-4 z-50 border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Assistente IPTU</h3>
            <button
              onClick={() => setAssistantOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Pergunte sobre débitos, parcelamentos ou certidões.
          </p>
          <div className="relative">
            <input
              type="text"
              placeholder="Digite sua pergunta..."
              className="w-full rounded-xl border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              className="absolute right-2 top-2 text-primary"
              aria-label="Enviar"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Iptu;
