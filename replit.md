# Conecta - Multi-Tenant Portal do Cidadão

## Overview

**Conecta** is a white-label multi-tenant citizen portal platform for Brazilian municipalities. Initially developed for Afogados da Ingazeira, Pernambuco, it is being transformed into a scalable platform that can serve multiple cities with customized branding (logos, colors, content).

The application provides digital access to government services across multiple departments (secretarias), including health, education, social assistance, culture, public works, and more. The platform supports multiple user roles with a sophisticated multi-role architecture that allows users to hold multiple roles simultaneously (e.g., a user can be both a parent and a teacher).

The application is built as a Progressive Web App (PWA) with mobile-first design, real-time notifications, and extensive administrative capabilities for managing content, users, and services.

**Current Status**: Phase 1 & 2 complete - Dynamic logo, city name, and global color theming based on city slug.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type safety
- Vite as the build tool and development server
- React Router for client-side routing with protected routes
- Tailwind CSS for styling with a custom design system
- shadcn/ui component library built on Radix UI primitives

**State Management**
- TanStack Query (React Query) for server state management and caching
- Local React state (useState, useContext) for UI state
- Custom hooks for reusable logic (useUserRole, useInactivityTimer, useRealtimeSubscription)

**Progressive Web App (PWA)**
- Service worker for offline capabilities and push notifications
- Dynamic PWA manifest generation based on admin settings
- Installable on mobile devices with custom icons and theme colors
- Configured via vite-plugin-pwa

**Key Design Patterns**
- Component-based architecture with clear separation of concerns
- Protected routes using role-based access control
- Real-time data synchronization using Supabase subscriptions
- Optimistic UI updates with automatic cache invalidation
- Theme system supporting light/dark modes with persistent storage

### Backend Architecture

**Database: Supabase (PostgreSQL)**

The application uses Supabase as the backend-as-a-service, providing:
- PostgreSQL database with Row Level Security (RLS)
- Real-time subscriptions for live data updates
- Authentication and authorization
- Edge functions for serverless operations
- File storage for media assets

**Data Model - Core Tables**

1. **profiles** - Single source of truth for user data
   - Stores: full_name, email, telefone, cpf, avatar_url, endereco_completo
   - All user personal data MUST be stored and read from this table
   - Never rely solely on user_metadata

2. **roles** - Centralized role definitions
   - Available roles: cidadao, admin, prefeito, secretario, professor, aluno, pai
   - Supports secretaria-specific roles via secretaria_slug
   - Contains permissions (JSONB) and descriptions

3. **user_roles** - Many-to-many user-role relationships
   - Links users to multiple roles simultaneously
   - Contains metadata (JSONB) for role-specific data
   - Maintains legacy enum for compatibility

4. **user_relationships** - User-to-user relationships
   - Parent-child relationships (pai, mae, filho, responsavel, tutor)
   - Supports complex family structures
   - Metadata (JSONB) for additional relationship info

5. **student_enrollments** - Student academic records
   - Matricula (enrollment number), school, grade, class
   - Grades and attendance stored as JSONB
   - Status tracking (active, inactive, transferred)

**Multi-Role Architecture**

The system implements a sophisticated multi-role system where:
- Users can hold multiple roles simultaneously
- Role-based navigation dynamically shows relevant panels
- Protected routes check for appropriate role access
- Secretary assignments link users to specific secretarias
- Parent-student relationships enable family access to educational data

**Security Considerations**

- Client-side encryption was DEPRECATED due to security vulnerabilities (exposed keys)
- Relies on Supabase RLS and server-side security
- Data masking functions (maskCPF, maskRG, maskNIS, maskPhone) for sensitive data display
- Validation schemas using Zod for form data integrity
- Protected routes with role-based access control

### External Dependencies

**Primary Services**

1. **Supabase** (hqhjbelcouanvcrqudbj.supabase.co)
   - PostgreSQL database
   - Authentication (JWT-based)
   - Real-time subscriptions via WebSocket
   - File storage for images and documents
   - Edge Functions for serverless operations (facial-recognition, realtime-token, social-media-publish)

