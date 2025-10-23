import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Trash2, Search, Users } from "lucide-react";

export const UserRelationshipsManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [relatedUser, setRelatedUser] = useState<string>("");
  const [relationshipType, setRelationshipType] = useState<string>("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch profiles
  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email, cpf");
      if (error) throw error;
      return data;
    },
  });

  // Fetch relationships
  const { data: relationships } = useQuery({
    queryKey: ["user-relationships"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_relationships").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Mutation to add relationship
  const addRelationshipMutation = useMutation({
    mutationFn: async ({ userId, relatedUserId, type }: { userId: string; relatedUserId: string; type: string }) => {
      const { error } = await supabase
        .from("user_relationships")
        .insert({ 
          user_id: userId, 
          related_user_id: relatedUserId,
          relationship_type: type
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-relationships"] });
      setShowAddDialog(false);
      setRelatedUser("");
      setRelationshipType("");
      toast.success("Relacionamento criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar relacionamento: " + error.message);
    },
  });

  // Mutation to remove relationship
  const removeRelationshipMutation = useMutation({
    mutationFn: async (relationshipId: string) => {
      const { error } = await supabase
        .from("user_relationships")
        .delete()
        .eq("id", relationshipId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-relationships"] });
      toast.success("Relacionamento removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover relacionamento: " + error.message);
    },
  });

  // Helper to get user relationships
  const getUserRelationships = (userId: string) => {
    return relationships?.filter(r => r.user_id === userId) || [];
  };

  // Filter profiles by search
  const filteredProfiles = profiles?.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf?.includes(searchTerm.replace(/\D/g, ""))
  ) || [];

  const relationshipTypeLabels: Record<string, string> = {
    pai: "Pai",
    mae: "Mãe",
    responsavel: "Responsável",
    tutor: "Tutor",
    filho: "Filho(a)",
  };

  const relationshipTypeColors: Record<string, string> = {
    pai: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    mae: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    responsavel: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    tutor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    filho: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Relacionamentos
          </CardTitle>
          <CardDescription>
            Vincule usuários através de relacionamentos familiares (pai/mãe/filho)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredProfiles.map((profile) => {
              const userRelationships = getUserRelationships(profile.id);
              
              return (
                <div key={profile.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex-1">
                    <h3 className="font-medium">{profile.full_name || "Sem nome"}</h3>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    {profile.cpf && (
                      <p className="text-xs text-muted-foreground">CPF: {profile.cpf}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {userRelationships.length > 0 ? (
                        userRelationships.map((rel) => {
                          const relatedProfile = profiles?.find(p => p.id === rel.related_user_id);
                          return (
                            <div key={rel.id} className="flex items-center gap-1">
                              <Badge className={relationshipTypeColors[rel.relationship_type] || "bg-gray-100 text-gray-700"}>
                                {relationshipTypeLabels[rel.relationship_type] || rel.relationship_type}: {relatedProfile?.full_name || "Usuário desconhecido"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeRelationshipMutation.mutate(rel.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })
                      ) : (
                        <Badge variant="outline">Sem relacionamentos</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(profile.id);
                        setShowAddDialog(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Adicionar Relacionamento
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Relacionamento</DialogTitle>
            <DialogDescription>Vincule este usuário a outro usuário</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={relatedUser} onValueChange={setRelatedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o usuário relacionado" />
              </SelectTrigger>
              <SelectContent>
                {profiles?.filter(p => p.id !== selectedUser).map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name} - {profile.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de relacionamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pai">Pai</SelectItem>
                <SelectItem value="mae">Mãe</SelectItem>
                <SelectItem value="responsavel">Responsável</SelectItem>
                <SelectItem value="tutor">Tutor</SelectItem>
                <SelectItem value="filho">Filho(a)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              className="w-full"
              onClick={() => {
                if (!selectedUser || !relatedUser || !relationshipType) {
                  toast.error("Preencha todos os campos");
                  return;
                }
                addRelationshipMutation.mutate({ 
                  userId: selectedUser, 
                  relatedUserId: relatedUser,
                  type: relationshipType
                });
              }}
            >
              Criar Relacionamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
