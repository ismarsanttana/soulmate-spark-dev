import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Briefcase, MapPin, Clock, Users } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface JobVacanciesSectionProps {
  user: User | null;
}

export function JobVacanciesSection({ user }: JobVacanciesSectionProps) {
  const [selectedVacancy, setSelectedVacancy] = useState<any>(null);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: vacancies } = useQuery({
    queryKey: ["job-vacancies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_vacancies")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: myApplications } = useQuery({
    queryKey: ["my-job-applications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("job_applications")
        .select("vacancy_id")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data?.map(app => app.vacancy_id) || [];
    },
    enabled: !!user,
  });

  const applyMutation = useMutation({
    mutationFn: async (formData: {
      vacancy_id: string;
      phone: string;
      email: string;
      cover_letter: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const { error } = await supabase
        .from("job_applications")
        .insert({
          ...formData,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Candidatura enviada com sucesso!");
      setApplicationDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-job-applications"] });
      queryClient.invalidateQueries({ queryKey: ["job-vacancies"] });
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Você já se candidatou a esta vaga.");
      } else {
        toast.error("Erro ao enviar candidatura. Tente novamente.");
      }
    },
  });

  const handleApply = (vacancy: any) => {
    if (!user) {
      toast.error("Faça login para se candidatar às vagas.");
      return;
    }
    setSelectedVacancy(vacancy);
    setApplicationDialogOpen(true);
  };

  const onSubmitApplication = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    applyMutation.mutate({
      vacancy_id: selectedVacancy.id,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      cover_letter: formData.get("cover_letter") as string,
    });
  };

  if (!vacancies || vacancies.length === 0) {
    return (
      <div className="mb-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="font-semibold">Vagas de Emprego - SINE</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Oportunidades disponíveis
            </p>
          </div>
        </div>
        <div className="bg-card dark:bg-card rounded-2xl p-6 shadow-sm text-center">
          <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold mb-1">Nenhuma vaga disponível no momento</p>
          <p className="text-xs text-muted-foreground">
            Novas oportunidades serão divulgadas em breve
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="font-semibold">Vagas de Emprego - SINE</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Oportunidades disponíveis
            </p>
          </div>
          <Link to="/servicos" className="text-xs text-primary font-medium">
            Ver todas
          </Link>
        </div>
        <div className="space-y-3">
          {vacancies.map((vacancy) => {
            const hasApplied = myApplications?.includes(vacancy.id);
            const spotsLeft = vacancy.vacancies_count - vacancy.applications_count;
            
            return (
              <div
                key={vacancy.id}
                className="bg-card dark:bg-card rounded-2xl p-4 shadow-sm card-hover"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <div className="bg-primary/10 text-primary p-2 rounded-lg flex-shrink-0">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold">{vacancy.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {vacancy.company}
                        </p>
                      </div>
                    </div>
                  </div>
                  {spotsLeft > 0 && (
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {spotsLeft} vaga{spotsLeft > 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {vacancy.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {vacancy.workload || "Horário comercial"}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {vacancy.description}
                </p>

                {vacancy.salary_range && (
                  <div className="bg-primary/5 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs font-semibold text-primary">
                      Salário: {vacancy.salary_range}
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => handleApply(vacancy)}
                  disabled={hasApplied || spotsLeft <= 0}
                  size="sm"
                  className="w-full"
                  variant={hasApplied ? "outline" : "default"}
                >
                  {hasApplied ? (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Candidatura enviada
                    </>
                  ) : spotsLeft <= 0 ? (
                    "Vagas preenchidas"
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Candidatar-se
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog de candidatura */}
      <Dialog open={applicationDialogOpen} onOpenChange={setApplicationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Candidatar-se à vaga</DialogTitle>
            <DialogDescription>
              {selectedVacancy?.title} - {selectedVacancy?.company}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitApplication} className="space-y-4">
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(87) 99999-9999"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="cover_letter">Carta de apresentação (opcional)</Label>
              <Textarea
                id="cover_letter"
                name="cover_letter"
                placeholder="Conte um pouco sobre você e por que deseja essa vaga..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setApplicationDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={applyMutation.isPending}
                className="flex-1"
              >
                {applyMutation.isPending ? "Enviando..." : "Enviar candidatura"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
