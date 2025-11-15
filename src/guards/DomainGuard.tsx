/**
 * DomainGuard Component
 * 
 * Protects routes based on domain context and user role.
 * Wrapper component that validates access and redirects if necessary.
 */

import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDomainContext } from '@/hooks/useDomainContext';
import { usePlatformUser } from '@/hooks/usePlatformUser';
import { useAuthContext } from '@/hooks/useAuthContext';
import { validateDomainAccess, getAccessDenialMessage } from './domain-access';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

function preserveSearchParams(target: string) {
  if (!target) return target;
  if (target.startsWith('http') || target.includes('?') || typeof window === 'undefined') {
    return target;
  }
  const currentSearch = window.location.search;
  if (!currentSearch) {
    return target;
  }
  return `${target}${currentSearch}`;
}

interface DomainGuardProps {
  children: React.ReactNode;
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
  /**
   * Custom access denied component
   */
  accessDeniedComponent?: React.ReactNode;
}

/**
 * Domain Guard Component
 * 
 * Wraps content and validates domain access based on user role.
 * 
 * @example
 * ```tsx
 * function MasterAppShell() {
 *   return (
 *     <DomainGuard>
 *       <CompanyDashboard />
 *     </DomainGuard>
 *   );
 * }
 * ```
 */
export function DomainGuard({ 
  children, 
  loadingComponent, 
  accessDeniedComponent 
}: DomainGuardProps) {
  const location = useLocation();
  const context = useDomainContext();
  const client = useAuthContext();
  const shouldBypassGuard = useMemo(
    () => location.pathname.startsWith('/auth'),
    [location.pathname]
  );
  const { data: platformUser, isLoading } = usePlatformUser(!shouldBypassGuard);
  const [accessResult, setAccessResult] = useState<ReturnType<typeof validateDomainAccess> | null>(null);
  const [hasSignedOut, setHasSignedOut] = useState(false);

  useEffect(() => {
    if (shouldBypassGuard) {
      return;
    }

    if (!isLoading) {
      const result = validateDomainAccess(context, platformUser?.role || null);
      setAccessResult(result);
      
      // If access is denied and user has a session, sign them out
      if (!result.allowed && !hasSignedOut) {
        client.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            console.log('[DomainGuard] Signing out user with invalid role for', context.type);
            client.auth.signOut().then(() => {
              setHasSignedOut(true);
              toast.error('Acesso negado', {
                description: result.reason || 'Você não tem permissão para acessar esta área.'
              });
            });
          }
        });
      }
    }
  }, [context, platformUser, isLoading, client, hasSignedOut, shouldBypassGuard]);

  if (shouldBypassGuard) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading || !accessResult) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  // Access denied
  if (!accessResult.allowed) {
    // If redirectTo is provided, redirect using React Router
    if (accessResult.redirectTo) {
      const redirectTarget = preserveSearchParams(accessResult.redirectTo);
      return <Navigate to={redirectTarget} replace />;
    }

    // Otherwise show access denied UI
    if (accessDeniedComponent) {
      return <>{accessDeniedComponent}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <CardTitle>Acesso Negado</CardTitle>
            </div>
            <CardDescription>
              {getAccessDenialMessage(context.type)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {accessResult.reason || 'Você não tem permissão para acessar esta área.'}
            </p>
            <Navigate to={preserveSearchParams('/auth')} replace />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access granted
  return <>{children}</>;
}
