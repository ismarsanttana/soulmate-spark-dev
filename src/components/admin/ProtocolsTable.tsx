import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare } from "lucide-react";

interface Protocol {
  id: string;
  protocol_number: string;
  full_name: string;
  category: string;
  manifestation_type: string;
  status: string;
  description: string;
  response: string | null;
  created_at: string;
}

interface ProtocolsTableProps {
  protocols: Protocol[];
  queryKey: string[];
}

export function ProtocolsTable({ protocols, queryKey }: ProtocolsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("aberto");

  const updateProtocol = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("ombudsman_protocols")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Sucesso!",
        description: "Protocolo atualizado com sucesso.",
      });
      setSelectedProtocol(null);
      setResponse("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar protocolo.",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setResponse(protocol.response || "");
    setStatus(protocol.status);
  };

  const handleSave = () => {
    if (!selectedProtocol) return;

    updateProtocol.mutate({
      id: selectedProtocol.id,
      data: {
        response,
        status,
        updated_at: new Date().toISOString(),
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      aberto: { variant: "default", label: "Aberto" },
      em_andamento: { variant: "secondary", label: "Em Andamento" },
      encerrado: { variant: "outline", label: "Encerrado" },
    };

    const config = variants[status] || variants.aberto;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Protocolo</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {protocols.map((protocol) => (
            <TableRow key={protocol.id}>
              <TableCell className="font-mono text-sm">{protocol.protocol_number}</TableCell>
              <TableCell>{protocol.full_name}</TableCell>
              <TableCell className="capitalize">{protocol.manifestation_type}</TableCell>
              <TableCell>{getStatusBadge(protocol.status)}</TableCell>
              <TableCell>{new Date(protocol.created_at).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDialog(protocol)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Responder
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selectedProtocol} onOpenChange={() => setSelectedProtocol(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Protocolo {selectedProtocol?.protocol_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Descrição</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedProtocol?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="response">Resposta</Label>
              <Textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Digite sua resposta..."
                rows={6}
              />
            </div>

            <Button onClick={handleSave} className="w-full" disabled={updateProtocol.isPending}>
              {updateProtocol.isPending ? "Salvando..." : "Salvar Resposta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
