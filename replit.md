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

The platform supports multi-tenancy through dynamic theming and content. City configurations (name, slug, logo, colors) are stored in a `cities` table in Supabase. A custom Vite plugin exposes a theme API, and a React hook (`useCityTheme`) fetches this data. A `ThemeProvider` component then converts HEX colors to HSL and injects them as global CSS variables, enabling automatic styling throughout the application. Future phases include dynamic PWA manifest colors, separate PostgreSQL databases per city (e.g., via Neon), and custom domain support.

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