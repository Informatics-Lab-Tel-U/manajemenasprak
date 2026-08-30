'use server';

import { createClient } from '@/lib/supabase/server';

export interface MfaFactorInfo {
  id: string;
  friendlyName?: string;
  factorType: string;
  status: string;
}

export interface MfaStatusResponse {
  currentLevel: 'aal1' | 'aal2' | null;
  nextLevel: 'aal1' | 'aal2' | null;
  enrolledFactors: MfaFactorInfo[];
  hasVerifiedFactor: boolean;
}

/**
 * Mengambil status level autentikasi (AAL) dan daftar MFA factors pengguna.
 */
export async function getMfaStatus(): Promise<{ data?: MfaStatusResponse; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalError) {
      return { error: aalError.message };
    }

    const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();
    if (factorError) {
      return { error: factorError.message };
    }

    const totpFactors = factorData.totp || [];
    const verifiedFactors = totpFactors.filter((f) => f.status === 'verified');

    return {
      data: {
        currentLevel: aalData.currentLevel,
        nextLevel: aalData.nextLevel,
        enrolledFactors: totpFactors.map((f) => ({
          id: f.id,
          friendlyName: f.friendly_name,
          factorType: f.factor_type,
          status: f.status,
        })),
        hasVerifiedFactor: verifiedFactors.length > 0,
      },
    };
  } catch (err: any) {
    console.error('[MFA Action] getMfaStatus error:', err);
    return { error: err.message || 'Gagal memeriksa status 2FA' };
  }
}

/**
 * Memulai pendaftaran TOTP baru. Mengembalikan QR Code SVG dan secret key.
 */
export async function enrollTotp(): Promise<{
  data?: {
    id: string;
    qrCode: string;
    secret: string;
    uri: string;
  };
  error?: string;
  alreadyEnrolled?: boolean;
}> {
  try {
    const supabase = await createClient();

    // 1. Cek faktor yang sudah ada
    const { data: factorData } = await supabase.auth.mfa.listFactors();
    const totpFactors = factorData?.totp || [];

    // Jika sudah ada yang verified, jangan buat baru
    const verifiedFactor = totpFactors.find((f) => f.status === 'verified');
    if (verifiedFactor) {
      return { alreadyEnrolled: true };
    }

    // Bersihkan faktor lama yang belum selesai diverifikasi (unverified)
    const unverifiedFactors = totpFactors.filter((f) => (f.status as string) === 'unverified');
    for (const factor of unverifiedFactors) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }

    // 2. Buat faktor TOTP baru
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'Informatics Lab Tel-U',
    });

    if (error) {
      return { error: error.message };
    }

    return {
      data: {
        id: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      },
    };
  } catch (err: any) {
    console.error('[MFA Action] enrollTotp error:', err);
    return { error: err.message || 'Gagal mendaftarkan 2FA' };
  }
}

/**
 * Memverifikasi 6-digit OTP untuk menaikkan sesi ke AAL2.
 */
export async function verifyTotp(factorId: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanCode = code.trim().replace(/\s+/g, '');
    if (cleanCode.length !== 6) {
      return { success: false, error: 'Kode autentikasi harus 6 digit angka.' };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: cleanCode,
    });

    if (error) {
      return { success: false, error: 'Kode autentikasi tidak valid atau telah kedaluwarsa.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[MFA Action] verifyTotp error:', err);
    return { success: false, error: err.message || 'Gagal memverifikasi kode 2FA' };
  }
}

/**
 * Menghapus/menonaktifkan factor TOTP (hanya bisa dilakukan jika sudah di level AAL2).
 */
export async function unenrollTotp(factorId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[MFA Action] unenrollTotp error:', err);
    return { success: false, error: err.message || 'Gagal menonaktifkan 2FA' };
  }
}
