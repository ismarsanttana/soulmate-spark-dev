import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, Users } from "lucide-react";

export function PushNotifications() {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    link: "",
    targetAudience: {
      geral: true,
      homens: false,
      mulheres: false,
      lgbtqiapn: false,
      idosos: false,
      faixaEtaria: false,
      idadeMin: 15,
      idadeMax: 30,
    },
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: audienceStats } = useQuery({
    queryKey: ["audience-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("gender, birth_date, lgbtqiapn");
      
      if (error) throw error;

      const stats = {
        total: data.length,
        homens: data.filter(p => p.gender === "masculino").length,
        mulheres: data.filter(p => p.gender === "feminino").length,
        lgbtqiapn: data.filter(p => p.lgbtqiapn).length,
        idosos: data.filter(p => {
          if (!p.birth_date) return false;
          const age = new Date().getFullYear() - new Date(p.birth_date).getFullYear();
          return age >= 60;
        }).length,
      };

      return stats;
    },
  });

  const sendNotification = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      // Buscar perfis que correspondem aos filtros
      let query = supabase.from("profiles").select("id, gender, birth_date, lgbtqiapn");

      const filters: string[] = [];
      
      if (!formData.targetAudience.geral) {
        if (formData.targetAudience.homens) {
          filters.push("gender.eq.masculino");
        }
        if (formData.targetAudience.mulheres) {
          filters.push("gender.eq.feminino");
        }
        if (formData.targetAudience.lgbtqiapn) {
          filters.push("lgbtqiapn.eq.true");
        }
      }

      const { data: profiles, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      let targetUsers = profiles || [];

      // Filtrar por idade se necessário
      if (formData.targetAudience.idosos) {
        targetUsers = targetUsers.filter(p => {
          if (!p.birth_date) return false;
          const age = new Date().getFullYear() - new Date(p.birth_date).getFullYear();
          return age >= 60;
        });
      }

      if (formData.targetAudience.faixaEtaria) {
        targetUsers = targetUsers.filter(p => {
          if (!p.birth_date) return false;
          const age = new Date().getFullYear() - new Date(p.birth_date).getFullYear();
          return age >= formData.targetAudience.idadeMin && age <= formData.targetAudience.idadeMax;
        });
      }

      // Filtrar por gênero se não for geral
      if (!formData.targetAudience.geral) {
        if (formData.targetAudience.homens && !formData.targetAudience.mulheres) {
          targetUsers = targetUsers.filter(p => p.gender === "masculino");
        } else if (formData.targetAudience.mulheres && !formData.targetAudience.homens) {
          targetUsers = targetUsers.filter(p => p.gender === "feminino");
        }
      }

      // Criar notificações para cada usuário
      const notifications = targetUsers.map(profile => ({
        user_id: profile.id,
        title: formData.title,
        message: formData.message,
        link: formData.link || null,
        type: "news",
        notification_type: "news",
        sent_by: user.user?.id,
        target_audience: formData.targetAudience,
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;

      return notifications.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({ 
        title: "Notificações enviadas!", 
        description: `${count} usuários receberão a notificação.` 
      });
      setFormData({
        title: "",
        message: "",
        link: "",
        targetAudience: {
          geral: true,
          homens: false,
          mulheres: false,
          lgbtqiapn: false,
          idosos: false,
          faixaEtaria: false,
          idadeMin: 15,
          idadeMax: 30,
        },
      });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao enviar notificações", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.message) {
      toast({ title: "Preencha título e mensagem", variant: "destructive" });
      return;
    }
    sendNotification.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estatísticas de Público
          </CardTitle>
          <CardDescription>Alcance potencial das notificações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold">{audienceStats?.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold">{audienceStats?.homens || 0}</div>
              <div className="text-sm text-muted-foreground">Homens</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold">{audienceStats?.mulheres || 0}</div>
              <div className="text-sm text-muted-foreground">Mulheres</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold">{audienceStats?.lgbtqiapn || 0}</div>
              <div className="text-sm text-muted-foreground">LGBTQIAPN+</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold">{audienceStats?.idosos || 0}</div>
              <div className="text-sm text-muted-foreground">Idosos (60+)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enviar Push Notification</CardTitle>
          <CardDescription>Envie notificações personalizadas para grupos específicos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Input
              placeholder="Título da notificação"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Textarea
              placeholder="Mensagem"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
            />
            <Input
              placeholder="Link (opcional)"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Público Alvo</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="geral"
                  checked={formData.targetAudience.geral}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      targetAudience: { ...formData.targetAudience, geral: checked as boolean },
                    })
                  }
                />
                <Label htmlFor="geral" className="cursor-pointer">Geral (Todos)</Label>
              </div>

              {!formData.targetAudience.geral && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="homens"
                      checked={formData.targetAudience.homens}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          targetAudience: { ...formData.targetAudience, homens: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="homens" className="cursor-pointer">Homens</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mulheres"
                      checked={formData.targetAudience.mulheres}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          targetAudience: { ...formData.targetAudience, mulheres: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="mulheres" className="cursor-pointer">Mulheres</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lgbtqiapn"
                      checked={formData.targetAudience.lgbtqiapn}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          targetAudience: { ...formData.targetAudience, lgbtqiapn: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="lgbtqiapn" className="cursor-pointer">LGBTQIAPN+</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="idosos"
                      checked={formData.targetAudience.idosos}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          targetAudience: { ...formData.targetAudience, idosos: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="idosos" className="cursor-pointer">Idosos (60+ anos)</Label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="faixaEtaria"
                        checked={formData.targetAudience.faixaEtaria}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            targetAudience: { ...formData.targetAudience, faixaEtaria: checked as boolean },
                          })
                        }
                      />
                      <Label htmlFor="faixaEtaria" className="cursor-pointer">Faixa Etária Específica</Label>
                    </div>
                    {formData.targetAudience.faixaEtaria && (
                      <div className="flex gap-4 ml-6">
                        <Input
                          type="number"
                          placeholder="Idade mínima"
                          value={formData.targetAudience.idadeMin}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              targetAudience: {
                                ...formData.targetAudience,
                                idadeMin: parseInt(e.target.value),
                              },
                            })
                          }
                          className="w-32"
                        />
                        <Input
                          type="number"
                          placeholder="Idade máxima"
                          value={formData.targetAudience.idadeMax}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              targetAudience: {
                                ...formData.targetAudience,
                                idadeMax: parseInt(e.target.value),
                              },
                            })
                          }
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" size="lg">
            <Send className="h-4 w-4 mr-2" />
            Enviar Notificação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
