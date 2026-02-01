# 📋 Sistem Manajemen Asprak

Aplikasi web internal untuk manajemen asisten praktikum (ASPRAK) Laboratorium Informatika. Dibangun dengan Next.js dan Supabase.

## 🎯 Tujuan Aplikasi

Sistem internal CASLAB/ASLAB dengan fokus utama:

| No  | Fitur                      | Deskripsi                                                  |
| :-: | -------------------------- | ---------------------------------------------------------- |
|  1  | Pendataan Asprak           | Mendata siapa saja asprak di setiap pool praktikum         |
|  2  | Pendataan Jadwal Praktikum | Mengelola jadwal rutin per kelas per praktikum             |
|  3  | Sistem Pelanggaran         | Mencatat dan mengelola pelanggaran asprak                  |
|  4  | Jadwal Pengganti           | Membuat dan tracking jadwal pengganti saat ada libur/acara |

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) 16.1 (App Router)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL Database)
- **UI Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Language**: TypeScript 5.x
- **Code Quality**: Prettier, ESLint

## 📁 Struktur Folder

```
webapp/
├── src/
│   ├── app/              # Next.js App Router (pages & API routes)
│   │   ├── api/          # API endpoints
│   │   ├── asprak/       # Asprak management page
│   │   ├── jadwal/       # Scheduling page
│   │   ├── database/     # Database management page
│   │   ├── pelanggaran/  # Violation tracking page
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── asprak/       # Asprak-specific components
│   │   ├── layout/       # Layout components (Sidebar)
│   │   └── ui/           # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Libraries & utilities
│   │   └── fetchers/     # API client fetchers
│   ├── services/         # Server-side services (Supabase)
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── constants/        # Application constants
├── docs/                 # Project documentation
│   ├── md/               # Markdown docs
│   └── datasets/         # Sample data (CSV, Excel)
├── scripts/              # Utility scripts (seeding, testing)
├── public/               # Static assets
│   └── references/       # Reference data
├── .vscode/              # VS Code settings
├── .prettierrc           # Prettier config
├── .gitignore            # Git ignore rules
└── package.json          # Dependencies & scripts
```

## 📚 Dokumentasi

Dokumentasi lengkap tersedia di folder `docs/md/`:

| File                                                             | Deskripsi                   |
| ---------------------------------------------------------------- | --------------------------- |
| [tujuanaplikasi.md](docs/md/tujuanaplikasi.md)                   | Tujuan dan scope aplikasi   |
| [techstack.md](docs/md/techstack.md)                             | Teknologi yang digunakan    |
| [gambaransistemasprak.md](docs/md/gambaransistemasprak.md)       | Gambaran sistem asprak      |
| [gambaransistempraktikum.md](docs/md/gambaransistempraktikum.md) | Gambaran sistem praktikum   |
| [gambaranjadwal.md](docs/md/gambaranjadwal.md)                   | Gambaran sistem penjadwalan |
| [gambaranpelanggaran.md](docs/md/gambaranpelanggaran.md)         | Gambaran sistem pelanggaran |

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x atau lebih baru
- npm / yarn / pnpm / bun
- Akun Supabase

### Instalasi

1. **Clone repository**

   ```bash
   git clone <repository-url>
   cd webapp
   ```

2. **Install dependencies**

   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   ```

3. **Setup environment variables**

   Copy file `env.example` ke `.env.local`:

   ```bash
   cp env.example .env.local
   ```

   Isi dengan kredensial Supabase Anda:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Setup Supabase Database**

   Buat tabel-tabel berikut di Supabase Dashboard:
   - `Praktikum` - Data praktikum per semester
   - `Mata_Kuliah` - Mata kuliah praktikum
   - `Asprak` - Data asisten praktikum
   - `Asprak_Praktikum` - Pivot table asprak-praktikum
   - `Jadwal` - Jadwal praktikum per kelas
   - `Pelanggaran` - Data pelanggaran asprak

   Schema lengkap ada di `docs/database-schema.md` (jika ada) atau lihat `src/types/database.ts`

5. **Jalankan development server**

   ```bash
   npm run dev
   ```

6. Buka [http://localhost:3000](http://localhost:3000) di browser

## 🌿 Git Workflow

### Membuat Branch Baru

Gunakan format penamaan branch: `<nama>`

**Contoh:**

```bash
# Buat branch dengan nama Anda
git checkout -b abiyyu
git checkout -b athila
git checkout -b hendika
```

**Tips:**

- Satu developer = satu branch aktif
- Merge ke main setelah fitur selesai, lalu lanjut di branch yang sama

### Langkah-langkah Development

1. **Pastikan branch main up-to-date**

   ```bash
   git checkout main
   git pull origin main
   ```

2. **Buat branch development Anda**

   ```bash
   git checkout -b <nama>

   # Contoh:
   git checkout -b abiyyu
   ```

3. **Lakukan development**
   - Edit code sesuai kebutuhan
   - Format code sebelum commit:
     ```bash
     npm run format
     ```

4. **Commit dengan conventional commits**

   ```bash
   git add .
   git commit -m "feat: deskripsi perubahan"
   ```

5. **Push branch ke remote**

   ```bash
   git push origin <nama>

   # Contoh:
   git push origin abiyyu
   ```

6. **Buat Pull Request ke main**
   - Buka GitHub repository
   - Buat Pull Request dari `<nama>` ke `main`
   - Request review dari tim
   - Merge setelah approved

### Konvensi Commit Message

Gunakan format [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix      | Penggunaan                       |
| ----------- | -------------------------------- |
| `feat:`     | Fitur baru                       |
| `fix:`      | Bug fix                          |
| `docs:`     | Perubahan dokumentasi            |
| `style:`    | Formatting, tidak mengubah logic |
| `refactor:` | Refactoring code                 |
| `test:`     | Menambah/memperbaiki test        |
| `chore:`    | Maintenance tasks                |

**Contoh:**

```bash
git commit -m "feat: tambah fitur import CSV asprak"
git commit -m "fix: perbaiki validasi jadwal bentrok"
git commit -m "docs: update dokumentasi API"
```

## 📜 Available Scripts

| Script                 | Deskripsi                     |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Jalankan development server   |
| `npm run build`        | Build production              |
| `npm run start`        | Jalankan production server    |
| `npm run lint`         | Jalankan ESLint               |
| `npm run format`       | Format code dengan Prettier   |
| `npm run format:check` | Check formatting tanpa modify |

### Database Scripts

```bash
# Seed database dengan data awal
npx tsx scripts/seed.ts

# Test koneksi database
npx tsx scripts/test_fetch.ts
```

## 🤝 Contributing

1. Buat branch dengan nama Anda: `git checkout -b <nama>`
2. Lakukan perubahan dengan commit yang jelas (conventional commits)
3. Format code dengan `npm run format`
4. Push dan buat Pull Request
5. Request review dari tim
6. Merge setelah approved

## 📄 License

Private - Internal Use Only
