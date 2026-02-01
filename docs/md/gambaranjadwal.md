📅 Sistem Jadwal Praktikum
🏫 Struktur Jadwal per Kelas
Konsep Dasar:
Satu kelas dapat memiliki beberapa praktikum, dan setiap praktikum memiliki 1 jadwal per minggu.
Contoh Kasus:
```text
Kelas TI-47-01 (REGULER):
├── Praktikum JARKOM → 1 jadwal
└── Praktikum SISOP  → 1 jadwal

Kelas IF-46-GAB (GABUNGAN):
├── Praktikum ALPRO2 (Semester 2) → 1 jadwal
└── Praktikum DKA (Semester 4) → 1 jadwal
*(Kelas gabungan dapat mengambil praktikum dari semester berbeda)*
```

Total: 2 jadwal per minggu

📊 Struktur Modul Praktikum
Setiap praktikum dalam satu semester memiliki 16 modul dengan pembagian:
| Jenis Modul | Jumlah | Keterangan |
|---|---|---|
| Modul Normal | 15 modul | Praktikum rutin mingguan |
| Modul Susulan | 1 modul | Praktikum pengganti/tambahan |
| **TOTAL** | **16 modul** | |
Frekuensi: 1 praktikum per kelas = 1 pertemuan per minggu

🕐 Contoh Jadwal Praktikum
Kelas TI-47-01
| Hari | Waktu | Praktikum | Ruangan |
|---|---|---|---|
| Senin | 10.00 - 12.00 | JARKOM | 0612 |
| Selasa | 10.00 - 12.00 | SISOP | 0613 |

Kelas TI-47-02
| Hari | Waktu | Praktikum | Ruangan |
|---|---|---|---|
| Senin | 13.00 - 15.00 | JARKOM | 0704 |
| Selasa | 13.00 - 15.00 | SISOP | 0612 |

Kelas IF-48-PJJ1 (Kelas Online / PJJ)
| Hari | Waktu | Praktikum | Platform |
|---|---|---|---|
| Rabu | 19.00 - 21.00 | ALPRO2 | Google Meet |
| Kamis | - | DKA | Zoom (Asynchronous) |
*(Catatan: Jadwal PJJ memiliki kolom `is_online=TRUE` dan `platform` spesifik, tanpa ruangan fisik)*

👤 Contoh Pembagian Asprak
Asprak: ARK
Profile:

- Mengampu 2 mata kuliah: JARKOM dan SISOP
- Terdaftar di pool JARKOM dan pool SISOP

Distribusi Mengajar:
| Praktikum | Jumlah Kelas | Kelas yang Diampu |
|---|---|---|
| JARKOM | 2 kelas | TI-47-01, TI-47-02 |
| SISOP | 1 kelas | TI-47-01 |
Jadwal Mengajar ARK:
- Senin 10.00   : JARKOM TI-47-01 (ruang 0612)
- Senin 13.00   : JARKOM TI-47-02 (ruang 0704)
- Selasa 10.00  : SISOP TI-47-01 (ruang 0613)

🔄 Jadwal Pengganti
Definisi:
Jadwal pengganti dibuat ketika jadwal normal tidak dapat dilaksanakan karena:
| Alasan | Contoh |
|---|---|
| 🏮 Hari Libur Nasional | Tanggal merah (17 Agustus, Lebaran, dll) |
| 🎓 Acara Fakultas | Dies Natalis, Seminar, Workshop |
| 🏢 Acara Lainnya | Renovasi ruangan, event kampus |
Karakteristik:

- ✅ Menggantikan jadwal yang terlewat
- ✅ Bisa di hari/waktu/ruangan berbeda
- ✅ Tetap terhitung dalam 16 modul praktikum
- ✅ Dikelola secara terpusat oleh CASLAB/ASLAB


📝 Catatan Penting: Sistem Pool Asprak
⚠️ Asprak TIDAK Diassign Spesifik ke Kelas
Sistem yang Digunakan: Pool System
```text
Pool JARKOM (±60 asprak):
└── Dapat mengajar di kelas manapun yang membutuhkan
    ├── TI-47-01
    ├── TI-47-02
    ├── IF-47-08
    └── dst...
```

```text
Pool SISOP (±40 asprak):
└── Dapat mengajar di kelas manapun yang membutuhkan
    ├── TI-47-01
    ├── IF-47-03
    └── dst...
```
Asprak bersifat fleksibel:

- ✅ Dapat "loncat sana-sini" antar kelas
- ✅ Tidak terikat pada kelas tertentu secara permanen
- ✅ Assignment ke kelas spesifik dikelola di luar sistem


