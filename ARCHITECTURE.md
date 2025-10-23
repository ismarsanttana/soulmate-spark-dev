# Arquitetura Multi-Role - Portal do Cidadão

## Visão Geral

Sistema de gerenciamento multi-role implementado para o Portal do Cidadão, permitindo que usuários tenham múltiplas funções simultaneamente (ex: uma pessoa pode ser pai E professor).

## Estrutura do Banco de Dados

### Tabelas Principais

#### `roles` (Nova)
Tabela centralizada de roles disponíveis no sistema:
- `id` (UUID): Identificador único
- `role_name` (TEXT): Nome da role (cidadao, admin, prefeito, secretario, professor, aluno, pai)
- `secretaria_slug` (TEXT, nullable): Para roles específicas de secretarias
- `description` (TEXT): Descrição da role
- `permissions` (JSONB): Permissões específicas da role
- `is_active` (BOOLEAN): Se a role está ativa

#### `user_roles` (Modificada)
Relacionamento muitos-para-muitos entre usuários e roles:
- `id` (UUID): Identificador único
- `user_id` (UUID): Referência ao usuário
- `role_id` (UUID): Referência à role na tabela `roles`
- `role` (ENUM): Enum legado para compatibilidade
- `metadata` (JSONB): Metadados adicionais

#### `user_relationships` (Nova)
Relacionamentos entre usuários (ex: pai-filho):
- `id` (UUID): Identificador único
- `user_id` (UUID): Usuário principal
- `related_user_id` (UUID): Usuário relacionado
- `relationship_type` (TEXT): Tipo (pai, mae, filho, responsavel, tutor)
- `metadata` (JSONB): Metadados do relacionamento

#### `student_enrollments` (Nova)
Matrículas de alunos:
- `id` (UUID): Identificador único
- `student_user_id` (UUID): Referência ao aluno
- `matricula` (TEXT): Número de matrícula
- `school_name`, `grade_level`, `class_name`: Informações da escola
- `status` (TEXT): Status da matrícula
- `grades`, `attendance` (JSONB): Notas e frequência

#### `profiles` (Modificada)
Adicionado campo `cpf`:
- `cpf` (TEXT, UNIQUE): CPF do usuário

## Componentes Implementados

### Painéis por Role

#### 1. **PainelProfessor** (`/painel-professor`)
- Visão geral com estatísticas de turmas e alunos
- Gerenciamento de turmas
- Visualização de alunos
- Planos de aula

#### 2. **PainelAluno** (`/painel-aluno`)
- Visão geral acadêmica
- Notas e frequência
- Horário de aulas
- Atividades pendentes

#### 3. **PainelPais** (`/painel-pais`)
- Visão geral dos filhos
- Acompanhamento de desempenho
- Comunicados da escola
- Reuniões agendadas

### Componentes Administrativos

#### 1. **UsersRolesManagement**
- Busca por usuários (nome, email, CPF)
- Atribuição de múltiplas roles por usuário
- Remoção de roles
- Associação de secretarias para secretários

#### 2. **UserRelationshipsManagement**
- Criação de vínculos pai-filho
- Gerenciamento de relacionamentos familiares
- Visualização de rede de relacionamentos

### Hooks e Utilitários

#### `useUserRole`
Hook principal para verificação de roles:
```typescript
const { 
  roles,           // Array de roles do usuário
  isAdmin,         // Boolean
  isPrefeito,      // Boolean
  isSecretario,    // Boolean
  isProfessor,     // Boolean
  isAluno,         // Boolean
  isPai,           // Boolean
  hasRole          // Function para verificar role específica
} = useUserRole();
```

#### `useRoleNavigation`
Hook para navegação baseada em roles:
```typescript
const { 
  rolePanels,      // Array de painéis disponíveis
  defaultPanel,    // Painel padrão do usuário
  hasRoles         // Se usuário tem alguma role
} = useRoleNavigation();
```

## Sistema de Permissões (RLS)

### Perfis (`profiles`)
- Usuários podem ver e editar apenas seu próprio perfil
- CPF é único e obrigatório para identificação

### Roles de Usuário (`user_roles`)
- Apenas admins podem gerenciar roles
- Usuários podem ver suas próprias roles

### Relacionamentos (`user_relationships`)
- Admins, prefeito e secretários podem criar/editar
- Usuários podem ver seus próprios relacionamentos

### Matrículas (`student_enrollments`)
- Alunos veem suas próprias informações
- Pais veem informações dos filhos
- Secretários de educação têm acesso completo

## Fluxo de Uso

### 1. Criação de Usuário
1. Usuário se registra no sistema
2. Perfil criado automaticamente via trigger
3. Admin atribui roles conforme necessário

### 2. Atribuição de Roles
1. Admin acessa painel administrativo
2. Busca usuário por nome, email ou CPF
3. Adiciona uma ou mais roles
4. Para secretário, seleciona secretaria associada

### 3. Criação de Relacionamentos
1. Admin/Secretário acessa gestão de relacionamentos
2. Seleciona usuário pai/responsável
3. Vincula ao usuário filho
4. Define tipo de relacionamento

### 4. Navegação do Usuário
1. Usuário faz login
2. Header exibe dropdown "Painéis" com acesso rápido
3. Cada painel mostra informações específicas da role
4. Usuário pode alternar entre painéis conforme suas roles

## Rotas Protegidas

Todas as rotas de painéis usam `ProtectedRoute`:

```typescript
<Route path="/painel-professor" element={
  <ProtectedRoute allowedRoles={["professor"]}>
    <PainelProfessor />
  </ProtectedRoute>
} />
```

## Próximos Passos

### Fase 3 - Funcionalidades Específicas
- [ ] Gestão completa de turmas (Professor)
- [ ] Sistema de notas e faltas (Professor)
- [ ] Agenda de atividades (Aluno)
- [ ] Sistema de mensagens (Pais ↔ Professores)
- [ ] Calendário escolar integrado

### Fase 4 - Relatórios e Analytics
- [ ] Relatórios de desempenho por aluno
- [ ] Dashboards para pais
- [ ] Estatísticas por turma/escola
- [ ] Exportação de dados

### Fase 5 - Integrações
- [ ] Integração com sistemas escolares
- [ ] Notificações push
- [ ] Chat em tempo real
- [ ] Videoconferências

## Segurança

- ✅ RLS habilitado em todas as tabelas sensíveis
- ✅ Autenticação obrigatória para painéis
- ✅ Verificação de roles em múltiplos níveis
- ✅ CPF único para identificação confiável
- ✅ Relacionamentos validados por permissões

## Manutenção

### Adicionando Nova Role

1. Inserir na tabela `roles`:
```sql
INSERT INTO roles (role_name, description, is_active)
VALUES ('coordenador', 'Coordenador Pedagógico', true);
```

2. Atualizar enum `app_role` (se necessário):
```sql
ALTER TYPE app_role ADD VALUE 'coordenador';
```

3. Adicionar no `useUserRole`:
```typescript
isCoordenador: roles.includes("coordenador"),
```

4. Criar página do painel e rota protegida

5. Adicionar no `useRoleNavigation`
