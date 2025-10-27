import { z } from "zod";

/**
 * Schemas de validação para formulários administrativos
 * SECURITY: Validação client-side para prevenir injeções e garantir integridade de dados
 */

// Schema para notícias
export const newsSchema = z.object({
  title: z.string()
    .trim()
    .min(5, "O título deve ter pelo menos 5 caracteres")
    .max(200, "O título não pode exceder 200 caracteres"),
  
  summary: z.string()
    .trim()
    .min(20, "O resumo deve ter pelo menos 20 caracteres")
    .max(500, "O resumo não pode exceder 500 caracteres"),
  
  content: z.string()
    .trim()
    .min(50, "O conteúdo deve ter pelo menos 50 caracteres")
    .max(10000, "O conteúdo não pode exceder 10000 caracteres"),
  
  category: z.string()
    .trim()
    .min(3, "A categoria deve ter pelo menos 3 caracteres")
    .max(50, "A categoria não pode exceder 50 caracteres"),
  
  image_url: z.string().optional(),
  
  gallery_images: z.array(z.string()).optional().default([]),
});

// Schema para eventos
export const eventSchema = z.object({
  title: z.string()
    .trim()
    .min(5, "O título deve ter pelo menos 5 caracteres")
    .max(200, "O título não pode exceder 200 caracteres"),
  
  description: z.string()
    .trim()
    .min(20, "A descrição deve ter pelo menos 20 caracteres")
    .max(2000, "A descrição não pode exceder 2000 caracteres"),
  
  location: z.string()
    .trim()
    .min(5, "O local deve ter pelo menos 5 caracteres")
    .max(200, "O local não pode exceder 200 caracteres"),
  
  event_date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), "Data inválida"),
  
  event_time: z.string().optional(),
});

// Schema para secretarias
export const secretariaSchema = z.object({
  name: z.string()
    .trim()
    .min(5, "O nome deve ter pelo menos 5 caracteres")
    .max(100, "O nome não pode exceder 100 caracteres"),
  
  slug: z.string()
    .trim()
    .min(3, "O slug deve ter pelo menos 3 caracteres")
    .max(50, "O slug não pode exceder 50 caracteres")
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  
  description: z.string()
    .trim()
    .max(500, "A descrição não pode exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  
  icon: z.string()
    .trim()
    .min(1, "Ícone é obrigatório")
    .max(50, "Nome do ícone muito longo"),
  
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (use formato hex #RRGGBB)"),
  
  phone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone inválido (use formato (XX) XXXXX-XXXX)")
    .optional()
    .or(z.literal("")),
  
  email: z.string()
    .email("E-mail inválido")
    .max(255, "E-mail muito longo")
    .optional()
    .or(z.literal("")),
  
  address: z.string()
    .max(300, "Endereço muito longo")
    .optional()
    .or(z.literal("")),
  
  business_hours: z.string()
    .max(200, "Horário de funcionamento muito longo")
    .optional()
    .or(z.literal("")),
});

// Schema para ouvidoria
export const ombudsmanSchema = z.object({
  fullName: z.string()
    .trim()
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(200, "O nome não pode exceder 200 caracteres"),
  
  email: z.string()
    .optional(),
  
  manifestationType: z.enum(["reclamacao", "elogio", "sugestao", "solicitacao"], {
    errorMap: () => ({ message: "Tipo de manifestação inválido" })
  }),
  
  category: z.string()
    .trim()
    .min(1, "Categoria é obrigatória")
    .max(50, "Categoria muito longa"),
  
  description: z.string()
    .trim()
    .min(20, "A descrição deve ter pelo menos 20 caracteres")
    .max(5000, "A descrição não pode exceder 5000 caracteres"),
});

// Schema para banners
export const bannerSchema = z.object({
  title: z.string()
    .trim()
    .min(5, "O título deve ter pelo menos 5 caracteres")
    .max(200, "O título não pode exceder 200 caracteres"),
  
  description: z.string()
    .trim()
    .min(10, "A descrição deve ter pelo menos 10 caracteres")
    .max(1000, "A descrição não pode exceder 1000 caracteres"),
  
  image_url: z.string()
    .trim()
    .min(1, "Imagem é obrigatória"),
  
  link: z.string()
    .optional()
    .or(z.literal("")),
  
  display_type: z.enum(["popup", "banner", "both"], {
    errorMap: () => ({ message: "Tipo de exibição inválido" })
  }),
  
  start_date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), "Data inválida"),
  
  end_date: z.string()
    .optional()
    .or(z.literal("")),
});

export type NewsFormData = z.infer<typeof newsSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type SecretariaFormData = z.infer<typeof secretariaSchema>;
export type OmbudsmanFormData = z.infer<typeof ombudsmanSchema>;
export type BannerFormData = z.infer<typeof bannerSchema>;
