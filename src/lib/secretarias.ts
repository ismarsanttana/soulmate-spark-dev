export interface Secretaria {
  slug: string;
  title: string;
  description?: string;
}

const secretarias: Secretaria[] = [
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
    slug: "financas",
    title: "Secretaria de Finanças",
    description: "Tributos, certidões e transparência fiscal"
  }
];

export const getSecretariaBySlug = (slug: string): Secretaria | undefined => {
  return secretarias.find(s => s.slug === slug);
};
