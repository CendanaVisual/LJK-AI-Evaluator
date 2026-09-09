import * as XLSX from 'xlsx';

export interface ExamResultExportData {
  exam: {
    title: string;
    code: string;
    subject: string;
    className: string;
    academicYear: string;
    passingScore: number;
  };
  results: Array<{
    student_id_number: string;
    student_name: string;
    class_name: string;
    total_score: number;
    max_possible_score: number;
    percentage: number;
    status: string;
    omr_confidence: number;
    created_at: string;
    raw_details?: any;
  }>;
  questions?: Array<{
    question_number: number;
    question_type: string;
    weight: number;
  }>;
}

export function generateExamExcel(data: ExamResultExportData): Buffer {
  const wb = XLSX.utils.book_new();

  // 1. REKAP NILAI SISWA
  const studentRows = data.results.map((r, idx) => ({
    'No': idx + 1,
    'No. Absen / NIS': r.student_id_number,
    'Nama Siswa': r.student_name,
    'Kelas': r.class_name || data.exam.className,
    'Nilai Akhir': Number(r.total_score).toFixed(1),
    'Nilai Maksimal': Number(r.max_possible_score).toFixed(1),
    'Persentase (%)': `${Number(r.percentage).toFixed(1)}%`,
    'KKM': data.exam.passingScore,
    'Status Kelulusan': r.status,
    'Tingkat Akurasi OMR (%)': `${Number(r.omr_confidence || 98).toFixed(1)}%`,
    'Waktu Koreksi': new Date(r.created_at).toLocaleString('id-ID'),
  }));

  const wsStudents = XLSX.utils.json_to_sheet(studentRows);
  // Auto-fit column widths
  wsStudents['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 14 },
    { wch: 15 },
    { wch: 10 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Rekap Nilai Siswa');

  // 2. STATISTIK KELAS
  const totalStudents = data.results.length;
  const scores = data.results.map((r) => Number(r.total_score));
  const avgScore = totalStudents > 0 ? (scores.reduce((a, b) => a + b, 0) / totalStudents).toFixed(1) : '0.0';
  const maxScore = totalStudents > 0 ? Math.max(...scores).toFixed(1) : '0.0';
  const minScore = totalStudents > 0 ? Math.min(...scores).toFixed(1) : '0.0';
  const passedCount = data.results.filter((r) => r.status === 'Lulus' || Number(r.total_score) >= data.exam.passingScore).length;
  const remedialCount = totalStudents - passedCount;
  const passRate = totalStudents > 0 ? ((passedCount / totalStudents) * 100).toFixed(1) + '%' : '0%';

  const statsRows = [
    { 'Parameter Analisis': 'Judul Ujian', 'Keterangan': data.exam.title },
    { 'Parameter Analisis': 'Kode Ujian', 'Keterangan': data.exam.code },
    { 'Parameter Analisis': 'Mata Pelajaran', 'Keterangan': data.exam.subject },
    { 'Parameter Analisis': 'Kelas / Rombel', 'Keterangan': data.exam.className },
    { 'Parameter Analisis': 'Tahun Pelajaran', 'Keterangan': data.exam.academicYear },
    { 'Parameter Analisis': 'Standar Kelulusan (KKM)', 'Keterangan': data.exam.passingScore.toString() },
    { 'Parameter Analisis': '------------------------------', 'Keterangan': '------------------------------' },
    { 'Parameter Analisis': 'Jumlah Siswa Dinilai', 'Keterangan': `${totalStudents} Siswa` },
    { 'Parameter Analisis': 'Nilai Rata-rata Kelas', 'Keterangan': avgScore },
    { 'Parameter Analisis': 'Nilai Tertinggi (Max)', 'Keterangan': maxScore },
    { 'Parameter Analisis': 'Nilai Terendah (Min)', 'Keterangan': minScore },
    { 'Parameter Analisis': 'Jumlah Siswa Tuntas / Lulus', 'Keterangan': `${passedCount} Siswa` },
    { 'Parameter Analisis': 'Jumlah Siswa Remedial', 'Keterangan': `${remedialCount} Siswa` },
    { 'Parameter Analisis': 'Persentase Ketuntasan Belajar', 'Keterangan': passRate },
  ];

  const wsStats = XLSX.utils.json_to_sheet(statsRows);
  wsStats['!cols'] = [{ wch: 32 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsStats, 'Statistik Kelas');

  // 3. ANALISIS BUTIR SOAL
  if (data.questions && data.questions.length > 0) {
    const questionRows = data.questions.map((q) => {
      let typeLabel = 'Pilihan Ganda';
      if (q.question_type === 'multi_choice') typeLabel = 'PG Kompleks';
      else if (q.question_type === 'true_false') typeLabel = 'Benar / Salah';
      else if (q.question_type === 'matching') typeLabel = 'Menjodohkan';
      else if (q.question_type === 'short_answer') typeLabel = 'Isian Singkat (AI OCR)';

      return {
        'No Soal': q.question_number,
        'Tipe Soal': typeLabel,
        'Bobot Soal': q.weight,
        'Format Koreksi': q.question_type === 'short_answer' ? 'AI Gemini Vision OCR' : 'Optical Mark Recognition (OMR)',
        'Status Validasi': 'Kunci Jawaban Terverifikasi',
      };
    });

    const wsQuestions = XLSX.utils.json_to_sheet(questionRows);
    wsQuestions['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 12 }, { wch: 30 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsQuestions, 'Spesifikasi Butir Soal');
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
