import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

interface EmployeeAbsenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string | null;
  employeeName: string;
}

export function EmployeeAbsenceDialog({ 
  open, 
  onOpenChange, 
  employeeId, 
  employeeName 
}: EmployeeAbsenceDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    absence_date: new Date().toISOString().split("T")[0],
    absence_type: "falta",
    justification: "",
    attachment_url: "",
    is_justified: false,
  });
  const [uploading, setUploading] = useState(false);

  const createAbsenceMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("employee_absences").insert({
        ...data,
        employee_id: employeeId,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-absences-today"] });
      queryClient.invalidateQueries({ queryKey: ["employees-for-attendance"] });
      toast({ title: "Falta registrada com sucesso!" });
      handleClose();
    },
    onError: () => {
      toast({ title: "Erro ao registrar falta", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAbsenceMutation.mutate(formData);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `employee-absences/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('app-assets')
        .getPublicUrl(filePath);

      setFormData({ ...formData, attachment_url: publicUrl });
      toast({ title: "Arquivo anexado com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao fazer upload do arquivo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      absence_date: new Date().toISOString().split("T")[0],
      absence_type: "falta",
      justification: "",
      attachment_url: "",
      is_justified: false,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Falta/Justificativa</DialogTitle>
          <DialogDescription>
            Funcionário: <span className="font-semibold">{employeeName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="absence_date">Data da Falta *</Label>
              <Input
                id="absence_date"
                type="date"
                value={formData.absence_date}
                onChange={(e) => setFormData({ ...formData, absence_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="absence_type">Tipo *</Label>
              <Select
                value={formData.absence_type}
                onValueChange={(value) => setFormData({ ...formData, absence_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="falta">Falta</SelectItem>
                  <SelectItem value="ferias">Férias</SelectItem>
                  <SelectItem value="atestado">Atestado Médico</SelectItem>
                  <SelectItem value="licenca">Licença</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Justificativa/Motivo</Label>
            <Textarea
              id="justification"
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              placeholder="Descreva o motivo da ausência..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment">Anexar Atestado/Documento</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachment"
                type="file"
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                disabled={uploading}
              />
              {formData.attachment_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(formData.attachment_url, "_blank")}
                >
                  Ver Arquivo
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_justified"
              checked={formData.is_justified}
              onChange={(e) => setFormData({ ...formData, is_justified: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_justified" className="cursor-pointer">
              Falta justificada
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAbsenceMutation.isPending || uploading}>
              {uploading ? "Enviando arquivo..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}