import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Users, UserPlus } from "lucide-react";

interface StudentsManagementProps {
  secretariaSlug: string;
}

interface RelationshipWithProfiles {
  id: string;
  user_id: string;
  related_user_id: string;
  relationship_type: string;
  created_at: string;
  created_by: string | null;
  metadata: any;
  student?: {
    id: string;
    full_name: string;
    email: string | null;
    cpf: string | null;
  };
  responsible?: {
    id: string;
    full_name: string;
    email: string | null;
    cpf: string | null;
  };
}

export function StudentsManagement({ secretariaSlug }: StudentsManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    related_user_id: "",
    relationship_type: "pai",
  });
  const queryClient = useQueryClient();

  // Buscar todos os relacionamentos aluno-responsável
  const { data: relationships, isLoading } = useQuery<RelationshipWithProfiles[]>({
    queryKey: ["student-relationships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_relationships")
        .select("*")
        .in("relationship_type", ["pai", "mae", "responsavel", "tutor"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Buscar dados dos usuários separadamente
      if (data && data.length > 0) {
        const studentIds = data.map(r => r.user_id);
        const responsibleIds = data.map(r => r.related_user_id);
        const allIds = [...new Set([...studentIds, ...responsibleIds])];
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, cpf")
          .in("id", allIds);
        
        // Combinar os dados
        return data.map(rel => ({
          ...rel,
          student: profiles?.find(p => p.id === rel.user_id),
          responsible: profiles?.find(p => p.id === rel.related_user_id)
        }));
      }
      
      return data;
    },
  });

  // Buscar todos os usuários para seleção
  const { data: allUsers } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, cpf")
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("user_relationships")
        .insert({ ...data, created_by: user?.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-relationships"] });
      toast.success("Relacionamento criado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar relacionamento: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_relationships")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-relationships"] });
      toast.success("Relacionamento removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover relacionamento: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      user_id: "",
      related_user_id: "",
      relationship_type: "pai",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredRelationships = relationships?.filter(
    (rel) =>
      rel.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.responsible?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.student?.cpf?.includes(searchTerm) ||
      rel.responsible?.cpf?.includes(searchTerm)
  );

  const getRelationshipLabel = (type: string) => {
    switch (type) {
      case "pai": return "Pai";
      case "mae": return "Mãe";
      case "responsavel": return "Responsável";
      case "tutor": return "Tutor";
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciamento de Alunos e Responsáveis
            </CardTitle>
            <CardDescription>
              Gerencie o vínculo entre alunos e seus responsáveis
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Responsável
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Vincular Aluno e Responsável</DialogTitle>
                <DialogDescription>
                  Selecione o aluno e o responsável para criar o vínculo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user_id">Aluno *</Label>
                  <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} - {user.cpf || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="related_user_id">Responsável *</Label>
                  <Select value={formData.related_user_id} onValueChange={(value) => setFormData({ ...formData, related_user_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} - {user.cpf || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship_type">Tipo de Relacionamento *</Label>
                  <Select value={formData.relationship_type} onValueChange={(value) => setFormData({ ...formData, relationship_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pai">Pai</SelectItem>
                      <SelectItem value="mae">Mãe</SelectItem>
                      <SelectItem value="responsavel">Responsável Legal</SelectItem>
                      <SelectItem value="tutor">Tutor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Vínculo
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por aluno ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando relacionamentos...
          </div>
        ) : filteredRelationships?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum relacionamento encontrado
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>CPF Aluno</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>CPF Responsável</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRelationships?.map((rel) => (
                  <TableRow key={rel.id}>
                    <TableCell className="font-medium">
                      {rel.student?.full_name || "Não informado"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {rel.student?.cpf || "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {rel.responsible?.full_name || "Não informado"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {rel.responsible?.cpf || "-"}
                    </TableCell>
                    <TableCell>
                      {getRelationshipLabel(rel.relationship_type)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(rel.id)}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
