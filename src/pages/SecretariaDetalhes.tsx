import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, MapPin, Clock, Loader2 } from "lucide-react";
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
  { slug: "comunicacao", title: "Comunicação", icon: "Megaphone", color: "#06b6d4", description: "Comunicação institucional, notícias, eventos e campanhas da cidade" }
];

const SecretariaDetalhes = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: secretariaDB, isLoading } = useQuery({
    queryKey: ["secretaria", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("secretarias")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      return data;
    },
  });

  // Mesclar com secretaria padrão se não encontrar no banco
  const defaultSec = defaultSecretarias.find(s => s.slug === slug);
  const secretaria = secretariaDB || (defaultSec ? {
    id: defaultSec.slug,
    slug: defaultSec.slug,
    name: defaultSec.title,
    icon: defaultSec.icon,
    color: defaultSec.color,
    description: defaultSec.description,
    phone: null,
    email: null,
    address: null,
    business_hours: null,
    is_active: true
  } : null);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!secretaria) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Secretaria não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            A secretaria que você procura não existe ou está inativa.
          </p>
          <Button asChild>
            <Link to="/">Voltar para a página inicial</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const IconComponent = getIconComponent(secretaria.icon);

  return (
    <Layout>
      <div className="mb-4">
        <Button variant="ghost" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <div
        className="rounded-2xl p-8 text-white mb-6"
        style={{ backgroundColor: secretaria.color }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center">
            <IconComponent className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold">{secretaria.name}</h1>
        </div>
        {secretaria.description && (
          <p className="text-lg opacity-90">{secretaria.description}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">Informações de Contato</h2>

            {secretaria.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Telefone</p>
                  <p className="text-muted-foreground">{secretaria.phone}</p>
                </div>
              </div>
            )}

            {secretaria.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">E-mail</p>
                  <p className="text-muted-foreground">{secretaria.email}</p>
                </div>
              </div>
            )}

            {secretaria.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Endereço</p>
                  <p className="text-muted-foreground">{secretaria.address}</p>
                </div>
              </div>
            )}

            {secretaria.business_hours && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Horário de Atendimento</p>
                  <p className="text-muted-foreground">{secretaria.business_hours}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Serviços Disponíveis</h2>
            <p className="text-muted-foreground">
              Em breve, aqui serão listados os serviços e funcionalidades específicas
              desta secretaria.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SecretariaDetalhes;
