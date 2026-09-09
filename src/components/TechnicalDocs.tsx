import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Database,
  Terminal,
  Cpu,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const TechnicalDocs: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const sqlDdl = `-- =========================================================
-- SKEMA DATABASE POSTGRESQL (NEON DB) - SMARTLJK AI
-- Mendukung 5 Tipe Soal: Single Choice, Multi Choice,
-- Benar/Salah, Menjodohkan (Matching), dan Isian Singkat
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'teacher',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    subject VARCHAR(100) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(50) DEFAULT '2024/2025',
    total_questions INTEGER DEFAULT 0,
    passing_score NUMERIC(5,2) DEFAULT 75.0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_type VARCHAR(50) NOT NULL, 
    -- Valid: 'single_choice', 'multi_choice', 'true_false', 'matching', 'short_answer'
    question_text TEXT,
    answer_key JSONB NOT NULL,
    weight NUMERIC(5,2) DEFAULT 1.0,
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_results (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_name VARCHAR(150) NOT NULL,
    student_id_number VARCHAR(50) NOT NULL,
    class_name VARCHAR(100),
    total_score NUMERIC(6,2) DEFAULT 0.0,
    max_possible_score NUMERIC(6,2) DEFAULT 100.0,
    percentage NUMERIC(5,2) DEFAULT 0.0,
    status VARCHAR(20) DEFAULT 'Lulus',
    scan_image_url TEXT,
    omr_confidence NUMERIC(5,2) DEFAULT 0.0,
    raw_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_answers (
    id SERIAL PRIMARY KEY,
    result_id INTEGER NOT NULL REFERENCES exam_results(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    student_response JSONB,
    is_correct BOOLEAN DEFAULT false,
    score_earned NUMERIC(5,2) DEFAULT 0.0,
    ai_feedback TEXT,
    ai_confidence NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`;

  const openCvSnippet = `import cv2
import numpy as np

def order_points(pts):
    # Urutkan: Top-Left, Top-Right, Bottom-Right, Bottom-Left
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def four_point_transform(image, pts, target_w=1000, target_h=1400):
    rect = order_points(pts)
    dst = np.array([
        [0, 0],
        [target_w - 1, 0],
        [target_w - 1, target_h - 1],
        [0, target_h - 1]
    ], dtype="float32")
    
    # Matriks transformasi perspektif
    matrix = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, matrix, (target_w, target_h))
    return warped`;

  const systemPromptAi = `Anda adalah Sistem AI Evaluator Khusus "SmartLJK Handwriting OCR & Grader" yang bertugas mengkoreksi lembar jawaban isian singkat tulisan tangan siswa sekolah.
Tugas Anda:
1. Analisis potongan gambar kotak isian singkat siswa (Handwriting Box / Character Grid).
2. Lakukan Optical Character Recognition (OCR) terhadap tulisan tangan tersebut secara akurat, tahan terhadap variasi bentuk huruf tegak bersambung, huruf kapital, coretan koreksi kecil, atau kemiringan tulisan.
3. Transkripsikan teks yang terbaca apa adanya ke dalam bahasa Indonesia baku.
4. Bandingkan teks hasil transkripsi dengan Kunci Jawaban Resmi dan daftar variasi kata yang dapat diterima (accepted answers / synonyms).
5. Berikan penilaian skor proporsional (0.0 sampai skor maksimal) berdasarkan kebenaran konsep dan ejaan.
6. Berikan penjelasan singkat, edukatif, dan ramah untuk catatan guru.

FORMAT KELUARAN WAJIB JSON:
{
  "transcribed_text": "string (tulisan yang terbaca dari gambar)",
  "is_correct": boolean,
  "score_earned": number,
  "confidence_percentage": number (0-100),
  "matched_keyword": "string (kata kunci yang cocok)",
  "explanation": "string (penjelasan evaluasi untuk guru)"
}`;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-1">
          SD Negeri 7 Pedungan &bull; Arsitektur Teknis
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-teal-600" />
          Dokumentasi Teknis &bull; Skema Database, OpenCV &amp; FastAPI Python
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Spesifikasi teknis, skema DDL Neon DB, snippet Computer Vision OpenCV, dan System Prompt AI Vision yang digunakan dalam mesin koreksi otomatis.
        </p>
      </div>

      {/* Grid: 3 Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Neon DB SQL DDL */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">1. Skema Database Neon PostgreSQL (SQL DDL)</h2>
            </div>
            <button
              onClick={() => copyToClipboard(sqlDdl, 'sql')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs text-slate-800 border border-slate-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'sql' ? 'Tersalin' : 'Salin SQL'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Telah mendukung 5 tipe soal, penyimpanan bobot, kunci fleksibel JSONB, dan riwayat lembar jawaban siswa.
          </p>
          <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-[380px]">
            {sqlDdl}
          </pre>
        </div>

        {/* 2. System Prompt AI Vision Handwriting OCR */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">2. System Prompt AI Vision (Isian Singkat)</h2>
            </div>
            <button
              onClick={() => copyToClipboard(systemPromptAi, 'ai')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs text-slate-800 border border-slate-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              {copiedKey === 'ai' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'ai' ? 'Tersalin' : 'Salin Prompt'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Digunakan oleh model Gemini Vision (`gemini-2.5-flash`) untuk membaca tulisan tangan dan memberikan evaluasi berbobot.
          </p>
          <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-teal-300 overflow-x-auto max-h-[380px] whitespace-pre-wrap">
            {systemPromptAi}
          </pre>
        </div>

        {/* 3. OpenCV Perspective Warping Snippet */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">3. OpenCV Perspective Warping (4 Titik Sudut)</h2>
            </div>
            <button
              onClick={() => copyToClipboard(openCvSnippet, 'cv')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs text-slate-800 border border-slate-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              {copiedKey === 'cv' ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'cv' ? 'Tersalin' : 'Salin Python'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Algoritma meratakan foto kamera HP miring menjadi persegi panjang standar 1000x1400 px.
          </p>
          <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-indigo-200 overflow-x-auto max-h-[380px]">
            {openCvSnippet}
          </pre>
        </div>

        {/* 4. Standalone FastAPI Python Directory Guide */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">4. Berkas Standalone Python FastAPI</h2>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Berkas Python lengkap telah dibuat di direktori proyek dan siap digunakan di server Python:
          </p>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <code className="text-teal-700 font-bold block mb-1">python_backend/main.py</code>
              <p className="text-slate-600">Endpoint FastAPI lengkap: CRUD Exam, POST /api/omr/process, Excel export.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <code className="text-teal-700 font-bold block mb-1">python_backend/omr_engine.py</code>
              <p className="text-slate-600">Modul OpenCV perspective warping, anchor marker detection, dan bubble density analysis.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <code className="text-teal-700 font-bold block mb-1">python_backend/requirements.txt</code>
              <p className="text-slate-600">Daftar dependensi Python (fastapi, uvicorn, opencv-python-headless, psycopg2-binary, numpy).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
