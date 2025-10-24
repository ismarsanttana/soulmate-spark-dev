import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Clock, UserPlus, Edit, AlertCircle, History } from "lucide-react";
import { EmployeeForm } from "./EmployeeForm";
import { TimeclockView } from "./TimeclockView";
import { EmployeeAbsenceDialog } from "@/components/educacao/content/EmployeeAbsenceDialog";
import { EmployeeAuditLog } from "@/components/educacao/content/EmployeeAuditLog";

interface TeamManagementProps {
  secretariaSlug: string;
}

export function TeamManagement({ secretariaSlug }: TeamManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [auditEmployeeId, setAuditEmployeeId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ["secretaria-employees", secretariaSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretaria_employees")
        .select("*")
        .eq("secretaria_slug", secretariaSlug)
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });

  const filteredEmployees = employees?.filter(
    (employee) =>
      employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.cpf.includes(searchTerm) ||
      employee.matricula.includes(searchTerm)
  );

  const handleEmployeeAdded = () => {
    setIsAddDialogOpen(false);
    setSelectedEmployee(null);
    queryClient.invalidateQueries({ queryKey: ["secretaria-employees"] });
    toast.success("Funcionário salvo com sucesso!");
  };

  const handleViewAudit = (employeeId: string) => {
    setAuditEmployeeId(employeeId);
    setIsAuditDialogOpen(true);
  };

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case "ativo":
        return "bg-green-500";
      case "afastado":
        return "bg-yellow-500";
      case "inativo":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestão de Equipe</CardTitle>
              <CardDescription>
                Gerencie os membros da equipe e acompanhe o ponto eletrônico
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedEmployee(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Funcionário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedEmployee ? "Editar Funcionário" : "Adicionar Funcionário"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os dados do funcionário. Os campos marcados com * são obrigatórios.
                  </DialogDescription>
                </DialogHeader>
                <EmployeeForm
                  secretariaSlug={secretariaSlug}
                  employee={selectedEmployee}
                  onSuccess={handleEmployeeAdded}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="equipe" className="space-y-4">
            <TabsList>
              <TabsTrigger value="equipe">
                <UserPlus className="mr-2 h-4 w-4" />
                Membros da Equipe
              </TabsTrigger>
              <TabsTrigger value="ponto">
                <Clock className="mr-2 h-4 w-4" />
                Ponto Eletrônico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="equipe" className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando funcionários...
                </div>
              ) : filteredEmployees?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum funcionário encontrado
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Situação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees?.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-mono">{employee.matricula}</TableCell>
                          <TableCell className="font-medium">{employee.full_name}</TableCell>
                          <TableCell className="font-mono">{employee.cpf}</TableCell>
                          <TableCell className="text-sm">{employee.funcao}</TableCell>
                          <TableCell>
                            <Badge className={getSituacaoColor(employee.situacao)}>
                              {employee.situacao}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <EmployeeAbsenceDialog 
                                employeeId={employee.id}
                                employeeName={employee.full_name}
                                open={false}
                                onOpenChange={() => {}}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setIsAddDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewAudit(employee.id)}
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ponto">
              <TimeclockView secretariaSlug={secretariaSlug} employees={employees || []} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
          </DialogHeader>
          {auditEmployeeId && <EmployeeAuditLog employeeId={auditEmployeeId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
