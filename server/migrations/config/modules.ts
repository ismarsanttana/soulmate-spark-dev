/**
 * Module to Tables Mapping
 * 
 * Defines which database tables belong to each module.
 * This mapping is used during city provisioning to:
 * - Determine which tables to replicate for new cities
 * - Enable/disable modules selectively per city
 * - Organize schema migration by functional domains
 */

export const MODULE_TABLES = {
  /**
   * EDUCAÇÃO - Sistema educacional completo
   * Gerencia escolas, alunos, professores, turmas, matrículas e avaliações
   */
  educacao: [
    'schools',                    // Instituições de ensino (INEP)
    'students',                   // Cadastro de alunos
    'teachers',                   // Cadastro de professores
    'school_classes',             // Turmas escolares
    'student_enrollments',        // Matrículas de alunos
    'ideb_data',                  // Dados históricos do IDEB
    'scheduled_assessments',      // Avaliações agendadas
    'student_assessments',        // Resultados de avaliações
  ],

  /**
   * SAÚDE - Sistema de saúde municipal
   * Gerencia unidades de saúde, agendamentos e prontuários
   */
  saude: [
    'health_units',               // Unidades de saúde (UBS, hospitais)
    'appointments',               // Agendamentos de consultas
  ],

  /**
   * CONTEÚDO - Gestão de comunicação e mídia
   * Notícias, eventos, stories, transmissões ao vivo e podcasts
   */
  conteudo: [
    'news',                       // Notícias publicadas
    'events',                     // Eventos municipais
    'stories',                    // Stories (formato mobile)
    'campaign_banners',           // Banners e campanhas
    'gallery_albums',             // Álbuns de fotos
    'live_streams',               // Transmissões ao vivo
    'podcasts',                   // Episódios de podcasts
  ],

  /**
   * OUVIDORIA - Canal de comunicação com cidadão
   * Reclamações, sugestões, denúncias e elogios
   */
  ouvidoria: [
    'ombudsman_protocols',        // Protocolos de atendimento
  ],

  /**
   * RH - Recursos Humanos
   * Gestão de funcionários, ponto eletrônico e controle de faltas
   */
  rh: [
    'employee_timeclock',         // Registros de ponto eletrônico
    'employee_absences',          // Faltas e justificativas
    'employee_audit_log',         // Auditoria de alterações
  ],

  /**
   * TRANSPARÊNCIA - Dados públicos e orçamento
   * Transferências federais, orçamento municipal
   */
  transparencia: [
    'transferencias_federais',    // Transferências de recursos federais
    'orcamento_educacao',         // Orçamento da educação
    'advertising_expenses',       // Despesas com publicidade
  ],

  /**
   * COMUNICAÇÃO - Redes sociais e marketing
   * Integração com Facebook, Instagram, Twitter, LinkedIn
   */
  comunicacao: [
    'social_media_accounts',      // Contas conectadas (OAuth)
    'social_media_posts',         // Histórico de publicações
    'social_media_api_keys',      // Credenciais de API
  ],

  /**
   * INFRAESTRUTURA - Suporte e cache
   * Cache de APIs externas, notificações, relatórios
   */
  infraestrutura: [
    'api_cache',                  // Cache de APIs externas (IDEB, SICONFI, etc)
    'notifications',              // Notificações push
    'report_requests',            // Solicitações de relatórios
  ],
} as const;

/**
 * Type helper to get all table names across all modules
 */
export type ModuleKey = keyof typeof MODULE_TABLES;
export type TableName = (typeof MODULE_TABLES)[ModuleKey][number];

/**
 * Get all tables for a given module
 */
export function getModuleTables(moduleKey: ModuleKey): readonly string[] {
  return MODULE_TABLES[moduleKey];
}

/**
 * Get all modules as array
 */
export function getAllModules(): ModuleKey[] {
  return Object.keys(MODULE_TABLES) as ModuleKey[];
}

/**
 * Get all tables across all modules (flat list)
 */
export function getAllModuleTables(): string[] {
  return Object.values(MODULE_TABLES).flat();
}

/**
 * Find which module a table belongs to
 */
export function findModuleForTable(tableName: string): ModuleKey | null {
  for (const [module, tables] of Object.entries(MODULE_TABLES)) {
    if ((tables as readonly string[]).includes(tableName)) {
      return module as ModuleKey;
    }
  }
  return null;
}
