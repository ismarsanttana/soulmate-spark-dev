export interface Secretaria {
  slug: string;
  title: string;
  description?: string;
}

export const secretarias: Secretaria[] = [
  {
    slug: "assistencia",
    title: "Secretaria de Assistência Social",
    description: "Programas sociais, benefícios e serviços de proteção ao cidadão"
  },
  {
    slug: "educacao",
    title: "Secretaria de Educação",
    description: "Matrículas, transporte escolar e calendário letivo"
  },
  {
    slug: "saude",
    title: "Secretaria de Saúde",
    description: "Atendimento médico, consultas e exames"
  },
  {
    slug: "comunicacao",
    title: "Secretaria de Comunicação",
    description: "Notícias, comunicados oficiais e transparência"
  },
  {
    slug: "financas",
    title: "Secretaria de Finanças",
    description: "Tributos, certidões e transparência fiscal"
  },
  {
    slug: "cultura",
    title: "Secretaria de Cultura e Turismo",
    description: "Editais, agenda cultural e pontos turísticos"
  },
  {
    slug: "obras",
    title: "Secretaria de Obras e Infraestrutura",
    description: "Acompanhamento de obras, investimentos e cronogramas"
  },
  {
    slug: "esporte",
    title: "Secretaria de Esporte",
    description: "Campeonatos, quadras, campos e programas esportivos"
  },
  {
    slug: "agricultura",
    title: "Secretaria de Agricultura",
    description: "Apoio ao produtor rural, programas agrícolas e desenvolvimento rural"
  },
  {
    slug: "mulher",
    title: "Secretaria da Mulher",
    description: "Políticas públicas para mulheres, acolhimento e apoio"
  }
];

export const getSecretariaBySlug = (slug: string): Secretaria | undefined => {
  return secretarias.find(s => s.slug === slug);
};
