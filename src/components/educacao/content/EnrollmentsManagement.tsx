import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Search, User, Users, GraduationCap } from "lucide-react";

interface EnrollmentsManagementProps {
  secretariaSlug: string;
}

export function EnrollmentsManagement({ secretariaSlug }: EnrollmentsManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("student");
  
  const [studentData, setStudentData] = useState({
    full_name: "",
    email: "",
    cpf: "",
    birth_date: "",
    gender: "",
  });

  const [enrollmentData, setEnrollmentData] = useState({
    class_id: "",
    school_year: new Date().getFullYear().toString(),
  });

  const [responsibleData, setResponsibleData] = useState({
    full_name: "",
    email: "",
    cpf: "",
    relationship_type: "pai",
  });

  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ["school-classes-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_classes")
        .select("*")
        .eq("status", "active")
        .order("grade_level", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["student-enrollments", secretariaSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select(`
          *,
          student:student_user_id(id, full_name, email),
          class:class_id(id, class_name, grade_level, school_name)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createStudentAndEnrollment = useMutation({
    mutationFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: studentData.email,
        password: Math.random().toString(36).slice(-12),
        options: { data: { full_name: studentData.full_name } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      const studentUserId = authData.user.id;

      await supabase.from("profiles").update({
        full_name: studentData.full_name,
        cpf: studentData.cpf,
        birth_date: studentData.birth_date,
        gender: studentData.gender,
      }).eq("id", studentUserId);

      await supabase.from("user_roles").insert([{ user_id: studentUserId, role: "aluno" }]);

      await supabase.from("student_enrollments").insert([{
        student_user_id: studentUserId,
        class_id: enrollmentData.class_id,
        school_year: enrollmentData.school_year,
        status: "active",
      }]);

      if (responsibleData.full_name && responsibleData.email) {
        const { data: respAuthData } = await supabase.auth.signUp({
          email: responsibleData.email,
          password: Math.random().toString(36).slice(-12),
          options: { data: { full_name: responsibleData.full_name } },
        });
        
        if (respAuthData?.user) {
          await supabase.from("profiles").update({
            full_name: responsibleData.full_name,
            cpf: responsibleData.cpf,
          }).eq("id", respAuthData.user.id);

          await supabase.from("user_roles").insert([{ user_id: respAuthData.user.id, role: "responsavel" }]);
          
          await supabase.from("user_relationships").insert([{
            user_id: respAuthData.user.id,
            related_user_id: studentUserId,
            relationship_type: responsibleData.relationship_type,
          }]);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
      toast.success("Aluno matriculado com sucesso!");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cadastrar aluno");
    },
  });

  const resetForm = () => {
    setStudentData({ full_name: "", email: "", cpf: "", birth_date: "", gender: "" });
    setEnrollmentData({ class_id: "", school_year: new Date().getFullYear().toString() });
    setResponsibleData({ full_name: "", email: "", cpf: "", relationship_type: "pai" });
    setActiveTab("student");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData.full_name || !studentData.email || !enrollmentData.class_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createStudentAndEnrollment.mutate();
  };

  const filteredEnrollments = enrollments.filter((e: any) => 
    !searchTerm || 
    e.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.matricula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cadastrar Novo Aluno</CardTitle>
            <CardDescription>Complete o cadastro, vincule a turma e responsável</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastro Completo de Aluno</DialogTitle>
                <DialogDescription>Matrícula será gerada automaticamente</DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="student"><User className="mr-2 h-4 w-4" />Dados do Aluno</TabsTrigger>
                    <TabsTrigger value="enrollment"><GraduationCap className="mr-2 h-4 w-4" />Turma</TabsTrigger>
                    <TabsTrigger value="responsible"><Users className="mr-2 h-4 w-4" />Responsável</TabsTrigger>
                  </TabsList>

                  <TabsContent value="student" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome Completo *</Label>
                        <Input value={studentData.full_name} onChange={(e) => setStudentData({ ...studentData, full_name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input type="email" value={studentData.email} onChange={(e) => setStudentData({ ...studentData, email: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF *</Label>
                        <Input value={studentData.cpf} onChange={(e) => setStudentData({ ...studentData, cpf: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Nascimento</Label>
                        <Input type="date" value={studentData.birth_date} onChange={(e) => setStudentData({ ...studentData, birth_date: e.target.value })} />
                      </div>
                    </div>
                    <Button type="button" onClick={() => setActiveTab("enrollment")}>Próximo: Turma</Button>
                  </TabsContent>

                  <TabsContent value="enrollment" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Turma *</Label>
                      <Select value={enrollmentData.class_id} onValueChange={(v) => setEnrollmentData({ ...enrollmentData, class_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {classes.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.class_name} - {c.grade_level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("student")}>Voltar</Button>
                      <Button type="button" onClick={() => setActiveTab("responsible")}>Próximo</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="responsible" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Responsável</Label>
                        <Input value={responsibleData.full_name} onChange={(e) => setResponsibleData({ ...responsibleData, full_name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={responsibleData.email} onChange={(e) => setResponsibleData({ ...responsibleData, email: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("enrollment")}>Voltar</Button>
                      <Button type="submit" disabled={createStudentAndEnrollment.isPending}>
                        {createStudentAndEnrollment.isPending ? "Cadastrando..." : "Cadastrar"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono">{e.matricula}</TableCell>
                  <TableCell>{e.student?.full_name || "N/A"}</TableCell>
                  <TableCell>{e.class?.class_name || "N/A"}</TableCell>
                  <TableCell><Badge>{e.status === "active" ? "Ativo" : "Inativo"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
