# UrbanByte Platform Backend (Go)

Backend em Go para a plataforma multi-tenant UrbanByte/Conecta Cidades.

## Função

Este backend serve como **Control Plane** da plataforma, gerenciando:
- Temas das cidades (logo + cores)
- Configurações de cada município
- Futuramente: conexões com bancos de dados separados por cidade (Neon)

## Endpoints

### `GET /healthz`
Health check simples.

**Resposta:** `"ok"`

### `GET /api/cities/{slug}/theme`
Retorna o tema (logo e cores) de uma cidade específica.

**Parâmetros:**
- `slug` (path): Identificador único da cidade (ex: `afogados-da-ingazeira`)

**Resposta de sucesso (200):**
```json
{
  "name": "Afogados da Ingazeira",
  "slug": "afogados-da-ingazeira",
  "logoUrl": "https://...",
  "primaryColor": "#004AAD",
  "secondaryColor": "#F5C842",
  "accentColor": "#FFFFFF"
}
```

**Erros:**
- `400`: slug não fornecido
- `403`: cidade desativada
- `404`: cidade não encontrada
- `500`: erro interno

## Configuração

### Variáveis de Ambiente

- **`CONTROL_DB_URL`** (obrigatória): String de conexão PostgreSQL do Supabase
  - Formato: `postgresql://postgres:[SENHA]@db.xxxxx.supabase.co:5432/postgres?sslmode=require&options=-c%20search_path%3Dpublic`
  - **IMPORTANTE**: Adicione `?sslmode=require&options=-c%20search_path%3Dpublic` ao final para forçar IPv4 e SSL
  
- **`PORT`** (opcional): Porta do servidor (padrão: `8080`)

### Executar Localmente

```bash
cd backend
go mod download
export CONTROL_DB_URL="sua-connection-string-aqui"
go run main.go
```

### Testar

```bash
# Health check
curl http://localhost:8080/healthz

# Buscar tema de Afogados
curl http://localhost:8080/api/cities/afogados-da-ingazeira/theme
```

## Banco de Dados

### Tabela `public.cities`

```sql
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text default '#004AAD',
  secondary_color text default '#F5C842',
  accent_color text default '#FFFFFF',
  db_url text,  -- Para conexões futuras com Neon
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## Dependências

- `github.com/go-chi/chi/v5` - Router HTTP
- `github.com/lib/pq` - Driver PostgreSQL

## Próximos Passos

1. ✅ Endpoint de tema funcionando
2. ⏳ Extrair slug do subdomínio dinamicamente
3. ⏳ Implementar conexão com bancos Neon separados por cidade
4. ⏳ Endpoints de CRUD para gerenciamento de cidades
