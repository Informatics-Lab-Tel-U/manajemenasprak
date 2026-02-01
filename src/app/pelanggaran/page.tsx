import { AlertTriangle, Plus } from 'lucide-react';
import { Pelanggaran } from '@/types/database';
import { getAllPelanggaran } from '@/services/pelanggaranService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const revalidate = 0;

export default async function PelanggaranPage() {
  const violations = await getAllPelanggaran();

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="title-gradient text-4xl font-bold">Pelanggaran</h1>
          <p className="text-muted-foreground mt-1">Log Indisipliner Asprak</p>
        </div>
        <Button>
          <Plus size={18} />
          Catat Pelanggaran
        </Button>
      </div>

      <Card className="bg-card backdrop-blur-sm shadow-sm">
        <CardContent className="p-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal Input</TableHead>
                  <TableHead>Asprak</TableHead>
                  <TableHead>Pelanggaran</TableHead>
                  <TableHead>Konteks Kejadian</TableHead>
                  <TableHead>Modul</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  violations.map((v) => {
                    const date = new Date(v.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });

                    const mkName = (v.jadwal as any)?.mata_kuliah?.nama_lengkap || 'Unknown MK';
                    const asprakName = v.asprak?.nama_lengkap || 'Unknown';
                    const asprakInfo = `${v.asprak?.kode || '-'} • ${mkName.substring(0, 15)}...`;
                    const jadwalInfo = `${v.jadwal?.hari || '-'}, ${v.jadwal?.jam || '-'}`;
                    const kelasInfo = `Kelas ${v.jadwal?.kelas || '-'}`;

                    return (
                      <TableRow key={v.id}>
                        <TableCell>{date}</TableCell>
                        <TableCell>
                          <div className="font-semibold">{asprakInfo}</div>
                          <div className="text-xs text-muted-foreground">{asprakName}</div>
                        </TableCell>
                        <TableCell>{v.jenis}</TableCell>
                        <TableCell>
                          <div>{jadwalInfo}</div>
                          <div className="text-xs text-muted-foreground">{kelasInfo}</div>
                        </TableCell>
                        <TableCell>{v.modul}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Recorded</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
