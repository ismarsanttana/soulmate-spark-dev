/**
 * Funções de mascaramento de dados sensíveis
 * Usadas para proteger informações pessoais quando visualizadas por usuários com permissões restritas
 */

export const maskCPF = (cpf: string): string => {
  if (!cpf) return "";
  // Remove caracteres não numéricos
  const numbers = cpf.replace(/\D/g, "");
  // Formato: 123.***.***-00
  if (numbers.length === 11) {
    return `${numbers.substring(0, 3)}.***.***-${numbers.substring(9)}`;
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

export const maskNIS = (nis: string): string => {
  if (!nis) return "";
  // Remove caracteres não numéricos
  const numbers = nis.replace(/\D/g, "");
  // Formato: 123.****.**-*
  if (numbers.length === 11) {
    return `${numbers.substring(0, 3)}.****.**-*`;
  }
  return nis;
};

export const maskPhone = (phone: string): string => {
  if (!phone) return "";
  // Remove caracteres não numéricos
  const numbers = phone.replace(/\D/g, "");
  // Formato: (87) 9****-0000
  if (numbers.length === 11) {
    return `(${numbers.substring(0, 2)}) 9****-${numbers.substring(7)}`;
  } else if (numbers.length === 10) {
    return `(${numbers.substring(0, 2)}) ****-${numbers.substring(6)}`;
  }
  return phone;
};

export const maskCartaoSUS = (cartaoSUS: string): string => {
  if (!cartaoSUS) return "";
  // Remove caracteres não numéricos
  const numbers = cartaoSUS.replace(/\D/g, "");
  // Formato: 123 **** **** ****
  if (numbers.length === 15) {
    return `${numbers.substring(0, 3)} **** **** ****`;
  }
  return cartaoSUS;
};

export const maskEmail = (email: string): string => {
  if (!email) return "";
  const [localPart, domain] = email.split("@");
  if (!domain) return email;
  
  // Mostra apenas os primeiros 3 caracteres do email local
  if (localPart.length <= 3) {
    return `${localPart}@${domain}`;
  }
  return `${localPart.substring(0, 3)}***@${domain}`;
};

export const unmaskCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, "");
};

export const unmaskRG = (rg: string): string => {
  return rg.replace(/\D/g, "");
};
