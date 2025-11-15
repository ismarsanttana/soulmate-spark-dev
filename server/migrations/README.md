# Conecta Multi-Tenant Migration System

## Overview

This migration system transforms Conecta from a single-tenant application (Afogados da Ingazeira) into a **white-label multi-tenant platform** for Brazilian municipalities.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTROL PLANE (Supabase)                 │
│  - cities table (name, slug, logo, colors, db_url)         │
│  - profiles, roles, user_roles, secretarias                │
│  - Global authentication & platform configuration          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Routes each city
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA PLANE (Neon)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │  afogados-db    │  │   recife-db     │  │ salvador-db  ││
│  │  (migrated)     │  │   (new)         │  │  (new)       ││
│  ├─────────────────┤  ├─────────────────┤  ├──────────────┤│
│  │ • schools       │  │ • schools       │  │ • schools    ││
│  │ • students      │  │ • students      │  │ • students   ││
│  │ • news          │  │ • news          │  │ • news       ││
│  │ • health_units  │  │ • health_units  │  │ ...          ││
│  │ • ...           │  │ • ...           │  │              ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Key Concepts

**Control Plane (Supabase)**
- Global platform data
- User authentication (Supabase Auth)
- City configurations (logo, colors, db_url)
- Cross-city user management

**Data Plane (Neon)**
- One PostgreSQL database per city
- Complete data isolation
- Modular feature enablement
- Independent scaling per city

**Modules**
- `educacao` - Schools, students, teachers, enrollments
- `saude` - Health units, appointments
- `conteudo` - News, events, stories, live streams
- `ouvidoria` - Citizen feedback and protocols
- `rh` - Employee management, timeclock, absences
- `transparencia` - Federal transfers, budgets
- `comunicacao` - Social media integration
- `infraestrutura` - Cache, notifications, reports

---

## Environment Variables

Required environment variables (add to `.env`):

```bash
# Supabase (Control Plane + current Afogados data)
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres

# Control Plane (can be same as SUPABASE_DB_URL for now)
CONTROL_DB_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres

# Neon Admin (for creating databases)
NEON_ADMIN_URL=postgresql://[USER]:[PASSWORD]@[HOST]/neondb

# Neon Project ID (for API operations)
NEON_PROJECT_ID=your-neon-project-id
```

**How to get these:**

1. **SUPABASE_DB_URL**: Supabase Dashboard → Project Settings → Database → Connection String (Direct)
2. **NEON_ADMIN_URL**: Neon Dashboard → Connection Details → PostgreSQL (select "Admin" database)
3. **NEON_PROJECT_ID**: Neon Dashboard → Project Settings → Project ID

---

## Commands

### 1. Test Connections

Verify database connectivity before running migrations:

```bash
npm run migrate:test-connections
```

### 2. Provision Afogados (ONE-TIME)

Migrate Afogados da Ingazeira from Supabase to Neon:

```bash
npm run migrate:provision
```

**What it does:**
1. Creates `conecta_afogados_da_ingazeira` database in Neon
2. Replicates schema for all modules (tables, constraints, indexes)
3. Migrates all data from Supabase to Neon (filters by `city_id IS NULL`)
4. Updates `cities.db_url` in Control Plane

**Options:**
```bash
# Migrate specific modules only
npm run migrate:provision -- --modules educacao,saude,conteudo

# Custom batch size for data migration
npm run migrate:provision -- --batch-size 5000

# Safe re-run after partial failure (TRUNCATE tables first)
npm run migrate:provision -- --truncate
```

**Recovery from Failed Migration:**
If a migration fails partway through (network issue, timeout, etc.), use `--truncate` flag to safely re-run:
```bash
npm run migrate:provision -- --truncate
```
This will TRUNCATE all tables before re-inserting data, ensuring a clean migration.

**Important:**
- This is a **non-destructive** migration (data remains in Supabase)
- Idempotent (safe to re-run, skips existing data)
- Can take several minutes depending on data size

### 3. Provision New City

Create a fresh database for a new city (no data migration):

```bash
npm run migrate:new-city recife educacao,saude,conteudo,ouvidoria
```

**What it does:**
1. Verifies city exists in `cities` table
2. Creates `conecta_recife` database in Neon
3. Creates tables for selected modules
4. Updates `cities.db_url`

**Prerequisites:**
- City must exist in Control Plane `cities` table with:
  - `slug` (e.g., 'recife')
  - `name`, `logo_url`, `primary_color`, etc.

### 4. Enable Module

Add a module to an existing city:

```bash
npm run migrate:enable-module recife transparencia
```

**What it does:**
1. Creates tables for the module
2. Optionally migrates data (if `--migrate-data` flag provided)

**With data migration:**
```bash
npm run migrate:enable-module recife transparencia -- --migrate-data --city-id recife-uuid
```

### 5. List Available Modules

```bash
npm run migrate:list-modules
```

---

## Migration Process

### Step 1: Prepare Control Plane

