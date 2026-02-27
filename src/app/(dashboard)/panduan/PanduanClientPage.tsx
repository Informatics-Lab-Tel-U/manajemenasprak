'use client';

import React from 'react';
import {
  BookOpen,
  Database,
  FileSpreadsheet,
  ArrowRight,
  AlertTriangle,
  Info,
  Download,
  GitGraph,
  Library,
  Calendar,
  Users,
  Settings,
  ShieldCheck,
  Eye,
} from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Role } from '@/config/rbac';

interface PanduanClientPageProps {
  role: Role;
}

export default function PanduanClientPage({ role }: PanduanClientPageProps) {
  const isKoor = role === 'ASPRAK_KOOR';

  return (
    <div className="container relative space-y-8">
      <div>
        <h1 className="title-gradient text-3xl font-bold">Panduan Sistem</h1>
        <p className="text-muted-foreground mt-2">
          Dokumentasi lengkap pengoperasian Sistem Manajemen Asisten Praktikum.
        </p>
      </div>

      <div>
        <div className="w-full space-y-6">
          <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={isKoor ? 'pelanggaran' : undefined}>

            {!isKoor && (
              <>
                {/* 1. Alur Penambahan Data */}
                <AccordionItem value="alur" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full"><GitGraph size={20} /></div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Alur Penambahan Data</h3>
                        <p className="text-sm font-normal text-muted-foreground">Urutan wajib saat memasukkan data ke sistem.</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2">
                    <div className="relative flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-6 bg-muted/30 rounded-lg border border-border/50">
                      <StepCard number={1} title="Data Praktikum" desc="Master data praktikum & tahun ajaran." />
                      <ArrowRight className="hidden md:block text-muted-foreground" />
                      <StepCard number={2} title="Data Mata Kuliah" desc="Perlu ID Praktikum." />
                      <ArrowRight className="hidden md:block text-muted-foreground" />
                      <StepCard number={3} title="Jadwal Praktikum" desc="Perlu Kode MK & data waktu." />
                      <ArrowRight className="hidden md:block text-muted-foreground" />
                      <StepCard number={4} title="Data Asprak" desc="Data mahasiswa asisten." />
                    </div>
                    <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-md flex gap-3 text-sm text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <p><strong>Penting:</strong> Jangan melompati urutan. Anda tidak bisa membuat Jadwal jika Mata Kuliah belum ada, dan tidak bisa membuat Mata Kuliah jika Praktikum belum ada.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 2. Data Praktikum */}
                <AccordionItem value="praktikum" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full"><BookOpen size={20} /></div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Data Praktikum</h3>
                        <p className="text-sm font-normal text-muted-foreground">Master data laboratorium dan tahun ajar.</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2 space-y-4">
                    <DataTable columns={[
                      { name: 'Nama', type: 'Teks', rule: 'Wajib', desc: 'Nama lengkap praktikum (contoh: Pemrograman Web).' },
                      { name: 'Tahun Ajaran', type: 'Teks', rule: 'Wajib', desc: 'Format: YYYY-Sem (Contoh: "2425-1").' },
                    ]} />
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm text-blue-600 dark:text-blue-400">
                      <strong>Info:</strong> Kombinasi (Nama + Tahun Ajaran) harus unik. Data praktikum digunakan sebagai konteks utama pada halaman Pelanggaran.
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 3. Mata Kuliah */}
                <AccordionItem value="matakuliah" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full"><Library size={20} /></div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Data Mata Kuliah</h3>
                        <p className="text-sm font-normal text-muted-foreground">Mata kuliah yang dibuka pada praktikum tertentu.</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2 space-y-4">
                    <DataTable columns={[
                      { name: 'Nama MK', type: 'Teks', rule: 'Wajib', desc: 'Nama mata kuliah.' },
                      { name: 'Praktikum', type: 'Relasi', rule: 'Wajib', desc: 'Mengacu ke Data Praktikum (nama + tahun ajaran).' },
                      { name: 'Program Studi', type: 'Teks', rule: 'Wajib', desc: 'Contoh: Informatika, Sistem Informasi.' },
                      { name: 'Dosen Koor', type: 'Teks', rule: 'Opsional', desc: 'Nama dosen koordinator.' },
                    ]} />
                  </AccordionContent>
                </AccordionItem>

                {/* 4. Jadwal */}
                <AccordionItem value="jadwal" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full"><Calendar size={20} /></div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Jadwal Praktikum</h3>
                        <p className="text-sm font-normal text-muted-foreground">Jadwal sesi, ruangan, dan kebutuhan asprak.</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2 space-y-4">
                    <DataTable columns={[
                      { name: 'Kelas', type: 'Teks', rule: 'Wajib', desc: 'Nama kelas (contoh: IF-45-01).' },
                      { name: 'Mata Kuliah', type: 'Relasi', rule: 'Wajib', desc: 'Harus match dengan Nama MK di Term yang sama.' },
                      { name: 'Hari', type: 'Pilihan', rule: 'SENIN - SABTU', desc: 'Hari pelaksanaan.' },
                      { name: 'Sesi', type: 'Angka', rule: '1 - 10', desc: 'Sesi Telkom University.' },
                      { name: 'Ruangan', type: 'Teks', rule: 'Wajib', desc: 'Kode ruangan (contoh: TULT 0612).' },
                      { name: 'Total Asprak', type: 'Angka', rule: 'Min 1', desc: 'Kuota asprak yang dibutuhkan.' },
                    ]} />
                    <div className="mt-3 text-sm text-muted-foreground p-3 bg-muted rounded-md border">
                      <strong>Aturan Validasi:</strong> Sistem akan menolak jika ada jadwal dengan (Hari + Sesi + Ruangan) yang sama dalam satu Term.
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 5. Data Asprak */}
                <AccordionItem value="asprak" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full"><Users size={20} /></div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Data Asprak</h3>
                        <p className="text-sm font-normal text-muted-foreground">Database asisten praktikum.</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2 space-y-4">
                    <DataTable columns={[
                      { name: 'NIM', type: 'Teks', rule: 'Unik, 10 Digit', desc: 'Nomor Induk Mahasiswa.' },
                      { name: 'Nama Lengkap', type: 'Teks', rule: 'Wajib', desc: 'Nama sesuai KTM.' },
                      { name: 'Kode Asprak', type: 'Teks', rule: 'Unik, 3 Huruf', desc: 'Kode inisial (contoh: ABY).' },
                      { name: 'Angkatan', type: 'Angka', rule: 'Format: YY', desc: '2 digit tahun angkatan (contoh: 21).' },
                    ]} />
                  </AccordionContent>
                </AccordionItem>

                {/* 6. Plotting */}
                <AccordionItem value="plotting" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full"><Users size={20} /></div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Plotting Asprak</h3>
                        <p className="text-sm font-normal text-muted-foreground">Penugasan asisten ke jadwal praktikum.</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Plotting adalah proses menghubungkan <strong>Data Asprak</strong> dengan <strong>Jadwal Praktikum</strong>.
                      Satu jadwal kelas bisa memiliki banyak asprak sesuai kuota (Total Asprak).
                    </p>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm text-blue-600 dark:text-blue-400">
                      <strong>Tips:</strong> Gunakan menu <em>Plotting Asprak</em> untuk melihat beban kerja setiap asisten dan menghindari jadwal bentrok.
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </>
            )}

            {/* 7. Pelanggaran */}
            <AccordionItem value="pelanggaran" className="border rounded-lg px-4 bg-card">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full"><AlertTriangle size={20} /></div>
                  <div className="text-left">
                    <h3 className="font-semibold text-base">Pencatatan Pelanggaran</h3>
                    <p className="text-sm font-normal text-muted-foreground">Log indisipliner asisten praktikum.</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6 px-2 space-y-5">
                {!isKoor && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2"><Info size={16} />Filter Utama</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Halaman pelanggaran difilter berdasarkan <strong>Tahun Ajaran</strong> dan <strong>Nama Praktikum</strong>.
                      Filter ini juga menentukan asprak dan jadwal yang tersedia saat menambahkan pelanggaran baru.
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2"><Database size={16} />Jenis Pelanggaran</h4>
                  <div className="flex flex-wrap gap-2">
                    {['TELAT DATANG', 'TIDAK DATANG', 'TELAT NILAI', 'PAKAIAN TIDAK SESUAI', 'LAIN-LAIN'].map((j) => (
                      <Badge key={j} variant="outline" className="text-xs">{j}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2"><Users size={16} />Menambah Pelanggaran</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1.5">
                    <li>Pilih <strong>Tahun Ajaran</strong> dan <strong>Nama Praktikum</strong> sebagai konteks.</li>
                    <li>Pilih <strong>Asprak yang Melanggar</strong> — bisa lebih dari 1 sekaligus (multi-select). Tersedia search berdasarkan nama, kode, atau NIM.</li>
                    <li>Pilih <strong>Kelas/Jadwal</strong> — tersedia search nama MK, kelas, atau hari.</li>
                    <li>Pilih <strong>Jenis Pelanggaran</strong> dan <strong>Modul</strong> (opsional).</li>
                    <li>Klik <em>Catat Pelanggaran</em>. Jika multi-asprak, sistem akan membuat satu record per asprak dengan data yang sama.</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2"><ShieldCheck size={16} />Finalisasi</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Finalisasi dilakukan <strong>satu klik per Praktikum per Tahun Ajaran</strong>. Setelah difinalisasi, data tidak dapat diubah. Pastikan semua data sudah benar sebelum klik tombol <em>Finalisasi</em>.
                  </p>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-sm text-amber-700 dark:text-amber-400">
                    <strong>Peringatan:</strong> Finalisasi bersifat permanen. Data yang sudah final tidak dapat diedit atau dihapus.
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2"><FileSpreadsheet size={16} />Export Excel</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Klik tombol <em>Export Excel</em> di pojok kanan atas halaman. File akan diunduh dengan kolom:
                  </p>
                  <DataTable columns={[
                    { name: 'NIM', type: 'Teks', rule: '', desc: 'Nomor Induk Mahasiswa asprak.' },
                    { name: 'NAMA', type: 'Teks', rule: '', desc: 'Nama lengkap asprak.' },
                    { name: 'KODE ASPRAK', type: 'Teks', rule: '', desc: 'Kode inisial asprak.' },
                    { name: 'MODUL', type: 'Angka', rule: '', desc: 'Nomor modul saat pelanggaran terjadi.' },
                    { name: 'KELAS', type: 'Teks', rule: '', desc: 'Nama kelas jadwal.' },
                    { name: 'PELANGGARAN', type: 'Pilihan', rule: '', desc: 'Jenis pelanggaran yang dicatat.' },
                  ]} />
                  <p className="text-xs text-muted-foreground mt-2">Export disesuaikan dengan filter aktif (tahun ajaran & praktikum).</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {!isKoor && (
              <>
                {/* 8. Role & Akses */}
                <AccordionItem value="role-akses" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full"><ShieldCheck size={20} /></div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Role & Hak Akses</h3>
                        <p className="text-sm font-normal text-muted-foreground">Perbedaan akses berdasarkan role pengguna.</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2 space-y-4">
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead>Fitur</TableHead>
                            <TableHead className="text-center">Admin</TableHead>
                            <TableHead className="text-center">Aslab</TableHead>
                            <TableHead className="text-center">Asprak Koor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            ['Dashboard', '✓', '✓', '—'],
                            ['Praktikum & MK', '✓', '✓', '—'],
                            ['Jadwal', '✓', '✓', '—'],
                            ['Data Asprak', '✓', '✓', '—'],
                            ['Plotting', '✓', '✓', '—'],
                            ['Pelanggaran', 'Semua', 'Semua', 'Assignment saja'],
                            ['Manajemen Akun', '✓', '—', '—'],
                            ['Audit Log', '✓', '✓', '—'],
                            ['Export Excel', '✓', '✓', '✓ (terbatas)'],
                          ].map(([feature, admin, aslab, koor]) => (
                            <TableRow key={feature}>
                              <TableCell className="font-medium text-sm">{feature}</TableCell>
                              <TableCell className="text-center text-sm">{admin}</TableCell>
                              <TableCell className="text-center text-sm">{aslab}</TableCell>
                              <TableCell className="text-center text-sm">{koor}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Asprak Koordinator (Koor)</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
                        <li>Hanya dapat mengakses halaman <strong>Pelanggaran</strong>.</li>
                        <li>Hanya melihat pelanggaran yang terkait dengan <strong>praktikum yang di-assign</strong> padanya.</li>
                        <li>Dapat mencatat pelanggaran baru untuk asprak di praktikumnya.</li>
                        <li>Dapat melakukan <strong>finalisasi</strong> pelanggaran untuk praktikumnya.</li>
                        <li>Dapat mengunduh <strong>export Excel</strong> data pelanggaran (tersaring sesuai aksesnya).</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm text-blue-600 dark:text-blue-400">
                      <strong>Cara assign Asprak Koor ke praktikum:</strong> Pergi ke <em>Manajemen Akun</em> → Tambah Akun → pilih role <em>Koordinator Asprak</em> → pilih Tahun Ajaran dan centang Praktikum yang dipegang.
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 9. Manajemen Akun */}
                <AccordionItem value="manajemen-akun" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full"><Eye size={20} /></div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Manajemen Akun</h3>
                        <p className="text-sm font-normal text-muted-foreground">Kelola akun pengguna sistem (Admin only).</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2 space-y-4">
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
                      <li>Tambah akun baru dengan role: <Badge variant="outline" className="text-xs">ADMIN</Badge> <Badge variant="outline" className="text-xs">ASLAB</Badge> <Badge variant="outline" className="text-xs">ASPRAK_KOOR</Badge></li>
                      <li>Edit nama dan role pengguna yang sudah ada.</li>
                      <li>Hapus akun pengguna.</li>
                      <li>Field password memiliki tombol <strong>👁 toggle</strong> untuk menampilkan/menyembunyikan karakter.</li>
                      <li>Saat membuat akun <em>Koordinator Asprak</em>, wajib memilih <strong>Tahun Ajaran</strong> dan <strong>Praktikum</strong> yang akan di-assign.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* 10. Database Manager */}
                <AccordionItem value="db-manager" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full"><Settings size={20} /></div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Database & Import/Export</h3>
                        <p className="text-sm font-normal text-muted-foreground">Fitur Admin untuk maintenance dan migrasi data.</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 px-2 space-y-4">
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                      <li><strong>Bulk Import Excel:</strong> Import seluruh data satu Term (Praktikum, MK, Asprak, Jadwal) sekaligus menggunakan format .xlsx khusus.</li>
                      <li><strong>Export Excel:</strong> Tersedia di halaman Pelanggaran — unduh data pelanggaran dalam format .xlsx dengan kolom standar (NIM, Nama, Kode Asprak, Modul, Kelas, Pelanggaran).</li>
                      <li><strong>Clear Database:</strong> Menghapus SEMUA data di sistem. Gunakan hanya untuk reset semester baru.</li>
                    </ul>

                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <div>
                        <strong>Danger Zone:</strong> &ldquo;Clear Database&rdquo; bersifat permanen dan tidak bisa dibatalkan. Backup data sebelum menjalankan fitur ini.
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </>
            )}

          </Accordion>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function StepCard({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function DataTable({
  columns,
}: {
  columns: { name: string; type: string; rule: string; desc: string }[];
}) {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[150px]">Kolom</TableHead>
            <TableHead className="w-[90px]">Tipe</TableHead>
            {columns[0].rule !== '' && <TableHead className="w-[130px]">Aturan</TableHead>}
            <TableHead>Keterangan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {columns.map((col) => (
            <TableRow key={col.name}>
              <TableCell className="font-medium text-sm">{col.name}</TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground">{col.type}</TableCell>
              {col.rule !== '' && (
                <TableCell className="text-xs">
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 font-medium text-muted-foreground border">
                    {col.rule}
                  </span>
                </TableCell>
              )}
              <TableCell className="text-sm text-muted-foreground">{col.desc}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
