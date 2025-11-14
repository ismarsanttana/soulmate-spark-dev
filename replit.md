# Conecta Afogados - Portal do Cidadão

## Overview

Conecta Afogados is a comprehensive citizen portal for the municipality of Afogados da Ingazeira, Pernambuco, Brazil. It provides digital access to government services across multiple departments (secretarias), including health, education, social assistance, culture, public works, and more. The platform supports multiple user roles with a sophisticated multi-role architecture that allows users to hold multiple roles simultaneously (e.g., a user can be both a parent and a teacher).

The application is built as a Progressive Web App (PWA) with mobile-first design, real-time notifications, and extensive administrative capabilities for managing content, users, and services.

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