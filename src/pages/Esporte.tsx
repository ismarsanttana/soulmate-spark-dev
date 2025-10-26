import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, MapPin, Clock, Calendar } from "lucide-react";
import esporte1 from "@/assets/esporte-1.jpg";
import esporte2 from "@/assets/esporte-2.jpg";
import esporte3 from "@/assets/esporte-3.jpg";
import esporte4 from "@/assets/esporte-4.jpg";
import esporte5 from "@/assets/esporte-5.jpg";
import esporte6 from "@/assets/esporte-6.jpg";
import esporte7 from "@/assets/esporte-7.jpg";
import esporte8 from "@/assets/esporte-8.jpg";

const Esporte = () => {
  const acoes = [
    {
      titulo: "Campeonato Rural de Futebol 2025",
      descricao: "Maior evento esportivo rural do município",
      status: "Em andamento",
      icone: "fa-trophy"
    },
    {
      titulo: "Escolinha de Futebol",
      descricao: "Programa de iniciação esportiva para crianças e adolescentes",
      status: "Inscrições abertas",
      icone: "fa-child"
    },
    {
      titulo: "Torneio de Futsal",
      descricao: "Campeonato municipal de futsal categorias livre e feminina",
      status: "Próxima edição",
      icone: "fa-futbol"
    },
    {
      titulo: "Programa Esporte na Comunidade",
      descricao: "Atividades esportivas em bairros e comunidades rurais",
      status: "Ativo",
      icone: "fa-users"
    }
  ];

  const galeriaFotos = [
    { src: esporte1, alt: "Evento esportivo - Cerimônia de abertura" },
    { src: esporte2, alt: "Equipe campeã com familiares" },
    { src: esporte3, alt: "Partida de futebol em andamento" },
    { src: esporte4, alt: "Medalhas e troféus do campeonato" },
    { src: esporte5, alt: "Premiação do campeonato" },
    { src: esporte6, alt: "Torcida e apoiadores" },
    { src: esporte7, alt: "Entrega de prêmios" },
    { src: esporte8, alt: "Comemoração da equipe vencedora" }
  ];

  const campeonatos = [
    {
      nome: "Campeonato Rural de Futebol",
      categoria: "Livre",
      periodo: "Junho a Agosto 2025",
      status: "Inscrições em breve"
    },
    {
      nome: "Copa Afogadense de Futsal",
      categoria: "Masculino e Feminino",
      periodo: "Março a Maio 2025",
      status: "Planejamento"
    },
    {
      nome: "Torneio Interdistrital",
      categoria: "Livre",
      periodo: "Setembro 2025",
      status: "Aguardando"
    }
  ];

  const locais = [
    {
      nome: "Estádio Municipal Lourival José da Silva",
      tipo: "Campo de Futebol",
      endereco: "Centro, Afogados da Ingazeira",
      horario: "Segunda a Domingo: 6h às 22h",
      contato: "(87) 3838-xxxx"
    },
    {
      nome: "Ginásio Poliesportivo",
      tipo: "Quadra Coberta",
      endereco: "Rua das Flores, Centro",
      horario: "Segunda a Sexta: 8h às 21h | Sábado: 8h às 17h",
      contato: "(87) 3838-xxxx"
    },
    {
      nome: "Campo do Distrito de Carnaíba",
      tipo: "Campo de Futebol",
      endereco: "Distrito de Carnaíba",
      horario: "Segunda a Domingo: 6h às 22h",
      contato: "(87) 3838-xxxx"
    },
    {
      nome: "Quadra da Vila São Sebastião",
      tipo: "Quadra Aberta",
      endereco: "Vila São Sebastião",
      horario: "Segunda a Domingo: 6h às 22h",
      contato: "(87) 3838-xxxx"
    }
  ];

  return (
    <Layout>
      <Header pageTitle="Esporte" />
      
      <div className="p-4 pb-20 max-w-7xl mx-auto space-y-6">
        {/* Assistente Virtual */}
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 p-2 rounded-lg">
                <i className="fas fa-robot"></i>
              </div>
              <CardTitle className="text-base">Assistente Virtual de Esporte</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
              <i className="fas fa-comment-dots text-muted-foreground"></i>
              <input
                type="text"
                placeholder="Como posso me inscrever no campeonato?"
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <i className="fas fa-paper-plane text-primary cursor-pointer"></i>
            </div>
          </CardContent>
        </Card>

        {/* Ações da Secretaria */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <i className="fas fa-clipboard-list text-green-600"></i>
            Ações e Programas
          </h2>
          <div className="grid gap-4">
            {acoes.map((acao, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 p-2.5 rounded-lg">
                        <i className={`fas ${acao.icone}`}></i>
                      </div>
                      <div>
                        <CardTitle className="text-base">{acao.titulo}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {acao.descricao}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2">{acao.status}</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Galeria de Fotos */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <i className="fas fa-images text-green-600"></i>
            Galeria de Eventos
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {galeriaFotos.map((foto, index) => (
              <div 
                key={index} 
                className="relative aspect-video rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
              >
                <img 
                  src={foto.src} 
                  alt={foto.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-xs font-medium">{foto.alt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campeonatos */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="text-green-600" size={24} />
            Campeonatos
          </h2>
          <div className="grid gap-4">
            {campeonatos.map((camp, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{camp.nome}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{camp.categoria}</Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar size={14} />
                            {camp.periodo}
                          </div>
                        </div>
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                      {camp.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Quadras e Campos */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="text-green-600" size={24} />
            Quadras e Campos
          </h2>
          <div className="grid gap-4">
            {locais.map((local, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 p-2.5 rounded-lg">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{local.nome}</CardTitle>
                      <Badge variant="secondary" className="mt-2">{local.tipo}</Badge>
                      <CardDescription className="text-sm mt-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span>{local.endereco}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span>{local.horario}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-phone text-muted-foreground text-sm"></i>
                          <span>{local.contato}</span>
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Contato */}
        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <i className="fas fa-phone text-green-600"></i>
              Entre em Contato
            </CardTitle>
            <CardDescription>
              <div className="space-y-2 mt-3">
                <p className="text-sm">
                  <strong>Telefone:</strong> (87) 3838-xxxx
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> esporte@afogados.pe.gov.br
                </p>
                <p className="text-sm">
                  <strong>Horário:</strong> Segunda a Sexta, 8h às 14h
                </p>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </Layout>
  );
};

export default Esporte;
