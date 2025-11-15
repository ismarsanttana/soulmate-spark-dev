import { useDomainContext } from "@/hooks/useDomainContext";
import { usePlatformUser } from "@/hooks/usePlatformUser";
import { validateDomainAccess } from "@/guards/domain-access";

/**
 * Hook wrapper for domain access validation.
 * Returns loading state plus the result from validateDomainAccess.
 */
export function useDomainAccess() {
  const context = useDomainContext();
  const { data: platformUser, isLoading } = usePlatformUser(true);

  if (isLoading) {
    return { allowed: null, isLoading: true };
  }

  const result = validateDomainAccess(context, platformUser?.role || null);
  return { ...result, isLoading: false };
}
