# ⚠️ Sistem Pendataan Pelanggaran Asprak (Sesuai Database Ver 3)

## 📋 Konsep Dasar
Sistem ini berfungsi sebagai **pencatat (log)** indisipliner asprak. Berdasarkan struktur database terupdate (`databasever3.db`), setiap data pelanggaran **wajib dikaitkan dengan jadwal spesifik**.

**Poin Penting:**
- Pendataan bersifat administratif & evaluatif.
- Pelanggaran melekat pada **ID Jadwal** (`id_jadwal`), yang secara hierarki terhubung ke Praktikum.
- Ini berarti sistem mencatat: *Siapa* melanggar *Dimana* (Jadwal/Kelas mana) dan *Kapan* (Modul berapa).

---

## 🔍 Studi Kasus: Asprak "TOM"

**Profil Asprak:**
- Nama: **TOM**
- Pool Praktikum: **DKA** dan **WEBPRO**

**Skenario Pelanggaran di Database:**
| No | Praktikum | Jadwal Spesifik (ID Jadwal) | Jenis Pelanggaran | Keterangan |
|---|---|---|---|---|
| 1 | **DKA** | Senin, 08.00 (Kelas IF-48-01) | Keterlambatan | Telat hadir 15 menit |
| 2 | **WEBPRO** | Selasa, 10.00 (Kelas TI-48-02) | Tidak Hadir | Tanpa keterangan |

**Analisis:**
- Pelanggaran Tom tidak mengambang, tapi "menunjuk" ke jadwal spesifik di mana dia seharusnya bertugas.
- Akumulasi tetap bisa dihitung per Praktikum (karena Jadwal → Praktikum).

---

## ⚙️ Mekanisme Pendataan (Logika Database)

### 1. Schedule-Based Tracking
Karena tabel `Pelanggaran` memiliki kolom `id_jadwal` yang bersifat **NOT NULL**, maka setiap input pelanggaran harus memilih jadwal yang valid.

**Logika Relasi (Lihat ERD):**
`Pelanggaran`
   └── `id_jadwal` (FK)
         └── `Jadwal`
               └── `id_kelas_praktikum`
                     └── `Praktikum` (Pool Mata Kuliah)

### 2. Data yang Diperlukan (Sesuai Kolom DB)
Untuk mencatat pelanggaran di sistem, Admin memerlukan:
- 👤 **Asprak** (`id_asprak`): Siapa yang melanggar?
- � **Jadwal** (`id_jadwal`): Di jadwal mana pelanggaran terjadi?
- 🔢 **Modul** (`modul`): Saat modul ke berapa?
- ⚠️ **Jenis & Keterangan**: Detail pelanggaran.

---

## 📐 Diagram Alur Pencatatan (Current System)

```text
Kasus: Tom Melanggar di Praktikum WEBPRO

      [ASPRAK: TOM]
           │
           ▼
      [CARI JADWAL MENGAJAR]
      (Sistem menampilkan jadwal yang diajar Tom atau Jadwal di Pool)
      1. Senin 08.00 - DKA
      2. Selasa 10.00 - WEBPRO ◄─── Pilih Jadwal Ini
           │
           ▼
      ---------------------------
      | Input Data Pelanggaran: |
      | 1. ID Asprak: TOM       |
      | 2. ID Jadwal: #1024     | (WEBPRO, Selasa 10.00)
      | 3. Modul: 3             |
      | 4. Jenis: Terlambat     |
      ---------------------------
                 │
                 ▼
      [DATABASE PELANGGARAN]
      Row: [Tom | ID_Jadwal(#1024) | Modul 3 | Terlambat]
```

## 📝 Catatan Implementasi
Meskipun tujuan evaluasi adalah "Per Praktikum", struktur database saat ini menuntut detail "Per Jadwal".
- **Kelebihan**: Data sangat akurat (bisa ditelusuri kapan persisnya kejadian).
- **Implikasi**: Admin harus tahu jadwal mana yang dimaksud saat menginput pelanggaran.