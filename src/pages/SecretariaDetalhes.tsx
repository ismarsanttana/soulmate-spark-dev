import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, MapPin, Clock, Loader2 } from "lucide-react";
import { getIconComponent } from "@/lib/iconMapper";

const SecretariaDetalhes = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: secretaria, isLoading, error } = useQuery({
    queryKey: ["secretaria", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretarias")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !secretaria) {
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
