'use client';

import React from 'react';
import { 
  BookOpen, 
  Database, 
  FileSpreadsheet, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Download,
  GitGraph,
  Library,
  Calendar,

  Users,
  Settings
} from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PanduanPage() {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Panduan Sistem</h2>
            <p className="text-muted-foreground">
              Dokumentasi lengkap mengenai alur data, batasan (constraint), dan format import.
            </p>
          </div>
        </div>
        
        <div className="w-full space-y-6">
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              
                  {/* 1. Alur Penambahan Data */}
              <AccordionItem value="alur" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full text-foreground">
                      <GitGraph size={20} />
                    </div>
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
                    <p>
                      <strong>Penting:</strong> Jangan melompati urutan. Anda tidak bisa membuat Jadwal jika Mata Kuliah belum ada, dan tidak bisa membuat Mata Kuliah jika Praktikum belum ada.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Data Praktikum */}
              <AccordionItem value="praktikum" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full text-foreground">
                      <BookOpen size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-base">Data Praktikum</h3>
                      <p className="text-sm font-normal text-muted-foreground">Master data laboratorium dan tahun ajar.</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 px-2 space-y-6">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Database size={16} /> Kamus Data & Constraint
                    </h4>
                    <DataTable 
                      columns={[
                        { name: 'Kode', type: 'String', rule: 'Unik, Wajib', desc: 'Kode identifikasi unik (contoh: IF-123).' },
                        { name: 'Nama', type: 'String', rule: 'Wajib', desc: 'Nama lengkap praktikum.' },
                        { name: 'Tahun Ajaran', type: 'String', rule: 'Wajib', desc: 'Format: YYYY-Sem (Contoh: "2024-1").' },
                        { name: 'Status', type: 'Boolean', rule: 'Default: Aktif', desc: 'Menandakan praktikum sedang berjalan.' },
                      ]} 
                    />
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileSpreadsheet size={16} /> Template Import
                    </h4>
                    <TemplateButton label="Download Template Praktikum (CSV)" />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 3. Mata Kuliah */}
              <AccordionItem value="matakuliah" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-4">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full text-foreground">
                      <Library size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-base">Data Mata Kuliah</h3>
                      <p className="text-sm font-normal text-muted-foreground">Mata kuliah yang dibuka pada praktikum tertentu.</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 px-2 space-y-6">
                   <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Database size={16} /> Kamus Data & Constraint
                    </h4>
                    <DataTable 
                      columns={[
                        { name: 'Kode MK', type: 'String', rule: 'Unik, Wajib', desc: 'Kode resmi mata kuliah (contoh: CSH123).' },
                        { name: 'Nama MK', type: 'String', rule: 'Wajib', desc: 'Nama mata kuliah.' },
                        { name: 'Praktikum', type: 'Relation', rule: 'Wajib', desc: 'Mengacu ke nama/ID Data Praktikum.' },
                        { name: 'SKS', type: 'Integer', rule: 'Min 1', desc: 'Bobot satuan kredit semester.' },
                      ]} 
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileSpreadsheet size={16} /> Template Import
                    </h4>
                    <TemplateButton label="Download Template Mata Kuliah (CSV)" />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 4. Jadwal Praktikum */}
              <AccordionItem value="jadwal" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-4">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full text-foreground">
                      <Calendar size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-base">Jadwal Praktikum</h3>
                      <p className="text-sm font-normal text-muted-foreground">Jadwal sesi, ruangan, dan kebutuhan asprak.</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 px-2 space-y-6">
                   <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Database size={16} /> Kamus Data & Constraint
                    </h4>
                    <DataTable 
                      columns={[
                        { name: 'Kelas', type: 'String', rule: 'Wajib', desc: 'Nama kelas (contoh: IF-45-01).' },
                        { name: 'Mata Kuliah', type: 'Relation', rule: 'Wajib', desc: 'Harus match dengan Nama MK di Term yang sama.' },
                        { name: 'Hari', type: 'Enum', rule: 'SENIN - SABTU', desc: 'Hari pelaksanaan.' },
                        { name: 'Sesi', type: 'Integer', rule: '1 - 10', desc: 'Sesi Telkom University.' },
                        { name: 'Ruangan', type: 'String', rule: 'Wajib', desc: 'Kode ruangan (contoh: TULT 0612).' },
                        { name: 'Total Asprak', type: 'Integer', rule: 'Min 1', desc: 'Kuota asprak yang dibutuhkan.' },
                      ]} 
                    />
                    <div className="mt-3 text-sm text-muted-foreground p-3 bg-muted rounded-md border">
                        <strong>Aturan Validasi:</strong> Sistem akan menolak jika ada jadwal dengan (Hari + Sesi + Ruangan) yang sama dalam satu Term.
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileSpreadsheet size={16} /> Template Import
                    </h4>
                    <TemplateButton label="Download Template Jadwal (CSV)" />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 5. Data Asprak */}
              <AccordionItem value="asprak" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-4">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full text-foreground">
                      <Users size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-base">Data Asprak</h3>
                      <p className="text-sm font-normal text-muted-foreground">Database asisten praktikum.</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 px-2 space-y-6">
                   <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Database size={16} /> Kamus Data & Constraint
                    </h4>
                    <DataTable 
                      columns={[
                        { name: 'NIM', type: 'String', rule: 'Unik, 10 Digit', desc: 'Nomor Induk Mahasiswa.' },
                        { name: 'Nama Lengkap', type: 'String', rule: 'Wajib', desc: 'Nama sesuai KTM.' },
                        { name: 'Kode Asprak', type: 'String', rule: 'Unik, 3 Huruf', desc: 'Kode inisial (contoh: ABY).' },
                        { name: 'Angkatan', type: 'Integer', rule: 'Format: YY', desc: '2 digit tahun angkatan (contoh: 21).' },
                        { name: 'Kontak', type: 'String', rule: 'Opsional', desc: 'No HP / LINE.' },
                      ]} 
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileSpreadsheet size={16} /> Template Import
                    </h4>
                    <TemplateButton label="Download Template Asprak (CSV)" />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 6. Plotting Asprak */}
              <AccordionItem value="plotting" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-4">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full text-foreground">
                      <Users size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-base">Plotting Asprak</h3>
                      <p className="text-sm font-normal text-muted-foreground">Penugasan asisten ke jadwal praktikum.</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 px-2 space-y-6">
                   <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Info size={16} /> Konsep & Alur
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Plotting adalah proses menghubungkan <strong>Data Asprak</strong> dengan <strong>Jadwal Praktikum</strong>. 
                      Satu jadwal kelas bisa memiliki banyak asprak sesuai kuota (Total Asprak).
                    </p>
                    <DataTable 
                      columns={[
                        { name: 'Kode Asprak', type: 'String', rule: 'Wajib, Exist', desc: 'Kode asprak yang sudah terdaftar.' },
                        { name: 'Jadwal ID / Kelas', type: 'Relation', rule: 'Wajib', desc: 'Mengacu pada jadwal spesifik.' },
                        { name: 'Posisi', type: 'Enum', rule: 'Inti / Cadangan', desc: 'Peran asprak di kelas tersebut.' },
                      ]} 
                    />
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm text-blue-600 dark:text-blue-400">
                      <strong>Tips:</strong> Gunakan menu <em>Plotting Asprak</em> untuk melihat beban kerja setiap asisten dan menghindari jadwal bentrok.
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 7. Pelanggaran */}
              <AccordionItem value="pelanggaran" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-4">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full text-foreground">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-base">Pencatatan Pelanggaran</h3>
                      <p className="text-sm font-normal text-muted-foreground">Log indisipliner asisten praktikum.</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 px-2 space-y-6">
                   <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Digunakan untuk mencatat ketidakhadiran, keterlambatan, atau pelanggaran SOP lainnya. Data ini berguna untuk evaluasi kinerja asprak.
                    </p>
                    <DataTable 
                      columns={[
                        { name: 'Asprak', type: 'Relation', rule: 'Wajib', desc: 'Siapa yang melanggar.' },
                        { name: 'Jenis', type: 'Enum', rule: 'Terlambat/Alpha/Lainnya', desc: 'Kategori pelanggaran.' },
                        { name: 'Konteks', type: 'Relation', rule: 'Jadwal', desc: 'Pada jadwal/modul apa pelanggaran terjadi.' },
                        { name: 'Poin', type: 'Integer', rule: 'Otomatis', desc: 'Pengurangan poin performansi.' },
                      ]} 
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

               {/* 8. Database Manager */}
               <AccordionItem value="db-manager" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-4">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full text-foreground">
                      <Settings size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-base">Pengaturan</h3>
                      <p className="text-sm font-normal text-muted-foreground">Fitur Admin untuk maintenance data.</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 px-2 space-y-6">
                   <div>
                    <h4 className="font-medium mb-3">Fitur Utama</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                      <li><strong>Bulk Import Excel:</strong> Import seluruh data satu Term (Praktikum, MK, Asprak, Jadwal) sekaligus menggunakan format .xlsx khusus.</li>
                      <li><strong>Clear Database:</strong> Menghapus SEMUA data di sistem.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <div>
                        <strong>Danger Zone:</strong> Fitur "Clear Database" bersifat permanen dan tidak bisa dibatalkan. Gunakan hanya saat reset semester baru atau setup awal.
                      </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────────────────────

function StepCard({ number, title, desc }: { number: number, title: string, desc: string }) {
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
    )
}

function DataTable({ columns }: { columns: { name: string, type: string, rule: string, desc: string }[] }) {
    return (
        <div className="rounded-md border border-border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-[150px]">Kolom</TableHead>
                        <TableHead className="w-[100px]">Tipe</TableHead>
                        <TableHead className="w-[150px]">Aturan</TableHead>
                        <TableHead>Keterangan</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {columns.map((col) => (
                        <TableRow key={col.name}>
                            <TableCell className="font-medium">{col.name}</TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">{col.type}</TableCell>
                            <TableCell className="text-xs">
                                <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 font-medium text-muted-foreground border">
                                    {col.rule}
                                </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{col.desc}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function TemplateButton({ label }: { label: string }) {
    return (
        <Button variant="outline" className="w-full sm:w-auto mt-2 justify-start group" onClick={() => alert("Fitur download template belum terhubung ke file fisik.")}>
            <span className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {label}
            </span>
            <Download className="h-4 w-4 opacity-50 ml-2 group-hover:opacity-100 transition-opacity text-muted-foreground" />
        </Button>
    )
}
