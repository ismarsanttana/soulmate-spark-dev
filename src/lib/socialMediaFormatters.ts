/**
 * Formatadores de conteúdo para diferentes redes sociais
 */

interface ContentData {
  title: string;
  summary?: string;
  content?: string;
  description?: string;
  location?: string;
  event_date?: string;
  image_url?: string;
  gallery_images?: string[];
}

const MAX_LENGTHS = {
  facebook: 63206, // Praticamente sem limite
  instagram: 2200,
  twitter: 280,
  linkedin: 3000,
};

/**
 * Trunca texto mantendo palavras inteiras
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  const truncated = text.slice(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(" ");
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + "...";
  }
  
  return truncated + "...";
}

/**
 * Remove tags HTML do texto
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Extrai hashtags relevantes do conteúdo
 */
function extractHashtags(text: string, limit = 5): string[] {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4 && /^[a-záàâãéèêíïóôõöúçñ]+$/.test(word));
  
  const uniqueWords = Array.from(new Set(words)).slice(0, limit);
  return uniqueWords.map((word) => `#${word.charAt(0).toUpperCase() + word.slice(1)}`);
}

/**
 * Formata conteúdo para Facebook
 * - Sem limite prático de caracteres
 * - Suporta formatação rica
 * - Boa para textos longos
 */
export function formatForFacebook(data: ContentData, customText?: string): string {
  if (customText) return customText;

  const parts: string[] = [];
  
  // Título em destaque
  if (data.title) {
    parts.push(`📢 ${data.title.toUpperCase()}\n`);
  }
  
  // Conteúdo principal
  const mainText = data.content || data.description || data.summary || "";
  if (mainText) {
    const cleanText = stripHtml(mainText);
    parts.push(cleanText);
  }
  
  // Informações adicionais (para eventos)
  if (data.location) {
    parts.push(`\n📍 Local: ${data.location}`);
  }
  if (data.event_date) {
    parts.push(`📅 Data: ${data.event_date}`);
  }
  
  return parts.join("\n");
}

/**
 * Formata conteúdo para Instagram
 * - Limite de 2.200 caracteres
 * - Foco em hashtags
 * - Visual e conciso
 */
export function formatForInstagram(data: ContentData, customText?: string): string {
  if (customText) {
    return truncateText(customText, MAX_LENGTHS.instagram);
  }

  const parts: string[] = [];
  
  // Título com emoji
  if (data.title) {
    parts.push(`✨ ${data.title}\n`);
  }
  
  // Resumo ou primeira parte do conteúdo
  const mainText = data.summary || data.description || data.content || "";
  if (mainText) {
    const cleanText = stripHtml(mainText);
    const truncated = truncateText(cleanText, 1500); // Deixar espaço para hashtags
    parts.push(truncated);
  }
  
  // Hashtags relevantes
  const fullText = `${data.title} ${mainText}`;
  const hashtags = extractHashtags(fullText, 10);
  
  // Adicionar hashtags locais
  hashtags.push("#AfogadosDaIngazeira", "#Pernambuco", "#NotíciasLocais");
  
  if (hashtags.length > 0) {
    parts.push(`\n\n${hashtags.join(" ")}`);
  }
  
  return truncateText(parts.join("\n"), MAX_LENGTHS.instagram);
}

/**
 * Formata conteúdo para Twitter/X
 * - Limite de 280 caracteres
 * - Extremamente conciso
 * - Foco no título e link
 */
export function formatForTwitter(data: ContentData, customText?: string): string {
  if (customText) {
    return truncateText(customText, MAX_LENGTHS.twitter);
  }

  const parts: string[] = [];
  
  // Emoji + título truncado
  if (data.title) {
    const availableLength = MAX_LENGTHS.twitter - 30; // Reservar espaço para hashtags
    const truncatedTitle = truncateText(data.title, availableLength);
    parts.push(`🔔 ${truncatedTitle}`);
  }
  
  // Hashtags principais (máximo 2)
  const fullText = `${data.title} ${data.summary || ""}`;
  const hashtags = extractHashtags(fullText, 2);
  
  if (hashtags.length > 0) {
    parts.push(`\n${hashtags.join(" ")}`);
  }
  
  return truncateText(parts.join(""), MAX_LENGTHS.twitter);
}

/**
 * Formata conteúdo para LinkedIn
 * - Limite de 3.000 caracteres
 * - Tom profissional
 * - Boa para anúncios oficiais
 */
export function formatForLinkedIn(data: ContentData, customText?: string): string {
  if (customText) {
    return truncateText(customText, MAX_LENGTHS.linkedin);
  }

  const parts: string[] = [];
  
  // Título profissional
  if (data.title) {
    parts.push(`${data.title}\n`);
  }
  
  // Conteúdo completo
  const mainText = data.content || data.description || data.summary || "";
  if (mainText) {
    const cleanText = stripHtml(mainText);
    const truncated = truncateText(cleanText, 2500);
    parts.push(truncated);
  }
  
  // Informações oficiais
  if (data.location) {
    parts.push(`\nLocal: ${data.location}`);
  }
  if (data.event_date) {
    parts.push(`Data: ${data.event_date}`);
  }
  
  // Assinatura institucional
  parts.push("\n\n---");
  parts.push("Prefeitura Municipal de Afogados da Ingazeira");
  parts.push("#GestãoPública #AfogadosDaIngazeira #Pernambuco");
  
  return truncateText(parts.join("\n"), MAX_LENGTHS.linkedin);
}

/**
 * Formata conteúdo para todas as plataformas
 */
export function formatForAllPlatforms(
  data: ContentData,
  customTexts?: Record<string, string>
): Record<string, string> {
  return {
    facebook: formatForFacebook(data, customTexts?.facebook),
    instagram: formatForInstagram(data, customTexts?.instagram),
    twitter: formatForTwitter(data, customTexts?.twitter),
    linkedin: formatForLinkedIn(data, customTexts?.linkedin),
  };
}

/**
 * Valida se o texto está dentro do limite da plataforma
 */
export function validateTextLength(platform: string, text: string): boolean {
  const maxLength = MAX_LENGTHS[platform as keyof typeof MAX_LENGTHS];
  return text.length <= maxLength;
}

/**
 * Obtém o limite de caracteres para uma plataforma
 */
export function getMaxLength(platform: string): number {
  return MAX_LENGTHS[platform as keyof typeof MAX_LENGTHS] || 3000;
}