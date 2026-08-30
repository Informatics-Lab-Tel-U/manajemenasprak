export const POST_TEMPLATES = {
  tp: {
    id: 'tp',
    name: 'Tugas Pendahuluan',
    description: 'Template standar untuk memberikan tugas praktikum sebelum sesi dimulai.',
    initialData: {
      title: 'Tugas Pendahuluan Modul [X]',
      slug: 'tugas-pendahuluan-modul-x',
      excerpt: 'Berikut adalah rincian tugas pendahuluan untuk modul praktikum...',
      content: `<h1>Tugas Pendahuluan Modul [X]</h1>
<p>Silakan kerjakan tugas pendahuluan berikut sebelum memasuki sesi praktikum. Tugas ditulis tangan di kertas A4 dan dikumpulkan kepada asisten masing-masing.</p>
<div data-type="attachment-card" data-title="Soal Tugas Pendahuluan Modul [X]" data-file-type="Document · PDF" data-download-url="https://onedrive.live.com/..." data-drive-type="onedrive" data-button-text="Buka Soal"></div>
<p><strong>Catatan:</strong> Plagiarisme akan berakibat pada pengurangan nilai secara signifikan.</p>`,
    },
  },
  info: {
    id: 'info',
    name: 'Pemberitahuan',
    description: 'Template untuk pengumuman resmi laboratorium.',
    initialData: {
      title: 'Pengumuman: [Topik Pemberitahuan]',
      slug: 'pengumuman-topik-pemberitahuan',
      excerpt: 'Pemberitahuan resmi terkait kegiatan atau administrasi laboratorium.',
      content: `<h1>Pengumuman Resmi</h1>
<p>Diberitahukan kepada seluruh praktikan dan asisten bahwa...</p>
<p>Mohon agar informasi ini diperhatikan dengan saksama dan dilaksanakan sebagaimana mestinya.</p>
<p>Terima kasih atas kerja samanya.</p>`,
    },
  },
  lostfound: {
    id: 'lostfound',
    name: 'Lost and Found',
    description: 'Template untuk melaporkan barang hilang atau ditemukan di lab.',
    initialData: {
      title: '[Lost/Found]: [Nama Barang]',
      slug: 'lost-found-nama-barang',
      excerpt: 'Telah ditemukan/hilang sebuah barang di area laboratorium.',
      content: `<h1>Lost &amp; Found</h1>
<p><strong>Status:</strong> [Ditemukan / Hilang]</p>
<p><strong>Barang:</strong> [Nama/Deskripsi Barang]</p>
<p><strong>Lokasi:</strong> [Ruangan / Area Lab]</p>
<p><strong>Waktu:</strong> [Tanggal &amp; Jam Perkiraan]</p>
<h2>Keterangan Tambahan</h2>
<p>Bagi yang merasa kehilangan atau menemukan barang dengan ciri-ciri tersebut, harap segera menghubungi Admin atau Asisten yang bertugas di ruangan lab.</p>`,
    },
  }
};

export type PostTemplateKey = keyof typeof POST_TEMPLATES;
