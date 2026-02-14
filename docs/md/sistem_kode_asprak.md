# Sistem Aturan Pembuatan Kode Asprak (3 Huruf)

> **Catatan Penting:**
> - Kode Asprak **HANYA 3 HURUF** (tidak ada angka)
> - Nama yang diinput **sudah bersih** (tanpa gelar)
> - Jika semua kombinasi 3 huruf habis, sistem akan error/tidak bisa generate

## Daftar Isi
- [A. Aturan Berdasarkan Jumlah Kata dalam Nama](#a-aturan-berdasarkan-jumlah-kata-dalam-nama)
  - [Nama 1 Kata](#nama-1-kata)
  - [Nama 2 Kata](#nama-2-kata)
  - [Nama 3 Kata](#nama-3-kata)
  - [Nama 4+ Kata (Universal Formula)](#nama-4-kata-universal-formula)
- [B. Sistem Fallback Universal](#b-sistem-fallback-universal-untuk-semua-kasus)
- [C. Estimasi Total Kemungkinan Kode](#c-estimasi-total-kemungkinan-kode)
- [D. Algoritma Lengkap](#d-algoritma-lengkap)
- [E. Contoh Kasus Edge Case](#e-contoh-kasus-edge-case)

---

## A. Aturan Berdasarkan Jumlah Kata dalam Nama

### Nama 1 Kata

1. **Aturan 1.1**: Tiga huruf pertama
   - Contoh: `BUDI` → `BUD`
   
2. **Aturan 1.2**: Huruf ke-1, ke-2, ke-4
   - Contoh: `BUDI` → `BUI`

3. **Aturan 1.3**: Huruf ke-1, ke-3, ke-4
   - Contoh: `BUDI` → `BDI`

4. **Aturan 1.4**: Huruf ke-1, ke-2, huruf terakhir
   - Contoh: `BUDIMAN` → `BUN`

**Fallback 1 Kata**: Jika semua gagal, gunakan kombinasi C(n,3) dari semua huruf dalam nama
- `BUDI` → 4 huruf, kombinasi: BUD, BUI, BDI, UDI
- Total kemungkinan = C(4,3) = 4 kombinasi

---

### Nama 2 Kata

1. **Aturan 2.1**: Dua huruf pertama kata-1 + huruf pertama kata-2
   - Contoh: `ANDI WIJAYA` → `ANW`

2. **Aturan 2.2**: Huruf pertama kata-1 + dua huruf pertama kata-2
   - Contoh: `ANDI WIJAYA` → `AWI`

3. **Aturan 2.3**: Huruf pertama kata-1 + huruf pertama kata-2 + huruf terakhir kata-2
   - Contoh: `ANDI WIJAYA` → `AWA`

4. **Aturan 2.4**: Dua huruf pertama kata-1 + huruf terakhir kata-2
   - Contoh: `ANDI WIJAYA` → `ANA`

**Fallback 2 Kata**: Kombinatorik dari pool huruf kedua kata
- Pool: [Huruf-huruf dari kata-1] + [Huruf-huruf dari kata-2]
- Prioritas: Ambil dari posisi strategis (awal, tengah, akhir setiap kata)
- Contoh: `ANDI WIJAYA`
  - Pool prioritas: A, N, D, I, W, I, J, A, Y, A
  - Kombinasi: AWI, ANW, ADW, AIW, AWJ, dst
  - Total teoritis: C(10,3) = 120 kombinasi

---

### Nama 3 Kata atau Lebih (3+ Kata)
> **Catatan:** Untuk nama dengan 4 kata atau lebih, sistem hanya mengambil **3 kata pertama** dan menerapkan aturan di bawah ini. Kata ke-4 dan seterusnya diabaikan dalam tahap aturan standar.

1. **Aturan 3.1**: Huruf pertama dari 3 kata pertama
   - Contoh: `MUHAMMAD ABIYU ALGHIFARI` → `MAA`
   - Contoh (4 Kata): `MUHAMMAD ABIYU ALGHIFARI PUTRA` → `MAA`

2. **Aturan 3.2**: Huruf pertama kata-1 + dua huruf pertama kata-2
   - Contoh: `MUHAMMAD ABIYU ALGHIFARI` → `MAB`

3. **Aturan 3.3**: Dua huruf pertama kata-1 + huruf pertama kata-2
   - Contoh: `MUHAMMAD ABIYU ALGHIFARI` → `MUA`

4. **Aturan 3.4**: Huruf pertama kata-1 + huruf pertama kata-2 + huruf kedua kata-3
   - Contoh: `MUHAMMAD ABIYU ALGHIFARI` → `MAL`

5. **Aturan 3.5**: Huruf pertama kata-1 + dua huruf pertama kata-3
   - Contoh: `MUHAMMAD ABIYU ALGHIFARI` → `MAL`

6. **Aturan 3.6**: Dua huruf pertama kata-1 + huruf pertama kata-3
   - Contoh: `MUHAMMAD ABIYU ALGHIFARI` → `MUA`

7. **Aturan 3.7**: Huruf pertama kata-1 + huruf pertama kata-2 + huruf terakhir kata-3
   - Contoh: `MUHAMMAD ABIYU ALGHIFARI` → `MAI`

8. **Aturan 3.8**: Huruf pertama ketiga kata dengan huruf kedua kata-2 (Correction: checks w1[0] + w2[1] + w3[0])
   - Contoh: `MUHAMMAD ABIYU ALGHIFARI` → `MBA`

**Fallback 3+ Kata**: Kombinatorik dari pool huruf 3 kata pertama
- Pool prioritas dari setiap kata (posisi 1, 2, 3, terakhir)
- Total pool huruf unik diambil dari 3 kata pertama.


---

## B. Sistem Fallback Universal (Untuk Semua Kasus)

Jika semua aturan spesifik gagal, gunakan **Generator Kombinatorik Bertingkat**:

### Level 1: Kombinasi Posisi Strategis

Ambil huruf dari posisi strategis setiap kata:
- Posisi 1 (huruf pertama)
- Posisi 2 (huruf kedua)
- Posisi terakhir
- Posisi tengah (jika ada)

**Rumus Pool**:
```
Pool = {huruf[i][j] | untuk setiap kata i, posisi j ∈ {1, 2, tengah, akhir}}
Kombinasi = C(|Pool|, 3)
```

### Level 2: Kombinasi Lengkap dengan Filter

Jika Level 1 masih konflik, expand pool:
- Ambil SEMUA huruf dari nama (kecuali spasi)
- Generate kombinasi C(n, 3)
- Filter kombinasi dengan prioritas:
  1. Dimulai dengan huruf pertama nama
  2. Mengandung huruf dari kata-1
  3. Urutan alfabetis
  4. Mudah diucapkan (hindari kombinasi konsonan berlebih)

**Contoh**:
```
Nama: ALI BIN AHMAD (3 kata)
Semua huruf: A, L, I, B, I, N, A, H, M, A, D
Huruf unik: A, L, I, B, N, H, M, D (8 huruf)
Kombinasi total: C(8,3) = 56 kombinasi

Filter prioritas:
1. Dimulai dengan A: ABA, ABH, ABM, ABD, ALI, ALB, ALN, ...
2. Mengandung L: ALI, ALB, ALN, ALH, ALM, ALD, LBI, ...
3. dst
```

### Level 3: Manual Assignment (Last Resort)

**Jika semua kombinasi 3 huruf dari nama sudah terpakai:**
- Sistem akan **GAGAL** generate kode otomatis
- Solusi: **Admin harus assign manual** atau minta user mengubah nama input
- Kemungkinan ini sangat kecil (lihat estimasi di bawah)


---

## C. Estimasi Total Kemungkinan Kode

| Jumlah Kata | Aturan Standar | Pool Huruf (avg) | Kombinasi Fallback | Total Kemungkinan | Catatan |
|-------------|----------------|------------------|--------------------|--------------------|---------|
| 1 kata      | 4              | 5-8 huruf        | C(8,3) = 56        | ~60                | Risiko konflik tinggi untuk nama pendek |
| 2 kata      | 4              | 10-15 huruf      | C(12,3) = 220      | ~225               | Cukup aman |
| 3 kata      | 8              | 15-20 huruf      | C(18,3) = 816      | ~825               | Sangat aman |
| 4+ kata     | 6+             | 20-30 huruf      | C(25,3) = 2,300    | ~2,500+            | Hampir mustahil konflik |

**Kesimpulan:**
- Untuk nama 3+ kata: **Sangat aman**, konflik sangat jarang terjadi
- Untuk nama 2 kata: **Aman**, masih banyak kombinasi
- Untuk nama 1 kata: **Risiko tinggi**, kemungkinan perlu manual assignment

**Total Kemungkinan Huruf:**
- Alfabet Indonesia: 26 huruf
- Total kombinasi 3 huruf: 26³ = **17,576 kemungkinan**
- Kombinasi tanpa pengulangan: C(26,3) = **2,600 kemungkinan**
- **Kesimpulan: Sistem ini sustainable untuk ribuan asprak**


---

## D. Algoritma Lengkap

```
FUNCTION generate_code(nama_lengkap):
    words = split(nama_lengkap)
    n = count(words)
    
    // Fase 1: Aturan Standar
    FOR rule IN standard_rules[n]:
        code = apply_rule(rule, words)
        IF is_available(code):
            RETURN code
    
    // Fase 2: Fallback Kombinatorik Level 1
    pool = get_strategic_positions(words)
    FOR combination IN generate_combinations(pool, 3):
        code = join(combination)
        IF is_available(code):
            RETURN code
    
    // Fase 3: Fallback Kombinatorik Level 2
    all_chars = get_all_unique_chars(nama_lengkap)
    FOR combination IN generate_combinations(all_chars, 3):
        code = join(combination)
        IF is_available(code):
            RETURN code
    
    // Fase 4: Gagal Generate
    THROW Error("Tidak dapat generate kode, semua kombinasi sudah terpakai")
    // Admin harus melakukan manual assignment
```

### Penjelasan Algoritma:

1. **Fase 1 (Aturan Standar)**
   - Coba semua aturan standar sesuai jumlah kata
   - Setiap aturan menghasilkan 1 kode kandidat
   - Check availability di database
   - Return jika tersedia

2. **Fase 2 (Kombinatorik Strategis)**
   - Generate pool dari posisi strategis (awal, tengah, akhir)
   - Buat kombinasi C(pool, 3)
   - Prioritaskan kombinasi yang dimulai huruf pertama nama
   - Check availability satu per satu

3. **Fase 3 (Kombinatorik Lengkap)**
   - Generate pool dari SEMUA huruf unik dalam nama
   - Buat semua kombinasi C(pool, 3)
   - Filter berdasarkan kriteria (dimulai huruf pertama, dll)
   - Check availability

4. **Fase 4 (Error Handling)**
   - Jika semua kombinasi gagal → throw error
   - Admin perlu intervene manual
   - Kemungkinan ini **sangat kecil** (lihat estimasi)


---

## E. Contoh Kasus Edge Case

### Kasus 1: Nama Sangat Panjang (7 kata)

```
Nama: GUSTI KANJENG RATU MAS ARIMBI PUTRI DEWI

Aturan 7.1: GKR (3 kata pertama)
Aturan 7.2: GKD (kata-1, kata-2, kata-terakhir)
Aturan 7.3: GKA (kata-1 + 2 huruf pertama kata-2)
Aturan 7.4: GAD (kata-1, kata-tengah=ARIMBI, kata-terakhir)
Aturan 7.5: GUD (2 huruf pertama kata-1 + huruf pertama kata-terakhir)

Fallback: Pool = G,U,S,T,I,K,A,N,J,E,N,G,R,T,U,M,A,S,A,R,I,M,B,I,P,U,T,R,I,D,E,W,I
Huruf unik = ~20 huruf → C(20,3) = 1,140 kombinasi
```

### Kasus 2: Nama Pendek (1 kata)

```
Nama: ALI

Aturan 1.1: ALI (3 huruf pertama) ✓
Jika konflik:
  Aturan 1.2: Tidak cukup huruf → SKIP
  Fallback: Hanya 3 huruf → C(3,3) = 1 kombinasi
  Jika ALI sudah terpakai → ERROR (perlu manual assignment)
  
Rekomendasi: Untuk nama 1 kata sangat pendek, sebaiknya gunakan 
nama lengkap atau minta user tambahkan nama tengah/belakang
```

### Kasus 3: Nama dengan Konflik Tinggi

```
Nama: AHMAD BUDI CAHYONO

Urutan Pencarian:
┌─────────┬──────────┬──────┬─────────────┬────────────────────────┐
│ Urutan  │ Aturan   │ Kode │ Status      │ Keterangan             │
├─────────┼──────────┼──────┼─────────────┼────────────────────────┤
│ 1       │ 3.1      │ ABC  │ ✗ Dipakai   │ Sudah digunakan        │
│ 2       │ 3.2      │ AAB  │ ✗ Dipakai   │ Sudah digunakan        │
│ 3       │ 3.3      │ AHB  │ ✓ Tersedia  │ KODE DIPILIH           │
└─────────┴──────────┴──────┴─────────────┴────────────────────────┘
```

### Kasus 4: Nama dengan Huruf Berulang

```
Nama: ANA ANITA ANWAR

Masalah: Banyak huruf A, kombinasi terbatas
Solusi:
1. Aturan 3.1: AAA (3 huruf A) - Valid jika tersedia
2. Aturan 3.2: AAN (A + AN dari Anita)
3. Aturan 3.3: ANA (AN dari Ana + A dari Anita)
4. Fallback: Pool = A,N,I,T,W,R → C(6,3) = 20 kombinasi

Catatan: Huruf berulang (AAA, BBB) tetap valid selama tersedia
```

### Kasus 5: Nama Sangat Unik dengan Banyak Huruf

```
Nama: XAVERIUS YOHANES ZEBEDEUS

Pool huruf unik: X,A,V,E,R,I,U,S,Y,O,H,N,Z,B,D (15 huruf)
Kombinasi: C(15,3) = 455 kemungkinan

Aturan 3.1: XYZ ✓ (sangat unik, kemungkinan besar tersedia)
Jika konflik: Masih ada 454 kombinasi lain
Kesimpulan: Nama dengan banyak huruf unik sangat aman
```

---

## F. Validasi Kode Akhir

Sebelum finalisasi, pastikan:
- ✓ Terdiri dari **tepat 3 huruf kapital** (tidak boleh kurang/lebih)
- ✓ Tidak mengandung angka atau karakter khusus
- ✓ **Unik** (belum pernah digunakan)
- ✓ Mudah diingat dan relevan dengan nama
- ✓ Berasal dari huruf-huruf dalam nama (tidak random)

### Input Requirement

Sebelum masuk sistem, pastikan:
- ✓ Nama sudah **tanpa gelar** (Dr., Ir., S.Kom, dll)
- ✓ Nama sudah **tanpa bin/binti** atau kata penghubung
- ✓ Format: NAMA DEPAN NAMA TENGAH NAMA BELAKANG
- ✓ Minimal 3 huruf total (untuk bisa membuat kode)
- ✓ Sudah dalam format UPPERCASE

**Contoh Input Valid:**
```
✓ MUHAMMAD ABIYU ALGHIFARI
✓ SITI NUR AZIZAH
✓ BUDI SANTOSO
✓ AHMAD

✗ Dr. Ahmad Wijaya, M.Kom  → Harus dihapus gelarnya dulu
✗ Ahmad bin Ali              → Harus dihapus "bin" dulu
✗ AL                         → Kurang dari 3 huruf
```

---

## G. Implementasi dalam Database

### Struktur Tabel

```sql
CREATE TABLE kode_asprak (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kode CHAR(3) UNIQUE NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    aturan_digunakan VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_kode (kode)
);
```

### Contoh Query Check Availability

```sql
-- Check apakah kode tersedia
SELECT COUNT(*) as is_used 
FROM kode_asprak 
WHERE kode = 'MAA';

-- Jika is_used = 0, kode tersedia
-- Jika is_used > 0, kode sudah dipakai
```

---

## H. Flowchart Sistem

```
START
  │
  ├─→ Input: Nama Lengkap (sudah bersih, tanpa gelar)
  │
  ├─→ Validasi Input
  │    ├─ Minimal 3 huruf total
  │    ├─ Format UPPERCASE
  │    └─ Tidak ada karakter khusus
  │
  ├─→ Hitung jumlah kata (N)
  │
  ├─→ Loop: Aturan Standar N.1 s/d N.x
  │    ├─ Generate kode
  │    ├─ Check availability
  │    └─ Jika tersedia → RETURN kode ✓
  │
  ├─→ Fallback Level 1: Kombinasi Posisi Strategis
  │    ├─ Generate pool (huruf awal, tengah, akhir)
  │    ├─ Loop kombinasi C(pool, 3)
  │    └─ Jika tersedia → RETURN kode ✓
  │
  ├─→ Fallback Level 2: Kombinasi Semua Huruf
  │    ├─ Generate pool lengkap (semua huruf unik)
  │    ├─ Loop kombinasi C(pool, 3) dengan filter
  │    └─ Jika tersedia → RETURN kode ✓
  │
  └─→ GAGAL
       ├─ Throw Error
       ├─ Log: "Semua kombinasi sudah terpakai"
       └─ Admin manual assignment required
```

**Catatan:** Kemungkinan mencapai tahap GAGAL sangat kecil (< 0.1% untuk nama 2+ kata)

---

## I. FAQ (Frequently Asked Questions)

### Q1: Bagaimana jika nama hanya 2 huruf?
**A:** Sistem akan error karena tidak cukup untuk membuat kode 3 huruf. Solusi: Minta user menambahkan nama lengkap atau gunakan manual assignment.
- Contoh: `ED` → Tidak valid (harus minimal 3 huruf)

### Q2: Apakah huruf besar/kecil berpengaruh?
**A:** Tidak, semua dinormalisasi ke UPPERCASE. `Ahmad` = `AHMAD`

### Q3: Bagaimana dengan nama dengan tanda hubung?
**A:** Tanda hubung dihilangkan, diperlakukan sebagai pemisah kata.
- Contoh: `SITI-NUR` → `SITI NUR` (2 kata)

### Q4: Apakah kode case-sensitive?
**A:** Tidak, semua disimpan dan dibandingkan dalam UPPERCASE.

### Q5: Bagaimana jika semua kombinasi sudah terpakai?
**A:** Sistem akan throw error dan memerlukan **manual assignment** oleh admin. Namun kemungkinan ini sangat kecil (lihat estimasi di Section C).

### Q6: Apakah kode AAA, BBB, CCC valid?
**A:** Ya, selama tersedia dan berasal dari huruf dalam nama. Tidak ada batasan huruf berulang.

### Q7: Berapa lama proses generate kode?
**A:** 
- Fase 1 (Aturan Standar): Instant (< 10ms)
- Fase 2 (Fallback Level 1): ~100-500ms
- Fase 3 (Fallback Level 2): ~1-3 detik (worst case)

### Q8: Apakah bisa generate kode untuk nama yang sama?
**A:** Tidak, sistem akan otomatis skip karena nama sudah ada di database. Setiap nama harus unik.


---

## J. Changelog & Version History

### Version 1.0 (Current)
- Initial release
- Support nama 1-N kata
- 2-level fallback system (kombinatorik strategis + kombinatorik lengkap)
- **STRICTLY 3 letters only** (no numbers)
- Input requirement: nama sudah tanpa gelar

### Constraints & Limitations
- ❌ Tidak support angka di kode (purely 3 letters)
- ❌ Tidak ada preprocessing otomatis untuk gelar/bin/binti (harus sudah bersih)
- ❌ Jika semua kombinasi habis → manual assignment required
- ✅ Support nama unlimited panjang
- ✅ Scalable untuk ribuan asprak

### Future Improvements (Planned)
- Algoritma machine learning untuk prediksi konflik
- Pre-check collision probability sebelum generate
- Optimasi pool generation untuk nama sangat panjang
- Dashboard admin untuk manual assignment kasus edge
- Batch processing untuk generate banyak kode sekaligus
- API REST endpoint untuk integrasi sistem lain


---

## K. Referensi & Credits

**Dokumentasi ini dibuat untuk:**
- Sistem Informasi Asisten Praktikum
- Keperluan administrasi akademik
- Standarisasi kode identifikasi

**Lisensi:** Internal Use Only

**Last Updated:** 2024

---

**© 2024 Sistem Kode Asprak - All Rights Reserved**
