# Sistema de Dados de Perfil Unificado

## 📌 Fonte Única da Verdade: Tabela `profiles`

Todos os dados pessoais dos usuários devem ser armazenados e lidos da tabela `profiles` do Supabase. Isso garante consistência em todo o sistema.

## 🔄 Campos Principais

- `full_name` - Nome completo
- `email` - E-mail 
- `telefone` - Telefone (não `phone`!)
- `cpf` - CPF formatado
- `avatar_url` - URL da foto de perfil
- `endereco_completo` - Endereço completo

## ✅ Componentes Atualizados

### 1. Profile.tsx (Página de Perfil do Cidadão)
- ✅ Salva telefone em `profiles.telefone`
- ✅ Salva endereço em `profiles.endereco_completo`
- ✅ Salva CPF em `profiles.cpf`
- ✅ Lê dados de `profiles` (prioridade sobre metadata)

### 2. SecretarioProfile.tsx (Perfil no Painel do Secretário)
- ✅ Lê de `profiles.telefone`
- ✅ Lê de `profiles.cpf`
- ✅ Salva em `profiles.telefone`
- ✅ Console.log para debug

### 3. Header.tsx
- ✅ Lê `full_name` e `avatar_url` de `profiles`

### 4. SecretarioLayout.tsx
- ✅ Lê dados do perfil de `profiles`

## 📝 Como Adicionar Novos Campos

1. Adicione o campo na tabela `profiles` via migration
2. Atualize o tipo TypeScript em `types.ts`
3. Adicione o campo no formulário de Profile.tsx
4. Adicione o campo no formulário de SecretarioProfile.tsx
5. Garanta que o campo está sendo salvo no `upsert` do profiles

## ⚠️ Importante

- **NUNCA** use apenas `user.user_metadata` como fonte de dados
- **SEMPRE** salve na tabela `profiles` primeiro
- Use `user_metadata` apenas como fallback temporário
- O campo telefone é `telefone`, não `phone`

## 🔍 Debug

Para verificar se os dados estão sendo salvos corretamente:

```sql
SELECT id, full_name, email, telefone, cpf, avatar_url 
FROM profiles 
WHERE email = 'portaltvcariri@gmail.com';
```

## 🎯 Fluxo de Dados

```
Usuário preenche formulário
         ↓
Salva em profiles (tabela)
         ↓
Atualiza user_metadata (opcional/backup)
         ↓
Todos os componentes leem de profiles
         ↓
Dados aparecem em todo o sistema
```
