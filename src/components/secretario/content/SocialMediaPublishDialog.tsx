import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { useSocialMedia } from "@/hooks/useSocialMedia";
import { formatForAllPlatforms, getMaxLength } from "@/lib/socialMediaFormatters";
import { Facebook, Instagram, Twitter, Linkedin, Send, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { ptBR } from "date-fns/locale";

interface SocialMediaPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: string;
  contentId: string;
  contentData: any;
  secretariaSlug: string;
}

const platformConfig = {
  facebook: { name: "Facebook", icon: Facebook, color: "#1877F2" },
  instagram: { name: "Instagram", icon: Instagram, color: "#E4405F" },
  twitter: { name: "Twitter / X", icon: Twitter, color: "#1DA1F2" },
  linkedin: { name: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
};

export function SocialMediaPublishDialog({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentData,
  secretariaSlug,
}: SocialMediaPublishDialogProps) {
  const { connectedAccounts, publishToSocial, isPublishing } = useSocialMedia(secretariaSlug);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState<string>("12:00");

  // Gerar textos formatados automaticamente
  useEffect(() => {
    if (open && contentData) {
      const formatted = formatForAllPlatforms(contentData);
      setCustomTexts(formatted);
      
      // Selecionar automaticamente plataformas com auto-publish
      const autoPlatforms = connectedAccounts
        ?.filter((acc) => acc.auto_publish)
        .map((acc) => acc.platform) || [];
      setSelectedPlatforms(autoPlatforms);
    }
  }, [open, contentData, connectedAccounts]);

  const handlePublish = () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Selecione pelo menos uma rede social");
      return;
    }

    let scheduledDateTime: Date | undefined;
    if (scheduleDate) {
      const [hours, minutes] = scheduleTime.split(":").map(Number);
      scheduledDateTime = new Date(scheduleDate);
      scheduledDateTime.setHours(hours, minutes);
      
      if (scheduledDateTime < new Date()) {
        toast.error("A data/hora agendada deve ser no futuro");
        return;
      }
    }

    publishToSocial({
      contentType,
      contentId,
      platforms: selectedPlatforms,
      customTexts,
      scheduleAt: scheduledDateTime,
    });

    onOpenChange(false);
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const availablePlatforms = connectedAccounts?.filter((acc) => acc.is_active) || [];

  if (!availablePlatforms.length) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nenhuma Rede Social Conectada</DialogTitle>
            <DialogDescription>
              Você precisa conectar pelo menos uma rede social antes de publicar.
              Acesse a aba "Redes Sociais" para conectar suas contas.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publicar nas Redes Sociais</DialogTitle>
          <DialogDescription>
            Selecione as redes e personalize o conteúdo para cada plataforma
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="platforms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="platforms">Plataformas</TabsTrigger>
            <TabsTrigger value="schedule">Agendar</TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="space-y-4">
            <div className="grid gap-4">
              {availablePlatforms.map((account) => {
                const config = platformConfig[account.platform as keyof typeof platformConfig];
                const Icon = config.icon;
                const isSelected = selectedPlatforms.includes(account.platform);
                const currentText = customTexts[account.platform] || "";
                const maxLength = getMaxLength(account.platform);
                const remaining = maxLength - currentText.length;

                return (
                  <div
                    key={account.id}
                    className={`border rounded-lg p-4 space-y-3 transition-all ${
                      isSelected ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={account.platform}
                          checked={isSelected}
                          onCheckedChange={() => togglePlatform(account.platform)}
                        />
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <Icon style={{ color: config.color }} className="h-5 w-5" />
                        </div>
                        <div>
                          <Label htmlFor={account.platform} className="text-base font-semibold cursor-pointer">
                            {config.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">{account.account_name}</p>
                        </div>
                      </div>
                      {account.auto_publish && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Auto-publicação
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Texto personalizado</Label>
                          <span
                            className={`text-xs ${
                              remaining < 50 ? "text-destructive" : "text-muted-foreground"
                            }`}
                          >
                            {remaining} caracteres restantes
                          </span>
                        </div>
                        <Textarea
                          value={currentText}
                          onChange={(e) =>
                            setCustomTexts((prev) => ({
                              ...prev,
                              [account.platform]: e.target.value,
                            }))
                          }
                          placeholder={`Digite o texto para ${config.name}...`}
                          rows={4}
                          maxLength={maxLength}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Data de publicação</Label>
                <Calendar
                  mode="single"
                  selected={scheduleDate}
                  onSelect={setScheduleDate}
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>
              {scheduleDate && (
                <div>
                  <Label htmlFor="schedule-time" className="mb-2 block">
                    Horário
                  </Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {scheduleDate
                  ? `A publicação será agendada para ${scheduleDate.toLocaleDateString("pt-BR")} às ${scheduleTime}`
                  : "Selecione uma data para agendar a publicação"}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || selectedPlatforms.length === 0}
          >
            {isPublishing ? (
              "Publicando..."
            ) : scheduleDate ? (
              <>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Agendar Publicação
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Publicar Agora
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}