import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { getIconComponent } from "@/lib/iconMapper";

// Secretarias padrão
const defaultSecretarias = [
  { slug: "saude", title: "Saúde", icon: "HeartPulse", color: "#10b981", description: "Atendimento médico, consultas e exames" },
  { slug: "educacao", title: "Educação", icon: "GraduationCap", color: "#3b82f6", description: "Matrículas, transporte escolar e calendário letivo" },
  { slug: "assistencia", title: "Assistência Social", icon: "Heart", color: "#f43f5e", description: "Programas sociais, benefícios e serviços de proteção ao cidadão" },
  { slug: "obras", title: "Obras", icon: "HardHat", color: "#f59e0b", description: "Acompanhamento de obras, investimentos e cronogramas" },
  { slug: "financas", title: "Finanças", icon: "Wallet", color: "#a855f7", description: "Tributos, certidões e transparência fiscal" },
  { slug: "cultura", title: "Cultura e Turismo", icon: "Music", color: "#ec4899", description: "Editais, agenda cultural e pontos turísticos" },
  { slug: "iptu", title: "2ª via IPTU", icon: "FileText", color: "#8b5cf6", description: "Emissão de segunda via do IPTU" },
  { slug: "agendar-consulta", title: "Agendar Consulta", icon: "Calendar", color: "#14b8a6", description: "Agendamento de consultas médicas" },
  { slug: "iluminacao", title: "Iluminação Pública", icon: "Lightbulb", color: "#60a5fa", description: "Solicitações e manutenção de iluminação pública" },
  { slug: "esporte", title: "Esporte", icon: "Trophy", color: "#22c55e", description: "Campeonatos, quadras, campos e programas esportivos" },
  { slug: "agricultura", title: "Agricultura", icon: "Tractor", color: "#84cc16", description: "Apoio ao produtor rural, programas agrícolas e desenvolvimento rural" },
  { slug: "mulher", title: "Secretaria da Mulher", icon: "Heart", color: "#f472b6", description: "Políticas públicas para mulheres, acolhimento e apoio" }
];

const SecretariasList = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: secretariasDB } = useQuery({
    queryKey: ["secretarias-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretarias")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Mesclar secretarias do banco com as padrões
  const secretarias = defaultSecretarias.map(defaultSec => {
    const dbSec = secretariasDB?.find(db => db.slug === defaultSec.slug);
    return dbSec || {
      id: defaultSec.slug,
      slug: defaultSec.slug,
      name: defaultSec.title,
      icon: defaultSec.icon,
      color: defaultSec.color,
      description: defaultSec.description,
      is_active: true
    };
  });

  const filteredSecretarias = secretarias?.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mapeia os slugs para as rotas corretas
  const getRouteForSlug = (slug: string) => {
    const routeMap: Record<string, string> = {
      'saude': '/saude',
      'educacao': '/educacao',
      'assistencia': '/assistencia',
      'obras': '/obras',
      'financas': '/financas',
      'cultura': '/cultura',
      'iptu': '/iptu',
      'agendar-consulta': '/agendar-consulta',
      'iluminacao': '/iluminacao-publica',
      'esporte': '/esporte',
      'agricultura': '/agricultura',
      'mulher': '/mulher'
    };
    return routeMap[slug] || `/secretarias/${slug}`;
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Secretarias & Serviços</h1>
        <p className="text-muted-foreground">
          Conheça as secretarias e serviços disponíveis
        </p>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar secretaria..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSecretarias?.map((secretaria) => {
          const IconComponent = getIconComponent(secretaria.icon);

          return (
              <Link
                key={secretaria.id}
                to={getRouteForSlug(secretaria.slug)}
                className="block"
              >
              <Card 
                className="card-hover h-full"
                style={{ borderLeft: `4px solid ${secretaria.color}` }}
              >
                <CardContent className="p-6">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${secretaria.color}20` }}
                  >
                    <IconComponent 
                      className="h-6 w-6" 
                      style={{ color: secretaria.color }}
                    />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{secretaria.name}</h3>
                  {secretaria.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {secretaria.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filteredSecretarias?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhuma secretaria encontrada com esse termo de busca.
          </p>
        </div>
      )}
    </Layout>
  );
};

export default SecretariasList;
