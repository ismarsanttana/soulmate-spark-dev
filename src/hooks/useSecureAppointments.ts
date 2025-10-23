import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { encryptData, decryptData } from "@/lib/encryption";
import { toast } from "sonner";

interface AppointmentData {
  full_name: string;
  cpf: string;
  phone: string;
  specialty: string;
  preferred_date: string;
  preferred_time: string;
  notes?: string;
}

interface SecureAppointment {
  id: string;
  full_name: string;
  cpf: string;
  phone: string;
  specialty: string;
  preferred_date: string;
  preferred_time: string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Registra acesso a um agendamento para auditoria
 */
async function logAppointmentAccess(
  appointmentId: string,
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('appointments_audit').insert({
      appointment_id: appointmentId,
      user_id: user.id,
      action,
      ip_address: null, // Pode ser capturado via API externa se necessário
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
}

/**
 * Hook para buscar agendamentos com descriptografia automática
 */
export function useSecureAppointments() {
  return useQuery({
    queryKey: ['secure-appointments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Registrar acesso para auditoria
      if (data && data.length > 0) {
        for (const appointment of data) {
          await logAppointmentAccess(appointment.id, 'SELECT');
        }
      }

      // Descriptografar dados sensíveis
      const decryptedData: SecureAppointment[] = await Promise.all(
        (data || []).map(async (appointment) => {
          try {
            // Verifica se os dados já estão criptografados (começam com caracteres base64)
            const cpfDecrypted = appointment.cpf.length > 20 
              ? await decryptData(appointment.cpf) 
              : appointment.cpf;
            
            const phoneDecrypted = appointment.phone.length > 20
              ? await decryptData(appointment.phone)
              : appointment.phone;

            return {
              ...appointment,
              cpf: cpfDecrypted,
              phone: phoneDecrypted,
            };
          } catch {
            // Se falhar a descriptografia, retorna os dados originais
            return appointment;
          }
        })
      );

      return decryptedData;
    },
  });
}

/**
 * Hook para criar agendamento com criptografia automática
 */
export function useCreateSecureAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData: AppointmentData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Criptografar dados sensíveis
      const encryptedCPF = await encryptData(appointmentData.cpf);
      const encryptedPhone = await encryptData(appointmentData.phone);

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          full_name: appointmentData.full_name,
          cpf: encryptedCPF,
          phone: encryptedPhone,
          specialty: appointmentData.specialty,
          preferred_date: appointmentData.preferred_date,
          preferred_time: appointmentData.preferred_time,
          notes: appointmentData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar criação para auditoria
      await logAppointmentAccess(data.id, 'INSERT');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-appointments'] });
      toast.success('Agendamento criado com sucurança!');
    },
    onError: (error) => {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento');
    },
  });
}

/**
 * Hook para atualizar agendamento
 */
export function useUpdateSecureAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SecureAppointment> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Criptografar dados sensíveis se fornecidos
      const updateData: any = { ...updates };
      if (updates.cpf) {
        updateData.cpf = await encryptData(updates.cpf);
      }
      if (updates.phone) {
        updateData.phone = await encryptData(updates.phone);
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Registrar atualização para auditoria
      await logAppointmentAccess(id, 'UPDATE');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-appointments'] });
      toast.success('Agendamento atualizado com segurança!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento');
    },
  });
}

/**
 * Hook para deletar agendamento
 */
export function useDeleteSecureAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Registrar deleção para auditoria antes de deletar
      await logAppointmentAccess(appointmentId, 'DELETE');

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-appointments'] });
      toast.success('Agendamento cancelado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao deletar agendamento:', error);
      toast.error('Erro ao cancelar agendamento');
    },
  });
}
