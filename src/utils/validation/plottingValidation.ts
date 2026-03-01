import { PlottingPreviewRow } from '@/components/plotting/PlottingCSVPreview';

export type ExtendedPreviewRow = PlottingPreviewRow & {
  asprakId?: string;
  praktikumId?: string;
};

export function mapPlottingValidationResponse(data: any): ExtendedPreviewRow[] {
  const { validRows, ambiguousRows, invalidRows } = data;

  const mapped: ExtendedPreviewRow[] = [];
  let idx = 0;

  // Valid
  validRows?.forEach((r: any) => {
    mapped.push({
      index: idx++,
      kode_asprak: r.original?.kode_asprak || '???',
      mk_singkat: r.original?.mk_singkat || '???',
      status: 'valid',
      selected: true,
      asprakId: r.asprak_id,
      praktikumId: r.praktikum_id,
    });
  });

  // Ambiguous
  ambiguousRows?.forEach((r: any) => {
    mapped.push({
      index: idx++,
      kode_asprak: r.original.kode_asprak,
      mk_singkat: r.original.mk_singkat,
      status: 'ambiguous',
      message: r.reason,
      candidates: r.candidates,
      selected: true, // Selected by default, but no candidates selected yet
      selectedCandidateIds: [], // Empty initially
      praktikumId: r.praktikum_id,
    });
  });

  // Invalid
  invalidRows?.forEach((r: any) => {
    mapped.push({
      index: idx++,
      kode_asprak: r.original.kode_asprak,
      mk_singkat: r.original.mk_singkat,
      status: 'invalid',
      message: r.reason,
      selected: false,
    });
  });

  return mapped;
}

export function handlePlottingResolve(
  index: number,
  candidateId: string,
  currentRows: ExtendedPreviewRow[]
): ExtendedPreviewRow[] {
  const update = [...currentRows];
  const row = { ...update[index] };

  const currentIds = row.selectedCandidateIds || [];
  if (currentIds.includes(candidateId)) {
    row.selectedCandidateIds = currentIds.filter((id: string) => id !== candidateId);
  } else {
    row.selectedCandidateIds = [...currentIds, candidateId];
  }

  update[index] = row;
  return update;
}
