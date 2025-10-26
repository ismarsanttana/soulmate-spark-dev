import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { useState } from "react";
import { Calendar, MapPin, Users, FileText, Upload, BookOpen, CalendarCheck, Info, Download, Pen, Theater, FileSignature, Heart, Camera, Headphones, Music, ExternalLink, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Cultura = () => {
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <Layout>
      <Header pageTitle="Cultura e Turismo" />

      <main className="pb-24">
        {/* Intro */}
        <div className="mb-4">
          <h2 className="font-semibold text-2xl">Cultura, Turismo e Economia Criativa</h2>
          <p className="text-sm text-muted-foreground">
            Serviços, fomento e agenda para quem faz cultura em Afogados da Ingazeira.
          </p>
        </div>

        {/* Indicadores */}
        <section className="grid grid-cols-2 gap-3 mb-5">
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Editais abertos
              </p>
              <p className="mt-2 text-2xl font-semibold">3</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Aldir Blanc • Paulo Gustavo • Arte na Praça
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Projetos apoiados
              </p>
              <p className="mt-2 text-2xl font-semibold">27</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Música, teatro, audiovisual, artesanato
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Equipamentos culturais
              </p>
              <p className="mt-2 text-2xl font-semibold">9</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Biblioteca, museu, CEUs, pontos de cultura
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Eventos do mês
              </p>
              <p className="mt-2 text-2xl font-semibold">12</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Festivais, oficinas e exposições
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Serviços para fazedores de cultura */}
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-lg">Serviços para fazedores de cultura</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Cadastre projetos, acompanhe prestações e acesse editais.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold whitespace-nowrap">
                <Heart className="h-3 w-3" />
                Economia criativa
              </span>
            </div>

            <div className="space-y-3">
              {/* Cadastro Municipal */}
              <div className="rounded-xl border p-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Theater className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">Cadastro Municipal de Cultura</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Atualize dados de artistas, grupos culturais e coletivos.
                    </p>
                    <div className="mt-2 flex gap-2 text-xs flex-wrap">
                      <Button size="sm" className="h-8">
                        <Pen className="h-3 w-3 mr-1" />
                        Atualizar cadastro
                      </Button>
                      <Button size="sm" variant="outline" className="h-8">
                        <Download className="h-3 w-3 mr-1" />
                        Baixar formulário
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prestação de contas */}
              <div className="rounded-xl border p-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/35 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                    <FileSignature className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">Prestação de contas simplificada</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Envie relatórios e comprovantes digitais de forma prática.
                    </p>
                    <div className="mt-2 flex gap-2 text-xs flex-wrap">
                      <Button size="sm" className="h-8">
                        <Upload className="h-3 w-3 mr-1" />
                        Enviar documentos
                      </Button>
                      <Button size="sm" variant="outline" className="h-8">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Manual do proponente
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mentorias */}
              <div className="rounded-xl border p-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/35 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">Mentorias e capacitações</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Participe de oficinas sobre elaboração de projetos e captação.
                    </p>
                    <div className="mt-2 flex gap-2 text-xs flex-wrap">
                      <Button size="sm" className="h-8">
                        <CalendarCheck className="h-3 w-3 mr-1" />
                        Agendar mentoria
                      </Button>
                      <Button size="sm" variant="outline" className="h-8">
                        <Info className="h-3 w-3 mr-1" />
                        Ver cronograma
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agenda Cultural */}
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-lg">Agenda cultural</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Eventos, festivais e oficinas dos próximos 30 dias.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/35 dark:text-blue-300 text-[11px] font-semibold">
                <Calendar className="h-3 w-3" />
                Programação
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border p-3 flex gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-semibold">OUT</span>
                  <span className="text-sm font-bold -mt-1">25</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Encontro de Forrozeiros</h4>
                  <p className="text-xs text-muted-foreground">Praça Central • 19h</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quadrilhas, trios de forró, feira de comidas típicas.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border p-3 flex gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-semibold">OUT</span>
                  <span className="text-sm font-bold -mt-1">30</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Oficina de Audiovisual</h4>
                  <p className="text-xs text-muted-foreground">CEU das Artes • 14h</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Edição básica, captação com celular, roteiro e storytelling.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border p-3 flex gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-semibold">NOV</span>
                  <span className="text-sm font-bold -mt-1">04</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Mostra de Artesanato e Gastronomia</h4>
                  <p className="text-xs text-muted-foreground">Mercado Cultural • 09h</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Exposição e venda de peças locais + aulas de culinária regional.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pontos Turísticos */}
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-lg">Pontos turísticos e patrimônio</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Descubra locais históricos, trilhas e experiências culturais.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300 text-[11px] font-semibold">
                <MapPin className="h-3 w-3" />
                Turismo criativo
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border p-3 flex gap-3">
                <div className="h-16 w-24 rounded-xl bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold">Mirante do Alto Alegre</h4>
                  <p className="text-xs text-muted-foreground">
                    Vista panorâmica do Rio Paraíba, pôr do sol e apresentações musicais ao ar livre.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                      <Footprints className="h-3 w-3" /> Trilhas guiadas
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                      <Camera className="h-3 w-3" /> Ponto instagramável
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-3 flex gap-3">
                <div className="h-16 w-24 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <Music className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold">Museu Histórico e Cultural</h4>
                  <p className="text-xs text-muted-foreground">
                    Acervo de fotografias, utensílios e obras de artistas locais. Entrada gratuita.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                      <Headphones className="h-3 w-3" /> Áudio-guia
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                      <Users className="h-3 w-3" /> Mediação escolar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editais e Chamadas Públicas */}
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-lg">Editais e chamadas públicas</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Oportunidades de financiamento para projetos culturais.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300 text-[11px] font-semibold">
                <FileText className="h-3 w-3" />
                Fomento
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">Lei Aldir Blanc 2024</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Auxílio financeiro para trabalhadores da cultura. Inscrições até 30/11.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/35 dark:text-green-300 text-[11px] font-semibold">
                        Aberto
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Valor: até R$ 5.000
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 flex-shrink-0">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver edital
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">Prêmio Paulo Gustavo</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Apoio a projetos de artes cênicas, música e audiovisual. Inscrições até 15/12.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/35 dark:text-green-300 text-[11px] font-semibold">
                        Aberto
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Valor: até R$ 10.000
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 flex-shrink-0">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver edital
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

    </Layout>
  );
};

export default Cultura;
