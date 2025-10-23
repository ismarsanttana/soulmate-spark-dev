import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { getIconComponent } from "@/lib/iconMapper";

const SecretariasList = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: secretarias } = useQuery({
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

  const filteredSecretarias = secretarias?.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Link key={secretaria.id} to={`/secretarias/${secretaria.slug}`}>
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
