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
        .select("id, full_name, email, cpf")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: availableRoles } = useQuery({
    queryKey: ["available-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("roles").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: secretarias } = useQuery({
    queryKey: ["secretarias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("secretarias").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: secretaryAssignments } = useQuery({
    queryKey: ["secretary-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("secretary_assignments").select("*");
      if (error) throw error;
      return data;
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, roleId, secretariaSlug }: { userId: string; roleId: string; secretariaSlug?: string }) => {
      const role = availableRoles?.find(r => r.id === roleId);
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role_id: roleId, role: role?.role_name.toLowerCase() as any });

      if (roleError) throw roleError;

      if (role?.role_name.toLowerCase() === "secretario" && secretariaSlug) {
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
    mutationFn: async (userRoleId: string) => {
      const userRole = userRoles?.find(ur => ur.id === userRoleId);
      if (userRole?.role === "secretario") {
        await supabase.from("secretary_assignments").delete().eq("user_id", userRole.user_id);
      }
      const { error } = await supabase.from("user_roles").delete().eq("id", userRoleId);
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

  const getUserRoles = (userId: string) => {
    const userRoleIds = userRoles?.filter(ur => ur.user_id === userId) || [];
    return userRoleIds.map(ur => {
      const role = availableRoles?.find(r => r.id === ur.role_id);
      return { ...ur, roleName: role?.role_name || ur.role || "Unknown", roleId: role?.id };
    });
  };

  const getUserSecretaria = (userId: string) => {
    const assignment = secretaryAssignments?.find(sa => sa.user_id === userId);
    if (!assignment) return null;
    return secretarias?.find(s => s.slug === assignment.secretaria_slug);
  };

  const filteredProfiles = profiles?.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf?.includes(searchTerm.replace(/\D/g, ""))
  );

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    prefeito: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
    secretario: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    professor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    aluno: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    pai: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários do Sistema
          </CardTitle>
          <CardDescription>Total de usuários: {profiles?.length || 0}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou CPF..."
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
                    <TableHead>CPF</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles?.map((profile: any) => {
                    const roles = getUserRoles(profile.id);
                    const hasSecretarioRole = roles.some(r => r.role === "secretario");
                    const secretaria = getUserSecretaria(profile.id);
                    
                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.full_name}</TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{profile.cpf || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {roles.length > 0 ? (
                              roles.map((userRole) => (
                                <Badge key={userRole.id} variant="secondary" className={roleColors[userRole.roleName.toLowerCase()] || "bg-gray-100"}>
                                  {userRole.roleName}
                                  {userRole.role === "secretario" && secretaria && ` - ${secretaria.name}`}
                                  <button onClick={() => removeRole.mutate(userRole.id)} className="ml-1 hover:bg-black/10 rounded-full">×</button>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">Sem roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={dialogOpen && selectedUserId === profile.id} onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (!open) { setSelectedUserId(null); setSelectedRole(""); setSelectedSecretaria(""); }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedUserId(profile.id)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Adicionar Role
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adicionar Role</DialogTitle>
                                <DialogDescription>Adicione uma role para {profile.full_name}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                  <SelectTrigger><SelectValue placeholder="Selecione uma role" /></SelectTrigger>
                                  <SelectContent>
                                    {availableRoles?.map((role) => (
                                      <SelectItem key={role.id} value={role.id}>{role.role_name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {availableRoles?.find(r => r.id === selectedRole)?.role_name.toLowerCase() === "secretario" && (
                                  <Select value={selectedSecretaria} onValueChange={setSelectedSecretaria}>
                                    <SelectTrigger><SelectValue placeholder="Selecione uma secretaria" /></SelectTrigger>
                                    <SelectContent>
                                      {secretarias?.map((sec: any) => (
                                        <SelectItem key={sec.id} value={sec.slug}>{sec.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}

                                <Button
                                  onClick={() => {
                                    const isSecretario = availableRoles?.find(r => r.id === selectedRole)?.role_name.toLowerCase() === "secretario";
                                    if (isSecretario && !selectedSecretaria) {
                                      toast({ title: "Atenção", description: "Selecione uma secretaria.", variant: "destructive" });
                                      return;
                                    }
                                    addRole.mutate({ userId: profile.id, roleId: selectedRole, secretariaSlug: isSecretario ? selectedSecretaria : undefined });
                                  }}
                                  disabled={!selectedRole}
                                  className="w-full"
                                >
                                  Adicionar Role
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
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
    </div>
  );
}
