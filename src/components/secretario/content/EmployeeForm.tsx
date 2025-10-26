import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/admin/FileUpload";
import { FacialCaptureTab } from "@/components/educacao/content/FacialCaptureTab";
import { Search } from "lucide-react";

const FUNCOES = [
  { category: "Liderança e planejamento", options: [
    "Secretário(a) de Comunicação",
    "Secretário(a) Adjunto(a) / Chefe de Gabinete",
    "Diretor(a) de Comunicação / Planejamento",
    "Coordenador(a) de Imprensa",
    "Coordenador(a) de Comunicação Digital / Redes",
    "Coordenador(a) de Publicidade & Mídia",
    "Coordenador(a) de Comunicação Interna / Endomarketing",
    "Gestor(a) de Crise / Porta-voz técnico"
  ]},
  { category: "Imprensa & RP", options: [
    "Jornalista / Assessor(a) de Imprensa",
    "Repórter / Pauteiro(a)",
    "Relações Públicas",
    "Media Trainer (prepara autoridades para a imprensa)",
    "Analista de Clipping / Monitoramento de Mídia"
  ]},
  { category: "Conteúdo & Editorial", options: [
    "Redator(a) / Copywriter / Roteirista",
    "Revisor(a) / Editor(a) de Texto",
    "Speechwriter (discursos)",
    "UX Writer / Editor(a) de Intranet / Boletins"
  ]},
  { category: "Digital & Redes Sociais", options: [
    "Social Media Manager / Community Manager",
    "Gestor(a) de Tráfego (mídia paga)",
    "Analista de SEO / Conteúdo Web",
    "E-mail Marketing / CRM",
    "Gestor(a) de Influenciadores",
    "Analista de Social Listening / Reputação"
  ]},
  { category: "Design & Marca", options: [
    "Designer Gráfico / Diretor(a) de Arte",
    "Ilustrador(a) / Diagramador(a)",
    "Motion Designer"
  ]},
  { category: "Audiovisual (foto, vídeo, som)", options: [
    "Fotógrafo(a) / Editor(a) de Imagem",
    "Videomaker / Cinegrafista / Editor(a) de Vídeo",
    "Operador(a) de Live Streaming",
    "Técnico(a) de Som / Sonoplasta",
    "Iluminador(a)",
    "Piloto(a) de Drone (captação aérea)"
  ]},
  { category: "Rádio, TV, eventos e voz", options: [
    "Locutor(a) / Apresentador(a) / Mestre de Cerimônias",
    "Produtor(a) de Estúdio / Rádio / Podcast",
    "Operador(a) de Áudio / Rádio"
  ]},
  { category: "Web & Tecnologia", options: [
    "Webdesigner / Desenvolvedor(a) Web",
    "Webmaster / Admin de CMS (ex.: WordPress)",
    "Analista de Web Analytics / BI de Comunicação",
    "MarTech Specialist (ferramentas e automações)"
  ]},
  { category: "Acessibilidade & Inclusão", options: [
    "Intérprete de Libras",
    "Legendista / Closed Caption",
    "Audiodescritor(a)"
  ]},
  { category: "Ouvidoria & Atendimento", options: [
    "Ouvidor(a) / SAC 2.0",
    "Atendente Omnichannel (WhatsApp, Telegram, site, redes)"
  ]},
  { category: "Administrativo, compras e jurídico", options: [
    "Analista de Licitações / Publicidade Legal",
    "Gestor(a) de Contratos e Parcerias",
    "Assessor(a) Jurídico (imagem, direitos autorais, compliance)",
    "Controladoria/Prestação de Contas da Comunicação"
  ]}
];

