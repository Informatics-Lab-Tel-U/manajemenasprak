'use client';

import { useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { Pelanggaran } from '@/types/database';
import { createPelanggaran } from '@/lib/fetchers/pelanggaranFetcher';
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
import { toast } from 'sonner';
import PelanggaranAddModal from '@/components/pelanggaran/PelanggaranAddModal';

interface PelanggaranClientPageProps {
  violations: Pelanggaran[];
}

export default function PelanggaranClientPage({ violations }: PelanggaranClientPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddViolation = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await createPelanggaran(data);

      if (result.ok) {
        toast.success('Pelanggaran berhasil dicatat!');
        setIsModalOpen(false);
        // In a real app, you would refresh the data here
        // For now, we'll just show a success message
      } else {
        toast.error(result.error || 'Gagal mencatat pelanggaran');
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat mencatat pelanggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="title-gradient text-4xl font-bold">Pelanggaran</h1>
          <p className="text-muted-foreground mt-1">Log Indisipliner Asprak</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
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

      <PelanggaranAddModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddViolation}
        isLoading={isSubmitting}
      />
    </div>
  );
}