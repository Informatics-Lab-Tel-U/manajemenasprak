
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

export default function AsprakGenerationRules() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="prose dark:prose-invert max-w-none">
        <h2 className="text-2xl font-bold tracking-tight">Sistem Kode Asprak (3 Huruf)</h2>
        <p className="text-muted-foreground">
          Sistem ini menggunakan algoritma deterministik bertingkat untuk menghasilkan kode unik 3 huruf
          berdasarkan nama lengkap asisten. Jika terjadi konflik (kode sudah dipakai), sistem akan otomatis
          mencoba aturan berikutnya hingga menemukan kode yang tersedia.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Aturan 1 Kata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Nama 1 Kata
              <Badge variant="outline">Risk: High Conflict</Badge>
            </CardTitle>
            <CardDescription>Contoh: "BUDI", "AHMAD"</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rule ID</TableHead>
                  <TableHead>Logika</TableHead>
                  <TableHead className="w-[80px]">Contoh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">1.1</TableCell>
                  <TableCell>3 huruf pertama</TableCell>
                  <TableCell className="font-mono font-bold">BUD</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">1.2</TableCell>
                  <TableCell>Huruf ke-1, 2, 4</TableCell>
                  <TableCell className="font-mono font-bold">BUI</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">1.3</TableCell>
                  <TableCell>Huruf ke-1, 3, 4</TableCell>
                  <TableCell className="font-mono font-bold">BDI</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">1.4</TableCell>
                  <TableCell>Huruf ke-1, 2, Akhir</TableCell>
                  <TableCell className="font-mono font-bold">BDI</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Aturan 2 Kata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Nama 2 Kata
              <Badge variant="secondary">Risk: Low</Badge>
            </CardTitle>
            <CardDescription>Contoh: "ANDI WIJAYA"</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rule ID</TableHead>
                  <TableHead>Logika (K1=Kata1, K2=Kata2)</TableHead>
                  <TableHead className="w-[80px]">Contoh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">2.1</TableCell>
                  <TableCell>Huruf 1(K1) + Huruf 1,2(K2)</TableCell>
                  <TableCell className="font-mono font-bold">AWI</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">2.2</TableCell>
                  <TableCell>Huruf 1,2(K1) + Huruf 1(K2)</TableCell>
                  <TableCell className="font-mono font-bold">ANW</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">2.3</TableCell>
                  <TableCell>Huruf 1(K1) + Huruf 1(K2) + Akhir(K2)</TableCell>
                  <TableCell className="font-mono font-bold">AWA</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">2.4</TableCell>
                  <TableCell>Huruf 1,2(K1) + Akhir(K2)</TableCell>
                  <TableCell className="font-mono font-bold">ANA</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Aturan 3 Kata */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Nama 3 Kata (Most Common)
              <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 border-emerald-200">Risk: Very Low</Badge>
            </CardTitle>
            <CardDescription>Contoh: "MUHAMMAD ABIYU ALGHIFARI"</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Rule ID</TableHead>
                    <TableHead>Logika</TableHead>
                    <TableHead className="w-[80px]">Contoh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.1</TableCell>
                    <TableCell>Huruf pertama tiap kata</TableCell>
                    <TableCell className="font-mono font-bold">MAA</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.2</TableCell>
                    <TableCell>Huruf 1(K1) + Huruf 1,2(K2)</TableCell>
                    <TableCell className="font-mono font-bold">MAB</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.3</TableCell>
                    <TableCell>Huruf 1,2(K1) + Huruf 1(K2)</TableCell>
                    <TableCell className="font-mono font-bold">MUA</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.4</TableCell>
                    <TableCell>Huruf 1(K1) + Huruf 1(K2) + Huruf 2(K3)</TableCell>
                    <TableCell className="font-mono font-bold">MAL</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Rule ID</TableHead>
                    <TableHead>Logika</TableHead>
                    <TableHead className="w-[80px]">Contoh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.5</TableCell>
                    <TableCell>Huruf 1(K1) + Huruf 1,2(K3)</TableCell>
                    <TableCell className="font-mono font-bold">MAL</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.6</TableCell>
                    <TableCell>Huruf 1,2(K1) + Huruf 1(K3)</TableCell>
                    <TableCell className="font-mono font-bold">MUA</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.7</TableCell>
                    <TableCell>Huruf 1(K1) + Huruf 1(K2) + Akhir(K3)</TableCell>
                    <TableCell className="font-mono font-bold">MAI</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.8</TableCell>
                    <TableCell>Huruf 1(K1) + Huruf 2(K2) + Huruf 1(K3)</TableCell>
                    <TableCell className="font-mono font-bold">MBA</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Universal / Fallback */}
        <Card className="md:col-span-2 border-dashed border-2">
            <CardHeader>
                <CardTitle>Sistem Fallback (Universal)</CardTitle>
                <CardDescription>
                    Digunakan untuk nama 4+ Kata ATAU jika semua aturan standar di atas menghasilkan kode yang sudah terpakai (konflik).
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                <div>
                    <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Level 1: Kombinatorik Strategis</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Mengambil huruf-huruf dari <span className="font-semibold text-foreground">posisi strategis</span> setiap kata:
                        Awal, Tengah, Akhir, dan Huruf ke-2.
                    </p>
                    <div className="bg-muted p-4 rounded-md font-mono text-xs space-y-2">
                        <p>Pool = [huruf[0], huruf[1], mid, last] dari setiap kata</p>
                        <p>Generate semua kombinasi 3 huruf (C(n,3))</p>
                        <p>Cek ketersediaan satu per satu</p>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Level 2: Full Combinatorics</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        <span className="text-red-500 font-semibold">Last Resort.</span> Mengambil <span className="font-semibold text-foreground">semua huruf unik</span> dari nama lengkap.
                    </p>
                    <div className="bg-muted p-4 rounded-md font-mono text-xs space-y-2">
                        <p>Pool = UniqueChars(NamaLengkap)</p>
                        <p>Generate kombinasi C(n,3)</p>
                        <p>Filter prioritas (diutamakan mulai huruf pertama nama)</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
