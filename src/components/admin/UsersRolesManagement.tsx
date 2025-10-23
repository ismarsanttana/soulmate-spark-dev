import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type UserRole = "admin" | "prefeito" | "secretario";

export function UsersRolesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedSecretaria, setSelectedSecretaria] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: profiles } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: secretarias } = useQuery({
    queryKey: ["secretarias"],
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

  const { data: secretaryAssignments } = useQuery({
    queryKey: ["secretary-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretary_assignments")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, role, secretariaSlug }: { userId: string; role: string; secretariaSlug?: string }) => {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as UserRole });

      if (roleError) throw roleError;

      if (role === "secretario" && secretariaSlug) {
        const { error: assignmentError } = await supabase
          .from("secretary_assignments")
          .insert({ user_id: userId, secretaria_slug: secretariaSlug });

        if (assignmentError) throw assignmentError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["secretary-assignments"] });
      toast({ title: "Sucesso!", description: "Role adicionada com sucesso." });
      setDialogOpen(false);
      setSelectedUserId(null);
      setSelectedRole("");
      setSelectedSecretaria("");
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      if (role === "secretario") {
        await supabase
          .from("secretary_assignments")
          .delete()
          .eq("user_id", userId);
      }

      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["secretary-assignments"] });
      toast({ title: "Sucesso!", description: "Role removida com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao remover role.", variant: "destructive" });
    },
  });

  const updateAssignment = useMutation({
    mutationFn: async ({ userId, secretariaSlug }: { userId: string; secretariaSlug: string }) => {
      await supabase
        .from("secretary_assignments")
        .delete()
        .eq("user_id", userId);

      const { error } = await supabase
        .from("secretary_assignments")
        .insert({ user_id: userId, secretaria_slug: secretariaSlug });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretary-assignments"] });
      toast({ title: "Sucesso!", description: "Secretaria atualizada." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao atualizar.", variant: "destructive" });
    },
  });

  const getUserRoles = (userId: string): UserRole[] => {
    return userRoles?.filter((ur: any) => ur.user_id === userId).map((ur: any) => ur.role as UserRole) || [];
  };

  const getUserSecretaria = (userId: string) => {
    const assignment = secretaryAssignments?.find((sa: any) => sa.user_id === userId);
    if (!assignment) return null;
    return secretarias?.find((s: any) => s.slug === assignment.secretaria_slug);
  };

  const filteredProfiles = profiles?.filter((profile: any) =>
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleColors: Record<UserRole, string> = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    prefeito: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
    secretario: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  };

  const roleLabels: Record<UserRole, string> = {
    admin: "Admin",
    prefeito: "Prefeito",
    secretario: "Secretário",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários e Roles</h2>
          <p className="text-muted-foreground">Gerencie permissões de acesso dos usuários</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários do Sistema
          </CardTitle>
          <CardDescription>
            Total de usuários: {profiles?.length || 0}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles?.map((profile: any) => {
                    const roles = getUserRoles(profile.id);
                    const hasSecretarioRole = roles.includes("secretario");
                    const secretaria = getUserSecretaria(profile.id);
                    
                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.full_name}</TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {roles.length > 0 ? (
                              roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant="secondary"
                                  className={roleColors[role]}
                                >
                                  {roleLabels[role]}
                                  {role === "secretario" && secretaria && ` - ${secretaria.name}`}
                                  <button
                                    onClick={() => removeRole.mutate({ userId: profile.id, role })}
                                    className="ml-1 hover:bg-black/10 rounded-full"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">Sem roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Dialog 
                              open={dialogOpen && selectedUserId === profile.id} 
                              onOpenChange={(open) => {
                                setDialogOpen(open);
                                if (!open) {
                                  setSelectedUserId(null);
                                  setSelectedRole("");
                                  setSelectedSecretaria("");
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedUserId(profile.id)}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Adicionar Role
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Adicionar Role</DialogTitle>
                                  <DialogDescription>
                                    Adicione uma role para {profile.full_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione uma role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="prefeito">Prefeito</SelectItem>
                                      <SelectItem value="secretario">Secretário</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  {selectedRole === "secretario" && (
                                    <Select value={selectedSecretaria} onValueChange={setSelectedSecretaria}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma secretaria" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {secretarias?.map((sec: any) => (
                                          <SelectItem key={sec.id} value={sec.slug}>
                                            {sec.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}

                                  <Button
                                    onClick={() => {
                                      if (selectedRole === "secretario" && !selectedSecretaria) {
                                        toast({
                                          title: "Atenção",
                                          description: "Selecione uma secretaria.",
                                          variant: "destructive"
                                        });
                                        return;
                                      }
                                      addRole.mutate({ 
                                        userId: profile.id, 
                                        role: selectedRole,
                                        secretariaSlug: selectedRole === "secretario" ? selectedSecretaria : undefined
                                      });
                                    }}
                                    disabled={!selectedRole || (selectedRole === "secretario" && !selectedSecretaria)}
                                    className="w-full"
                                  >
                                    Adicionar Role
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {hasSecretarioRole && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Alterar Secretaria
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Alterar Secretaria</DialogTitle>
                                    <DialogDescription>
                                      Altere a secretaria atribuída a {profile.full_name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Select 
                                      defaultValue={secretaria?.slug}
                                      onValueChange={(value) => 
                                        updateAssignment.mutate({ 
                                          userId: profile.id, 
                                          secretariaSlug: value 
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma secretaria" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {secretarias?.map((sec: any) => (
                                          <SelectItem key={sec.id} value={sec.slug}>
                                            {sec.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {userRoles?.filter((ur: any) => ur.role === "admin").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prefeitos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {userRoles?.filter((ur: any) => ur.role === "prefeito").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Secretários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {userRoles?.filter((ur: any) => ur.role === "secretario").length || 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
