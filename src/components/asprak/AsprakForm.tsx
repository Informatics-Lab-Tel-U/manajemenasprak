
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { checkNim, generateCode, fetchAvailableTerms, fetchExistingCodes, UpsertAsprakInput } from '@/lib/fetchers/asprakFetcher';
import { fetchPraktikumByTerm } from '@/lib/fetchers/praktikumFetcher';
// Manual debounce helper if hook doesn't exist
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface AsprakFormProps {
  onSubmit: (data: UpsertAsprakInput) => Promise<void>;
  onCancel: () => void;
}

interface AssignmentBlock {
  id: string; // internal UI ID
  term: string;
  selectedCourseNames: string[];
  availableCourses: { id: string; nama: string }[];
  loadingCourses: boolean;
}

export default function AsprakForm({ onSubmit, onCancel }: AsprakFormProps) {
  // Personal Data
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');
  const [kode, setKode] = useState('');
  const [angkatan, setAngkatan] = useState<string>('2023');
  
  // Validation States
  const [nimStatus, setNimStatus] = useState<'idle' | 'checking' | 'valid' | 'taken'>('idle');
  const [codeStatus, setCodeStatus] = useState<'idle' | 'generating' | 'valid' | 'invalid_length' | 'taken'>('idle');
  const [ruleInfo, setRuleInfo] = useState('');
  
  // Data
  const [assignments, setAssignments] = useState<AssignmentBlock[]>([]);
  const [availableTerms, setAvailableTerms] = useState<string[]>([]);
  const [existingCodes, setExistingCodes] = useState<Set<string>>(new Set());
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Debounced Values
  const debouncedNama = useDebounceValue(nama, 800);
  const debouncedNim = useDebounceValue(nim, 800);

  // Initial Fetch
  useEffect(() => {
    async function loadData() {
      setLoadingTerms(true);
      const [termsRes, codesRes] = await Promise.all([
          fetchAvailableTerms(),
          fetchExistingCodes()
      ]);
      
      if (termsRes.ok && termsRes.data) {
        setAvailableTerms(termsRes.data);
      }
      if (codesRes.ok && codesRes.data) {
          setExistingCodes(new Set(codesRes.data));
      }
      setLoadingTerms(false);
    }
    loadData();
  }, []);

  // NIM Check Effect
  useEffect(() => {
    if (!debouncedNim || debouncedNim.length < 5) {
        setNimStatus('idle');
        return;
    }
    
    async function check() {
        setNimStatus('checking');
        const res = await checkNim(debouncedNim);
        if (res.ok && res.data) {
            setNimStatus('taken');
        } else {
            setNimStatus('valid');
        }
    }
    check();
  }, [debouncedNim]);

  // Code Generation Effect
  useEffect(() => {
    // Only auto-generate if user hasn't typed a custom valid code? 
    // Or always overwrite? The prompt implies "auto generate" behavior similar to CSV.
    // We'll generate.
    if (!debouncedNama || debouncedNama.length < 3) return;
    
    // If code is already manually set to something valid (length 3), maybe don't overwrite?
    // But biasanya "Auto" berarti bereaksi terhadap Nama.
    // Kita gunakan logika sederhana: generate.
    
    async function gen() {
        setCodeStatus('generating');
        const res = await generateCode(debouncedNama);
        if (res.ok && res.data) {
            setKode(res.data.code);
            setRuleInfo(res.data.rule);
            if (existingCodes.has(res.data.code)) {
                setCodeStatus('taken');
            } else {
                setCodeStatus('valid');
            }
        } else {
            setCodeStatus('idle');
        }
    }
    gen();
  }, [debouncedNama]); // Removed existingCodes dependency to avoid loops, though it's stable.

  // Manual Code Validation
  const handleCodeChange = (val: string) => {
      const up = val.toUpperCase().replace(/[^A-Z]/g, '');
      setKode(up);
      setRuleInfo('Manual Input');
      
      if (up.length === 0) {
          setCodeStatus('idle');
          return;
      }
      if (up.length !== 3) {
          setCodeStatus('invalid_length');
          return;
      }
      if (existingCodes.has(up)) {
          setCodeStatus('taken');
          return;
      }
      setCodeStatus('valid');
  };

  // Assignment Logic
  const addAssignmentBlock = () => {
    setAssignments(prev => [
      ...prev, 
      { 
        id: crypto.randomUUID(), 
        term: '', 
        selectedCourseNames: [], 
        availableCourses: [], 
        loadingCourses: false 
      }
    ]);
  };

  const removeAssignmentBlock = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const handleTermChange = async (blockId: string, term: string) => {
    // Check if term is already selected (though UI should prevent it)
    if (assignments.some(a => a.id !== blockId && a.term === term)) {
        toast.error('Tahun ajaran ini sudah dipilih!');
        return;
    }

    // Update term
    setAssignments(prev => prev.map(a => a.id === blockId ? { ...a, term, loadingCourses: true, selectedCourseNames: [] } : a));
    
    // Fetch courses
    const res = await fetchPraktikumByTerm(term);
    
    setAssignments(prev => prev.map(a => {
        if (a.id !== blockId) return a;
        if (res.ok && res.data) {
            return {
                ...a,
                loadingCourses: false,
                availableCourses: res.data.map(p => ({ id: p.id, nama: p.nama }))
            };
        }
        return { ...a, loadingCourses: false, availableCourses: [] };
    }));
  };

  const toggleCourse = (blockId: string, courseName: string, checked: boolean) => {
      setAssignments(prev => prev.map(a => {
          if (a.id !== blockId) return a;
          const newSelection = checked 
            ? [...a.selectedCourseNames, courseName]
            : a.selectedCourseNames.filter(n => n !== courseName);
          return { ...a, selectedCourseNames: newSelection };
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nimStatus === 'taken') {
        toast.error('NIM sudah terdaftar!');
        return;
    }
    if (codeStatus === 'taken') {
        toast.error('Kode Asprak sudah digunakan!');
        return;
    }
    if (codeStatus === 'invalid_length') {
        toast.error('Kode Asprak harus 3 huruf!');
        return;
    }
    if (angkatan.length !== 4) {
        toast.error('Angkatan harus 4 digit!');
        return;
    }
    
    setSubmitLoading(true);
    try {
        const payload: UpsertAsprakInput = {
            nim,
            nama_lengkap: nama,
            kode,
            angkatan: parseInt(angkatan),
            assignments: assignments.map(a => ({
                term: a.term,
                praktikumNames: a.selectedCourseNames
            })).filter(a => a.term && a.praktikumNames.length > 0)
        };
        
        await onSubmit(payload);
    } catch (e: any) {
        toast.error(e.message || 'Gagal menyimpan data');
    } finally {
        setSubmitLoading(false);
    }
  };

  // Helper to filter terms
  const getDisabledTerms = (currentBlockId: string) => {
      return new Set(assignments.filter(a => a.id !== currentBlockId).map(a => a.term).filter(Boolean));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Personal Info Section - Header removed as requested */}
      <div className="grid gap-3">
           {/* Nama */}
           <div className="space-y-1.5">
             <Label htmlFor="nama">Nama Lengkap</Label>
             <Input 
               id="nama" 
               value={nama} 
               onChange={e => setNama(e.target.value)} 
               placeholder="Contoh: Muhammad Farhan"
               required
               className="h-9"
             />
           </div>

           <div className="grid grid-cols-2 gap-3">
              {/* NIM */}
              <div className="space-y-1.5">
                <Label htmlFor="nim">NIM</Label>
                <div className="relative">
                    <Input 
                      id="nim" 
                      value={nim} 
                      onChange={e => {
                          const val = e.target.value;
                          setNim(val);
                          if(nimStatus === 'taken') setNimStatus('checking');
                      }} 
                      placeholder="1301..."
                      className={`h-9 ${nimStatus === 'taken' ? 'border-destructive focus-visible:ring-destructive' : nimStatus === 'valid' ? 'border-green-500' : ''}`}
                      required
                    />
                    {nimStatus === 'checking' && <Loader2 size={14} className="absolute right-3 top-2.5 animate-spin text-muted-foreground"/>}
                    {nimStatus === 'valid' && <CheckCircle2 size={14} className="absolute right-3 top-2.5 text-green-500"/>}
                    {nimStatus === 'taken' && <AlertCircle size={14} className="absolute right-3 top-2.5 text-destructive"/>}
                </div>
                {nimStatus === 'taken' && <p className="text-[10px] text-destructive mt-1">NIM sudah terdaftar.</p>}
              </div>

              {/* Kode */}
              <div className="space-y-1.5">
                 <Label htmlFor="kode">Kode Asprak</Label>
                 <div className="relative">
                     <Input 
                        id="kode"
                        value={kode}
                        onChange={e => handleCodeChange(e.target.value)}
                        maxLength={3}
                        className={`h-9 uppercase font-mono tracking-wider ${
                            codeStatus === 'taken' || codeStatus === 'invalid_length' 
                                ? 'border-destructive focus-visible:ring-destructive' 
                                : codeStatus === 'valid' ? 'border-green-500' : ''
                        }`}
                        placeholder="MFA"
                        required
                     />
                     {codeStatus === 'generating' && <Loader2 size={14} className="absolute right-3 top-2.5 animate-spin text-muted-foreground"/>}
                 </div>
                 {codeStatus === 'taken' && <p className="text-[10px] text-destructive mt-1">Kode sudah digunakan.</p>}
                 {codeStatus === 'invalid_length' && <p className="text-[10px] text-destructive mt-1">Harus pas 3 huruf.</p>}
                 {codeStatus === 'valid' && ruleInfo && <p className="text-[10px] text-muted-foreground mt-1">OK ({ruleInfo})</p>}
              </div>
           </div>

           {/* Angkatan */}
           <div className="space-y-1.5">
              <Label htmlFor="angkatan">Angkatan</Label>
              <Input 
                 id="angkatan"
                 type="number"
                 value={angkatan}
                 onChange={e => setAngkatan(e.target.value)}
                 min={2000}
                 max={2099}
                 required
                 className="h-9"
              />
              <p className="text-[10px] text-muted-foreground">Format 4 digit (YYYY)</p>
           </div>
      </div>
      
      <hr className="border-border/50" />

      {/* Assignments Section */}
      <div className="space-y-3">
          <div className="flex justify-between items-center">
             <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Penugasan / History</h3>
             {/* No button here as requested? "step paling bawah tombol biru" */}
          </div>

          <div className="space-y-3">
              {assignments.map((block, idx) => {
                  const disabledTerms = getDisabledTerms(block.id);
                  return (
                    <Card key={block.id} className="relative bg-muted/20 border-border/50 shadow-sm">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-1 top-1 h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeAssignmentBlock(block.id)}
                            type="button"
                        >
                            <Trash2 size={14} />
                        </Button>
                        <CardContent className="p-3 space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Tahun Ajaran (Term)</Label>
                                <Select 
                                    value={block.term} 
                                    onValueChange={(val) => handleTermChange(block.id, val)}
                                >
                                    <SelectTrigger className="bg-background h-8 text-xs">
                                        <SelectValue placeholder="Pilih Angkatan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTerms.map(t => (
                                            <SelectItem 
                                                key={t} 
                                                value={t}
                                                disabled={disabledTerms.has(t)}
                                                className="text-xs"
                                            >
                                                {t} {disabledTerms.has(t) ? '(Dipilih)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {block.term && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Mata Kuliah Diampu</Label>
                                    {block.loadingCourses ? (
                                        <div className="flex justify-center p-2"><Loader2 size={16} className="animate-spin text-muted-foreground"/></div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto border rounded-md p-2 bg-background">
                                            {block.availableCourses.map(course => (
                                                <div key={course.id} className="flex items-start space-x-2">
                                                    <Checkbox 
                                                        id={`${block.id}-${course.id}`}
                                                        checked={block.selectedCourseNames.includes(course.nama)}
                                                        onCheckedChange={(c) => toggleCourse(block.id, course.nama, !!c)}
                                                        className="h-3.5 w-3.5 mt-0.5"
                                                    />
                                                    <label htmlFor={`${block.id}-${course.id}`} className="text-xs cursor-pointer select-none leading-tight">
                                                        {course.nama}
                                                    </label>
                                                </div>
                                            ))}
                                            {block.availableCourses.length === 0 && (
                                                <p className="text-[10px] text-muted-foreground col-span-2 text-center py-1">Tidak ada praktikum.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                  );
              })}
          </div>

          <Button 
             type="button" 
             onClick={addAssignmentBlock} 
             variant="default" 
             size="sm"
             className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
          >
              <Plus size={14} className="mr-2"/> Tambah Tahun Ajaran
          </Button>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-8">
          Batal
        </Button>
        <Button 
            type="submit" 
            size="sm"
            className="h-8"
            disabled={
                submitLoading || 
                nimStatus === 'taken' || 
                codeStatus === 'invalid_length' || 
                codeStatus === 'taken' || 
                codeStatus === 'generating'
            }
        >
          {submitLoading ? 'Menyimpan...' : 'Simpan Data Asprak'}
        </Button>
      </div>
    </form>
  );
}
