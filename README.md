# SmartLJK AI &bull; SD Negeri 7 Pedungan

**Sistem Otomatisasi Pembuat & Pemeriksa Lembar Jawaban Komputer (LJK) Berbasis Computer Vision & AI Vision Evaluator**

Aplikasi web modern terintegrasi untuk SD Negeri 7 Pedungan yang memudahkan guru mencetak lembar jawaban standar ujian, memindai dan mengoreksi LJK satu kelas (hingga 32 lembar berkas PDF) secara otomatis, membaca tulisan tangan siswa dengan AI Vision, serta menyajikan rekapitulasi nilai lengkap.

---

## 🌟 Fitur Utama

1. **Pembuat LJK Presisi (Generator)**
   - Mendukung jenjang **Kelas 1 sampai 6**.
   - **Diferensiasi Opsi**:
     - *Kelas 1 – 3*: Pilihan ganda otomatis dibatasi **A s.d. C** (3 opsi).
     - *Kelas 4 – 6*: Pilihan ganda memuat **A s.d. D** (4 opsi).
   - Dilengkapi **4 Solid Anchor Markers** di setiap sudut untuk kalibrasi *perspective warping* kamera/scanner.
   - **QR Code Metadata** untuk sinkronisasi otomatis kode ujian dan jumlah soal.
   - Cetak A4 presisi langsung ke printer atau simpan sebagai file PDF.

2. **Pemeriksa LJK OMR Cerdas (Scanner)**
   - **Batch PDF 1 Kelas (s.d. 32 Siswa)**: Cukup unggah 1 file PDF hasil scan seluruh siswa, sistem otomatis merender dan mengoreksi halaman per halaman.
   - **Deteksi Identitas Otomatis**: Membaca otomatis kotak **Nama Siswa**, **Nomor Absen**, dan **Kelas** tanpa perlu input manual.
   - **5 Model Penilaian Soal**:
     - Pilihan Ganda Biasa (*Single Choice*)
     - Pilihan Ganda Kompleks (*Multiple Answers*)
     - Benar / Salah (*True / False*)
     - Menjodohkan (*Matching Matrix*)
     - Isian Singkat Tulisan Tangan (*Handwriting OCR with Gemini Vision*)
   - Dilengkapi visualisasi *bounding box* hasil Computer Vision pada lembar ujian.

3. **Dashboard Rekapitulasi Nilai**
   - Ringkasan statistik kelas: Rata-rata nilai, Nilai Tertinggi, Terendah, dan Persentase Kelulusan (KKM).
   - Ekspor data lengkap ke **Microsoft Excel (.xlsx)**.
   - Cetak dokumen resmi ber-Kop Surat **SD Negeri 7 Pedungan** lengkap dengan tabel rekap dan kolom tanda tangan Kepala Sekolah serta Guru Pengampu.

4. **Arsitektur Teknis Standalone**
   - Skema database serverless **Neon PostgreSQL**.
   - Backend Python mandiri dengan **FastAPI & OpenCV** di folder `python_backend/`.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas API, PDF.js
- **Backend**: Node.js Express & TypeScript (`server.ts`)
- **Engine Python**: FastAPI, OpenCV (`cv2`), NumPy, Psycopg2
- **Database**: PostgreSQL (Serverless Neon DB)
- **AI Model**: Google Gemini Vision (`@google/genai`)

---

## 🚀 Cara Menjalankan Secara Lokal

### Prasyarat
- **Node.js** (versi 18 atau lebih baru)
- **npm** atau **bun**
- *(Opsional)* **Python 3.9+** untuk backend OpenCV Python mandiri

### Langkah Instalasi

1. **Clone repository:**
   ```bash
   git clone https://github.com/USERNAME_ANDA/NAMA_REPOSITORY.git
   cd NAMA_REPOSITORY
   ```

2. **Instal dependensi Node.js:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Salin file contoh konfigurasi:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan lengkapi:
   ```env
   # Database Neon PostgreSQL
   DATABASE_URL=postgresql://neondb_owner:password@ep-sample.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

   # Google Gemini API Key untuk koreksi tulisan tangan (AI Vision OCR)
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Jalankan Aplikasi Mode Development:**
   ```bash
   npm run dev
   ```
   Buka browser di: `http://localhost:3000`

5. **Deploy ke Vercel (100% Serverless Ready):**
   - Import repositori GitHub Anda ke **Vercel**.
   - Vercel secara otomatis mendeteksi konfigurasi `vercel.json` dan folder `api/` (Serverless Functions).
   - Tambahkan Environment Variables di Vercel Dashboard (*Settings -> Environment Variables*):
     - `DATABASE_URL`: Connection string PostgreSQL (Neon DB).
     - `GEMINI_API_KEY`: API Key Gemini Anda.
   - Klik **Deploy**. Aplikasi langsung aktif secara instan dengan routing API serverless murni.

---

## 📁 Struktur Direktori

```text
├── api/                    # Vercel Serverless Function Endpoints
│   ├── index.ts            # Entrypoint Serverless Vercel (Express /api/* routes)
│   └── db-status.ts        # Endpoint mandiri status database Neon
├── vercel.json             # Konfigurasi routing rewrite resmi Vercel
├── index.html              # Entry point HTML aplikasi
├── metadata.json           # Metadata aplikasi AI Studio
├── package.json            # Daftar pustaka Node.js & script
├── server.ts               # Server Express lokal / dev & Cloud Run
├── server/                 # Logika modul backend (DB, OMR, AI, Excel)
├── .env.example            # Template variabel lingkungan
├── python_backend/         # Modul mandiri FastAPI & OpenCV
│   ├── main.py             # Endpoint API FastAPI
│   ├── omr_engine.py       # Engine Computer Vision & Bubble Density
│   └── requirements.txt    # Dependensi Python
├── src/                    # Source code frontend React
│   ├── components/         # Komponen UI (LjkGenerator, OmrScanner, Dashboard, dsb.)
│   ├── types.ts            # Definisi Type & Interface TypeScript
│   ├── App.tsx             # Root Application Component
│   ├── main.tsx            # React Entry Point
│   └── index.css           # Styling Tailwind CSS & konfigurasi cetak A4
└── README.md               # Dokumentasi proyek
```

---

## 🏫 Lembaga Pengembang

**SD Negeri 7 Pedungan**  
Denpasar Selatan, Bali &bull; NPSN: 50103233  
Email: `sdn7pedungan63@gmail.com`
