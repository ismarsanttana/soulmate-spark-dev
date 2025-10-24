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
    naturalidade: "",
    nacionalidade: "Brasileira",
    rg: "",
    certidao_nascimento: "",
    cartao_sus: "",
    nis: "",
    telefone: "",
  });

  const [studentDocs, setStudentDocs] = useState({
    doc_certidao: null as File | null,
    doc_rg: null as File | null,
    doc_vacinacao: null as File | null,
    doc_comprovante_residencia: null as File | null,
    doc_foto: null as File | null,
    doc_historico_escolar: null as File | null,
  });

  const [studentInfo, setStudentInfo] = useState({
    alergias: "",
    restricoes_alimentares: "",
    medicacoes_continuas: "",
    necessidades_especiais: "",
    autorizacao_uso_imagem: true,
    autorizacao_busca_medica: true,
    usa_transporte_escolar: false,
    endereco_transporte: "",
    ponto_embarque: "",
  });

  const [enrollmentData, setEnrollmentData] = useState({
    class_id: "",
    school_year: new Date().getFullYear().toString(),
  });

  const [responsibleData, setResponsibleData] = useState({
    full_name: "",
    email: "",
    cpf: "",
    rg: "",
    telefone: "",
    telefone_emergencia: "",
    endereco_completo: "",
    relationship_type: "pai",
  });

  const [responsibleDocs, setResponsibleDocs] = useState({
    doc_rg: null as File | null,
    doc_cpf: null as File | null,
    doc_guarda_tutela: null as File | null,
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

  const uploadDocument = async (file: File, userId: string, docType: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${docType}_${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('student-documents')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('student-documents')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

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

      // Upload de documentos do aluno
      const docUrls: any = {};
      if (studentDocs.doc_certidao) docUrls.doc_certidao_url = await uploadDocument(studentDocs.doc_certidao, studentUserId, 'certidao');
      if (studentDocs.doc_rg) docUrls.doc_rg_url = await uploadDocument(studentDocs.doc_rg, studentUserId, 'rg');
      if (studentDocs.doc_vacinacao) docUrls.doc_vacinacao_url = await uploadDocument(studentDocs.doc_vacinacao, studentUserId, 'vacinacao');
      if (studentDocs.doc_comprovante_residencia) docUrls.doc_comprovante_residencia_url = await uploadDocument(studentDocs.doc_comprovante_residencia, studentUserId, 'comprovante');
      if (studentDocs.doc_foto) docUrls.doc_foto_url = await uploadDocument(studentDocs.doc_foto, studentUserId, 'foto');
      if (studentDocs.doc_historico_escolar) docUrls.doc_historico_escolar_url = await uploadDocument(studentDocs.doc_historico_escolar, studentUserId, 'historico');

      // Atualizar perfil do aluno com todos os dados
      await supabase.from("profiles").update({
        full_name: studentData.full_name,
        cpf: studentData.cpf,
        birth_date: studentData.birth_date,
        gender: studentData.gender,
        naturalidade: studentData.naturalidade,
        nacionalidade: studentData.nacionalidade,
        rg: studentData.rg,
        certidao_nascimento: studentData.certidao_nascimento,
        cartao_sus: studentData.cartao_sus,
        nis: studentData.nis,
        telefone: studentData.telefone,
        alergias: studentInfo.alergias,
        restricoes_alimentares: studentInfo.restricoes_alimentares,
        medicacoes_continuas: studentInfo.medicacoes_continuas,
        necessidades_especiais: studentInfo.necessidades_especiais,
        autorizacao_uso_imagem: studentInfo.autorizacao_uso_imagem,
        autorizacao_busca_medica: studentInfo.autorizacao_busca_medica,
        usa_transporte_escolar: studentInfo.usa_transporte_escolar,
        endereco_transporte: studentInfo.endereco_transporte,
        ponto_embarque: studentInfo.ponto_embarque,
        ...docUrls,
      }).eq("id", studentUserId);

      await supabase.from("user_roles").insert([{ user_id: studentUserId, role: "aluno" }]);

      // Criar matrícula (matricula será gerada automaticamente pelo trigger)
      await supabase.from("student_enrollments").insert({
        student_user_id: studentUserId,
        class_id: enrollmentData.class_id,
        school_year: enrollmentData.school_year,
        status: "active",
      } as any);

      // Criar responsável se fornecido
      if (responsibleData.full_name && responsibleData.email) {
        const { data: respAuthData } = await supabase.auth.signUp({
          email: responsibleData.email,
          password: Math.random().toString(36).slice(-12),
          options: { data: { full_name: responsibleData.full_name } },
        });
        
        if (respAuthData?.user) {
          // Upload de documentos do responsável
          const respDocUrls: any = {};
          if (responsibleDocs.doc_rg) respDocUrls.doc_rg_url = await uploadDocument(responsibleDocs.doc_rg, respAuthData.user.id, 'resp_rg');
          if (responsibleDocs.doc_cpf) respDocUrls.doc_cpf_url = await uploadDocument(responsibleDocs.doc_cpf, respAuthData.user.id, 'resp_cpf');
          if (responsibleDocs.doc_guarda_tutela) respDocUrls.doc_guarda_tutela_url = await uploadDocument(responsibleDocs.doc_guarda_tutela, respAuthData.user.id, 'guarda');

          await supabase.from("profiles").update({
            full_name: responsibleData.full_name,
            cpf: responsibleData.cpf,
            rg: responsibleData.rg,
            telefone: responsibleData.telefone,
            telefone_emergencia: responsibleData.telefone_emergencia,
            endereco_completo: responsibleData.endereco_completo,
            ...respDocUrls,
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
    setStudentData({ 
      full_name: "", email: "", cpf: "", birth_date: "", gender: "",
      naturalidade: "", nacionalidade: "Brasileira", rg: "", certidao_nascimento: "",
      cartao_sus: "", nis: "", telefone: ""
    });
    setStudentDocs({
      doc_certidao: null, doc_rg: null, doc_vacinacao: null,
      doc_comprovante_residencia: null, doc_foto: null, doc_historico_escolar: null
    });
    setStudentInfo({
      alergias: "", restricoes_alimentares: "", medicacoes_continuas: "",
      necessidades_especiais: "", autorizacao_uso_imagem: true,
      autorizacao_busca_medica: true, usa_transporte_escolar: false,
      endereco_transporte: "", ponto_embarque: ""
    });
    setEnrollmentData({ class_id: "", school_year: new Date().getFullYear().toString() });
    setResponsibleData({ 
      full_name: "", email: "", cpf: "", rg: "", telefone: "",
      telefone_emergencia: "", endereco_completo: "", relationship_type: "pai"
    });
    setResponsibleDocs({ doc_rg: null, doc_cpf: null, doc_guarda_tutela: null });
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
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="student">Dados Pessoais</TabsTrigger>
                    <TabsTrigger value="documents">Documentos</TabsTrigger>
                    <TabsTrigger value="info">Info. Complementares</TabsTrigger>
                    <TabsTrigger value="enrollment">Turma</TabsTrigger>
                    <TabsTrigger value="responsible">Responsável</TabsTrigger>
                  </TabsList>

                  <TabsContent value="student" className="space-y-4 max-h-[50vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label>Nome Completo *</Label>
                        <Input value={studentData.full_name} onChange={(e) => setStudentData({ ...studentData, full_name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Nascimento *</Label>
                        <Input type="date" value={studentData.birth_date} onChange={(e) => setStudentData({ ...studentData, birth_date: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Gênero</Label>
                        <Select value={studentData.gender} onValueChange={(v) => setStudentData({ ...studentData, gender: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Naturalidade</Label>
                        <Input value={studentData.naturalidade} onChange={(e) => setStudentData({ ...studentData, naturalidade: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Nacionalidade</Label>
                        <Input value={studentData.nacionalidade} onChange={(e) => setStudentData({ ...studentData, nacionalidade: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF *</Label>
                        <Input value={studentData.cpf} onChange={(e) => setStudentData({ ...studentData, cpf: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>RG</Label>
                        <Input value={studentData.rg} onChange={(e) => setStudentData({ ...studentData, rg: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Certidão de Nascimento</Label>
                        <Input value={studentData.certidao_nascimento} onChange={(e) => setStudentData({ ...studentData, certidao_nascimento: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Cartão SUS</Label>
                        <Input value={studentData.cartao_sus} onChange={(e) => setStudentData({ ...studentData, cartao_sus: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>NIS</Label>
                        <Input value={studentData.nis} onChange={(e) => setStudentData({ ...studentData, nis: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input value={studentData.telefone} onChange={(e) => setStudentData({ ...studentData, telefone: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input type="email" value={studentData.email} onChange={(e) => setStudentData({ ...studentData, email: e.target.value })} required />
                      </div>
                    </div>
                    <Button type="button" onClick={() => setActiveTab("documents")}>Próximo: Documentos</Button>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-4 max-h-[50vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Certidão de Nascimento (PDF/Imagem)</Label>
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => setStudentDocs({ ...studentDocs, doc_certidao: e.target.files?.[0] || null })} />
                      </div>
                      <div className="space-y-2">
                        <Label>RG (PDF/Imagem)</Label>
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => setStudentDocs({ ...studentDocs, doc_rg: e.target.files?.[0] || null })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Carteira de Vacinação</Label>
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => setStudentDocs({ ...studentDocs, doc_vacinacao: e.target.files?.[0] || null })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Comprovante de Residência</Label>
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => setStudentDocs({ ...studentDocs, doc_comprovante_residencia: e.target.files?.[0] || null })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Foto 3x4</Label>
                        <Input type="file" accept="image/*" onChange={(e) => setStudentDocs({ ...studentDocs, doc_foto: e.target.files?.[0] || null })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Histórico Escolar (transferência)</Label>
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => setStudentDocs({ ...studentDocs, doc_historico_escolar: e.target.files?.[0] || null })} />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("student")}>Voltar</Button>
                      <Button type="button" onClick={() => setActiveTab("info")}>Próximo: Info. Complementares</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="info" className="space-y-4 max-h-[50vh] overflow-y-auto">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Alergias</Label>
                        <Input value={studentInfo.alergias} onChange={(e) => setStudentInfo({ ...studentInfo, alergias: e.target.value })} placeholder="Ex: Lactose, amendoim..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Restrições Alimentares</Label>
                        <Input value={studentInfo.restricoes_alimentares} onChange={(e) => setStudentInfo({ ...studentInfo, restricoes_alimentares: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Medicações de Uso Contínuo</Label>
                        <Input value={studentInfo.medicacoes_continuas} onChange={(e) => setStudentInfo({ ...studentInfo, medicacoes_continuas: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Necessidades Educacionais Especiais</Label>
                        <Input value={studentInfo.necessidades_especiais} onChange={(e) => setStudentInfo({ ...studentInfo, necessidades_especiais: e.target.value })} placeholder="Ex: AEE, Dislexia..." />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="img" checked={studentInfo.autorizacao_uso_imagem} onChange={(e) => setStudentInfo({ ...studentInfo, autorizacao_uso_imagem: e.target.checked })} />
                        <Label htmlFor="img">Autorizo uso de imagem em eventos escolares</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="med" checked={studentInfo.autorizacao_busca_medica} onChange={(e) => setStudentInfo({ ...studentInfo, autorizacao_busca_medica: e.target.checked })} />
                        <Label htmlFor="med">Autorizo busca médica em caso de emergência</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="trans" checked={studentInfo.usa_transporte_escolar} onChange={(e) => setStudentInfo({ ...studentInfo, usa_transporte_escolar: e.target.checked })} />
                        <Label htmlFor="trans">Utiliza transporte escolar</Label>
                      </div>
                      {studentInfo.usa_transporte_escolar && (
                        <>
                          <div className="space-y-2">
                            <Label>Endereço para Transporte</Label>
                            <Input value={studentInfo.endereco_transporte} onChange={(e) => setStudentInfo({ ...studentInfo, endereco_transporte: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Ponto de Embarque</Label>
                            <Input value={studentInfo.ponto_embarque} onChange={(e) => setStudentInfo({ ...studentInfo, ponto_embarque: e.target.value })} />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("documents")}>Voltar</Button>
                      <Button type="button" onClick={() => setActiveTab("enrollment")}>Próximo: Turma</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="enrollment" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Turma *</Label>
                      <Select value={enrollmentData.class_id} onValueChange={(v) => setEnrollmentData({ ...enrollmentData, class_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione uma turma" /></SelectTrigger>
                        <SelectContent>
                          {classes.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.class_name} - {c.grade_level} - {c.school_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ano Letivo</Label>
                      <Input value={enrollmentData.school_year} onChange={(e) => setEnrollmentData({ ...enrollmentData, school_year: e.target.value })} />
                    </div>
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("info")}>Voltar</Button>
                      <Button type="button" onClick={() => setActiveTab("responsible")}>Próximo: Responsável</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="responsible" className="space-y-4 max-h-[50vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label>Nome Completo do Responsável</Label>
                        <Input value={responsibleData.full_name} onChange={(e) => setResponsibleData({ ...responsibleData, full_name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Grau de Parentesco</Label>
                        <Select value={responsibleData.relationship_type} onValueChange={(v) => setResponsibleData({ ...responsibleData, relationship_type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pai">Pai</SelectItem>
                            <SelectItem value="mae">Mãe</SelectItem>
                            <SelectItem value="responsavel">Responsável Legal</SelectItem>
                            <SelectItem value="tutor">Tutor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={responsibleData.email} onChange={(e) => setResponsibleData({ ...responsibleData, email: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF</Label>
                        <Input value={responsibleData.cpf} onChange={(e) => setResponsibleData({ ...responsibleData, cpf: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>RG</Label>
                        <Input value={responsibleData.rg} onChange={(e) => setResponsibleData({ ...responsibleData, rg: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone Principal</Label>
                        <Input value={responsibleData.telefone} onChange={(e) => setResponsibleData({ ...responsibleData, telefone: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone Emergência</Label>
                        <Input value={responsibleData.telefone_emergencia} onChange={(e) => setResponsibleData({ ...responsibleData, telefone_emergencia: e.target.value })} />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Endereço Completo</Label>
                        <Input value={responsibleData.endereco_completo} onChange={(e) => setResponsibleData({ ...responsibleData, endereco_completo: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>RG do Responsável (PDF/Imagem)</Label>
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => setResponsibleDocs({ ...responsibleDocs, doc_rg: e.target.files?.[0] || null })} />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF do Responsável (PDF/Imagem)</Label>
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => setResponsibleDocs({ ...responsibleDocs, doc_cpf: e.target.files?.[0] || null })} />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Comprovante de Guarda/Tutela (se aplicável)</Label>
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => setResponsibleDocs({ ...responsibleDocs, doc_guarda_tutela: e.target.files?.[0] || null })} />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("enrollment")}>Voltar</Button>
                      <Button type="submit" disabled={createStudentAndEnrollment.isPending}>
                        {createStudentAndEnrollment.isPending ? "Cadastrando..." : "Finalizar Cadastro"}
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
