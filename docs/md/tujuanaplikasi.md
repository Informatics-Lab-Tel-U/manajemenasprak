🎯 Tujuan Aplikasi
Aplikasi ini adalah sistem internal CASLAB/ASLAB dengan fokus utama:
✅ Fitur Utama:
| No | Fitur | Tujuan |
|---|---|---|
| 1 | Pendataan Asprak | Mendata siapa saja asprak di setiap pool praktikum |
| 2 | Pendataan Jadwal Praktikum | Mengelola jadwal rutin per kelas per praktikum |
| 3 | Mengelola Jadwal Pengganti | Membuat dan tracking jadwal pengganti saat ada libur/acara |
❌ Bukan Untuk:

- ❌ Tracking kehadiran asprak per kelas per pertemuan
- ❌ Absensi asprak secara real-time
- ❌ Scheduling asprak ke kelas spesifik (diatur manual)
- ❌ Sistem operasional harian asprak


📐 Ringkasan Struktur
```text
Kelas (IT-47-01)
    ↓
Praktikum (JARKOM, SISOP)
    ↓
Jadwal (1 per praktikum per minggu)
    ↓
16 Modul (15 normal + 1 susulan)
    ↓
Pool Asprak (fleksibel, tidak fix per kelas)
    ↓
Jadwal Pengganti (bila ada libur/acara)
```

Sistem ini dirancang untuk mempermudah koordinasi dan administrasi praktikum di tingkat laboratorium, bukan untuk operational tracking per asprak.