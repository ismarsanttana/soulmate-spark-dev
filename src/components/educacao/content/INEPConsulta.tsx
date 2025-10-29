import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Database, Search, Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface INEPConsultaProps {
  secretariaSlug: string;
}

interface School {
  id: string;
  codigo_inep: string;
  nome_escola: string;
  municipio: string;
  uf: string;
  created_at: string;
}

export const INEPConsulta = ({ secretariaSlug }: INEPConsultaProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Buscar escolas cadastradas
  const { data: schools, isLoading: loadingSchools } = useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("nome_escola");
      
      if (error) throw error;
      return data as School[];
    },
  });

  // Buscar dados IDEB
  const { data: idebData, isLoading: loadingIdeb } = useQuery({
    queryKey: ["ideb", selectedSchool],
    queryFn: async () => {
      if (!selectedSchool) return null;
      
      const { data, error } = await supabase.functions.invoke('inep-api', {
        body: { action: 'get-ideb', codigo_inep: selectedSchool }
      });
      
      if (error) throw error;
      return data?.data;
    },
    enabled: !!selectedSchool,
  });

  // Buscar escola por código INEP
  const searchSchoolMutation = useMutation({
    mutationFn: async (codigoInep: string) => {
      const { data, error } = await supabase.functions.invoke('inep-api', {
        body: { action: 'search-school', codigo_inep: codigoInep }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.cached ? "Dados carregados do cache" : "Escola encontrada no INEP");
    },
    onError: (error: any) => {
      toast.error("Erro ao buscar escola: " + error.message);
    },
  });

  // Importar escola
  const importSchoolMutation = useMutation({
    mutationFn: async (schoolData: any) => {
      const { data, error } = await supabase.functions.invoke('inep-api', {
        body: { 
          action: 'import-school',
          ...schoolData
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Escola importada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao importar escola: " + error.message);
    },
  });

  // Validação Educacenso
  const { data: validation } = useQuery({
    queryKey: ["educacenso-validation"],
    queryFn: async () => {
      // Buscar alunos sem raça/cor
      const { data: studentsWithoutRace } = await supabase
        .from("students")
        .select("id, full_name")
        .is("raca_cor", null)
        .limit(10);

      // Buscar turmas sem escola
      const { data: classesWithoutSchool } = await supabase
        .from("school_classes")
        .select("id, class_name")
        .is("school_id", null)
        .eq("status", "active")
        .limit(10);

      return {
        studentsWithoutRace: studentsWithoutRace || [],
        classesWithoutSchool: classesWithoutSchool || [],
      };
    },
  });

  const handleSearch = () => {
    if (searchTerm.length >= 8) {
      searchSchoolMutation.mutate(searchTerm);
    } else {
      toast.error("Digite um código INEP válido (mínimo 8 dígitos)");
    }
  };

  const handleImport = (schoolData: any) => {
    importSchoolMutation.mutate(schoolData);
  };

  return (
    <div className="space-y-4">
      <div className="ascom-page-header">
        <div>
          <h1 className="ascom-page-title">Integração INEP</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consulte dados do INEP e valide informações do Educacenso
          </p>
        </div>
      </div>

      <Tabs defaultValue="consulta" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consulta">
            <Search className="h-4 w-4 mr-2" />
            Consulta
          </TabsTrigger>
          <TabsTrigger value="escolas">
            <Database className="h-4 w-4 mr-2" />
            Minhas Escolas
          </TabsTrigger>
          <TabsTrigger value="ideb">
            <RefreshCw className="h-4 w-4 mr-2" />
            Dados IDEB
          </TabsTrigger>
          <TabsTrigger value="validacao">
            <CheckCircle className="h-4 w-4 mr-2" />
            Validação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consulta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Escola por Código INEP</CardTitle>
              <CardDescription>
                Digite o código INEP da escola para buscar informações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: 26000001"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch}
                  disabled={searchSchoolMutation.isPending}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>

              {searchSchoolMutation.data && (
                <Card className="border-primary/20">
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Código INEP</p>
                        <p className="font-medium">{searchSchoolMutation.data.data.codigo_inep}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Nome da Escola</p>
                        <p className="font-medium">{searchSchoolMutation.data.data.nome_escola}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Município</p>
                        <p className="font-medium">{searchSchoolMutation.data.data.municipio}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">UF</p>
                        <p className="font-medium">{searchSchoolMutation.data.data.uf}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleImport(searchSchoolMutation.data.data)}
                      disabled={importSchoolMutation.isPending}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Importar Escola
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escolas">
          <Card>
            <CardHeader>
              <CardTitle>Escolas Cadastradas</CardTitle>
              <CardDescription>
                Lista de escolas importadas do sistema INEP
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSchools ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : schools && schools.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código INEP</TableHead>
                      <TableHead>Nome da Escola</TableHead>
                      <TableHead>Município</TableHead>
                      <TableHead>UF</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-mono">{school.codigo_inep}</TableCell>
                        <TableCell>{school.nome_escola}</TableCell>
                        <TableCell>{school.municipio}</TableCell>
                        <TableCell>{school.uf}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedSchool(school.codigo_inep)}
                          >
                            Ver IDEB
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhuma escola cadastrada ainda
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ideb">
          <Card>
            <CardHeader>
              <CardTitle>Histórico IDEB</CardTitle>
              <CardDescription>
                Dados do Índice de Desenvolvimento da Educação Básica
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedSchool ? (
                <p className="text-center py-8 text-muted-foreground">
                  Selecione uma escola na aba "Minhas Escolas" para ver os dados do IDEB
                </p>
              ) : loadingIdeb ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : idebData ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Anos Iniciais (1º ao 5º ano)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={idebData.anos_iniciais}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ano" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="nota" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Anos Finais (6º ao 9º ano)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={idebData.anos_finais}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ano" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="nota" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Dados do IDEB não disponíveis
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validacao">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Validação Educacenso</CardTitle>
                <CardDescription>
                  Verificação de campos obrigatórios para o Censo Escolar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Alunos sem Raça/Cor declarada</h3>
                    <Badge variant={validation?.studentsWithoutRace?.length ? "destructive" : "default"}>
                      {validation?.studentsWithoutRace?.length || 0} pendências
                    </Badge>
                  </div>
                  {validation?.studentsWithoutRace && validation.studentsWithoutRace.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Campo obrigatório para o Educacenso
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Turmas sem escola vinculada</h3>
                    <Badge variant={validation?.classesWithoutSchool?.length ? "destructive" : "default"}>
                      {validation?.classesWithoutSchool?.length || 0} pendências
                    </Badge>
                  </div>
                  {validation?.classesWithoutSchool && validation.classesWithoutSchool.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Vincule as turmas às escolas cadastradas
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
