/**
 * DomainGuard Component
 * 
 * Protects routes based on domain context and user role.
 * Wrapper component that validates access and redirects if necessary.
 */

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDomainContext } from '@/hooks/useDomainContext';
import { usePlatformUser } from '@/hooks/usePlatformUser';
import { validateDomainAccess, getAccessDenialMessage } from './domain-access';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogIn } from 'lucide-react';

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
  const context = useDomainContext();
  const { data: platformUser, isLoading } = usePlatformUser({ enabled: true });
  const [accessResult, setAccessResult] = useState<ReturnType<typeof validateDomainAccess> | null>(null);

  useEffect(() => {
    if (!isLoading) {
      const result = validateDomainAccess(context, platformUser?.role || null);
      setAccessResult(result);
    }
  }, [context, platformUser, isLoading]);

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
    // If redirectTo is provided, redirect
    if (accessResult.redirectTo) {
      window.location.href = accessResult.redirectTo;
      return null;
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
            <div className="flex gap-2">
              <Button onClick={() => window.location.href = '/auth'} className="flex-1">
                <LogIn className="h-4 w-4 mr-2" />
                Fazer Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="flex-1"
              >
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access granted
  return <>{children}</>;
}

/**
 * Simple hook version for programmatic access checking
 */
export function useDomainAccess() {
  const context = useDomainContext();
  const { data: platformUser, isLoading } = usePlatformUser({ enabled: true });

  if (isLoading) {
    return { allowed: null, isLoading: true };
  }

  const result = validateDomainAccess(context, platformUser?.role || null);
  return { ...result, isLoading: false };
}
