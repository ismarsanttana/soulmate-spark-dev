import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface SchoolSelectorProps {
  value: string | null;
  onValueChange: (value: string) => void;
  label?: string;
}

export default function SchoolSelector({ value, onValueChange, label = "Selecione uma escola" }: SchoolSelectorProps) {
  const { data: schools, isLoading } = useQuery({
    queryKey: ["schools-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("id, nome_escola, codigo_inep")
        .order("nome_escola", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!schools || schools.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted">
          Nenhuma escola cadastrada. Importe escolas pela aba "Censo Escolar" primeiro.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value || undefined} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione uma escola..." />
        </SelectTrigger>
        <SelectContent>
          {schools.map((school) => (
            <SelectItem key={school.id} value={school.id}>
              {school.nome_escola} - INEP: {school.codigo_inep}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
