/**
 * DEPRECATED: Este arquivo foi movido para encryption.deprecated.ts
 * 
 * SECURITY WARNING: Client-side encryption with hardcoded keys is NOT secure.
 * The encryption key was exposed in the client-side code, making all encrypted data vulnerable.
 * 
 * RECOMMENDATION: Rely on Supabase RLS and server-side encryption for sensitive data.
 * Do NOT use this encryption library for sensitive data like CPF, phone numbers, etc.
 * 
 * This file is kept for reference only and should not be used.
 */

// Chave de criptografia - em produção, isso deveria vir de uma variável de ambiente
// Para este exemplo, usamos uma chave derivada do projeto
const ENCRYPTION_KEY = 'conecta-afogados-2024-secure-key-v1';

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Criptografa um texto usando AES-GCM
 * @deprecated Use server-side encryption instead
 */
export async function encryptData(text: string): Promise<string> {
  console.warn('DEPRECATED: encryptData() should not be used. Use server-side encryption instead.');
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Combina IV e dados criptografados
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Retorna como base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Erro ao criptografar dados:', error);
    throw new Error('Falha na criptografia');
  }
}

/**
 * Descriptografa um texto criptografado com AES-GCM
 * @deprecated Use server-side decryption instead
 */
export async function decryptData(encryptedText: string): Promise<string> {
  console.warn('DEPRECATED: decryptData() should not be used. Use server-side decryption instead.');
  try {
    // Decodifica base64
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const key = await getKey();
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error);
    throw new Error('Falha na descriptografia');
  }
}

/**
 * Mascara um CPF parcialmente para exibição
 * Exemplo: 123.456.789-00 -> ***.***.789-00
 */
export function maskCPF(cpf: string): string {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  
  return `***.***.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

/**
 * Mascara um telefone parcialmente para exibição
 * Exemplo: (83) 99999-9999 -> (83) ****-9999
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 8) return phone;
  
  const lastDigits = cleaned.slice(-4);
  const ddd = cleaned.slice(0, 2);
  return `(${ddd}) ****-${lastDigits}`;
}

/**
 * Formata CPF para exibição
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata telefone para exibição
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}
