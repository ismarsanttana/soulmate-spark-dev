# Supabase Edge Functions

## ⚠️ Sobre Erros LSP Locais

As Edge Functions neste diretório são escritas para o **runtime Deno** e executadas no Supabase, não no Replit/Node.js.

**É normal ver erros LSP localmente** como:
- `Cannot find name 'Deno'`
- `Cannot find module 'https://...'`

Esses erros **NÃO afetam a funcionalidade** - as funções funcionam perfeitamente quando deployadas no Supabase.

## Desenvolvendo Edge Functions

Para desenvolver e testar Edge Functions localmente:

1. **Use o Supabase CLI**: 
   ```bash
   npx supabase functions serve
   ```

2. **Ou edite no Dashboard do Supabase**:
   - Acesse seu projeto no Supabase
   - Vá em "Edge Functions"
   - Edite diretamente no editor online

3. **Deploy**:
   ```bash
   npx supabase functions deploy <function-name>
   ```

## Funções Disponíveis

- `facial-recognition` - Reconhecimento facial para entrada/saída de alunos
- `inep-api` - Integração com dados do INEP
- `ideb-api` - Consulta de índices IDEB
- `siconfi-api` - Dados de transparência SICONFI
- `dados-abertos-api` - Portal de Dados Abertos do governo
- `transparencia-api` - API de transparência governamental
- `social-publish` - Publicação automática em redes sociais
- `social-auth` - Autenticação OAuth com redes sociais
- `match-candidates` - Matching de candidatos para vagas
- `realtime-voice` - Assistente de voz em tempo real
- `realtime-token` - Tokens para sessões realtime OpenAI

## Variáveis de Ambiente Necessárias

Configure no Supabase Dashboard:
- `OPENAI_API_KEY` - Para funções de IA e voz
- `LOVABLE_API_KEY` - Para matching de candidatos
- Outras conforme necessário para cada função
