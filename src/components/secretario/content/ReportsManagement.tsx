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
import { Download, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { generateTimeclockPDF } from "@/lib/pdfGenerator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReportRequest {
  id: string;
  employee_id: string;
  report_type: string;
  report_period: string;
  full_data_requested: boolean;
  status: string;
  created_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
  report_data: any;
  secretaria_employees: {
    full_name: string;
    cpf: string;
    matricula: string;
    funcao: string;
  };
}

export default function ReportsManagement() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<ReportRequest | null>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["report-requests"],
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
      return data as ReportRequest[];
    },
  });

  const handleDownload = async (report: ReportRequest) => {
    if (report.status !== "approved") {
      toast.error("Relatório ainda não foi aprovado");
      return;
    }

    try {
      const [month, year] = report.report_period.split("/");
      
      // Buscar registros de ponto do funcionário
      const { data: timeclockRecords, error } = await supabase
        .from("employee_timeclock")
        .select("*")
        .eq("employee_id", report.employee_id)
        .gte(
          "clock_in",
          new Date(parseInt(year), parseInt(month) - 1, 1).toISOString()
        )
        .lt(
          "clock_in",
          new Date(parseInt(year), parseInt(month), 1).toISOString()
        )
        .order("clock_in", { ascending: true });

      if (error) throw error;

      // Calcular total de horas
      let totalMinutes = 0;
      timeclockRecords?.forEach((record) => {
        if (record.clock_out) {
          const diff =
            new Date(record.clock_out).getTime() -
            new Date(record.clock_in).getTime();
          totalMinutes += Math.floor(diff / (1000 * 60));
        }
      });

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const totalHours = `${hours}h${minutes.toString().padStart(2, "0")}m`;

      await generateTimeclockPDF({
        employee: {
          full_name: report.secretaria_employees.full_name,
          cpf: report.secretaria_employees.cpf,
          funcao: report.secretaria_employees.funcao,
          matricula: report.secretaria_employees.matricula,
        },
        month,
        year,
        records: timeclockRecords || [],
        totalHours,
        generatedBy: "Sistema",
        maskSensitiveData: !report.full_data_requested,
      });

      toast.success("Relatório baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar relatório");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Aguardando Aprovação
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
        <h2 className="text-2xl font-bold">Relatórios</h2>
        <p className="text-muted-foreground">
          Gerencie suas solicitações de relatórios
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Funcionário</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Dados Completos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Solicitado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports?.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="font-medium">
                {report.secretaria_employees.full_name}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Ponto Eletrônico
                </div>
              </TableCell>
              <TableCell>{report.report_period}</TableCell>
              <TableCell>
                {report.full_data_requested ? (
                  <Badge variant="outline">Sim</Badge>
                ) : (
                  <Badge variant="secondary">Não</Badge>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(report.status)}</TableCell>
              <TableCell>
                {format(new Date(report.created_at), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {report.status === "approved" && (
                  <Button
                    size="sm"
                    onClick={() => handleDownload(report)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                )}
                {report.status === "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedReport(report)}
                  >
                    Ver Motivo
                  </Button>
                )}
                {report.status === "pending" && (
                  <Button size="sm" variant="outline" disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    Aguardando
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!reports?.length && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhum relatório solicitado ainda
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo da Negação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedReport?.rejection_reason}
            </p>
            {selectedReport?.approved_at && (
              <p className="text-xs text-muted-foreground">
                Respondido em:{" "}
                {format(new Date(selectedReport.approved_at), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