2. **Social Media Integration**
   - Facebook, Instagram, Twitter, LinkedIn APIs
   - Auto-publishing capabilities for news and events
   - OAuth-based authentication for connected accounts
   - Stored in social_media_accounts and social_media_posts tables

**Third-Party Libraries**

- **UI Components**: Radix UI primitives (dialogs, dropdowns, tooltips, etc.)
- **PDF Generation**: jsPDF and html2canvas for report generation
- **QR Codes**: qrcode library for generating QR codes
- **Date Handling**: date-fns for date formatting and manipulation
- **Form Validation**: react-hook-form with @hookform/resolvers and Zod schemas
- **Icons**: Lucide React for modern icons, Font Awesome via CDN
- **Carousel**: embla-carousel-react for image galleries
- **Voice Interface**: WebRTC for real-time voice communication

**File Upload & Storage**
- Images stored in Supabase Storage buckets
- Support for multiple image galleries (gallery_images JSONB array)
- Profile avatars and document attachments
- File size validation and compression

**Notifications**
- Real-time notifications via Supabase Realtime
- Push notifications through service worker
- Email notifications (configured per user preference)
- WhatsApp integration for alerts

**Analytics & Monitoring**
- Statistics tracking for admin dashboard
- Usage metrics for services and content
- Real-time user activity monitoring

**Development & Deployment**
- Lovable.dev as primary development platform
- Git-based version control
- Environment variables for sensitive configuration
- Development and production build modes

## Multi-Tenant Architecture (White Label Platform)

### Phase 1: Dynamic Theming (COMPLETED ✅)

**Implementation**:
- **Control Database**: `cities` table in Supabase stores city configuration (name, slug, logo_url, colors)
- **Theme API**: `/api/cities/:slug/theme` endpoint via Vite plugin (vite-api-plugin.ts)
- **Frontend Hook**: `useCityTheme()` hook with React Query for caching
- **UI Integration**: Dynamic logo and city name in Auth.tsx

**Files**:
- `vite-api-plugin.ts` - Vite middleware serving theme API
- `src/hooks/useCityTheme.ts` - React hook for fetching city themes
- `src/pages/Auth.tsx` - Updated with dynamic branding
- `supabase/migrations/20251114231854_create_cities_table.sql` - Cities table migration

**Current Tenant**: Afogados da Ingazeira (slug: `afogados-da-ingazeira`)

**Testing**:
```bash
curl http://localhost:5000/api/cities/afogados-da-ingazeira/theme
# Returns: {"name":"Afogados da Ingazeira","slug":"afogados-da-ingazeira","logo_url":"...","primary_color":"#004AAD","secondary_color":"#F5C842","accent_color":"#FFFFFF"}
```

**Phase 2: Dynamic Color System (COMPLETED ✅)**

