
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  getWords, 
  rulesFor1Word, 
  rulesFor2Words, 
  rulesFor3Words,
  generateStrategicCandidates,
  generateFullCandidates 
} from "@/utils/asprakCodeGenerator";

export default function AsprakGenerationRules() {
  const [name1, setName1] = useState("BUDI");
  const [name2, setName2] = useState("ANDI WIJAYA");
  const [name3, setName3] = useState("MUHAMMAD ABIYU ALGHIFARI");
  const [fallbackName, setFallbackName] = useState("SITI NUR AZIZAH PUTRI");

  // Helper to safely generate codes
  const generateCodes = (name: string, generator: (words: string[]) => string[]) => {
    const words = getWords(name);
    if (!words.length) return [];
    try {
      // Check word count requirements for specific generators to avoid errors
      if (generator === rulesFor1Word && words.length < 1) return [];
      if (generator === rulesFor2Words && words.length < 2) return [];
      if (generator === rulesFor3Words && words.length < 3) return [];
      
      const rawCodes = generator(words);
      // Validate length - strictly 3 chars
      return rawCodes.map(code => code.length === 3 ? code : null);
    } catch {
      return [];
    }
  };

  const codes1 = generateCodes(name1, rulesFor1Word);
  const codes2 = generateCodes(name2, rulesFor2Words);
  const codes3 = generateCodes(name3, rulesFor3Words);

  // Fallback generation
  const fallbackWords = getWords(fallbackName);
  const strategicCandidates = fallbackWords.length > 0 ? generateStrategicCandidates(fallbackWords) : [];
  const fullCandidates = fallbackWords.length > 0 ? generateFullCandidates(fallbackName) : [];

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
            <CardDescription>
              <div className="mt-2">
                <Label htmlFor="name1" className="text-xs font-semibold mb-1 block">Contoh Input:</Label>
                <Input 
                  id="name1"
                  value={name1} 
                  onChange={(e) => setName1(e.target.value)} 
                  placeholder="Masukkan nama 1 kata..."
                  className="h-8"
                />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rule ID</TableHead>
                  <TableHead>Logika</TableHead>
                  <TableHead className="w-[80px]">Hasil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">1.1</TableCell>
                  <TableCell>3 huruf pertama</TableCell>
                  <TableCell className="font-mono font-bold">{codes1[0] || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">1.2</TableCell>
                  <TableCell>Huruf ke-1, 2, 4</TableCell>
                  <TableCell className="font-mono font-bold">{codes1[1] || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">1.3</TableCell>
                  <TableCell>Huruf ke-1, 3, 4</TableCell>
                  <TableCell className="font-mono font-bold">{codes1[2] || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">1.4</TableCell>
                  <TableCell>Huruf ke-1, 2, Akhir</TableCell>
                  <TableCell className="font-mono font-bold">{codes1[3] || 'N/A'}</TableCell>
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
            <CardDescription>
              <div className="mt-2">
                <Label htmlFor="name2" className="text-xs font-semibold mb-1 block">Contoh Input:</Label>
                <Input 
                  id="name2"
                  value={name2} 
                  onChange={(e) => setName2(e.target.value)} 
                  placeholder="Masukkan nama 2 kata..."
                  className="h-8"
                />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rule ID</TableHead>
                  <TableHead>Logika (K1=Kata1, K2=Kata2)</TableHead>
                  <TableHead className="w-[80px]">Hasil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">2.1</TableCell>
                  <TableCell>Huruf 1,2(K1) + Huruf 1(K2)</TableCell>
                  <TableCell className="font-mono font-bold">{codes2[0] || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">2.2</TableCell>
                  <TableCell>Huruf 1(K1) + Huruf 1,2(K2)</TableCell>
                  <TableCell className="font-mono font-bold">{codes2[1] || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">2.3</TableCell>
                  <TableCell>Huruf 1(K1) + Huruf 1(K2) + Akhir(K2)</TableCell>
                  <TableCell className="font-mono font-bold">{codes2[2] || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">2.4</TableCell>
                  <TableCell>Huruf 1,2(K1) + Akhir(K2)</TableCell>
                  <TableCell className="font-mono font-bold">{codes2[3] || 'N/A'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Aturan 3 Kata */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Nama 3 Kata atau Lebih (3+)
              <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 border-emerald-200">Risk: Very Low</Badge>
            </CardTitle>
            <CardDescription>
              <div className="mt-2 max-w-md">
                <Label htmlFor="name3" className="text-xs font-semibold mb-1 block">Contoh Input:</Label>
                <Input 
                  id="name3"
                  value={name3} 
                  onChange={(e) => setName3(e.target.value)} 
                  placeholder="Masukkan nama 3 kata atau lebih..."
                  className="h-8"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Catatan: Untuk nama 4 kata atau lebih, hanya 3 kata pertama yang digunakan dalam aturan standar.
                </p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Rule ID</TableHead>
                    <TableHead>Logika</TableHead>
                    <TableHead className="w-[80px]">Hasil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.1</TableCell>
                    <TableCell>Huruf pertama tiap kata (3 kata awal)</TableCell>
                    <TableCell className="font-mono font-bold">{codes3[0] || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.2</TableCell>
                    <TableCell>Huruf 1(K1) + Huruf 1,2(K2)</TableCell>
                    <TableCell className="font-mono font-bold">{codes3[1] || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.3</TableCell>
                    <TableCell>Huruf 1,2(K1) + Huruf 1(K2)</TableCell>
                    <TableCell className="font-mono font-bold">{codes3[2] || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.4</TableCell>
                    <TableCell>Huruf 1(K1) + Huruf 1(K2) + Huruf 2(K3)</TableCell>
                    <TableCell className="font-mono font-bold">{codes3[3] || 'N/A'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Rule ID</TableHead>
                    <TableHead>Logika</TableHead>
                    <TableHead className="w-[80px]">Hasil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.5</TableCell>
                    <TableCell>Huruf 1(K1) + Huruf 1,2(K3)</TableCell>
                    <TableCell className="font-mono font-bold">{codes3[4] || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.6</TableCell>
                    <TableCell>Huruf 1,2(K1) + Huruf 1(K3)</TableCell>
                    <TableCell className="font-mono font-bold">{codes3[5] || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.7</TableCell>
                    <TableCell>Huruf 1(K1) + Huruf 1(K2) + Akhir(K3)</TableCell>
                    <TableCell className="font-mono font-bold">{codes3[6] || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">3.8</TableCell>
                    <TableCell>Huruf 1(K1) + Huruf 2(K2) + Huruf 1(K3)</TableCell>
                    <TableCell className="font-mono font-bold">{codes3[7] || 'N/A'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Universal / Fallback */}
        <Card className="md:col-span-2 border-dashed border-2">
            <CardHeader>
                <CardTitle>Sistem Fallback (Konflik Resolution)</CardTitle>
                <CardDescription>
                  <div className="space-y-4">
                    <p>Digunakan jika semua aturan standar di atas menghasilkan kode yang sudah terpakai (konflik) di database.</p>
                    <div className="max-w-md">
                      <Label htmlFor="fallbackName" className="text-xs font-semibold mb-1 block">Contoh Input Fallback:</Label>
                      <Input 
                        id="fallbackName"
                        value={fallbackName} 
                        onChange={(e) => setFallbackName(e.target.value)} 
                        placeholder="Masukkan nama untuk simulasi fallback..."
                        className="h-8"
                      />
                    </div>
                  </div>
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                <div>
                    <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                      <span>Level 1: Kombinatorik Strategis</span>
                      <Badge variant="outline" className="text-[10px]">{strategicCandidates.length} Candidates</Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Pool = [awal, tengah, akhir, ke-2] dari setiap kata.
                    </p>
                    <div className="bg-muted p-4 rounded-md font-mono text-xs space-y-2 h-[200px]">
                        <ScrollArea className="h-full w-full">
                          <div className="grid grid-cols-4 gap-2">
                           {strategicCandidates.length > 0 ? strategicCandidates.map(c => (
                             <span key={c} className="text-center bg-background px-1 py-0.5 rounded border">{c}</span>
                           )) : <span className="text-muted-foreground col-span-4 block text-center py-4">No combinatorics available</span>}
                          </div>
                        </ScrollArea>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                      <span>Level 2: Full Combinatorics</span>
                       <Badge variant="outline" className="text-[10px]">{fullCandidates.length} Candidates</Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        <span className="text-red-500 font-semibold">Last Resort.</span> Pool = Semua huruf unik dari nama.
                    </p>
                    <div className="bg-muted p-4 rounded-md font-mono text-xs space-y-2 h-[200px]">
                      <ScrollArea className="h-full w-full">
                          <div className="grid grid-cols-4 gap-2">
                           {fullCandidates.length > 0 ? fullCandidates.map(c => (
                             <span key={c} className="text-center bg-background px-1 py-0.5 rounded border">{c}</span>
                           )) : <span className="text-muted-foreground col-span-4 block text-center py-4">No combinatorics available</span>}
                          </div>
                        </ScrollArea>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
