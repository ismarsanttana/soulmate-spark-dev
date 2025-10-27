import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { useState } from "react";
import { Construction, MapPin, TrendingUp, Users, FileText, Camera, AlertTriangle, CheckCircle, Clock, Pause, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type WorkStatus = "todas" | "em-andamento" | "planejada" | "paralisada" | "concluida";
type MapFilter = "todos" | "Centro" | "São Sebastião" | "Vila Nova" | "Alto Alegre";

const Obras = () => {
  const [workFilter, setWorkFilter] = useState<WorkStatus>("todas");
  const [mapFilter, setMapFilter] = useState<MapFilter>("todos");

  const obras = [
    {
      id: 1,
      title: "Requalificação da Praça Central",
      description: "Implantação de piso intertravado, paisagismo e playground acessível.",
      status: "em-andamento" as WorkStatus,
      progress: 65,
      deadline: "Dez/2025",
      contract: "045/2025",
      fiscal: "Ana Carvalho",
      bairro: "Centro",
      investment: { previsto: 1200000, executado: 780000 },
      etapas: [
        { title: "Demolição do piso antigo e drenagem", progress: 100, status: "completed" },
        { title: "Instalação de mobiliário urbano", progress: 45, status: "in-progress" },
        { title: "Paisagismo e playground", progress: 20, status: "pending" }
      ]
    },
    {
      id: 2,
      title: "Pavimentação em paralelepípedo — Rua São Sebastião",
      description: "1,2 km de pavimentação, drenagem superficial e sinalização.",
      status: "concluida" as WorkStatus,
      progress: 100,
      deadline: "Ago/2025",
      bairro: "São Sebastião",
      beneficiados: 180,
      investment: { previsto: 820000, executado: 820000 },
      etapas: [
        { title: "Base e sub-base executadas", progress: 100, status: "completed" },
        { title: "Assentamento de paralelepípedos finalizado", progress: 100, status: "completed" },
        { title: "Sinalização horizontal e vertical concluída", progress: 100, status: "completed" }
      ]
    },
    {
      id: 3,
      title: "Construção da Creche Municipal Vila Nova",
      description: "Creche com capacidade para 120 crianças, 6 salas, cozinha e área de lazer.",
      status: "paralisada" as WorkStatus,
      progress: 38,
      deadline: "Previsão reprogramada",
      bairro: "Vila Nova",
      investment: { previsto: 2400000, executado: 910000 },
      etapas: [
        { title: "Fundação e estrutura metálica concluídas", progress: 100, status: "completed" },
        { title: "Cobertura — aguardando liberação da Caixa", progress: 0, status: "paused" },
        { title: "Situação jurídica regularizada em 18 Out", progress: 0, status: "legal" }
      ]
    },
    {
      id: 4,
      title: "Sistema de iluminação em LED — Bairro Alto Alegre",
      description: "Substituição de 220 luminárias e implementação de telegestão.",
      status: "planejada" as WorkStatus,
      progress: 0,
      deadline: "Jan/2026",
      bairro: "Alto Alegre",
      duracao: "4 meses",
      investment: { previsto: 950000, executado: 0 },
      etapas: [
        { title: "Projeto executivo concluído", progress: 100, status: "completed" },
        { title: "Licitação marcada para 12 Nov", progress: 0, status: "planned" },
        { title: "Recursos garantidos via convênio 019/2025", progress: 0, status: "planned" }
      ]
    }
  ];

  const filteredObras = obras.filter(obra => {
    if (workFilter === "todas") return true;
    return obra.status === workFilter;
  });

  const getStatusColor = (status: WorkStatus) => {
    switch (status) {
      case "em-andamento": return "bg-primary/10 text-primary";
      case "concluida": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300";
      case "paralisada": return "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300";
      case "planejada": return "bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: WorkStatus) => {
    switch (status) {
      case "em-andamento": return <Construction className="h-3 w-3" />;
      case "concluida": return <CheckCircle className="h-3 w-3" />;
      case "paralisada": return <AlertTriangle className="h-3 w-3" />;
      case "planejada": return <Clock className="h-3 w-3" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: WorkStatus) => {
    switch (status) {
      case "em-andamento": return "Em andamento";
      case "concluida": return "Concluída";
      case "paralisada": return "Paralisada";
      case "planejada": return "Planejada";
      default: return status;
    }
  };

  return (
    <Layout>
      <Header pageTitle="Obras e Infraestrutura" />

      <main className="pb-24">
        {/* Intro */}
        <div className="mb-4">
          <h2 className="font-semibold text-2xl">Obras e Infraestrutura</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe o andamento das obras públicas, investimentos e próximos marcos.
          </p>
        </div>

        {/* Indicadores */}
        <section className="grid grid-cols-2 gap-3 mb-5">
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Obras em execução
              </p>
              <p className="mt-2 text-2xl font-semibold">8</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                4 escolas • 2 pavimentações • 2 unidades de saúde
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Investimento total
              </p>
              <p className="mt-2 text-2xl font-semibold">R$ 6,2 mi</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                47% recursos próprios • 53% convênios
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Índice médio de avanço
              </p>
              <p className="mt-2 text-2xl font-semibold">62%</p>
              <Progress value={62} className="mt-2 h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Postos de trabalho
              </p>
              <p className="mt-2 text-2xl font-semibold">134</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                56% mão de obra local
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Mapa das Obras */}
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-lg">Mapa das obras</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use os filtros para localizar trabalhos por bairro e acompanhar o avanço no território.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300 text-[11px] font-semibold">
                <MapPin className="h-3 w-3" />
                Vista espacial
              </span>
            </div>

            {/* Filtros do Mapa */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(["todos", "Centro", "São Sebastião", "Vila Nova", "Alto Alegre"] as MapFilter[]).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={mapFilter === filter ? "default" : "outline"}
                  onClick={() => setMapFilter(filter)}
                  className="h-7 text-xs"
                >
                  {filter === "todos" ? "Todos" : filter}
                </Button>
              ))}
            </div>

            {/* Mapa Simplificado */}
            <div className="relative h-64 rounded-2xl border overflow-hidden bg-gradient-to-br from-sky-100 via-emerald-50 to-amber-50 dark:from-sky-900/40 dark:via-slate-900/30 dark:to-amber-900/30">
              <div className="absolute inset-0 opacity-30 bg-[linear-gradient(90deg,rgba(148,163,184,0.15)1px,transparent_1px),linear-gradient(rgba(148,163,184,0.15)1px,transparent_1px)] bg-[length:32px_32px]"></div>
              
              {/* Pins no mapa */}
              <div className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-full text-[11px]" style={{ top: "45%", left: "56%" }}>
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary text-white shadow-lg text-xs font-bold">65%</span>
                <span className="px-2 py-1 rounded-full bg-white/90 dark:bg-gray-900/85 shadow text-xs">Praça Central</span>
              </div>

              <div className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-full text-[11px]" style={{ top: "60%", left: "32%" }}>
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-600 text-white shadow-lg text-xs font-bold">100%</span>
                <span className="px-2 py-1 rounded-full bg-white/90 dark:bg-gray-900/85 shadow text-xs">Rua São Sebastião</span>
              </div>

              <div className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-full text-[11px]" style={{ top: "30%", left: "28%" }}>
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-500 text-white shadow-lg text-xs font-bold">38%</span>
                <span className="px-2 py-1 rounded-full bg-white/90 dark:bg-gray-900/85 shadow text-xs">Creche Vila Nova</span>
              </div>

              <div className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-full text-[11px]" style={{ top: "28%", left: "70%" }}>
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-600 text-white shadow-lg text-xs font-bold">0%</span>
                <span className="px-2 py-1 rounded-full bg-white/90 dark:bg-gray-900/85 shadow text-xs">Iluminação Alto Alegre</span>
              </div>
            </div>

            {/* Legenda */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
                Em andamento / dados atualizados diariamente
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                Concluída — etapa finalizada e entregue
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                Paralisada — aguardando liberação documental
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-500"></span>
                Planejada — início estimado para os próximos meses
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status das Obras */}
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-lg">Status das obras</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Filtre por fase para entender o avanço de cada projeto.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/35 dark:text-blue-300 text-[11px] font-semibold">
                <TrendingUp className="h-3 w-3" />
                Atualizado hoje
              </span>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(["todas", "em-andamento", "planejada", "paralisada", "concluida"] as WorkStatus[]).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={workFilter === filter ? "default" : "outline"}
                  onClick={() => setWorkFilter(filter)}
                  className="h-7 text-xs"
                >
                  {filter === "todas" ? "Todas" : getStatusLabel(filter)}
                </Button>
              ))}
            </div>

            {/* Lista de Obras */}
            <div className="space-y-3">
              {filteredObras.map((obra) => (
                <div key={obra.id} className="rounded-2xl border p-4">
                  <header className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold">{obra.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{obra.description}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${getStatusColor(obra.status)}`}>
                      {getStatusIcon(obra.status)}
                      {getStatusLabel(obra.status)}
                    </span>
                  </header>

                  {/* Progresso */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>{obra.progress}% concluído</span>
                      <span>
                        {obra.status === "concluida" ? `Entrega: ${obra.deadline}` : 
                         obra.status === "planejada" ? `Início estimado: ${obra.deadline}` :
                         `Entrega prevista: ${obra.deadline}`}
                      </span>
                    </div>
                    <Progress value={obra.progress} className="h-2" />
                  </div>

                  {/* Etapas */}
                  <ul className="space-y-2 text-xs mb-3">
                    {obra.etapas.map((etapa, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        {etapa.status === "completed" && <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
                        {etapa.status === "in-progress" && <Circle className="h-4 w-4 text-primary flex-shrink-0" />}
                        {etapa.status === "pending" && <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                        {etapa.status === "paused" && <Pause className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                        {etapa.status === "legal" && <FileText className="h-4 w-4 text-rose-500 flex-shrink-0" />}
                        {etapa.status === "planned" && <Circle className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                        <span>{etapa.title} {etapa.progress > 0 && `(${etapa.progress}%)`}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Informações Adicionais */}
                  <div className="flex flex-wrap gap-2 text-xs mb-3">
                    {obra.contract && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/35 dark:text-blue-300">
                        <FileText className="h-3 w-3" />
                        Contrato: {obra.contract}
                      </span>
                    )}
                    {obra.fiscal && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                        Fiscal: {obra.fiscal}
                      </span>
                    )}
                    {obra.beneficiados && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                        <Users className="h-3 w-3" />
                        Beneficiados: {obra.beneficiados} famílias
                      </span>
                    )}
                    {obra.duracao && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                        Execução: {obra.duracao}
                      </span>
                    )}
                  </div>

                  {/* Galeria de Fotos */}
                  <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
                    {[1, 2, 3].map((_, idx) => (
                      <div key={idx} className="shrink-0 h-16 w-24 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Camera className="h-6 w-6 text-primary/40" />
                      </div>
                    ))}
                  </div>

                  <Button size="sm" className="h-8">
                    <Camera className="h-3 w-3 mr-1" />
                    Ver fotos e vídeos
                  </Button>
                </div>
              ))}
            </div>

            {filteredObras.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Nenhuma obra encontrada para este filtro.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investimento por Projeto */}
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold">Investimento por projeto</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Comparativo entre valores previstos e executados em cada obra.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/35 dark:text-indigo-300 text-[11px] font-semibold">
                <TrendingUp className="h-3 w-3" />
                Atualizado mês a mês
              </span>
            </div>

            <div className="space-y-3">
              {obras.map((obra) => {
                const percentExecutado = (obra.investment.executado / obra.investment.previsto) * 100;
                return (
                  <div key={obra.id} className="rounded-xl border p-3">
                    <header className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{obra.title}</span>
                      <span>
                        Previsto: R$ {(obra.investment.previsto / 1000000).toFixed(1)} mi
                      </span>
                    </header>
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                        <span>
                          Executado: R$ {(obra.investment.executado / 1000).toFixed(0)} mil
                        </span>
                        <span>{Math.round(percentExecutado)}%</span>
                      </div>
                      <Progress value={percentExecutado} className="h-2" />
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      Mês referência: Out/2025
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>

    </Layout>
  );
};

export default Obras;
