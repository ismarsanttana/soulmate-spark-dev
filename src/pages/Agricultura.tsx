import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tractor, Sprout, Users, FileText, Calendar, TrendingUp } from "lucide-react";

const Agricultura = () => {
  const services = [
    {
      icon: Tractor,
      title: "Apoio ao Produtor",
      description: "Assistência técnica e equipamentos para produtores rurais",
    },
    {
      icon: Sprout,
      title: "Sementes e Insumos",
      description: "Distribuição de sementes e insumos agrícolas",
    },
    {
      icon: Users,
      title: "Capacitação Rural",
      description: "Cursos e treinamentos para agricultores",
    },
    {
      icon: FileText,
      title: "Documentação",
      description: "DAP, certificados e declarações rurais",
    },
  ];

  const programs = [
    {
      title: "Programa de Irrigação",
      description: "Apoio para implementação de sistemas de irrigação",
      status: "Ativo",
    },
    {
      title: "Feira do Produtor",
      description: "Espaço para comercialização da produção local",
      status: "Semanal",
    },
    {
      title: "Crédito Rural",
      description: "Orientação para acesso a linhas de crédito",
      status: "Ativo",
    },
  ];

  return (
    <Layout>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Tractor className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Secretaria de Agricultura
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Apoio ao produtor rural, programas agrícolas e desenvolvimento sustentável
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
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Programas Ativos</h2>
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

          {/* Contact Section */}
          <Card className="p-8 bg-primary/5">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <Calendar className="w-12 h-12 text-primary" />
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Atendimento ao Produtor Rural
                </h3>
                <p className="text-muted-foreground">
                  Segunda a Sexta, das 8h às 14h
                </p>
              </div>
              <Button size="lg">Agendar Atendimento</Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Agricultura;
