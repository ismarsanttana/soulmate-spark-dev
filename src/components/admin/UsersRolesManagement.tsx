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

  const { data: secretarias } = useQuery({
    queryKey: ["secretarias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("secretarias").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  // Roles disponíveis no sistema com opções específicas para secretários
  const availableRoles = [
    { id: 'admin', role_name: 'Admin', baseRole: 'admin' },
    { id: 'prefeito', role_name: 'Prefeito', baseRole: 'prefeito' },
    { id: 'professor', role_name: 'Professor', baseRole: 'professor' },
    { id: 'aluno', role_name: 'Aluno', baseRole: 'aluno' },
    { id: 'pai', role_name: 'Pai', baseRole: 'pai' },
    { id: 'cidadao', role_name: 'Cidadão', baseRole: 'cidadao' },
    // Opções específicas de secretários
    ...(secretarias?.map(sec => ({
      id: `secretario-${sec.slug}`,
      role_name: sec.name,
      baseRole: 'secretario',
      secretariaSlug: sec.slug
    })) || [])
  ];

  const { data: userRoles } = useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
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
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const role = availableRoles.find(r => r.id === roleId);
      if (!role) throw new Error("Role não encontrada");

      // Verificar se a role já existe para este usuário
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", role.baseRole as any)
        .maybeSingle();

      if (existingRole) {
        throw new Error(`O usuário já possui a role ${role.role_name}`);
      }

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role.baseRole as any });

      if (roleError) throw roleError;

      // Se for uma role de secretário específico, adicionar assignment
      if (role.baseRole === "secretario" && 'secretariaSlug' in role && role.secretariaSlug) {
        const { error: assignmentError } = await supabase
          .from("secretary_assignments")
          .insert({ user_id: userId, secretaria_slug: role.secretariaSlug });

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
      // Para secretários, procurar a role específica com base no assignment
      if (ur.role === "secretario") {
        const assignment = secretaryAssignments?.find(sa => sa.user_id === userId);
        if (assignment) {
          const specificRole = availableRoles.find(r => 
            r.baseRole === "secretario" && 'secretariaSlug' in r && r.secretariaSlug === assignment.secretaria_slug
          );
          if (specificRole) {
            return { ...ur, roleName: specificRole.role_name, roleId: specificRole.id };
          }
        }
        return { ...ur, roleName: "Secretário", roleId: "secretario" };
      }
      
      // Para outras roles, usar baseRole para comparação
      const role = availableRoles.find(r => r.baseRole === ur.role);
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
                              roles.map((userRole) => {
                                const isSecretario = userRole.role === "secretario";
                                const secretaria = isSecretario ? getUserSecretaria(profile.id) : null;
                                const displayName = isSecretario && secretaria 
                                  ? `${userRole.roleName} - ${secretaria.name}`
                                  : userRole.roleName;
                                
                                return (
                                  <Badge key={userRole.id} variant="secondary" className={roleColors[userRole.role] || "bg-gray-100"}>
                                    {displayName}
                                    <button onClick={() => removeRole.mutate(userRole.id)} className="ml-1 hover:bg-black/10 rounded-full">×</button>
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-sm text-muted-foreground">Sem roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={dialogOpen && selectedUserId === profile.id} onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (!open) { setSelectedUserId(null); setSelectedRole(""); }
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
                                     {availableRoles.map((role) => (
                                       <SelectItem key={role.id} value={role.id}>{role.role_name}</SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>

                                 <Button
                                   onClick={() => addRole.mutate({ userId: profile.id, roleId: selectedRole })}
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
