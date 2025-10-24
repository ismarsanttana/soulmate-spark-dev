import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateTimeclockPDF } from "@/lib/pdfGenerator";

interface ReportRequest {
  id: string;
  employee_id: string;
  requested_by: string;
  report_type: string;
  report_period: string;
  full_data_requested: boolean;
  status: string;
  created_at: string;
  secretaria_employees: {
    full_name: string;
    cpf: string;
    matricula: string;
    funcao: string;
  };
  profiles: {
    full_name: string;
  };
}

export default function ReportRequestsManagement() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ReportRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-report-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_requests")
        .select(`
          *,
          secretaria_employees (
            full_name,
            cpf,
            matricula,
            funcao
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Buscar informações dos solicitantes
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", request.requested_by)
            .single();
          
          return {
            ...request,
            profiles: profile || { full_name: "Usuário desconhecido" },
          };
        })
      );

      return requestsWithProfiles as ReportRequest[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("report_requests")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-report-requests"] });
      toast.success("Solicitação de relatório aprovada!");
    },
    onError: (error) => {
      console.error("Erro ao aprovar solicitação:", error);
      toast.error("Erro ao aprovar solicitação");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("report_requests")
        .update({
          status: "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-report-requests"] });
      toast.success("Solicitação de relatório rejeitada");
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedRequest(null);
    },
    onError: (error) => {
      console.error("Erro ao rejeitar solicitação:", error);
      toast.error("Erro ao rejeitar solicitação");
    },
  });

  const handleApprove = (request: ReportRequest) => {
    approveMutation.mutate(request.id);
  };

  const handleRejectClick = (request: ReportRequest) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      toast.error("Digite um motivo para a rejeição");
      return;
    }
    rejectMutation.mutate({
      requestId: selectedRequest.id,
      reason: rejectionReason,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Negado
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Aprovação de Relatórios</h2>
        <p className="text-muted-foreground">
          Gerencie solicitações de relatórios com dados completos
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Solicitante</TableHead>
            <TableHead>Funcionário</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data da Solicitação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests?.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">
                {request.profiles.full_name}
              </TableCell>
              <TableCell>
                {request.secretaria_employees.full_name}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Ponto Eletrônico
                </div>
              </TableCell>
              <TableCell>{request.report_period}</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell>
                {format(new Date(request.created_at), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {request.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(request)}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectClick(request)}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Negar
                    </Button>
                  </>
                )}
                {request.status !== "pending" && (
                  <span className="text-sm text-muted-foreground">
                    Processado
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!requests?.length && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhuma solicitação de relatório
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação de Relatório</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição desta solicitação. O secretário receberá
              esta justificativa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Motivo da Rejeição</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Digite o motivo da rejeição..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason("");
                setSelectedRequest(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim()}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
