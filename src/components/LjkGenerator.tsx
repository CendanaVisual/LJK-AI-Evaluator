import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  HelpCircle,
  QrCode,
  Sparkles,
  RefreshCw,
  FileDown,
  BookOpen,
} from 'lucide-react';
import { Exam, Question, QuestionType } from '../types';

interface LjkGeneratorProps {
  currentExam: Exam | null;
  onExamSaved: (examId: number) => void;
}

export const LjkGenerator: React.FC<LjkGeneratorProps> = ({
  currentExam,
  onExamSaved,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);

  // Grade level dropdown state (1 to 6)
  const [selectedGrade, setSelectedGrade] = useState<number>(() => {
    if (currentExam?.class_name) {
      const match = currentExam.class_name.match(/([1-6])/);
      if (match) return Number(match[1]);
    }
    return 5; // Default Grade 5
  });
  const [classRombel, setClassRombel] = useState<string>('A');

  // Form State
  const [title, setTitle] = useState(currentExam?.title || 'Asesmen Sumatif Akhir Semester');
  const [code, setCode] = useState(currentExam?.code || 'LJK-IPAS-SD7');
  const [subject, setSubject] = useState(currentExam?.subject || 'Ilmu Pengetahuan Alam dan Sosial (IPAS)');
  const [className, setClassName] = useState(currentExam?.class_name || 'Kelas 5 A');
  const [academicYear, setAcademicYear] = useState(currentExam?.academic_year || '2024/2025 Semester 2');
  const [passingScore, setPassingScore] = useState(currentExam?.passing_score || 75.0);
  const [schoolName, setSchoolName] = useState('SD NEGERI 7 PEDUNGAN');

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Determine choices based on grade level:
  // Kelas 1-3 -> A, B, C (3 pilihan)
  // Kelas 4-6 -> A, B, C, D (4 pilihan)
  const isLowerGrade = selectedGrade <= 3;
  const choiceOptions = isLowerGrade ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];

  // Handle grade change
  const handleGradeChange = (newGrade: number) => {
    setSelectedGrade(newGrade);
    const newClassName = `Kelas ${newGrade} ${classRombel}`.trim();
    setClassName(newClassName);

    // If switching to Grade 1-3, adjust questions to only have A-C
    if (newGrade <= 3) {
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.question_type === 'single_choice') {
            const key = q.answer_key === 'D' ? 'C' : q.answer_key;
            const options = (q.options || ['Opsi A', 'Opsi B', 'Opsi C']).slice(0, 3);
            return { ...q, answer_key: key, options };
          } else if (q.question_type === 'multi_choice') {
            const currentArr: string[] = Array.isArray(q.answer_key)
              ? q.answer_key
              : [q.answer_key];
            const filtered = currentArr.filter((item) => item !== 'D');
            const options = (q.options || ['Opsi A', 'Opsi B', 'Opsi C']).slice(0, 3);
            return {
              ...q,
              answer_key: filtered.length > 0 ? filtered : ['A'],
              options,
            };
          } else if (q.question_type === 'matching' && typeof q.answer_key === 'object') {
            const adjusted: Record<string, string> = {};
            Object.keys(q.answer_key).forEach((k) => {
              adjusted[k] = q.answer_key[k] === 'D' ? 'C' : q.answer_key[k];
            });
            return { ...q, answer_key: adjusted };
          }
          return q;
        })
      );
    }
  };

  // Questions List
  const [questions, setQuestions] = useState<Question[]>([
    {
      question_number: 1,
      question_type: 'single_choice',
      question_text: 'Bagian tumbuhan yang berfungsi menyerap air dan zat hara dari dalam tanah adalah...',
      answer_key: 'C',
      weight: 10,
      options: ['Batang', 'Daun', 'Akar', 'Bunga'],
    },
    {
      question_number: 2,
      question_type: 'single_choice',
      question_text: 'Gas yang diperlukan tumbuhan untuk proses fotosintesis adalah...',
      answer_key: 'A',
      weight: 10,
      options: ['Karbon dioksida', 'Oksigen', 'Nitrogen', 'Hidrogen'],
    },
    {
      question_number: 3,
      question_type: 'single_choice',
      question_text: 'Hewan yang mengalami metamorfosis sempurna adalah...',
      answer_key: 'B',
      weight: 10,
      options: ['Kecoa', 'Kupu-kupu', 'Belalang', 'Ayam'],
    },
    {
      question_number: 4,
      question_type: 'multi_choice',
      question_text: 'Sumber energi alternatif yang ramah lingkungan (pilih lebih dari satu):',
      answer_key: ['A', 'C'],
      weight: 10,
      options: ['Matahari', 'Batu bara', 'Angin', 'Minyak bumi'],
    },
    {
      question_number: 5,
      question_type: 'multi_choice',
      question_text: 'Ciri-ciri makhluk hidup antara lain (pilih lebih dari satu):',
      answer_key: ['A', 'B', 'C'],
      weight: 10,
      options: ['Bernapas', 'Berkembang biak', 'Membutuhkan nutrisi', 'Berkarat'],
    },
    {
      question_number: 6,
      question_type: 'true_false',
      question_text: 'Gaya gravitasi bumi menyebabkan semua benda jatuh ke bawah:',
      answer_key: 'B',
      weight: 10,
      options: ['Pernyataan: Gaya gravitasi menarik benda ke bawah'],
    },
    {
      question_number: 7,
      question_type: 'true_false',
      question_text: 'Tumbuhan lumut termasuk kelompok tumbuhan berbunga:',
      answer_key: 'S',
      weight: 10,
      options: ['Pernyataan: Lumut adalah tumbuhan berbunga'],
    },
    {
      question_number: 8,
      question_type: 'matching',
      question_text: 'Jodohkan hewan dengan cara perkembangbiakannya: 1. Sapi, 2. Ayam, 3. Ikan hiu',
      answer_key: { '1': 'B', '2': 'A', '3': 'C' },
      weight: 15,
      options: ['A. Bertelur (Ovipar)', 'B. Melahirkan (Vivipar)', 'C. Bertelur & Melahirkan (Ovovivipar)'],
    },
    {
      question_number: 9,
      question_type: 'short_answer',
      question_text: 'Sebutkan zat hijau daun yang berperan dalam fotosintesis!',
      answer_key: {
        accepted_answers: ['klorofil', 'zat hijau daun'],
        keywords: ['klorofil'],
        max_score: 12.5,
      },
      weight: 12.5,
      options: ['Area Kotak Tulisan Tangan (AI OCR Handwriting)'],
    },
    {
      question_number: 10,
      question_type: 'short_answer',
      question_text: 'Alat pernapasan utama pada ikan adalah...',
      answer_key: {
        accepted_answers: ['insang'],
        keywords: ['insang'],
        max_score: 12.5,
      },
      weight: 12.5,
      options: ['Area Kotak Tulisan Tangan (AI OCR Handwriting)'],
    },
  ]);

  // Generate QR Code on change
  useEffect(() => {
    generateQr();
  }, [code, title, questions.length]);

  const generateQr = async () => {
    try {
      const payload = JSON.stringify({
        c: code,
        t: title.substring(0, 30),
        q: questions.length,
        v: '2.0-OMR-AI',
      });
      const res = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: payload }),
      });
      const data = await res.json();
      if (data.qrDataUrl) {
        setQrDataUrl(data.qrDataUrl);
      }
    } catch (e) {
      console.error('QR code generation failed:', e);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => setIsPrinting(false), 2500);

    const printableEl = document.getElementById('printable-ljk-sheet');
    if (!printableEl) {
      window.print();
      return;
    }

    // Ambil seluruh CSS stylesheet dan style dari dokumen
    let styleContent = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      styleContent += node.outerHTML + '\n';
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cetak LJK - ${title || 'Lembar Jawaban Komputer'} - SD Negeri 7 Pedungan</title>
  ${styleContent}
  <style>
    @page {
      size: A4 portrait;
      margin: 6mm 5mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-control-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    .btn-action-print {
      background: #059669;
      color: white;
      border: none;
      font-weight: 700;
      font-size: 14px;
      padding: 8px 18px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-action-print:hover {
      background: #047857;
    }
    .btn-action-close {
      background: #475569;
      color: white;
      border: none;
      font-weight: 600;
      font-size: 13px;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
    }
    .btn-action-close:hover {
      background: #334155;
    }
    .print-wrapper {
      padding: 20px;
      display: flex;
      justify-content: center;
      background: #f1f5f9;
      min-height: 100vh;
    }
    .printable-sheet {
      display: block !important;
      position: relative !important;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
      border: 1.5px solid #000000 !important;
      width: 100% !important;
      max-width: 210mm !important;
      margin: 0 auto !important;
      padding: 24px !important;
      background: #ffffff !important;
      color: #000000 !important;
    }
    @media print {
      .print-control-bar, .no-print {
        display: none !important;
      }
      .print-wrapper {
        padding: 0 !important;
        background: #ffffff !important;
        min-height: auto !important;
      }
      .printable-sheet {
        border: 1.5px solid #000000 !important;
        box-shadow: none !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 16px !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-control-bar no-print">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-weight: 800; font-size: 14px;">SmartLJK AI &bull; SD Negeri 7 Pedungan</span>
      <span style="background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600;">Jendela Cetak Web</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button class="btn-action-print" onclick="window.print()">
        🖨️ Buka Dialog Print / PDF
      </button>
      <button class="btn-action-close" onclick="window.close()">
        Tutup Jendela
      </button>
    </div>
  </div>
  <div class="print-wrapper">
    ${printableEl.outerHTML}
  </div>
  <script>
    // Membuka jendela print browser secara otomatis
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 400);
    });
  <\/script>
</body>
</html>`;

    // Buat Blob HTML
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    let opened = false;
    // 1. Buka jendela print baru (tidak terpengaruh sandbox iframe)
    try {
      const printWin = window.open(blobUrl, '_blank', 'width=950,height=1100,menubar=no,toolbar=no,location=no,status=no');
      if (printWin) {
        opened = true;
      }
    } catch (err) {
      console.warn('window.open gagal:', err);
    }

    // 2. Jika popup terblokir browser, gunakan pemicu klik elemen <a>
    if (!opened) {
      try {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        opened = true;
      } catch (err) {
        console.warn('Pemicu link cetak gagal:', err);
      }
    }

    // 3. Cadangan: coba panggil langsung window.print() bila berada di jendela mandiri
    if (window.self === window.top) {
      try {
        window.print();
      } catch (e) {
        console.warn('Panggilan window.print() langsung gagal:', e);
      }
    }
  };

  const addQuestion = (type: QuestionType) => {
    const nextNum = questions.length + 1;
    let defaultKey: any = 'A';
    let weight = 10;
    let options = isLowerGrade
      ? ['Opsi A', 'Opsi B', 'Opsi C']
      : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'];

    if (type === 'multi_choice') {
      defaultKey = isLowerGrade ? ['A', 'B'] : ['A', 'C'];
    } else if (type === 'true_false') {
      defaultKey = 'B';
      options = ['Pernyataan Benar atau Salah'];
    } else if (type === 'matching') {
      defaultKey = { '1': 'A', '2': 'B', '3': 'C' };
      options = ['A. Opsi Pasangan A', 'B. Opsi Pasangan B', 'C. Opsi Pasangan C'];
      weight = 15;
    } else if (type === 'short_answer') {
      defaultKey = {
        accepted_answers: ['jawaban'],
        keywords: ['jawaban'],
        max_score: 10,
      };
      options = ['Area Kotak Isian Tulisan Tangan'];
      weight = 15;
    }

    const newQ: Question = {
      question_number: nextNum,
      question_type: type,
      question_text: `Pertanyaan Nomor ${nextNum}`,
      answer_key: defaultKey,
      weight,
      options,
    };

    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (idx: number) => {
    const updated = questions.filter((_, i) => i !== idx);
    const renumbered = updated.map((q, i) => ({ ...q, question_number: i + 1 }));
    setQuestions(renumbered);
  };

  const updateQuestion = (idx: number, updates: Partial<Question>) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...updates };
    setQuestions(updated);
  };

  const handleSaveExam = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          code,
          subject,
          className,
          academicYear,
          passingScore,
          description: `Template LJK SD Negeri 7 Pedungan (${className})`,
          questions: questions.map((q, i) => ({
            questionNumber: i + 1,
            questionType: q.question_type,
            questionText: q.question_text,
            answerKey: q.answer_key,
            weight: q.weight,
            options: q.options,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        onExamSaved(data.id);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Gagal menyimpan ujian: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err: any) {
      alert('Koneksi gagal: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="no-print bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Format Standar OMR &bull; SD Negeri 7 Pedungan
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {isLowerGrade ? 'Tingkat Rendah: Pilihan A - C' : 'Tingkat Tinggi: Pilihan A - D'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pembuat Lembar Jawaban Komputer (LJK)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Cetak lembar jawaban komputer A4 presisi dengan 4 Anchor Markers, QR Code validasi, dan dukungan 5 model penilaian otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="print-ljk-btn"
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition cursor-pointer disabled:opacity-80"
            title="Buka jendela cetak web browser (A4 / Simpan ke PDF)"
          >
            <Printer className={`w-4 h-4 ${isPrinting ? 'animate-bounce' : ''}`} />
            <span>{isPrinting ? 'Membuka Jendela Print...' : 'Cetak LJK (Print / PDF)'}</span>
          </button>

          <button
            id="save-exam-btn"
            onClick={handleSaveExam}
            disabled={isSaving}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/20 transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle className="w-4 h-4 text-emerald-200" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Menyimpan...' : saveSuccess ? 'Tersimpan di DB!' : 'Simpan Konfigurasi'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Config, Right Printable Sheet Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Exam Metadata & Question Settings (Hidden on Print) */}
        <div className="no-print lg:col-span-5 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>Identitas Ujian &amp; Sekolah</span>
              </span>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                SD Negeri 7 Pedungan
              </span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lembaga / Sekolah
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Ujian / Asesmen
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Ujian
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                </div>
              </div>

              {/* Dropdown Kelas 1 - 6 (Sesuai Permintaan Pengguna) */}
              <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-8">
                    <label className="block text-xs font-bold text-slate-900 mb-1">
                      Pilihan Tingkat Kelas (1 - 6)
                    </label>
                    <select
                      id="grade-level-select"
                      value={selectedGrade}
                      onChange={(e) => handleGradeChange(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition cursor-pointer"
                    >
                      <option value={1}>Kelas 1 (Fase A - Opsi A s.d. C)</option>
                      <option value={2}>Kelas 2 (Fase A - Opsi A s.d. C)</option>
                      <option value={3}>Kelas 3 (Fase B - Opsi A s.d. C)</option>
                      <option value={4}>Kelas 4 (Fase B - Opsi A s.d. D)</option>
                      <option value={5}>Kelas 5 (Fase C - Opsi A s.d. D)</option>
                      <option value={6}>Kelas 6 (Fase C - Opsi A s.d. D)</option>
                    </select>
                  </div>

                  <div className="col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rombel
                    </label>
                    <input
                      type="text"
                      value={classRombel}
                      onChange={(e) => {
                        setClassRombel(e.target.value);
                        setClassName(`Kelas ${selectedGrade} ${e.target.value}`.trim());
                      }}
                      placeholder="A / B"
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-bold text-xs text-center uppercase focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                </div>

                <div className="text-[11px] font-medium flex items-center justify-between text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                  <span>Jumlah Opsi Jawaban:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    isLowerGrade ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                  }`}>
                    {isLowerGrade ? 'Pilihan A, B, C (3 Opsi)' : 'Pilihan A, B, C, D (4 Opsi)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    KKM / Batas Kelulusan
                  </label>
                  <input
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full bg-slate-50/70 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Ajaran
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Question List Editor */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Daftar Butir Soal ({questions.length} Butir)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Format aktif: {isLowerGrade ? 'Opsi A s.d. C' : 'Opsi A s.d. D'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => addQuestion('single_choice')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
                  title={`Tambah Pilihan Ganda (${choiceOptions.join('-')})`}
                >
                  + PG ({choiceOptions[0]}-{choiceOptions[choiceOptions.length - 1]})
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('multi_choice')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
                  title="Tambah PG Kompleks (Kotak Centang)"
                >
                  + PG Kompleks
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('true_false')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
                  title="Tambah Benar/Salah (B/S)"
                >
                  + B/S
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('matching')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
                  title="Tambah Menjodohkan"
                >
                  + Jodohkan
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('short_answer')}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-lg transition cursor-pointer"
                  title="Tambah Isian Singkat Tulisan Tangan (AI OCR)"
                >
                  + Isian AI
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                        {q.question_number}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {q.question_type === 'single_choice' && `Pilihan Ganda (${choiceOptions.join('-')})`}
                        {q.question_type === 'multi_choice' && `PG Kompleks (${choiceOptions.join('-')})`}
                        {q.question_type === 'true_false' && 'Benar / Salah (B/S)'}
                        {q.question_type === 'matching' && 'Menjodohkan (Matching)'}
                        {q.question_type === 'short_answer' && 'Isian Singkat (AI OCR)'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-medium text-slate-500">Bobot:</span>
                      <input
                        type="number"
                        value={q.weight}
                        onChange={(e) => updateQuestion(idx, { weight: Number(e.target.value) })}
                        className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 text-center font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                        title="Hapus soal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={q.question_text}
                    onChange={(e) => updateQuestion(idx, { question_text: e.target.value })}
                    placeholder="Tuliskan teks pertanyaan / indikator soal..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />

                  {/* Specific Key Formatter based on Question Type */}
                  <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 text-xs">
                    {q.question_type === 'single_choice' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 text-[11px] font-medium">Kunci Jawaban:</span>
                        {choiceOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateQuestion(idx, { answer_key: opt })}
                            className={`w-7 h-7 rounded-full font-bold text-xs transition cursor-pointer ${
                              q.answer_key === opt
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.question_type === 'multi_choice' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 text-[11px] font-medium">Kunci Benar (Bisa &gt;1):</span>
                        {choiceOptions.map((opt) => {
                          const currentArr: string[] = Array.isArray(q.answer_key)
                            ? q.answer_key
                            : [q.answer_key];
                          const isChecked = currentArr.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const newArr = isChecked
                                  ? currentArr.filter((item) => item !== opt)
                                  : [...currentArr, opt];
                                updateQuestion(idx, { answer_key: newArr.length > 0 ? newArr : [opt] });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                isChecked
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                              }`}
                            >
                              [{opt}]
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.question_type === 'true_false' && (
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-500 text-[11px] font-medium">Kunci Pernyataan:</span>
                        {['B', 'S'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => updateQuestion(idx, { answer_key: val })}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                              q.answer_key === val
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                            }`}
                          >
                            {val === 'B' ? 'Benar (B)' : 'Salah (S)'}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.question_type === 'matching' && (
                      <div className="space-y-1.5">
                        <span className="text-slate-500 text-[11px] font-medium block">
                          Matriks Pasangan (Pernyataan &rarr; Pilihan):
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 2, 3].map((num) => (
                            <div key={num} className="flex items-center space-x-1">
                              <span className="text-slate-700 font-bold">{num}:</span>
                              <select
                                value={q.answer_key?.[num] || 'A'}
                                onChange={(e) => {
                                  const currentMatching = { ...(q.answer_key || {}) };
                                  currentMatching[num] = e.target.value;
                                  updateQuestion(idx, { answer_key: currentMatching });
                                }}
                                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-900 font-bold"
                              >
                                {choiceOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.question_type === 'short_answer' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-teal-700 font-semibold text-[11px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-teal-600" /> Kata Kunci Evaluasi AI:
                          </span>
                        </div>
                        <input
                          type="text"
                          value={q.answer_key?.accepted_answers?.join(', ') || 'klorofil'}
                          onChange={(e) => {
                            const answers = e.target.value.split(',').map((s) => s.trim());
                            updateQuestion(idx, {
                              answer_key: {
                                ...q.answer_key,
                                accepted_answers: answers,
                                keywords: answers,
                              },
                            });
                          }}
                          placeholder="Kunci diterima (pisahkan koma, misal: klorofil, zat hijau daun)"
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-medium"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Live Printable A4 Sheet Preview */}
        <div className="lg:col-span-7 print:w-full print:p-0 print:m-0">
          <div className="sticky top-20 print:static">
            {/* Header info in preview (hidden on print) */}
            <div className="no-print flex items-center justify-between mb-3 bg-white border border-slate-200/90 rounded-xl p-3 shadow-sm">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-600" />
                Pratinjau Lembar Fisik LJK (Ukuran A4)
              </span>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                4 Corner Anchors Presisi
              </span>
            </div>

            {/* Printable Paper Component */}
            <div
              ref={printableRef}
              id="printable-ljk-sheet"
              className="printable-sheet bg-white text-slate-900 rounded-xl shadow-md p-7 border border-slate-300 font-sans relative select-none"
              style={{ minHeight: '850px' }}
            >
              {/* 4 SOLID CORNER ANCHOR MARKERS FOR OPENCV PERSPECTIVE WARPING */}
              {/* Top-Left Anchor */}
              <div
                className="absolute top-4 left-4 w-7 h-7 bg-black flex items-center justify-center shadow-sm"
                title="Anchor Marker 1 (Top-Left)"
              >
                <div className="w-2 h-2 bg-white"></div>
              </div>

              {/* Top-Right Anchor */}
              <div
                className="absolute top-4 right-4 w-7 h-7 bg-black flex items-center justify-center shadow-sm"
                title="Anchor Marker 2 (Top-Right)"
              >
                <div className="w-2 h-2 bg-white"></div>
              </div>

              {/* Bottom-Left Anchor */}
              <div
                className="absolute bottom-4 left-4 w-7 h-7 bg-black flex items-center justify-center shadow-sm"
                title="Anchor Marker 3 (Bottom-Left)"
              >
                <div className="w-2 h-2 bg-white"></div>
              </div>

              {/* Bottom-Right Anchor */}
              <div
                className="absolute bottom-4 right-4 w-7 h-7 bg-black flex items-center justify-center shadow-sm"
                title="Anchor Marker 4 (Bottom-Right)"
              >
                <div className="w-2 h-2 bg-white"></div>
              </div>

              {/* Paper Content Inside Anchors */}
              <div className="px-6 py-4 space-y-4">
                {/* School & Exam Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                      {schoolName}
                    </p>
                    <h2 className="text-base font-black text-slate-950 uppercase tracking-tight">
                      LEMBAR JAWABAN KOMPUTER (LJK)
                    </h2>
                    <p className="text-xs font-bold text-slate-800">
                      {title} &bull; <span className="text-teal-800">{subject}</span>
                    </p>
                    <p className="text-[11px] text-slate-700 font-medium">
                      Kelas: <b>{className}</b> | TA: {academicYear} | KKM: {passingScore}
                    </p>
                  </div>

                  {/* QR Code with Exam Metadata */}
                  <div className="text-center">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Metadata"
                        className="w-20 h-20 border border-slate-400 p-0.5 bg-white mx-auto shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 border border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-500">
                        QR Code
                      </div>
                    )}
                    <span className="text-[9px] font-mono block mt-0.5 text-slate-800 font-bold">
                      {code}
                    </span>
                  </div>
                </div>

                {/* Student Identity Section */}
                <div className="grid grid-cols-12 gap-3 bg-slate-50/80 border border-slate-300 rounded p-2.5 text-xs">
                  <div className="col-span-7 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-24 font-bold text-slate-800 text-[11px] whitespace-nowrap">
                        NAMA SISWA:
                      </span>
                      <div className="flex-1 border-b border-dashed border-slate-500 h-5"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-24 font-bold text-slate-800 text-[11px] whitespace-nowrap">
                        NOMOR ABSEN:
                      </span>
                      <div className="flex-1 border-b border-dashed border-slate-500 h-5"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-24 font-bold text-slate-800 text-[11px] whitespace-nowrap">
                        KELAS:
                      </span>
                      <div className="flex-1 border-b border-dashed border-slate-500 h-5"></div>
                    </div>
                  </div>

                  {/* Sample Bubble Guide for Student */}
                  <div className="col-span-5 border-l border-slate-300 pl-3 flex flex-col justify-center space-y-1 text-[10px] text-slate-700">
                    <span className="font-bold text-slate-900">PETUNJUK PENGISIAN:</span>
                    <p>1. Hitamkan bulatan secara penuh dengan pensil 2B.</p>
                    <p>2. Tulisan isian singkat harus terbaca jelas.</p>
                    <div className="flex items-center space-x-3 pt-1">
                      <span className="flex items-center space-x-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-slate-900 inline-block"></span>
                        <span className="text-emerald-800 font-bold">Benar</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-500 inline-block text-center text-[9px] leading-3 font-bold">
                          &times;
                        </span>
                        <span className="text-rose-700 font-bold">Salah</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Structured Questions Grid on LJK Sheet */}
                <div className="space-y-4 pt-1">
                  {/* Pilihan Ganda & Kompleks Section */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
                      <span>
                        BAGIAN I &bull; PILIHAN GANDA ({choiceOptions[0]}-{choiceOptions[choiceOptions.length - 1]}) &amp; PG KOMPLEKS ({choiceOptions[0]}-{choiceOptions[choiceOptions.length - 1]})
                      </span>
                      <span className="text-[10px] font-normal text-slate-600">
                        {isLowerGrade ? 'Pilihan A, B, C' : 'Pilihan A, B, C, D'}
                      </span>
                    </h3>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {questions
                        .filter((q) => q.question_type === 'single_choice' || q.question_type === 'multi_choice')
                        .map((q) => (
                          <div
                            key={q.question_number}
                            className="flex items-center justify-between border-b border-slate-100 py-1 text-xs"
                          >
                            <span className="font-bold text-slate-900 w-7">
                              {String(q.question_number).padStart(2, '0')}.
                            </span>

                            {q.question_type === 'single_choice' ? (
                              <div className="flex items-center space-x-2">
                                {choiceOptions.map((opt) => (
                                  <div
                                    key={opt}
                                    className="w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center font-bold text-[10px] text-slate-800"
                                  >
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                {choiceOptions.map((opt) => (
                                  <div
                                    key={opt}
                                    className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center font-bold text-[10px] text-slate-900"
                                  >
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Benar / Salah & Menjodohkan Section */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
                      <span>BAGIAN II &bull; BENAR/SALAH &amp; MENJODOHKAN</span>
                    </h3>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {questions
                        .filter((q) => q.question_type === 'true_false' || q.question_type === 'matching')
                        .map((q) => (
                          <div
                            key={q.question_number}
                            className="flex items-center justify-between border-b border-slate-100 py-1 text-xs"
                          >
                            <span className="font-bold text-slate-900 w-7">
                              {String(q.question_number).padStart(2, '0')}.
                            </span>

                            {q.question_type === 'true_false' ? (
                              <div className="flex items-center space-x-4 pr-6">
                                <span className="text-[10px] text-slate-600">Pilihan:</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center font-bold text-[10px] text-slate-800">
                                    B
                                  </div>
                                  <div className="w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center font-bold text-[10px] text-slate-800">
                                    S
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 pr-2">
                                {[1, 2, 3].map((sub) => (
                                  <div key={sub} className="flex items-center space-x-0.5">
                                    <span className="text-[9px] text-slate-600 font-bold">{sub}:</span>
                                    <div className="w-4 h-4 rounded border border-slate-500 flex items-center justify-center text-[9px] font-bold text-slate-700">
                                      &nbsp;
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Tulisan Tangan Isian Singkat Section */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
                      <span>BAGIAN III &bull; TULISAN TANGAN ISIAN SINGKAT (AI OCR)</span>
                      <span className="text-[10px] font-normal text-slate-600">
                        Tuliskan jawaban dalam kotak kapital
                      </span>
                    </h3>

                    <div className="space-y-2">
                      {questions
                        .filter((q) => q.question_type === 'short_answer')
                        .map((q) => (
                          <div key={q.question_number} className="flex items-center space-x-3 text-xs">
                            <span className="font-bold text-slate-900 w-7">
                              {String(q.question_number).padStart(2, '0')}.
                            </span>
                            <div className="flex-1">
                              <div
                                className="border-2 border-slate-900 rounded bg-slate-50/50 h-10 flex items-center px-3 relative"
                                title="Area Deteksi Tulisan Tangan AI Vision"
                              >
                                <span className="absolute top-0.5 right-1.5 text-[8px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                                  OCR BOX #{q.question_number}
                                </span>
                                <div className="text-[11px] text-slate-400 italic">
                                  [Tuliskan Jawaban Siswa dengan Jelas di Sini]
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Footer validation bar */}
                <div className="border-t border-slate-300 pt-2 flex items-center justify-between text-[9px] text-slate-600 font-medium">
                  <span>SMARTLJK OPENCV &amp; AI VISION READY &bull; SD NEGERI 7 PEDUNGAN</span>
                  <span>SISTEM VALIDASI 4 TITIK ANCHOR OTOMATIS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
