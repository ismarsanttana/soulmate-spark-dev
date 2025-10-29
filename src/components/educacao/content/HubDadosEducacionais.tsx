import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  School, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Search, 
  Database,
  CheckCircle2
} from "lucide-react";
import DashboardTab from "./hub/DashboardTab";
import CensoEscolarTab from "./hub/CensoEscolarTab";
import IdebAvaliacoesTab from "./hub/IdebAvaliacoesTab";
import OrcamentoTab from "./hub/OrcamentoTab";
import SiconfiTab from "./hub/SiconfiTab";
import TransparenciaTab from "./hub/TransparenciaTab";
import DadosAbertosTab from "./hub/DadosAbertosTab";
import ValidacaoTab from "./hub/ValidacaoTab";

interface HubDadosEducacionaisProps {
  secretariaSlug: string;
}

export default function HubDadosEducacionais({ secretariaSlug }: HubDadosEducacionaisProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Hub de Dados Educacionais</h2>
        <p className="text-muted-foreground mt-2">
          Integração completa com INEP, SICONFI, Portal da Transparência e Dados Abertos
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto gap-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="censo" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            <span className="hidden sm:inline">Censo</span>
          </TabsTrigger>
          <TabsTrigger value="ideb" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">IDEB</span>
          </TabsTrigger>
          <TabsTrigger value="orcamento" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Orçamento</span>
          </TabsTrigger>
          <TabsTrigger value="siconfi" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">SICONFI</span>
          </TabsTrigger>
          <TabsTrigger value="transparencia" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Transparência</span>
          </TabsTrigger>
          <TabsTrigger value="dados-abertos" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Dados Abertos</span>
          </TabsTrigger>
          <TabsTrigger value="validacao" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Validação</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab secretariaSlug={secretariaSlug} />
        </TabsContent>

        <TabsContent value="censo">
          <CensoEscolarTab secretariaSlug={secretariaSlug} />
        </TabsContent>

        <TabsContent value="ideb">
          <IdebAvaliacoesTab secretariaSlug={secretariaSlug} />
        </TabsContent>

        <TabsContent value="orcamento">
          <OrcamentoTab secretariaSlug={secretariaSlug} />
        </TabsContent>

        <TabsContent value="siconfi">
          <SiconfiTab secretariaSlug={secretariaSlug} />
        </TabsContent>

        <TabsContent value="transparencia">
          <TransparenciaTab secretariaSlug={secretariaSlug} />
        </TabsContent>

        <TabsContent value="dados-abertos">
          <DadosAbertosTab secretariaSlug={secretariaSlug} />
        </TabsContent>

        <TabsContent value="validacao">
          <ValidacaoTab secretariaSlug={secretariaSlug} />
        </TabsContent>
      </Tabs>
    </div>
  );
}