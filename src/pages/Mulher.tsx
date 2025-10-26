import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Briefcase, Users, Phone, BookOpen } from "lucide-react";

const Mulher = () => {
  const services = [
    {
      icon: Shield,
      title: "Proteção e Acolhimento",
      description: "Atendimento e apoio a mulheres em situação de vulnerabilidade",
    },
    {
      icon: Briefcase,
      title: "Emprego e Renda",
      description: "Cursos profissionalizantes e geração de renda",
    },
    {
      icon: BookOpen,
      title: "Capacitação",
      description: "Oficinas, cursos e workshops para desenvolvimento pessoal",
    },
    {
      icon: Users,
      title: "Grupos de Apoio",
      description: "Espaços de acolhimento e fortalecimento mútuo",
    },
  ];

  const programs = [
    {
      title: "Mulheres Empreendedoras",
      description: "Apoio para iniciar e desenvolver negócios próprios",
      status: "Inscrições Abertas",
    },
    {
      title: "Rede de Proteção",
      description: "Atendimento e orientação jurídica e psicológica",
      status: "Sempre Disponível",
    },
    {
      title: "Qualifica Mulher",
      description: "Cursos profissionalizantes gratuitos",
      status: "Próxima Turma",
    },
  ];

  const emergencyContacts = [
    { name: "Disque 180", description: "Central de Atendimento à Mulher", number: "180" },
    { name: "Polícia Militar", description: "Emergências", number: "190" },
    { name: "CREAS", description: "Centro de Referência Especializado", number: "(87) 3838-XXXX" },
  ];

  return (
    <Layout>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Secretaria da Mulher
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Políticas públicas para mulheres, acolhimento e fortalecimento
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all">
                <service.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </Card>
            ))}
          </div>

          {/* Programs Section */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Programas e Projetos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {programs.map((program, index) => (
                <Card key={index} className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-foreground">{program.title}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {program.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{program.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Saiba Mais
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          {/* Emergency Contacts */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Phone className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Contatos de Emergência</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {emergencyContacts.map((contact, index) => (
                <Card key={index} className="p-6 border-2 border-primary/20">
                  <h3 className="font-bold text-xl text-foreground mb-2">{contact.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{contact.description}</p>
                  <p className="text-2xl font-bold text-primary">{contact.number}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <Card className="p-8 bg-primary/5">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <Heart className="w-12 h-12 text-primary" />
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Atendimento Especializado
                </h3>
                <p className="text-muted-foreground">
                  Segunda a Sexta, das 8h às 17h - Atendimento sigiloso e humanizado
                </p>
              </div>
              <Button size="lg">Solicitar Atendimento</Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Mulher;
