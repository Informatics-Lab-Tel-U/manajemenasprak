# 📋 Sistem Manajemen Asprak (Informatics Lab)

Aplikasi web internal profesional untuk manajemen asisten praktikum (ASPRAK), penjadwalan, dan pencatatan pelanggaran di Laboratorium Informatika. Dibangun dengan fokus pada efisiensi administratif dan integritas data.

## 🎯 Fitur Utama

- **🌍 UI Terlokalisasi**: Antarmuka sepenuhnya dalam Bahasa Indonesia untuk kemudahan penggunaan.
- **👥 Manajemen Asprak**: Database asisten lengkap dengan sistem inisial kode dan tracking angkatan.
- **📅 Penjadwalan & Plotting**: Kelola jadwal praktikum mingguan dan penugasan asisten ke setiap sesi secara dinamis.
- **⚠️ Sistem Pelanggaran**: Pencatatan indisipliner asisten dengan alur finalisasi yang menjamin integritas data (tidak bisa diubah setelah final).
- **📝 Audit Logs**: Pencatatan otomatis setiap aktivitas perubahan data di sistem untuk akuntabilitas.
- **🔐 RBAC (Role-Based Access Control)**: Dukungan multi-role dengan hak akses yang terenkondisi:
  - **Admin**: Akses penuh ke seluruh sistem termasuk manajemen akun dan database.
  - **Aslab**: Akses ke fitur operasional praktikum, jadwal, dan pelanggaran.
  - **Koor Asprak**: Akses terbatas hanya untuk melihat panduan dan mengelola pelanggaran pada praktikum yang di-assign.
- **📊 Import/Export Data**: Kemudahan migrasi data melalui format Excel (.xlsx) untuk laporan dan setup semester.

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) 16.1 (App Router & Server Components)
- **Backend-as-a-Service**: [Supabase](https://supabase.com/) & PostgreSQL
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4.x
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix UI)
- **Data Table**: TanStack Table
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

## 📁 Struktur Folder Utama

```
webapp/
├── src/
│   ├── app/                # App Router
│   │   ├── (auth)/         # Halaman Otentikasi (Login)
│   │   ├── (dashboard)/    # Halaman Utama (Layout Terproteksi)
│   │   └── api/            # API Route Handlers
│   ├── components/         # React Components
│   │   ├── ui/             # Shadcn UI (Reusable)
│   │   ├── layout/         # Navigation & Sidebar
│   │   └── [feature]/      # Komponen spesifik fitur
│   ├── hooks/              # Custom React Hooks
│   ├── lib/                # Konfigurasi Library (Supabase, Auth)
│   ├── services/           # Logika Bisnis Server-side
│   └── types/              # Definisi TypeScript
├── docs/                   # Dokumentasi Teknis & User Guide
├── scripts/                # Utility Scripts (Seed, Test)
└── public/                 # Asset Statis (Gambar, Logos)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x / 20.x
- npm / yarn / pnpm
- Akun Supabase (untuk database & auth)

### Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   Buat file `.env.local` dan isi kredensial Supabase Anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Jalankan development server**
   ```bash
   npm run dev
   ```

5. Buka [http://localhost:3000](http://localhost:3000)

## 🌿 Git Workflow

Gunakan [Conventional Commits](https://www.conventionalcommits.org/) dalam setiap pesan commit:
- `feat:` (fitur baru)
- `fix:` (perbaikan bug)
- `docs:` (pembaruan dokumentasi)
- `style:` (perubahan visual/formatting)
- `refactor:` (perubahan struktur code tanpa mengubah fitur)

---
**Laboratorium Informatika** - *Efficiency through Technology*