const employeeSchema = z.object({
  matricula: z.string().min(1, "Matrícula é obrigatória"),
  full_name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF inválido"),
  funcao: z.string().min(1, "Função é obrigatória"),
  birth_date: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  regime_juridico: z.string().optional(),
  cargo: z.string().optional(),
  area: z.string().optional(),
  chefe_imediato: z.string().optional(),
  lotacao: z.string().optional(),
  jornada: z.string().optional(),
  ato_nomeacao_numero: z.string().optional(),
  ato_nomeacao_data: z.string().optional(),
  data_exercicio: z.string().optional(),
  situacao: z.string().default("ativo"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  secretariaSlug: string;
  employee?: any;
  onSuccess: () => void;
}

export function EmployeeForm({ secretariaSlug, employee, onSuccess }: EmployeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [equipamentos, setEquipamentos] = useState<string[]>(employee?.equipamentos || []);
  const [termoLgpd, setTermoLgpd] = useState(employee?.termo_lgpd_assinado || false);
  const [termoResp, setTermoResp] = useState(employee?.termo_responsabilidade_assinado || false);
  const [atoArquivo, setAtoArquivo] = useState(employee?.ato_nomeacao_arquivo_url || "");
  const [lgpdArquivo, setLgpdArquivo] = useState(employee?.termo_lgpd_arquivo_url || "");
  const [respArquivo, setRespArquivo] = useState(employee?.termo_responsabilidade_arquivo_url || "");
  const [facialPhotos, setFacialPhotos] = useState<any[]>(employee?.facial_photos || []);
  const [facialConsent, setFacialConsent] = useState(employee?.autorizacao_reconhecimento_facial || false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee ? {
      ...employee,
      birth_date: employee.birth_date || "",
      email: employee.email || "",
      ato_nomeacao_data: employee.ato_nomeacao_data || "",
      data_exercicio: employee.data_exercicio || "",
    } : {
      situacao: "ativo",
    },
  });

  const handleSearchUser = async () => {
    const cpf = watch("cpf");
    
    if (!cpf || cpf.length < 11) {
      toast.error("Digite um CPF válido para buscar");
      return;
    }

    setIsSearching(true);
    
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("cpf", cpf)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          toast.error("Nenhum usuário encontrado com este CPF");
        } else {
          throw error;
        }
        return;
      }

      if (profile) {
        // Auto-preencher campos com os dados do perfil
        setValue("full_name", profile.full_name);
        if (profile.email) setValue("email", profile.email);
        if (profile.telefone) setValue("phone", profile.telefone);
        if (profile.endereco_completo) setValue("address", profile.endereco_completo);
        if (profile.birth_date) setValue("birth_date", profile.birth_date);
        
        toast.success("Dados do usuário carregados com sucesso!");
      }
    } catch (error: any) {
      console.error("Error searching user:", error);
      toast.error("Erro ao buscar usuário");
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const employeeData: any = {
        matricula: data.matricula,
        full_name: data.full_name,
        cpf: data.cpf,
        funcao: data.funcao,
        secretaria_slug: secretariaSlug,
        equipamentos,
        termo_lgpd_assinado: termoLgpd,
        termo_lgpd_arquivo_url: lgpdArquivo || null,
        termo_responsabilidade_assinado: termoResp,
        termo_responsabilidade_arquivo_url: respArquivo || null,
        ato_nomeacao_arquivo_url: atoArquivo || null,
        birth_date: data.birth_date || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        regime_juridico: data.regime_juridico || null,
        cargo: data.cargo || null,
        area: data.area || null,
        chefe_imediato: data.chefe_imediato || null,
        lotacao: data.lotacao || null,
        jornada: data.jornada || null,
        ato_nomeacao_numero: data.ato_nomeacao_numero || null,
        ato_nomeacao_data: data.ato_nomeacao_data || null,
        data_exercicio: data.data_exercicio || null,
        situacao: data.situacao,
        created_by: user?.id,
        facial_photos: facialPhotos,
        autorizacao_reconhecimento_facial: facialConsent,
      };

      if (employee) {
        const { error } = await supabase
          .from("secretaria_employees")
          .update(employeeData)
          .eq("id", employee.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("secretaria_employees")
          .insert([employeeData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving employee:", error);
      toast.error(error.message || "Erro ao salvar funcionário");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="pessoais" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="funcionais">Dados Funcionais</TabsTrigger>
          <TabsTrigger value="nomeacao">Nomeação/Contrato</TabsTrigger>
          <TabsTrigger value="equipamentos">Equipamentos/Termos</TabsTrigger>
          <TabsTrigger value="facial">Reconhecimento Facial</TabsTrigger>
        </TabsList>

        <TabsContent value="pessoais" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="matricula">Matrícula *</Label>
              <Input id="matricula" {...register("matricula")} />
              {errors.matricula && (
                <p className="text-sm text-destructive">{errors.matricula.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <div className="flex gap-2">
                <Input id="cpf" {...register("cpf")} placeholder="Digite o CPF" />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSearchUser}
                  disabled={isSearching}
                  className="shrink-0"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? "Buscando..." : "Buscar"}
                </Button>
              </div>
              {errors.cpf && (
                <p className="text-sm text-destructive">{errors.cpf.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input id="full_name" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="funcao">Função *</Label>
            <Select onValueChange={(value) => setValue("funcao", value)} defaultValue={watch("funcao")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                {FUNCOES.map((cat) => (
                  <div key={cat.category}>
                    <div className="px-2 py-1.5 text-sm font-semibold">{cat.category}</div>
                    {cat.options.map((func) => (
                      <SelectItem key={func} value={func}>
                        {func}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {errors.funcao && (
              <p className="text-sm text-destructive">{errors.funcao.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input id="birth_date" type="date" {...register("birth_date")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea id="address" {...register("address")} />
          </div>
        </TabsContent>

        <TabsContent value="funcionais" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regime_juridico">Regime Jurídico</Label>
              <Input id="regime_juridico" {...register("regime_juridico")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" {...register("cargo")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area">Área</Label>
              <Input id="area" {...register("area")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lotacao">Lotação</Label>
              <Input id="lotacao" {...register("lotacao")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chefe_imediato">Chefe Imediato</Label>
              <Input id="chefe_imediato" {...register("chefe_imediato")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jornada">Jornada</Label>
              <Input id="jornada" placeholder="Ex: 40h semanais" {...register("jornada")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="situacao">Situação</Label>
            <Select onValueChange={(value) => setValue("situacao", value)} defaultValue={watch("situacao")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="afastado">Afastado</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="nomeacao" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ato_nomeacao_numero">Número do Ato</Label>
              <Input id="ato_nomeacao_numero" {...register("ato_nomeacao_numero")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ato_nomeacao_data">Data do Ato</Label>
              <Input id="ato_nomeacao_data" type="date" {...register("ato_nomeacao_data")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Arquivo do Ato de Nomeação/Contrato</Label>
            <FileUpload
              bucket="app-assets"
              path="employee-documents"
              onUploadComplete={(url) => setAtoArquivo(url)}
              currentUrl={atoArquivo}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_exercicio">Data de Exercício</Label>
            <Input id="data_exercicio" type="date" {...register("data_exercicio")} />
          </div>
        </TabsContent>

        <TabsContent value="equipamentos" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Equipamentos Entregues</Label>
            <Textarea
              placeholder="Liste os equipamentos (um por linha)"
              value={equipamentos.join("\n")}
              onChange={(e) => setEquipamentos(e.target.value.split("\n").filter(Boolean))}
              rows={5}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="termo_lgpd"
                checked={termoLgpd}
                onCheckedChange={(checked) => setTermoLgpd(checked as boolean)}
              />
              <Label htmlFor="termo_lgpd">Termo LGPD assinado</Label>
            </div>

            {termoLgpd && (
              <div className="ml-6 space-y-2">
                <Label>Arquivo do Termo LGPD</Label>
                <FileUpload
                  bucket="app-assets"
                  path="employee-documents"
                  onUploadComplete={(url) => setLgpdArquivo(url)}
                  currentUrl={lgpdArquivo}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="termo_resp"
                checked={termoResp}
                onCheckedChange={(checked) => setTermoResp(checked as boolean)}
              />
              <Label htmlFor="termo_resp">Termo de Responsabilidade assinado</Label>
            </div>

            {termoResp && (
              <div className="ml-6 space-y-2">
                <Label>Arquivo do Termo de Responsabilidade</Label>
                <FileUpload
                  bucket="app-assets"
                  path="employee-documents"
                  onUploadComplete={(url) => setRespArquivo(url)}
                  currentUrl={respArquivo}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="facial" className="space-y-4 mt-4">
          <FacialCaptureTab
            onPhotosCapture={setFacialPhotos}
            consent={facialConsent}
            onConsentChange={setFacialConsent}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : employee ? "Atualizar" : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}
