📋 Dokumentasi Sistem Praktikum CASLAB FIF
🏛️ Struktur Organisasi
Fakultas Informatika (FIF) memiliki 4 program studi:

- **IF** (Informatika)
- **DS** (Data Science)
- **TI** (Teknologi Informasi)
- **RPL** (Rekayasa Perangkat Lunak)
*(Catatan: Dalam DB V3, Program Studi dikelola dalam tabel master terpisah, sehingga fleksibel untuk penambahan prodi baru tanpa mengubah struktur tabel)*


📚 Struktur Mata Kuliah Praktikum
Kasus 1: Mata Kuliah dengan Nama Sama di Semua Prodi
Contoh: STD (Struktur Data)
| Program Studi | Nama Panjang Mata Kuliah | Status |
|---|---|---|
| IF | Struktur Data | ✅ Ada |
| DS | Struktur Data | ✅ Ada |
| TI | Struktur Data | ✅ Ada |
| RPL | Struktur Data | ✅ Ada |
Karakteristik:

Praktikum STD memiliki nama mata kuliah yang sama di semua prodi: "Struktur Data"
Modul yang digunakan mengikuti standar prodi masing-masing
Meskipun nama sama, setiap prodi dapat memiliki konten modul yang disesuaikan


Kasus 2: Mata Kuliah dengan Nama Berbeda per Prodi
Contoh: WEBPRO (Pemrograman Web)
| Program Studi | Nama Panjang Mata Kuliah | Status |
|---|---|---|
| IF | - | ❌ Tidak Ada |
| DS | - | ❌ Tidak Ada |
| TI | Pemrograman Web | ✅ Ada |
| RPL | Perancangan dan Pemrograman Web | ✅ Ada |
Karakteristik:

Praktikum WEBPRO hanya ada di TI dan RPL
Setiap prodi memiliki nama mata kuliah yang berbeda:

- TI: "Pemrograman Web"
- RPL: "Perancangan dan Pemrograman Web"


Modul dan materi pembelajaran disesuaikan dengan nama mata kuliah masing-masing prodi


🎓 Struktur Kelas & Tipe Kelas
Dalam Database V3, terdapat beberapa jenis kelas yang didukung:

1.  **REGULER**: Kelas standar satu angkatan.
    *   *Contoh*: `IF-48-08` (Angkatan 2024, Tipe REGULER).
2.  **GABUNGAN**: Kelas gabungan lintas angkatan atau sisa mahasiswa.
    *   *Contoh*: `IF-46-GAB` (Angkatan 2022, Tipe GABUNGAN).
    *   *Karakteristik*: Bisa mengambil mata kuliah dari semester berbeda (misal smt 2 & 4).
3.  **GABUP (Gabungan Atas)**: Variasi dari kelas gabungan.
    *   *Contoh*: `IF-48-GABUP02` (Angkatan 2024, Tipe GABUP).
4.  **PJJ (Pendidikan Jarak Jauh)**: Kelas online penuh.
    *   *Contoh*: `IF-48-PJJ1` (Angkatan 2024, Tipe PJJ).
    *   *Karakteristik*: Jadwal memiliki `is_online=TRUE`, menggunakan platform (Zoom/GMeet), tidak butuh ruangan fisik.

Distribusi Kelas per Prodi (Contoh Angkatan 2023)
| Program Studi | Jumlah Kelas | Keterangan |
|---|---|---|
| IF | 12 kelas | Kelas terbanyak |
| DS | 3 kelas | Kelas paling sedikit |
| TI | 5 kelas | Kelas sedang |
| RPL | 4 kelas | Kelas sedang |

📊 Total Kelas Praktikum
Praktikum STD (Struktur Data)
- IF:  12 kelas
- DS:   3 kelas
- TI:   5 kelas
- RPL:  4 kelas
─────────────
TOTAL: 24 kelas praktikum = 24 jadwal berbeda
Praktikum WEBPRO (Pemrograman Web)
- TI:   5 kelas
- RPL:  4 kelas
─────────────
TOTAL: 9 kelas praktikum = 9 jadwal berbeda

🏫 Contoh Detail Kelas
Kelas: IF-48-08
Informasi Dasar:

Kode Kelas: IF-48-08
Program Studi: IF (Informatika)
Angkatan: 2024
Tipe Kelas: REGULER
*(Catatan: Semester tidak lagi melekat pada kelas, tetapi pada pengambilan praktikum)*

