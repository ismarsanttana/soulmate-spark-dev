/**
 * Funções de mascaramento de dados sensíveis
 */

export const maskCPF = (cpf: string): string => {
  if (!cpf) return "";
  // Remove caracteres não numéricos
  const numbers = cpf.replace(/\D/g, "");
  // Formato: 123.***.**-00
  if (numbers.length === 11) {
    return `${numbers.substring(0, 3)}.***.***.***-${numbers.substring(9)}`;
  }
  return cpf;
};

export const maskRG = (rg: string): string => {
  if (!rg) return "";
  // Remove caracteres não numéricos
  const numbers = rg.replace(/\D/g, "");
  // Formato: 3.866.***
  if (numbers.length >= 7) {
    const firstPart = numbers.substring(0, 1);
    const secondPart = numbers.substring(1, 4);
    return `${firstPart}.${secondPart}.***`;
  }
  return rg;
};

export const unmaskCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, "");
};

export const unmaskRG = (rg: string): string => {
  return rg.replace(/\D/g, "");
};
