# Conecta - Multi-Tenant Portal do Cidadão

## Overview

Conecta is a white-label multi-tenant citizen portal platform for Brazilian municipalities, designed to provide digital access to government services across various departments. Built as a Progressive Web App (PWA) with a mobile-first approach, it features a sophisticated multi-role architecture allowing users to hold multiple roles simultaneously. The platform supports extensive administrative capabilities for content, user, and service management, with dynamic branding and theming for each city.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18+ and TypeScript, using Vite for development and bundling. Styling is handled by Tailwind CSS with a custom design system and shadcn/ui components. State management uses TanStack Query for server state and local React state for UI. It's a PWA with service workers for offline capabilities and push notifications, and features a component-based architecture, protected routes with role-based access control, real-time data synchronization via Supabase subscriptions, and optimistic UI updates. Dynamic theming based on city configuration is implemented using a custom ThemeProvider and CSS variables.

### Backend Architecture

Supabase serves as the backend-as-a-service, providing a PostgreSQL database with Row Level Security (RLS), real-time subscriptions, authentication, authorization, and file storage. The data model includes core tables for `profiles`, `roles`, `user_roles`, `user_relationships`, and `student_enrollments`, supporting a sophisticated multi-role system where users can hold multiple roles and access is controlled by these roles. Security is managed through Supabase RLS, server-side security, data masking functions for sensitive information, and Zod for validation.

### Multi-Tenant Architecture (White Label Platform)

The platform supports multi-tenancy through dynamic theming and content. City configurations (name, slug, logo, colors) are stored in a `cities` table in Supabase Control Plane. A custom Vite plugin exposes a theme API, and a React hook (`useCityTheme`) fetches this data. A `ThemeProvider` component then converts HEX colors to HSL and injects them as global CSS variables, enabling automatic styling throughout the application.

#### Multi-Domain Context Detection

The system uses a sophisticated domain detection mechanism that supports both production domains and development query parameters:

**Core Files:**
- `src/core/domain-context.ts` - Detects current application context from hostname/query params
- `src/core/Bootstrap.tsx` - Root component that renders appropriate AppShell based on context
- `src/hooks/useCityBySubdomain.ts` - Fetches city data with graceful slug fallback

**Domain Contexts:**
1. **ROOT** (`urbanbyte.com.br`) - Marketing/institutional website
2. **MASTER** (`dash.urbanbyte.com.br` or `?mode=dash`) - UrbanByte Control Center
3. **COLLABORATOR** (`colaborador.urbanbyte.com.br` or `?mode=colaborador`) - Team panel
4. **PARTNER** (`parceiro.urbanbyte.com.br` or `?mode=parceiro`) - Partner panel
5. **CITY** (`{city}.urbanbyte.com.br` or `?mode=city&subdomain={city}`) - City portals

**Development Mode:**
- Query params (`?mode=dash`, `?mode=city`) override hostname detection
- Only works in dev environments (localhost, *.replit.dev) for security
- DEV test button available in city portal to switch between modes
- Bootstrap uses `useLocation()` + `useMemo()` to react to query param changes

**City Resolution:**
- Primary: Uses `subdomain` column from cities table
- Fallback: Maps slug to full subdomain (e.g., "afogados" → "afogados-da-ingazeira")
- Graceful degradation during schema transition period

**Type Safety:**
- Cities table definition in `src/integrations/supabase/types.ts`
- All CRUD operations are type-safe via TypeScript

## External Dependencies

### Primary Services

-   **Supabase**: PostgreSQL database, authentication (JWT), real-time subscriptions, file storage, and Edge Functions (e.g., facial-recognition, realtime-token, social-media-publish).

### Third-Party Libraries

-   **UI Components**: Radix UI primitives.
-   **PDF Generation**: jsPDF and html2canvas.
-   **QR Codes**: qrcode.
-   **Date Handling**: date-fns.
-   **Form Validation**: react-hook-form with Zod.
-   **Icons**: Lucide React, Font Awesome.
-   **Carousel**: embla-carousel-react.
-   **Voice Interface**: WebRTC.

### Integrations

