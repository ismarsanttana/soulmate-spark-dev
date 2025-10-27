import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Briefcase, Plus, Trash2, Edit2, Users, Brain } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VacancyFormData {
  title: string;
  company: string;
  description: string;
  location: string;
  job_type: string;
  salary_range?: string;
  vacancies_count: number;
  workload?: string;
  requirements?: string;
  benefits?: string;
  status: string;
  expires_at?: string;
}

export const VacanciesManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<any>(null);
  const [isMatchingCandidates, setIsMatchingCandidates] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<VacancyFormData>({
    title: "",
    company: "",
    description: "",
    location: "",
    job_type: "CLT",
    salary_range: "",
    vacancies_count: 1,
    workload: "",
    requirements: "",
    benefits: "",
    status: "active",
    expires_at: "",
  });

  const { data: vacancies, isLoading } = useQuery({
    queryKey: ["job-vacancies-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_vacancies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createVacancyMutation = useMutation({
    mutationFn: async (data: VacancyFormData) => {
      const { data: vacancy, error } = await supabase
        .from("job_vacancies")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return vacancy;
    },
    onSuccess: async (vacancy) => {
      toast.success("Vaga criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["job-vacancies-admin"] });
      setIsDialogOpen(false);
      resetForm();

      // Executar matching automático de candidatos
      try {
        setIsMatchingCandidates(true);
        const { data, error } = await supabase.functions.invoke("match-candidates", {
          body: { vacancyId: vacancy.id },
        });

        if (error) throw error;

        toast.success(
          `${data.matchedCount} candidatos compatíveis foram notificados!`,
          {
            description: `Sistema de IA analisou perfis e encontrou candidatos ideais para ${data.vacancyTitle}`,
            duration: 5000,
          }
        );
      } catch (error) {
        console.error("Erro ao fazer matching:", error);
        toast.error("Vaga criada, mas houve erro ao notificar candidatos");
      } finally {
        setIsMatchingCandidates(false);
      }
    },
    onError: (error) => {
      toast.error("Erro ao criar vaga");
      console.error(error);
    },
  });

  const updateVacancyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VacancyFormData> }) => {
      const { error } = await supabase
        .from("job_vacancies")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vaga atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["job-vacancies-admin"] });
      setIsDialogOpen(false);
      setEditingVacancy(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar vaga");
      console.error(error);
    },
  });

  const deleteVacancyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_vacancies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vaga excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["job-vacancies-admin"] });
    },
    onError: (error) => {
      toast.error("Erro ao excluir vaga");
      console.error(error);
    },
  });

  const matchCandidatesMutation = useMutation({
    mutationFn: async (vacancyId: string) => {
      const { data, error } = await supabase.functions.invoke("match-candidates", {
        body: { vacancyId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        `${data.matchedCount} candidatos compatíveis foram notificados!`,
        {
          description: `Sistema analisou perfis e encontrou candidatos para ${data.vacancyTitle}`,
          duration: 5000,
        }
      );
    },
    onError: (error) => {
      toast.error("Erro ao analisar candidatos");
      console.error(error);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      company: "",
      description: "",
      location: "",
      job_type: "CLT",
      salary_range: "",
      vacancies_count: 1,
      workload: "",
      requirements: "",
      benefits: "",
      status: "active",
      expires_at: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingVacancy) {
      updateVacancyMutation.mutate({ id: editingVacancy.id, data: formData });
    } else {
      createVacancyMutation.mutate(formData);
    }
  };

  const handleEdit = (vacancy: any) => {
    setEditingVacancy(vacancy);
    setFormData({
      title: vacancy.title,
      company: vacancy.company,
      description: vacancy.description,
      location: vacancy.location,
      job_type: vacancy.job_type,
      salary_range: vacancy.salary_range || "",
      vacancies_count: vacancy.vacancies_count,
      workload: vacancy.workload || "",
      requirements: vacancy.requirements || "",
      benefits: vacancy.benefits || "",
      status: vacancy.status,
      expires_at: vacancy.expires_at
        ? new Date(vacancy.expires_at).toISOString().split("T")[0]
        : "",
    });
    setIsDialogOpen(true);
  };

  const handleMatchCandidates = (vacancyId: string) => {
    matchCandidatesMutation.mutate(vacancyId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          Vagas de Emprego - SINE Municipal
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingVacancy(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Vaga
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVacancy ? "Editar Vaga" : "Nova Vaga"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Vaga *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Localização *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_type">Tipo de Contrato *</Label>
                  <Select
                    value={formData.job_type}
                    onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLT">CLT</SelectItem>
                      <SelectItem value="PJ">PJ</SelectItem>
                      <SelectItem value="Temporário">Temporário</SelectItem>
                      <SelectItem value="Estágio">Estágio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_range">Faixa Salarial</Label>
                  <Input
                    id="salary_range"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                    placeholder="Ex: R$ 2.000,00 - R$ 3.000,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacancies_count">Número de Vagas *</Label>
                  <Input
                    id="vacancies_count"
                    type="number"
                    min="1"
                    value={formData.vacancies_count}
                    onChange={(e) =>
                      setFormData({ ...formData, vacancies_count: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workload">Carga Horária</Label>
                <Input
                  id="workload"
                  value={formData.workload}
                  onChange={(e) => setFormData({ ...formData, workload: e.target.value })}
                  placeholder="Ex: Segunda a Sexta, 8h às 17h"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requisitos</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefits">Benefícios</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="inactive">Inativa</SelectItem>
                      <SelectItem value="filled">Preenchida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_at">Data de Expiração</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingVacancy(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createVacancyMutation.isPending || updateVacancyMutation.isPending || isMatchingCandidates}
                >
                  {isMatchingCandidates ? (
                    <>
                      <Brain className="h-4 w-4 mr-2 animate-pulse" />
                      Analisando candidatos...
                    </>
                  ) : editingVacancy ? (
                    "Atualizar"
                  ) : (
                    "Criar Vaga"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>Carregando vagas...</div>
      ) : (
        <div className="grid gap-4">
          {vacancies?.map((vacancy) => (
            <Card key={vacancy.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{vacancy.title}</h3>
                    <p className="text-sm text-muted-foreground">{vacancy.company}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMatchCandidates(vacancy.id)}
                      disabled={matchCandidatesMutation.isPending}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Analisar Candidatos
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(vacancy)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Deseja excluir esta vaga?")) {
                          deleteVacancyMutation.mutate(vacancy.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Localização:</strong> {vacancy.location}
                  </div>
                  <div>
                    <strong>Tipo:</strong> {vacancy.job_type}
                  </div>
                  <div>
                    <strong>Vagas:</strong> {vacancy.vacancies_count}
                  </div>
                  <div>
                    <strong>Candidaturas:</strong> {vacancy.applications_count}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span
                      className={
                        vacancy.status === "active"
                          ? "text-green-600"
                          : vacancy.status === "filled"
                          ? "text-blue-600"
                          : "text-gray-600"
                      }
                    >
                      {vacancy.status === "active"
                        ? "Ativa"
                        : vacancy.status === "filled"
                        ? "Preenchida"
                        : "Inativa"}
                    </span>
                  </div>
                  {vacancy.salary_range && (
                    <div>
                      <strong>Salário:</strong> {vacancy.salary_range}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