**Implementation**:
- **ThemeProvider**: `src/components/ThemeProvider.tsx` - Component that loads city theme and injects CSS variables globally
- **Color Conversion**: `src/lib/colorUtils.ts` - Converts HEX colors (#004AAD) to HSL format (214 100% 34%)
- **Global Variables**: `--primary`, `--secondary`, `--accent` CSS variables are dynamically set
- **Automatic Styling**: All Tailwind classes (bg-primary, text-secondary, etc.) automatically use city colors

**How It Works**:
1. App.tsx wraps application with `<ThemeProvider>`
2. ThemeProvider calls `useCityTheme()` to fetch city theme
3. Colors are converted from HEX to HSL (Tailwind format)
4. CSS variables are injected via `document.documentElement.style.setProperty()`
5. Entire app respects city colors without prop drilling

**Files**:
- `src/components/ThemeProvider.tsx` - Global theme provider
- `src/lib/colorUtils.ts` - HEX to HSL conversion
- `src/App.tsx` - ThemeProvider integration

**Testing**:
```javascript
// Console output shows:
[ThemeProvider] Applied theme for Afogados da Ingazeira {
  primary: #004AAD → 214 100% 34%,
  secondary: #F5C842 → 45 90% 61%,
  accent: #FFFFFF → 0 0% 100%
}
```

### Future Phases

**Phase 2.1: PWA Manifest Colors (TODO)**
- Dynamic PWA manifest theme_color
- Dynamic icons based on city colors

**Phase 3: Multi-Database (Neon)**
- Separate PostgreSQL database per city
- Central control plane for routing
- Tenant isolation and data privacy
- Database migration tools

**Phase 4: Custom Domains**
- Domain → city slug mapping
- Automatic city detection from hostname
- SSL certificate management per domain

### Technical Notes

**Backend Go (Non-Functional)**:
- A Go backend (`backend/main.go`) was developed but cannot run on Replit due to IPv6 connectivity issues with lib/pq driver
- Workaround: Vite plugin serves the theme API using Node.js (works perfectly)
- Future: Consider deploying Go backend externally (Fly.io, Railway) or migrate to pgx driver

**Architecture Documentation**:
- Full details in `.local/state/replit/agent/multi-tenant-architecture.md`
- Includes schema, API specs, security notes, and migration roadmap

## Deployment & Production

### Build Configuration

**Development**:
```bash
npm run dev        # Vite dev server (port 5000)
```

**Production Build**:
```bash
npm run build      # Creates dist/ folder with optimized assets
npm run start      # Serves built files via Vite preview (port 5000)
```

**Preview**:
```bash
npm run preview    # Test production build locally
```

### Environment Variables

Required secrets (configured in Replit Secrets or production environment):

1. **CONTROL_DB_URL** - Control Plane database (Supabase)
   - Format: `postgresql://[user]:[pass]@db.xxxx.supabase.co:5432/postgres`
   - Used for: cities table, platform_users, global configuration

2. **DATABASE_URL** - Data Plane database (Neon, per city)
   - Format: `postgresql://[user]:[pass]@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - Used for: city-specific data, migrations, CLI tools

**Note**: Frontend Supabase credentials are hardcoded in `src/integrations/supabase/client.ts` (no env vars needed)

See `.env.example` for full documentation.

### Replit Deployment (Autoscale)

**Configuration** (`.replit`):
```toml
[deployment]
deploymentTarget = "autoscale"
run = ["npm", "run", "start"]
build = ["npm", "run", "build"]
```

**Steps to Deploy**:
1. Ensure secrets are configured (DATABASE_URL, CONTROL_DB_URL)
2. Test build locally: `npm run build && npm run start`
3. Click "Deploy" button in Replit
4. Select "Autoscale" deployment
5. Configure machine size (CPU/RAM)
6. Set max number of machines for autoscaling
7. Click "Publish"

**Post-Deployment**:
- Monitor deployment logs for errors
- Verify database connections
- Test authentication flow
- Validate PWA installation on mobile devices

### Migration & Database Management

**CLI Commands**:
```bash
# Test database connections
npm run migrate:test-connections

# Provision new city
npm run migrate:new-city

# Enable module for city
npm run migrate:enable-module

# List available modules
npm run migrate:list-modules
```

**Migration System**:
- Control Plane (Supabase): Manual migrations in `supabase/migrations/`
- Data Plane (Neon): CLI-driven schema sync via `server/migrations/`
- Schema versioning tracked per city in `schema_versions` table

### Production Checklist

Before deploying to production:

- [ ] All Supabase migrations applied (`supabase db push`)
- [ ] Control Plane database accessible (CONTROL_DB_URL)
- [ ] Data Plane database accessible (DATABASE_URL)
- [ ] Environment secrets configured
- [ ] Build succeeds without errors (`npm run build`)
- [ ] Start script works locally (`npm run start`)
- [ ] PWA manifest configured correctly
- [ ] Service worker registered (offline support)
- [ ] SSL certificates valid (HTTPS)
- [ ] Authentication flow tested
- [ ] Role-based access control verified
- [ ] Real-time subscriptions working
- [ ] File uploads functional

### Monitoring & Maintenance

**Health Checks**:
- Monitor Replit deployment status
- Check Supabase database health
- Verify Neon database connections
- Monitor API response times
- Track error rates in logs

**Regular Maintenance**:
- Review and apply Supabase migrations
- Update city configurations
- Clean up old logs and temporary files
- Monitor storage usage
- Update dependencies (npm update)