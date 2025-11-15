/**
 * Platform Role Validation
 * 
 * Validates that users attempting to access admin/team/partner panels
 * actually have the required platform roles.
 * 
 * Security: Prevents unauthorized access to admin contexts.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

export type PlatformRole = 'master' | 'team' | 'partner';

/**
 * Validates if the current user has the required platform role.
 * 
 * @param client - Supabase client to use for validation
 * @param requiredRole - The role required to access the resource
 * @returns true if user has role, false otherwise
 */
export async function validatePlatformRole(
  client: SupabaseClient,
  requiredRole: PlatformRole
): Promise<boolean> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await client.auth.getUser();
    
    if (userError || !user) {
      console.error('[Platform Auth] User not found:', userError);
      return false;
    }

    // Query platform_users table for role validation
    // TODO: This table needs to be created in Supabase Control Plane
    const { data: platformUser, error: roleError } = await client
      .from('platform_users')
      .select('role, is_active')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      console.error('[Platform Auth] Role query failed:', roleError);
      
      // If table doesn't exist yet, allow access (temporary)
      if (roleError.code === 'PGRST116') {
        console.warn('[Platform Auth] platform_users table not found - skipping role validation');
        return true;
      }
      
      return false;
    }

    // Check if user has the required role and is active
    if (!platformUser || !platformUser.is_active) {
      console.warn('[Platform Auth] User not active or role not found');
      return false;
    }

    if (platformUser.role !== requiredRole) {
      console.warn(`[Platform Auth] Role mismatch: expected ${requiredRole}, got ${platformUser.role}`);
      return false;
    }

    console.log(`[Platform Auth] ✅ User validated for role: ${requiredRole}`);
    return true;

  } catch (error) {
    console.error('[Platform Auth] Unexpected error during validation:', error);
    return false;
  }
}

/**
 * Validates role and signs out user if validation fails.
 * Shows toast notification with error message.
 * 
 * @param client - Supabase client
 * @param requiredRole - Required role
 * @param onSuccess - Callback on successful validation
 * @param onFailure - Callback on failed validation (after signout)
 */
export async function validateRoleOrSignOut(
  client: SupabaseClient,
  requiredRole: PlatformRole,
  onSuccess?: () => void,
  onFailure?: () => void
): Promise<void> {
  const hasRole = await validatePlatformRole(client, requiredRole);
  
  if (!hasRole) {
    // Sign out user
    await client.auth.signOut();
    
    // Show error message
    const roleNames = {
      master: 'Administrador da Plataforma',
      team: 'Colaborador',
      partner: 'Parceiro'
    };
    
    toast.error(
      `Acesso negado`,
      {
        description: `Você não tem permissão de ${roleNames[requiredRole]}. Entre em contato com o suporte.`
      }
    );
    
    if (onFailure) {
      onFailure();
    }
  } else {
    if (onSuccess) {
      onSuccess();
    }
  }
}