Ensure the city exists in Supabase `cities` table:

```sql
INSERT INTO public.cities (name, slug, logo_url, primary_color, secondary_color, accent_color)
VALUES (
  'Recife',
  'recife',
  'https://example.com/logo.png',
  '#004AAD',
  '#F5C842',
  '#FFFFFF'
);
```

### Step 2: Run Migration

For **Afogados** (existing data):
```bash
npm run migrate:provision
```

For **new city** (empty database):
```bash
npm run migrate:new-city recife educacao,saude,conteudo
```

### Step 3: Verify

Check the `cities` table:
```sql
SELECT slug, name, db_url FROM public.cities WHERE slug = 'recife';
```

### Step 4: Update Application

The frontend automatically detects `db_url` and routes requests to the correct Neon database.

---

## File Structure

```
server/migrations/
├── config/
│   ├── modules.ts                  # Module → Tables mapping
│   └── control-plane-tables.ts     # Tables that stay in Supabase
├── utils/
│   ├── connections.ts              # Database connection pools
│   ├── schema-reader.ts            # Read table schemas from Supabase
│   ├── ddl-generator.ts            # Generate CREATE TABLE statements
│   ├── data-migrator.ts            # Copy data with batching
│   └── logger.ts                   # Structured migration logs
├── commands/
│   ├── create-neon-database.ts     # Create Neon database
│   ├── sync-module-schema.ts       # Replicate table schemas
│   ├── migrate-module-data.ts      # Copy table data
│   ├── provision-afogados.ts       # Migrate Afogados (orchestrator)
│   ├── provision-new-city.ts       # Create new city database
│   └── enable-module.ts            # Add module to existing city
├── index.ts                        # CLI entry point
└── README.md                       # This file
```

---

## Module Mapping

| Module | Tables |
|--------|--------|
| **educacao** | schools, students, teachers, school_classes, student_enrollments, ideb_data, scheduled_assessments, student_assessments |
| **saude** | health_units, appointments |
| **conteudo** | news, events, stories, campaign_banners, gallery_albums, live_streams, podcasts |
| **ouvidoria** | ombudsman_protocols |
| **rh** | employee_timeclock, employee_absences, employee_audit_log |
| **transparencia** | transferencias_federais, orcamento_educacao, advertising_expenses |
| **comunicacao** | social_media_accounts, social_media_posts, social_media_api_keys |
| **infraestrutura** | api_cache, notifications, report_requests |

---

## Troubleshooting

### Connection Errors

**Problem:** "Connection string not provided"
**Solution:** Verify environment variables are set correctly

```bash
echo $SUPABASE_DB_URL
echo $NEON_ADMIN_URL
```

### Schema Sync Fails

**Problem:** Foreign key constraint errors
**Solution:** Migrations create tables in dependency order automatically. If issues persist, check for circular dependencies.

### Data Migration Stalls

**Problem:** Migration seems stuck
**Solution:** Large tables (>100k rows) may take time. Check logs for progress.

**Reduce batch size:**
```bash
npm run migrate:provision -- --batch-size 500
```

### City Not Found

**Problem:** "City not found in cities table"
**Solution:** Create the city record in Control Plane first:

```sql
INSERT INTO public.cities (name, slug, logo_url, primary_color, secondary_color, accent_color)
VALUES ('City Name', 'city-slug', 'logo.png', '#004AAD', '#F5C842', '#FFFFFF');
```

---

## Data Isolation Strategy

### Afogados (Migrated City)

**Problem:** Afogados data exists in Supabase **without** `city_id` column.

**Solution:** Migration filters by `WHERE city_id IS NULL` to extract only Afogados legacy data.

### New Cities

**Future data** will include `city_id` column to support:
1. Gradual rollout (data in Supabase before Neon migration)
2. Data sharing across cities (if needed)
3. Rollback safety

**Migration for new cities:**
```typescript
// When migrating data for 'recife' from Supabase
WHERE city_id = 'recife-uuid'
```

---

## Next Steps

After provisioning cities:

1. **Update Application Router**: Frontend automatically detects `db_url` from `cities` table
2. **Enable Modules Dynamically**: Use `enable:module` command
3. **Monitor Performance**: Each city database can be scaled independently in Neon
4. **Custom Domains**: Map domains to city slugs (Phase 4)

---

## Safety Features

✅ **Idempotent**: Safe to re-run migrations (skips existing data)  
✅ **Non-Destructive**: Original Supabase data remains intact  
✅ **Batched Transfers**: Large datasets migrated in chunks  
✅ **Transaction Safety**: Schema changes wrapped in transactions  
✅ **Connection Pooling**: Efficient database connection management  
✅ **Structured Logging**: Detailed progress tracking per module/table  

---

## Support

For questions or issues:
1. Check logs for error details
2. Verify environment variables
3. Test connections: `npm run migrate:test-connections`
4. Review module mapping in `config/modules.ts`

---

**Built with ❤️ for Brazilian municipalities**
