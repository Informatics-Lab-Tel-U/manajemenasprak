# Sistem Asisten Praktikum (Asprak)
📊 Total Asprak per Tahun Ajaran
| Tahun Ajaran | Total Asprak | Keterangan |
|---|---|---|
| 2526-1 | 200+ orang | Semester Ganjil |
| 2526-2 | 200+ orang | Semester Genap |

🔄 Sistem Multi-Praktikum
Konsep Penting: Satu asprak dapat mengampu lebih dari 1 mata kuliah praktikum
Contoh di Tahun Ajaran 2526-1:
Asprak dengan kode "ARS" (Athila Ramdani Saputra):
├── ALPRO 1 (Algoritma Pemrograman 1)
└── STD (Struktur Data)

Total: 2 praktikum
Contoh di Tahun Ajaran 2526-2:
Asprak dengan kode "ARS" (Ananda Rizky Saputra):
├── ALPRO 2 (Algoritma Pemrograman 2)
└── DKA (Dasar Kecerdasan Artifisial)

Total: 2 praktikum
Karakteristik:

- ✅ 1 asprak bisa mengampu maksimal 2 mata kuliah praktikum dalam 1 semester
- ✅ Asprak dapat mengajar di berbagai prodi dalam praktikum yang sama
- ✅ Setiap kelas mendapat 6 asprak dari pool
- ✅ Asprak fleksibel, dapat "loncat sana-sini" antar kelas


♻️ Sistem Recycling Kode Asprak
Kode asprak dapat digunakan kembali (di-recycle) di tahun ajaran berbeda oleh orang yang berbeda.
Contoh Kasus Kode "ARS":
| Tahun Ajaran | Nama Lengkap | Praktikum yang Diampu |
|---|---|---|
| 2526-1 | Athila Ramdani Saputra | ALPRO 1, STD |
| 2526-2 | Ananda Rizky Saputra | ALPRO 2, DKA |
| 2627-1 | Athila Ramdani Saputra | JARKOM, SISOP |
Penjelasan:

- Kode "ARS" digunakan oleh Athila Ramdani Saputra di tahun ajaran 2526-1
- Kode yang sama "ARS" digunakan oleh Ananda Rizky Saputra (orang berbeda) di tahun ajaran 2526-2
- Kode "ARS" kembali digunakan oleh Athila Ramdani Saputra (orang pertama) di tahun ajaran 2627-1

Implikasi Sistem:

- ⚠️ Kode asprak TIDAK UNIK secara global
- ✅ Kode asprak UNIK per tahun ajaran
- ✅ Kombinasi (kode + tahun_ajaran) adalah unique identifier
- ⚠️ Nama lengkap asprak HARUS disimpan untuk identifikasi
- ⚠️ NIM lebih reliable sebagai identifier permanen


📊 Ringkasan Pool Asprak per Praktikum
Tahun Ajaran 2526-1:
| Praktikum | Total Kelas | Asprak per Kelas | Total Pool Asprak |
|---|---|---|---|
| JARKOM | 24 kelas | 6 | ±60 orang |
| STD | 24 kelas | 6 | ±60 orang |
| SISOP | 17 kelas | 6 | ±40 orang |
| ALPRO 1 | 24 kelas | 6 | ±60 orang |

Tahun Ajaran 2526-2:
| Praktikum | Total Kelas | Asprak per Kelas | Total Pool Asprak |
|---|---|---|---|
| DKA | 15 kelas | 6 | ±40 orang |
| WEBPRO | 9 kelas | 6 | ±25 orang |
| ALPRO 2 | 24 kelas | 6 | ±60 orang |

🔑 Poin Penting Sistem
### 1. Struktur Mata Kuliah

- ✅ Satu mata kuliah praktikum dapat ada di beberapa prodi
- ✅ Nama panjang mata kuliah dapat sama atau berbeda per prodi
- ✅ Modul pembelajaran selalu mengikuti prodi masing-masing

### 2. Struktur Kelas

- ✅ Setiap prodi memiliki jumlah kelas yang relatif konsisten per angkatan
- ✅ Format kode kelas: [PRODI]-[ANGKATAN]-[NOMOR]
- ✅ Satu kelas dapat memiliki beberapa praktikum dalam satu semester

### 3. Sistem Asprak (Pool System)

- ✅ Asprak dikelompokkan per mata kuliah praktikum
- ✅ Total asprak per tahun ajaran: 200+ orang
- ✅ Satu asprak dapat mengampu maksimal 2 praktikum
- ✅ Asprak dapat mengajar di berbagai prodi
- ✅ Setiap kelas mendapat 6 asprak dari pool
- ✅ Kode asprak dapat di-recycle di tahun ajaran berbeda

### 4. Tahun Ajaran

- ✅ Format: YYWW-S (contoh: 2526-1, 2526-2)
- ✅ Semester Ganjil: -1
- ✅ Semester Genap: -2

### 5. Unique Identifier

- ⚠️ Kode asprak TIDAK UNIK secara global
- ✅ Kombinasi (kode + tahun_ajaran) adalah unique identifier
- ✅ NIM adalah identifier permanen yang paling reliable


📐 Diagram Hubungan Lengkap
```text
Mata Kuliah (STD, WEBPRO, JARKOM, ALPRO 1, ALPRO 2, SISOP, DKA)
    ↓
Program Studi (Master Data)
    ↓
Kelas (Type: REGULER/GABUNGAN/PJJ/GABUP)
    ↓
Pengambilan Praktikum (Menentukan: Semester & Tahun Ajaran)
    ↓
Jadwal (Hari, Sesi, Jam, Ruangan/Platform)
    ↓
Asprak (6 orang dari pool)
    ↓
Pool Asprak (±60 orang per praktikum, total 200+ per tahun ajaran)
    ↑
    └── 1 Asprak bisa mengampu 2 Praktikum
```

Dokumentasi ini menjelaskan sistem praktikum CASLAB secara lengkap dengan:
