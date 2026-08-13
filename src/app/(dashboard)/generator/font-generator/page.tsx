import { requireRole } from '@/lib/auth';
import { getCachedAvailableTerms } from '@/services/termService';
import { getCachedJadwalByTerm } from '@/services/jadwalService';
import FontGeneratorForm from '@/components/admin/FontGeneratorForm';

export const metadata = {
  title: 'Font Fingerprint Generator | Manajemen Asprak',
};

export default async function FontGeneratorPage() {
  await requireRole(['ADMIN', 'ASLAB']);

  let initialRooms: string[] = [];
  let initialTerm = '';
  try {
    const terms = await getCachedAvailableTerms();
    if (terms && terms.length > 0) {
      const activeTerm = terms[0];
      const jadwalList = await getCachedJadwalByTerm(activeTerm);
      
      initialTerm = activeTerm;
      const rooms = new Set<string>();
      jadwalList.forEach((j) => {
        if (j.ruangan && j.ruangan !== 'Tanpa Ruangan' && j.ruangan.trim() !== '') {
          rooms.add(j.ruangan.trim());
        }
      });
      initialRooms = Array.from(rooms).sort();
    }
  } catch (error) {
    console.error('Failed to fetch rooms for font generator:', error);
  }

  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8 relative space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl 2xl:text-3xl font-bold tracking-tight">Font Fingerprint Generator</h1>
          <p className="text-sm 2xl:text-base text-muted-foreground mt-1">
            Generate file TTF khusus per ruangan untuk validasi perangkat PC Lab.
          </p>
        </div>
      </div>
      
      <div className="flex items-start pt-4">
        <FontGeneratorForm initialRooms={initialRooms} initialTerm={initialTerm} />
      </div>
    </div>
  );
}