-   **Social Media**: Facebook, Instagram, Twitter, LinkedIn APIs for auto-publishing and OAuth-based authentication.
-   **Notifications**: Supabase Realtime for real-time notifications, service workers for push notifications, email, and WhatsApp for alerts.
-   **Analytics & Monitoring**: Basic statistics tracking and usage metrics for the admin dashboard.

## Deployment Configuration

This project is configured for **Replit Autoscale** deployment with production-ready settings.

### Configuration Files

**`.replit`**:
```toml
modules = ["nodejs-20", "web"]

[deployment]
deploymentTarget = "autoscale"
run = ["npm", "run", "start"]
build = ["npm", "run", "build"]
```

### Steps to Deploy

⚠️ **CRITICAL**: Autoscale deployments **DO NOT** automatically inherit workspace secrets. You must manually sync them.

**Step 1: Add Secrets to Workspace** (if not done yet)
- Click the 🔒 "Secrets" icon in the left sidebar
- Add these required secrets:
  - `SUPABASE_URL`: `https://hqhjbelcouanvcrqudbj.supabase.co`
  - `SUPABASE_ANON_KEY`: Get from Supabase Dashboard > Settings > API

**Step 2: Test Build Locally** (recommended)
```bash
npm run build && npm run start
```
This catches missing env vars before deploying.

**Step 3: Open Publishing Interface**
- Click "Publishing" tab at the top of Replit
- Or click "Deploy" button

**Step 4: Sync Secrets to Production** ⚠️ **MOST IMPORTANT STEP**

In the Publishing interface:

a. Scroll down to the **"Production app secrets"** section

b. You'll see a warning: **"X workspace secrets are missing from this environment"**

c. Under that warning, you'll see a list of secrets that need to be synced:
   - `SUPABASE_URL` with a **"+ Add secret"** button
   - `SUPABASE_ANON_KEY` with a **"+ Add secret"** button

d. For each secret, click the **"+ Add secret"** button next to it
   - This copies the value from your workspace secrets to the deployment
   - The secret will now show as `••••••••` indicating it's synced

e. Repeat until the "X secrets out of sync" warning disappears

**Required secrets for deployment**:
- ✅ `SUPABASE_URL` (mandatory)
- ✅ `SUPABASE_ANON_KEY` (mandatory)

**Step 5: Configure Deployment**
- Verify "Build command": `npm run build`
- Verify "Run command": `npm run start`
- Choose machine size (CPU/RAM) - Start with smallest, scale up if needed
- Set max machines for autoscaling (e.g., 3-5)

**Step 6: Publish**
- Click the blue **"Publish"** button (bottom right)
- Wait for build to complete (~30-60 seconds)
- Monitor progress in "Overview" > "Logs"

### Common Deployment Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "SUPABASE_URL is required" | Secrets not synced to deployment | Go back to Step 4, click "+ Add secret" |
| "Build failed" | npm build error | Run `npm run build` locally to see full error |
| "X secrets out of sync" | Haven't clicked "+ Add secret" buttons | Must manually sync each secret in Publishing UI |
| "Cannot validate database migrations - stage already exists" | Migration system conflict | **FIXED** - `.deployignore` now excludes migrations |

**Post-Deployment**:
- Monitor deployment logs for errors
- Verify database connections
- Test authentication flow
- Validate PWA installation on mobile devices

## Deploy Optimization

### .deployignore

The `.deployignore` file excludes development-only files from production deploys, reducing bundle size and preventing validation conflicts.

**What's excluded**:

1. **Migration System** (`server/migrations/`)
   - CLI tool for provisioning new city databases
   - Not needed in production (servers connect to pre-migrated databases)
   - **Prevents "stage already exists" error** during Replit validation

2. **Test Files** (`*.test.ts`, `*.spec.ts`)
   - Unit and integration tests
   - Only needed during development

3. **Development Documentation** (`.env.example`, `TODO.md`)
   - Example files and notes
   - Not required for running the app

**Why this matters**:

✅ **Faster deploys** - Smaller bundle uploads faster  
✅ **No migration conflicts** - Replit won't try to validate custom CLI migrations  
✅ **Cleaner production** - Only runtime code in prod environment  
✅ **Better security** - No test data or example configs exposed

The migration system remains available in the workspace for manual city provisioning via the CLI (`npm run migrate provision:city <slug>`).