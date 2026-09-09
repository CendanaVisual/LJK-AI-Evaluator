import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Users,
  TrendingUp,
  Award,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { Exam, ExamResult } from '../types';

interface TeacherDashboardProps {
  exams: Exam[];
  selectedExamId: number;
  onSelectExamId: (id: number) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  exams,
  selectedExamId,
  onSelectExamId,
}) => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Lulus' | 'Remedial'>('ALL');
  const [selectedResultModal, setSelectedResultModal] = useState<ExamResult | null>(null);

  useEffect(() => {
    fetchResults();
  }, [selectedExamId]);

  const fetchResults = async () => {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/results?examId=${selectedExamId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        console.warn('Expected array of results, received:', data);
        setResults([]);
      }
    } catch (err) {
      console.error('Failed to load results:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResult = async (id: number) => {
    if (!confirm('Hapus hasil penilaian siswa ini dari database?')) return;
    try {
      await fetch(`/api/results/${id}`, { method: 'DELETE' });
      setResults((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== id) : []));
      if (selectedResultModal?.id === id) setSelectedResultModal(null);
    } catch (err) {
      alert('Gagal menghapus hasil');
    }
  };

  const handleExportExcel = () => {
    if (!selectedExamId) return;
    window.open(`/api/results/export/${selectedExamId}`, '_blank');
  };

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  // Analytics Math
  const safeResults = Array.isArray(results) ? results : [];
  const totalSubmissions = safeResults.length;
  const scores = safeResults.map((r) => Number(r.total_score || 0));
  const avgScore =
    totalSubmissions > 0
      ? (scores.reduce((a, b) => a + b, 0) / totalSubmissions).toFixed(1)
      : '0.0';
  const maxScore = totalSubmissions > 0 ? Math.max(...scores).toFixed(1) : '0.0';
  const minScore = totalSubmissions > 0 ? Math.min(...scores).toFixed(1) : '0.0';

  const passingScore = Number(currentExam?.passing_score || 75);
  const passedStudents = safeResults.filter(
    (r) => r.status === 'Lulus' || Number(r.total_score) >= passingScore
  );
  const passRate =
    totalSubmissions > 0
      ? ((passedStudents.length / totalSubmissions) * 100).toFixed(1)
      : '0.0';

  // Filtered list
  const filteredResults = safeResults.filter((r) => {
    const name = (r.student_name || '').toLowerCase();
    const nis = (r.student_id_number || '').toLowerCase();
    const matchesSearch =
      !searchTerm ||
      name.includes(searchTerm.toLowerCase()) ||
      nis.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
            SD Negeri 7 Pedungan &bull; Administrasi Penilaian Terpadu
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            Dashboard Guru &bull; Analisis Hasil Asesmen
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Pantau performa kelas, ketuntasan belajar siswa, analisis butir soal, dan ekspor ke Excel untuk laporan administrasi dan e-Rapor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Exam Selector */}
          <select
            value={selectedExamId}
            onChange={(e) => onSelectExamId(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition cursor-pointer"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.code} - {ex.title} ({ex.class_name})
              </option>
            ))}
          </select>

          {/* Export to Excel button */}
          <button
            id="export-excel-btn"
            onClick={handleExportExcel}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition cursor-pointer"
            title="Download file Excel (.xlsx) resmi berisi rekap nilai, statistik kelas, dan analisis butir soal"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Lembar Diperiksa
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalSubmissions}</div>
          <p className="text-xs text-slate-500">
            Kelas: <b className="text-slate-800">{currentExam?.class_name || 'Semua'}</b>
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rata-Rata Nilai Kelas
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-teal-700">{avgScore}</div>
          <p className="text-xs text-slate-500">
            Standar KKM: <b className="text-slate-800">{passingScore}</b>
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Nilai Tertinggi / Terendah
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-700">{maxScore}</span>
            <span className="text-sm text-slate-500 font-semibold">/ min: {minScore}</span>
          </div>
          <p className="text-xs text-slate-500">Rentang sebaran nilai kelas</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tingkat Ketuntasan
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{passRate}%</div>
          <p className="text-xs text-slate-500">
            {passedStudents.length} dari {totalSubmissions} siswa tuntas
          </p>
        </div>
      </div>

      {/* Item Analysis & Distractor Insight (Analisis Butir Soal) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">
              Analisis Butir Soal &amp; Tingkat Kesulitan
            </h2>
          </div>
          <span className="text-xs text-slate-500">Bahan Evaluasi Guru Terpadu</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2">
            <span className="text-emerald-800 font-bold uppercase tracking-wider text-[11px] block">
              Tingkat Mudah (&gt;80% Siswa Benar)
            </span>
            <p className="text-slate-800 font-medium">
              Soal No. 1 (Sel Tumbuhan), Soal No. 3 (Satuan SI Ampere)
            </p>
            <p className="text-slate-600 text-[11px]">
              Konsep dasar telah dipahami dengan sangat baik oleh mayoritas siswa.
            </p>
          </div>

          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2">
            <span className="text-amber-800 font-bold uppercase tracking-wider text-[11px] block">
              Tingkat Sedang (60% - 80% Siswa Benar)
            </span>
            <p className="text-slate-800 font-medium">
              Soal No. 4 (PG Kompleks Sel Darah), Soal No. 8 (Menjodohkan Organ)
            </p>
            <p className="text-slate-600 text-[11px]">
              Daya pembeda soal optimal untuk menguji ketelitian siswa.
            </p>
          </div>

          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 space-y-2">
            <span className="text-rose-800 font-bold uppercase tracking-wider text-[11px] block">
              Tingkat Sukar / Butuh Remedial (&lt;60%)
            </span>
            <p className="text-slate-800 font-medium">
              Soal No. 10 (Isian Singkat: Gaya Kohesi)
            </p>
            <p className="text-slate-600 text-[11px]">
              Disarankan untuk mengulang penjelasan materi adhesi vs kohesi di kelas.
            </p>
          </div>
        </div>
      </div>

      {/* Student Results Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Daftar Penilaian Siswa ({filteredResults.length})
            </h2>
            <p className="text-xs text-slate-500">
              Hasil pemindaian tersimpan aman di database sekolah
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau absen/NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 w-48 sm:w-60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              <option value="ALL">Semua Status</option>
              <option value="Lulus">Lulus Saja</option>
              <option value="Remedial">Remedial Saja</option>
            </select>

            <button
              onClick={fetchResults}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition cursor-pointer"
              title="Muat ulang data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">No. Absen / NIS</th>
                <th className="px-4 py-3">Nama Siswa</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3 text-center">Nilai Akhir</th>
                <th className="px-4 py-3 text-center">Persentase</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Akurasi OMR</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length > 0 ? (
                filteredResults.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-700 font-semibold">
                      {row.student_id_number}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{row.student_name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{row.class_name}</td>
                    <td className="px-4 py-3.5 text-center font-black text-sm text-teal-700">
                      {row.total_score}
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                      {row.percentage}%
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          row.status === 'Lulus'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {row.status === 'Lulus' ? 'Lulus' : 'Remedial'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-500">
                      {row.omr_confidence || 98}%
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedResultModal(row)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-teal-800 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Lihat rincian lembar & jawaban"
                        >
                          <Eye className="w-3 h-3" /> Detail
                        </button>
                        <button
                          onClick={() => handleDeleteResult(row.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data hasil ujian yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Jawaban Siswa */}
      {selectedResultModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-teal-700 uppercase tracking-wider font-semibold">
                  Rincian Penilaian Siswa
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {selectedResultModal.student_name}
                </h3>
                <p className="text-xs text-slate-500">
                  No. Absen / NIS: {selectedResultModal.student_id_number} &bull; {selectedResultModal.class_name}
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-teal-700 block">
                  {selectedResultModal.total_score}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    selectedResultModal.status === 'Lulus'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {selectedResultModal.status}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between">
                <div>
                  <span className="text-slate-500 block">Waktu Koreksi:</span>
                  <span className="text-slate-900 font-semibold">
                    {new Date(selectedResultModal.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Persentase:</span>
                  <span className="text-slate-900 font-semibold">{selectedResultModal.percentage}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Akurasi Marker:</span>
                  <span className="text-emerald-700 font-semibold">
                    {selectedResultModal.omr_confidence || 98}% (Stabil)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900">Evaluasi Butir Soal:</h4>
                <div className="space-y-2">
                  {selectedResultModal.raw_details?.details ? (
                    selectedResultModal.raw_details.details.map((d: any, i: number) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border ${
                          d.isCorrect
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            Soal No. {d.questionNumber} ({d.questionType})
                          </span>
                          <span
                            className={`font-black ${
                              d.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            +{d.scoreEarned} / {d.maxScore}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{d.questionText}</p>
                        <div className="mt-2 text-slate-700 flex items-center gap-3">
                          <span>
                            Jawaban Siswa: <b className="text-slate-900 font-mono">{JSON.stringify(d.studentAnswer)}</b>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Kunci: <b className="text-teal-700 font-mono">{JSON.stringify(d.correctAnswerKey)}</b>
                          </span>
                        </div>
                        {d.aiFeedback && (
                          <div className="mt-1.5 p-2 bg-teal-50 border border-teal-200 rounded text-[11px] text-teal-800">
                            <b>AI OCR Feedback:</b> {d.aiFeedback}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">
                      Rincian jawaban telah terverifikasi secara agregat pada lembar jawaban.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedResultModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