Praktikum di Semester 3:
| No | Mata Kuliah | Praktikum |
|---|---|---|
| 1 | Struktur Data | STD |
| 2 | Jaringan Komputer | JARKOM |
| 3 | Sistem Operasi | SISOP |
Kesimpulan: Satu kelas dapat memiliki 3 praktikum berbeda dalam satu semester (konteks semester ada pada relasi pengambilan).

👥 Sistem Pool Asisten Praktikum (Asprak)
Konsep Pool Asprak
Asprak dikelompokkan berdasarkan mata kuliah praktikum, bukan per prodi atau per kelas.
Contoh 1: Pool Asprak STD
Total Asprak STD: ±60 orang
Distribusi per Kelas:
| Kelas | Program Studi | Jumlah Asprak |
|---|---|---|
| IF-48-08 | IF | 6 asprak |
| DS-48-02 | DS | 6 asprak |
| TI-48-05 | TI | 6 asprak |
| RPL-48-04 | RPL | 6 asprak |
Karakteristik:

- 60 asprak STD dapat mengajar di semua prodi (IF, DS, TI, RPL)
- Asprak dapat "loncat sana-sini" antar prodi
- Asprak tidak terikat pada satu prodi tertentu
- Modul yang diajarkan mengikuti prodi tempat asprak mengajar
- Nama mata kuliah yang digunakan: "Struktur Data" (sama untuk semua prodi)


Contoh 2: Pool Asprak WEBPRO
Total Asprak WEBPRO: ±60 orang
Distribusi per Kelas:
| Kelas | Program Studi | Jumlah Asprak |
|---|---|---|
| TI-48-05 | TI | 6 asprak |
| RPL-48-04 | RPL | 6 asprak |
Karakteristik:

- 60 asprak WEBPRO dapat mengajar hanya di TI dan RPL (karena WEBPRO tidak ada di IF dan DS)
- Asprak dapat "loncat" antara IT dan RPL
- Modul yang diajarkan berbeda per prodi:

  - Di IT: mengikuti modul "Pemrograman Web"
  - Di RPL: mengikuti modul "Perancangan dan Pemrograman Web"


Nama mata kuliah yang digunakan berbeda per prodi


🔑 Poin Penting
### 1. Hubungan Mata Kuliah dan Prodi

- Satu mata kuliah praktikum (contoh: STD) dapat ada di beberapa prodi
- Nama panjang mata kuliah dapat sama (STD) atau berbeda (WEBPRO) per prodi
- Modul pembelajaran selalu mengikuti prodi masing-masing

### 2. Sistem Kelas & Semester
- **Tipe Kelas**: Mendukung REGULER, GABUNGAN (multi-angkatan), PJJ (online), dan GABUP (gabungan atas).
- **Sifat Semester**: Kontekstual. Semester melekat pada *pengambilan* praktikum, bukan pada entitas kelas itu sendiri. (Misal: Kelas Gabungan bisa mengambil matkul semester 2 dan 4 sekaligus).
- **Fleksibilitas**: Angkatan bersifat *nullable* untuk mengakomodasi kelas gabungan lintas angkatan.

### 3. Sistem Asprak (Pool System)

- Asprak dikelompokkan per mata kuliah praktikum, bukan per prodi
- Satu pool asprak dapat mengajar di berbagai prodi
- Pembagian: setiap kelas mendapat 6 asprak dari pool
- Asprak fleksibel, dapat berpindah antar kelas dan prodi

### 4. Tahun Ajaran

- Format: YY/YY-S (contoh: 25/26-1)
- 25/26-1 = Tahun Ajaran 2025/2026 Semester Ganjil (1)
- 25/26-2 = Tahun Ajaran 2025/2026 Semester Genap (2)


📐 Diagram Hubungan
```text
Mata Kuliah (STD, WEBPRO)
    ↓
Program Studi (Master Table) → Nama Panjang MK
    ↓
Kelas (Type: REGULER/GABUNGAN/PJJ)
    ↓
Pengambilan Praktikum (Context: Semester & Tahun Ajaran)
    ↓
Jadwal (Hari, Sesi/Jam, Ruangan/Platform Online)
    ↓
Asprak (6 orang dari pool ±60)
```

Dokumentasi ini menjelaskan sistem praktikum CASLAB dengan fokus pada:

✅ Struktur organisasi dan prodi
✅ Perbedaan nama mata kuliah per prodi
✅ Sistem pool asprak yang fleksibel
✅ Hubungan antara kelas, praktikum, dan jadwal