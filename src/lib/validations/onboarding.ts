import { z } from 'zod';

// ============================================================================
// TAHUN AJARAN VALIDATION
// ============================================================================

/**
 * Validasi format tahun ajaran
 * Format yang diterima: "2024/2025 Ganjil", "2024/2025 Genap", "2425-1", "2425-2"
 * Fleksibel untuk berbagai format yang umum digunakan
 */
export const tahunAjaranSchema = z
  .string()
  .min(1, 'Tahun ajaran tidak boleh kosong')
  .refine(
    (val) => {
      // Format: "2024/2025 Ganjil" atau "2024/2025 Genap"
      const fullFormat = /^\d{4}\/\d{4}\s?(Ganjil|Genap)$/i.test(val);
      // Format: "2425-1" atau "2425-2"
      const shortFormat = /^\d{4}-[12]$/i.test(val);
      // Format: "2024/2025" saja
      const yearOnly = /^\d{4}\/\d{4}$/.test(val);
      // Format: "2425 Ganjil" atau "2425 Genap"
      const shortYearFormat = /^\d{4}\s?(Ganjil|Genap)$/i.test(val);

      return fullFormat || shortFormat || yearOnly || shortYearFormat;
    },
    {
      message:
        'Format tahun ajaran tidak valid. Contoh: "2024/2025 Ganjil", "2425-1", atau "2024/2025"',
    }
  );

// ============================================================================
// PRAKTIKUM VALIDATION
// ============================================================================

export const praktikumSchema = z.object({
  nama: z
    .string()
    .min(1, 'Nama praktikum tidak boleh kosong')
    .min(2, 'Nama praktikum minimal 2 karakter')
    .max(100, 'Nama praktikum maksimal 100 karakter')
    .transform((val) => val.trim().toUpperCase()),
  tahun_ajaran: tahunAjaranSchema,
});

export const praktikumBulkSchema = z.array(praktikumSchema).min(1, 'Minimal 1 data praktikum');

// ============================================================================
// MATA KULIAH VALIDATION
// ============================================================================

const programStudiOptions = ['Informatika', 'Sistem Informasi', 'Teknik Komputer'] as const;

export const mataKuliahSchema = z.object({
  nama_lengkap: z
    .string()
    .min(1, 'Nama mata kuliah tidak boleh kosong')
    .min(3, 'Nama mata kuliah minimal 3 karakter')
    .max(200, 'Nama mata kuliah maksimal 200 karakter')
    .transform((val) => val.trim()),
  program_studi: z
    .string()
    .min(1, 'Program studi tidak boleh kosong')
    .refine((val) => programStudiOptions.some((opt) => val.includes(opt)), {
      message: `Program studi harus salah satu dari: ${programStudiOptions.join(', ')}`,
    }),
  dosen_koor: z.string().max(100, 'Nama dosen maksimal 100 karakter').optional(),
});

export const mataKuliahWithPraktikumSchema = mataKuliahSchema.extend({
  id_praktikum: z.string().uuid('ID Praktikum tidak valid'),
});

// ============================================================================
// COPY VALIDATION
// ============================================================================

export const copyTahunAjaranSchema = z.object({
  sourceTerm: z.string().min(1, 'Tahun ajaran sumber tidak boleh kosong'),
  targetTerm: tahunAjaranSchema,
  options: z.object({
    copyPraktikum: z.boolean().default(true),
    copyMataKuliah: z.boolean().default(true),
    copyAsprakAssignments: z.boolean().default(false),
  }),
});

// ============================================================================
// ONBOARDING STATE VALIDATION
// ============================================================================

export type OnboardingStep = 'praktikum' | 'matkul' | 'jadwal' | 'selesai';

export const onboardingStepSchema = z.enum(['praktikum', 'matkul', 'jadwal', 'selesai']);

export const onboardingDraftSchema = z.object({
  currentStep: onboardingStepSchema,
  completedSteps: z.array(onboardingStepSchema),
  praktikumData: praktikumSchema.optional(),
  mataKuliahData: z.array(mataKuliahWithPraktikumSchema).optional(),
  lastUpdated: z.string().optional(),
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse dan validasi data praktikum dari CSV/Excel
 */
export function parsePraktikumRows(data: Record<string, unknown>[]): {
  success: boolean;
  data?: z.infer<typeof praktikumBulkSchema>;
  errors?: { row: number; message: string }[];
} {
  const errors: { row: number; message: string }[] = [];
  const validData: z.infer<typeof praktikumBulkSchema> = [];

  data.forEach((row, index) => {
    const nama = row.nama_singkat || row.nama_lengkap || row.nama || row['Nama Singkat'] || '';
    const tahun_ajaran = row.tahun_ajaran || row['Tahun Ajaran'] || '';

    const result = praktikumSchema.safeParse({
      nama: String(nama),
      tahun_ajaran: String(tahun_ajaran),
    });

    if (result.success) {
      validData.push(result.data);
    } else {
      errors.push({
        row: index + 1,
        message: result.error.issues.map((e: any) => e.message).join(', '),
      });
    }
  });

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: validData };
}

/**
 * Cek apakah tahun ajaran sudah ada di database
 */
export function validateUniqueTahunAjaran(
  tahunAjaran: string,
  existingTerms: string[]
): { valid: boolean; message?: string } {
  if (existingTerms.includes(tahunAjaran)) {
    return {
      valid: false,
      message: `Tahun ajaran "${tahunAjaran}" sudah ada dalam sistem`,
    };
  }
  return { valid: true };
}

/**
 * Normalize tahun ajaran format
 * Mengubah berbagai format menjadi format standar: "2024/2025 Ganjil"
 */
export function normalizeTahunAjaran(input: string): string {
  const trimmed = input.trim();

  // Sudah format standar
  if (/^\d{4}\/\d{4}\s?(Ganjil|Genap)$/i.test(trimmed)) {
    return trimmed.replace(/\s+/g, ' ');
  }

  // Format "2425-1" atau "2425-2"
  const shortFormat = trimmed.match(/^(\d{2})(\d{2})-([12])$/i);
  if (shortFormat) {
    const year1 = `20${shortFormat[1]}`;
    const year2 = `20${shortFormat[2]}`;
    const semester = shortFormat[3] === '1' ? 'Ganjil' : 'Genap';
    return `${year1}/${year2} ${semester}`;
  }

  // Format "2425 Ganjil" atau "2425 Genap"
  const shortYearFormat = trimmed.match(/^(\d{2})(\d{2})\s?(Ganjil|Genap)$/i);
  if (shortYearFormat) {
    const year1 = `20${shortYearFormat[1]}`;
    const year2 = `20${shortYearFormat[2]}`;
    const semester = shortYearFormat[3];
    return `${year1}/${year2} ${semester}`;
  }

  // Format "2024/2025" tanpa semester
  if (/^\d{4}\/\d{4}$/.test(trimmed)) {
    return `${trimmed} Ganjil`; // Default ke Ganjil
  }

  return trimmed;
}

/**
 * Get semester dari tahun ajaran
 */
export function getSemesterFromTahunAjaran(tahunAjaran: string): 1 | 2 {
  if (/ganjil/i.test(tahunAjaran) || tahunAjaran.endsWith('-1')) {
    return 1;
  }
  return 2;
}

/**
 * Get year range dari tahun ajaran
 */
export function getYearRangeFromTahunAjaran(
  tahunAjaran: string
): { startYear: number; endYear: number } | null {
  const match = tahunAjaran.match(/(\d{4})\/(\d{4})/);
  if (match) {
    return {
      startYear: parseInt(match[1]),
      endYear: parseInt(match[2]),
    };
  }

  const shortMatch = tahunAjaran.match(/^(\d{2})(\d{2})/);
  if (shortMatch) {
    return {
      startYear: parseInt(`20${shortMatch[1]}`),
      endYear: parseInt(`20${shortMatch[2]}`),
    };
  }

  return null;
}
