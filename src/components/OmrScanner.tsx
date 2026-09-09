import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Scan,
  Maximize2,
  ChevronRight,
  HelpCircle,
  Award,
  Layers,
  Users,
  Play,
  Square,
  Download,
  Printer,
  Eye,
  Check,
  Search,
  Filter,
  FileCheck2,
} from 'lucide-react';
import { Exam, QuestionEvaluationDetail } from '../types';
import { renderPdfToImages } from '../utils/pdfRenderer';
import { exportClassResultsToExcel, ClassResultRow } from '../utils/excelExporter';

interface SheetQueueItem {
  id: string;
  pageNumber: number;
  dataUrl: string;
  fileName?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: any;
  error?: string;
}

interface OmrScannerProps {
  exams: Exam[];
  selectedExamId: number;
  onSelectExamId: (id: number) => void;
  preloadedImageBase64?: string;
  preloadedStudentName?: string;
  preloadedNis?: string;
  onScanSaved: () => void;
}

export const OmrScanner: React.FC<OmrScannerProps> = ({
  exams,
  selectedExamId,
  onSelectExamId,
  preloadedImageBase64,
  onScanSaved,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cancelProcessingRef = useRef<boolean>(false);

  // Sheets Queue (Holds 1 to 32+ sheets from 1-class PDF or images)
  const [sheets, setSheets] = useState<SheetQueueItem[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentProcessingPage, setCurrentProcessingPage] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [processingStatusText, setProcessingStatusText] = useState<string>('');

  // PDF reading progress
  const [isPdfRendering, setIsPdfRendering] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showWarpedView, setShowWarpedView] = useState(true);

  // Detail Modal / Inspector for an individual student
  const [inspectedResult, setInspectedResult] = useState<any | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Lulus' | 'Remedial'>('all');

  const activeExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  // Initialize with preloaded image if available
  useEffect(() => {
    if (preloadedImageBase64 && sheets.length === 0) {
      setSheets([
        {
          id: 'preloaded-1',
          pageNumber: 1,
          dataUrl: preloadedImageBase64,
          fileName: 'Lembar LJK Terpilih',
          status: 'pending',
        },
      ]);
      setActiveSheetIndex(0);
    }
  }, [preloadedImageBase64]);

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
    }
  };

  // Handle uploaded files: single PDF (e.g. 32 pages for a whole class) or multiple image files
  const handleFilesSelected = async (fileList: FileList) => {
    setErrorMessage(null);
    setInspectedResult(null);

    const firstFile = fileList[0];
    const isPdf =
      firstFile.type === 'application/pdf' || firstFile.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      setIsPdfRendering(true);
      setPdfProgress({ current: 1, total: 1 });
      try {
        const pages = await renderPdfToImages(firstFile, {
          scale: 1.4,
          onProgress: (current, total) => {
            setPdfProgress({ current, total });
          },
        });

        if (pages.length === 0) {
          throw new Error('Dokumen PDF tidak memiliki halaman yang dapat dibaca');
        }

        const newSheets: SheetQueueItem[] = pages.map((p) => ({
          id: `pdf-page-${p.pageNumber}-${Date.now()}`,
          pageNumber: p.pageNumber,
          dataUrl: p.dataUrl,
          fileName: `${firstFile.name} (Lembar ${p.pageNumber})`,
          status: 'pending',
        }));

        setSheets(newSheets);
        setActiveSheetIndex(0);
      } catch (err: any) {
        setErrorMessage('Gagal membaca berkas PDF: ' + (err.message || err));
      } finally {
        setIsPdfRendering(false);
        setPdfProgress(null);
      }
    } else {
      // Multiple or single image files
      const newSheets: SheetQueueItem[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const dataUrl = await readFileAsDataUrl(file);
        newSheets.push({
          id: `img-${i + 1}-${Date.now()}`,
          pageNumber: i + 1,
          dataUrl,
          fileName: file.name,
          status: 'pending',
        });
      }

      setSheets(newSheets);
      setActiveSheetIndex(0);
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Camera Handler
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      alert('Tidak dapat mengakses kamera: ' + err.message);
    }
  };

  const captureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1000;
    canvas.height = videoRef.current.videoHeight || 1400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setSheets((prev) => [
        ...prev,
        {
          id: `cam-${Date.now()}`,
          pageNumber: prev.length + 1,
          dataUrl,
          fileName: `Foto Kamera (Lembar ${prev.length + 1})`,
          status: 'pending',
        },
      ]);
      setActiveSheetIndex(sheets.length);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Run Batch Processing for all sheets in queue
  const handleStartBatchProcessing = async () => {
    if (sheets.length === 0) {
      setErrorMessage('Harap unggah file PDF atau gambar LJK terlebih dahulu');
      return;
    }

    if (!selectedExamId) {
      setErrorMessage('Pilih paket ujian terlebih dahulu');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    cancelProcessingRef.current = false;

    const total = sheets.length;

    for (let i = 0; i < total; i++) {
      if (cancelProcessingRef.current) {
        setProcessingStatusText('Pemeriksaan dihentikan oleh pengguna.');
        break;
      }

      const currentSheet = sheets[i];
      setCurrentProcessingPage(i + 1);
      setProgressPercent(Math.round((i / total) * 100));
      setActiveSheetIndex(i);
      setProcessingStatusText(
        `Memindai Lembar ${i + 1} dari ${total}: Mengevaluasi OMR & OCR Identitas LJK...`
      );

      // Mark current sheet as processing
      setSheets((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'processing' } : s))
      );

      try {
        const res = await fetch('/api/omr/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId: selectedExamId,
            imageBase64: currentSheet.dataUrl,
            pageIndex: currentSheet.pageNumber,
            // Nama siswa, no absen, dan kelas dipindai langsung oleh server AI Vision dari kotak LJK!
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal memproses lembar');
        }

        // Update sheet with success result
        setSheets((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'done', result: data } : s))
        );

        setProcessingStatusText(
          `Lembar ${i + 1}/${total} selesai: ${data.studentName} (Absen ${data.studentIdNumber}) - Nilai: ${data.totalScore}`
        );
      } catch (err: any) {
        setSheets((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: 'error', error: err.message || 'Galat pemindaian' } : s
          )
        );
      }

      // Brief pause between sheets for responsive DOM updates
      await new Promise((r) => setTimeout(r, 150));
    }

    setProgressPercent(100);
    setIsProcessing(false);
    onScanSaved();

    // Auto-inspect the first completed sheet if none inspected
    const firstDone = sheets.find((s) => s.result);
    if (firstDone?.result && !inspectedResult) {
      setInspectedResult(firstDone.result);
    }
  };

  const handleStopProcessing = () => {
    cancelProcessingRef.current = true;
  };

  // Export Results to Excel (.xlsx)
  const handleExportExcel = () => {
    const completedResults: ClassResultRow[] = sheets
      .filter((s) => s.status === 'done' && s.result)
      .map((s) => ({
        studentName: s.result.studentName,
        studentIdNumber: s.result.studentIdNumber,
        className: s.result.className || activeExam?.class_name || '5 A',
        totalScore: s.result.totalScore,
        maxScore: s.result.maxScore,
        percentage: s.result.percentage,
        status: s.result.status,
        omrConfidence: s.result.omrConfidence,
      }));

    if (completedResults.length === 0) {
      alert('Belum ada data lembar siswa yang selesai diperiksa.');
      return;
    }

    exportClassResultsToExcel(
      completedResults,
      activeExam?.title || 'Ujian',
      activeExam?.subject || 'IPAS',
      activeExam?.class_name || 'Kelas 5 A'
    );
  };

  // Print results
  const handlePrintSummary = () => {
    const recapEl = document.getElementById('printable-omr-recap-sheet');
    if (!recapEl) {
      window.print();
      return;
    }

    let styleContent = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      styleContent += node.outerHTML + '\n';
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rekapitulasi Nilai LJK - SD Negeri 7 Pedungan</title>
  ${styleContent}
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 6mm;
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
    .print-only {
      display: block !important;
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
    .print-wrapper {
      padding: 24px;
      display: flex;
      justify-content: center;
      background: #f1f5f9;
      min-height: 100vh;
    }
    .printable-omr-recap {
      display: block !important;
      width: 100% !important;
      max-width: 210mm !important;
      margin: 0 auto !important;
      background: #ffffff !important;
      color: #000000 !important;
      padding: 16px !important;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
      border: 1px solid #cbd5e1;
    }
    @media print {
      .print-control-bar, .no-print {
        display: none !important;
      }
      .print-wrapper {
        padding: 0 !important;
        background: #ffffff !important;
      }
      .printable-omr-recap {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-control-bar no-print">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-weight: 800; font-size: 14px;">SD Negeri 7 Pedungan</span>
      <span style="background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600;">Rekapitulasi Nilai LJK</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button class="btn-action-print" onclick="window.print()">
        🖨️ Cetak ke Printer / Simpan PDF
      </button>
      <button class="btn-action-close" onclick="window.close()">
        Tutup
      </button>
    </div>
  </div>
  <div class="print-wrapper">
    ${recapEl.outerHTML}
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 400);
    });
  <\/script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    let opened = false;
    try {
      const printWin = window.open(blobUrl, '_blank', 'width=950,height=1100,menubar=no,toolbar=no,location=no,status=no');
      if (printWin) opened = true;
    } catch (err) {
      console.warn('window.open blocked:', err);
    }

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
        console.warn('Anchor click error:', err);
      }
    }

    if (window.self === window.top) {
      try {
        window.print();
      } catch (e) {
        console.warn('window.print direct error:', e);
      }
    }
  };

  // Current active sheet
  const activeSheet = sheets[activeSheetIndex] || sheets[0];

  // Completed results list
  const completedSheets = sheets.filter((s) => s.status === 'done' && s.result);
  const totalCompleted = completedSheets.length;
  const averageScore =
    totalCompleted > 0
      ? Math.round(
          (completedSheets.reduce((acc, s) => acc + s.result.percentage, 0) / totalCompleted) * 10
        ) / 10
      : 0;
  const totalPassed = completedSheets.filter((s) => s.result.status === 'Lulus').length;
  const totalRemedial = completedSheets.filter((s) => s.result.status === 'Remedial').length;

  // Filtered rows for the class results table
  const filteredCompletedSheets = completedSheets.filter((s) => {
    const matchesSearch =
      !searchFilter ||
      s.result.studentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.result.studentIdNumber.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.result.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* PRINT-ONLY OFFICIAL CLASS RECAPITULATION (Shown only in print mode) */}
      {completedSheets.length > 0 && (
        <div id="printable-omr-recap-sheet" className="print-only printable-omr-recap font-sans">
          {/* Official Kop Surat */}
          <div className="border-b-2 border-black pb-3 mb-4 text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">
              PEMERINTAH KOTA DENPASAR &bull; DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA
            </h3>
            <h1 className="text-lg font-black uppercase text-black tracking-tight">
              SD NEGERI 7 PEDUNGAN
            </h1>
            <p className="text-[11px] text-black">
              Alamat: Jl. Pulau Bungin, Pedungan, Denpasar Selatan &bull; NPSN: 50103233
            </p>
            <div className="border-t border-black mt-2 pt-2">
              <h2 className="text-sm font-black uppercase tracking-tight text-black">
                DAFTAR REKAPITULASI HASIL PEMERIKSAAN LEMBAR JAWABAN KOMPUTER (LJK OMR)
              </h2>
            </div>
          </div>

          {/* Exam Info Table */}
          <div className="grid grid-cols-2 gap-4 text-xs text-black mb-4 border border-black p-2.5">
            <div className="space-y-1">
              <p>
                <b>Mata Pelajaran:</b> {activeExam?.subject}
              </p>
              <p>
                <b>Judul Asesmen:</b> {activeExam?.title}
              </p>
              <p>
                <b>Kode Ujian:</b> {activeExam?.code}
              </p>
            </div>
            <div className="space-y-1">
              <p>
                <b>Kelas / Rombel:</b> {activeExam?.class_name}
              </p>
              <p>
                <b>Tahun Ajaran:</b> {activeExam?.academic_year}
              </p>
              <p>
                <b>Batas KKM:</b> {activeExam?.passing_score}
              </p>
            </div>
          </div>

          {/* Class Statistics Summary */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs text-black mb-4 border border-black p-2 font-bold bg-slate-50">
            <div>Total Siswa: {totalCompleted}</div>
            <div>Rata-Rata Kelas: {averageScore}</div>
            <div>Tuntas (Lulus): {totalPassed}</div>
            <div>Remedial: {totalRemedial}</div>
          </div>

          {/* Student Grades Table */}
          <table className="w-full text-xs text-black border-collapse border border-black mb-6">
            <thead>
              <tr className="bg-slate-100 border-b border-black">
                <th className="border border-black p-1.5 text-center w-10">No</th>
                <th className="border border-black p-1.5 text-center w-20">No. Absen</th>
                <th className="border border-black p-1.5 text-left">Nama Siswa (Pindai LJK)</th>
                <th className="border border-black p-1.5 text-center w-20">Kelas</th>
                <th className="border border-black p-1.5 text-center w-20">Nilai</th>
                <th className="border border-black p-1.5 text-center w-24">Persentase</th>
                <th className="border border-black p-1.5 text-center w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {completedSheets.map((item, i) => (
                <tr key={item.id} className="border-b border-black">
                  <td className="border border-black p-1.5 text-center">{i + 1}</td>
                  <td className="border border-black p-1.5 text-center font-mono font-bold">
                    {item.result.studentIdNumber || '-'}
                  </td>
                  <td className="border border-black p-1.5 font-bold uppercase">
                    {item.result.studentName}
                  </td>
                  <td className="border border-black p-1.5 text-center">
                    {item.result.className || activeExam?.class_name}
                  </td>
                  <td className="border border-black p-1.5 text-center font-bold">
                    {item.result.totalScore}
                  </td>
                  <td className="border border-black p-1.5 text-center font-medium">
                    {item.result.percentage}%
                  </td>
                  <td className="border border-black p-1.5 text-center font-black">
                    {item.result.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signature Row */}
          <div className="flex justify-between text-xs text-black pt-6">
            <div className="text-center w-52">
              <p>Mengetahui,</p>
              <p className="font-bold">Kepala SD Negeri 7 Pedungan</p>
              <div className="h-16"></div>
              <p className="font-bold underline">( ............................................ )</p>
              <p>NIP. ..........................................</p>
            </div>
            <div className="text-center w-52">
              <p>
                Denpasar,{' '}
                {new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="font-bold">Guru Pengampu / Wali Kelas</p>
              <div className="h-16"></div>
              <p className="font-bold underline">( ............................................ )</p>
              <p>NIP. ..........................................</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner & Exam Selector (Hidden on Print) */}
      <div className="no-print bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Pemeriksaan LJK OMR Cermat &bull; Multi-Lembar PDF 1 Kelas
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" /> Deteksi Identitas Otomatis LJK
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pemeriksaan Lembar Jawaban Komputer (OMR)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Mendukung pemindaian berkas PDF 1 kelas secara langsung (hingga 32 lembar siswa). Nama siswa, nomor absen, dan kelas dipindai langsung dari kolom identitas LJK secara otomatis oleh AI Vision tanpa perlu input manual.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Pilih Paket Ujian
            </label>
            <select
              id="select-exam-scanner"
              value={selectedExamId}
              onChange={(e) => onSelectExamId(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 min-w-[220px] transition cursor-pointer"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.subject} - {ex.title} ({ex.class_name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Identity Auto-Detection Informational Pill (Hidden on Print) */}
      <div className="no-print bg-teal-50/70 border border-teal-200/80 rounded-xl p-4 flex items-center justify-between gap-4 text-xs text-teal-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-xs">
              Pindai Identitas Otomatis Aktif (Kolom Nama Siswa &amp; Nomor Absen Manual Ditiadakan)
            </span>
            <span className="text-slate-600 text-[11px]">
              Guru tidak perlu mengetik nama atau nomor absen satu per satu. Mesin AI Vision memindai kolom <b className="text-teal-900">NAMA SISWA</b>, <b className="text-teal-900">NOMOR ABSEN</b>, dan <b className="text-teal-900">KELAS</b> langsung dari lembar kertas LJK tiap siswa.
            </span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-teal-200 rounded-lg text-[11px] text-teal-800 font-bold whitespace-nowrap shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          Kapasitas 1 Kelas (32 Lembar)
        </div>
      </div>

      {/* File Upload / Source Action Bar (Hidden on Print) */}
      <div className="no-print bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="application/pdf,image/*"
              multiple
              className="hidden"
            />
            <button
              id="upload-class-pdf-btn"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'application/pdf';
                  fileInputRef.current.click();
                }
              }}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-teal-600/20 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Unggah File PDF (1 Kelas / 32 Lembar)</span>
            </button>

            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'image/*';
                  fileInputRef.current.click();
                }
              }}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <span>Pilih Banyak Foto LJK Sekaligus</span>
            </button>

            <button
              onClick={startCamera}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <Camera className="w-3.5 h-3.5 text-slate-600" />
              <span>Kamera Langsung</span>
            </button>
          </div>
        </div>

        {/* Live Camera Feed Modal / Tray */}
        {isCameraActive && (
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 space-y-3">
            <div className="relative aspect-[4/3] max-w-md mx-auto bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={captureCamera}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
              >
                Ambil Foto Lembar
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Tutup Kamera
              </button>
            </div>
          </div>
        )}

        {/* PDF Rendering Loading Indicator */}
        {isPdfRendering && (
          <div className="bg-teal-50 border border-teal-300 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-teal-800 animate-pulse">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
              <span>
                Sedang membaca dan merender dokumen PDF 1 kelas: Halaman {pdfProgress?.current || 1} dari{' '}
                {pdfProgress?.total || 32}...
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-teal-700">PDF Reader Aktif</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Queue Gallery Strip (when sheets are loaded) */}
        {sheets.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-teal-600" />
                  Antrean Lembar Siswa ({sheets.length} Lembar Terbaca)
                </span>
                <span className="text-[11px] text-slate-500">
                  &bull; Selesai: {totalCompleted}/{sheets.length} siswa
                </span>
              </div>

              {/* Action Buttons: Start Batch & Stop */}
              <div className="flex items-center gap-2">
                {isProcessing ? (
                  <button
                    onClick={handleStopProcessing}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Hentikan Pemeriksaan</span>
                  </button>
                ) : (
                  <button
                    id="start-batch-scan-btn"
                    onClick={handleStartBatchProcessing}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-teal-600/20 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Mulai Koreksi Otomatis ({sheets.length} Lembar Siswa)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setSheets([]);
                    setActiveSheetIndex(0);
                    setInspectedResult(null);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* Live Progress Bar when processing */}
            {isProcessing && (
              <div className="space-y-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-teal-800 font-semibold flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin text-teal-600" />
                    {processingStatusText}
                  </span>
                  <span className="font-mono font-bold text-teal-800">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-2 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Thumbnail horizontal scroll strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300">
              {sheets.map((sheet, idx) => {
                const isActive = idx === activeSheetIndex;
                const isDone = sheet.status === 'done';
                const isErr = sheet.status === 'error';
                const isCurr = sheet.status === 'processing';

                return (
                  <button
                    key={sheet.id}
                    onClick={() => setActiveSheetIndex(idx)}
                    className={`relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden border-2 transition text-left cursor-pointer ${
                      isActive
                        ? 'border-teal-600 ring-2 ring-teal-500/20'
                        : isDone
                        ? 'border-emerald-400 opacity-90'
                        : isErr
                        ? 'border-rose-400'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={sheet.dataUrl}
                      alt={`Halaman ${sheet.pageNumber}`}
                      className="w-full h-full object-cover bg-white"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 text-[10px] text-white p-1 text-center font-mono font-bold">
                      #{sheet.pageNumber}
                    </div>
                    {isDone && (
                      <div className="absolute top-1 right-1 bg-emerald-600 rounded-full p-0.5 text-white shadow-xs">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                    {isCurr && (
                      <div className="absolute inset-0 bg-teal-900/40 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left Sheet Viewer, Right Results Table (Hidden on Print) */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 Cols): Active Sheet Image & Bounding Corner Overlay */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Scan className="w-4 h-4 text-teal-600" />
                Peninjau Lembar ({sheets.length > 0 ? activeSheetIndex + 1 : 0} dari {sheets.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWarpedView(!showWarpedView)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold border transition cursor-pointer ${
                    showWarpedView
                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                  title="Tampilkan 4 Titik Anchor Presisi OpenCV"
                >
                  Anchor Grid
                </button>
              </div>
            </div>

            {/* Active Sheet Display */}
            {activeSheet ? (
              <div className="relative aspect-[3/4] bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                <img
                  src={activeSheet.dataUrl}
                  alt={`Lembar ${activeSheet.pageNumber}`}
                  className="max-w-full max-h-full object-contain rounded shadow-xs"
                />

                {/* Perspective Corner Overlay Simulation */}
                {showWarpedView && (
                  <div className="absolute inset-4 pointer-events-none border border-teal-500/40 rounded">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-teal-600"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-teal-600"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-teal-600"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-teal-600"></div>
                    <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-teal-500/20"></div>
                    <div className="absolute inset-y-0 left-1/2 border-r border-dashed border-teal-500/20"></div>
                  </div>
                )}

                {/* Status Overlay Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/95 border border-slate-300 rounded-lg text-[11px] font-mono font-bold text-slate-800 shadow-xs">
                  <span>Lembar #{activeSheet.pageNumber}</span>
                  {activeSheet.result && (
                    <span className="text-teal-700 font-bold">
                      &bull; {activeSheet.result.studentName}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Blank State */
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] bg-slate-50 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl flex flex-col items-center justify-center text-center p-6 cursor-pointer transition space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Tarik &amp; Lepaskan Berkas PDF 1 Kelas di Sini
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Mendukung PDF multi-halaman (hingga 32 lembar siswa) atau beberapa file gambar LJK sekaligus.
                  </p>
                </div>
                <button className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition shadow-xs">
                  Pilih Berkas Komputer
                </button>
              </div>
            )}

            {/* Quick trigger */}
            {activeSheet && !isProcessing && (
              <button
                onClick={handleStartBatchProcessing}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-teal-800 border border-teal-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Koreksi Ulang Antrean ({sheets.length} Lembar Siswa)</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Class Results Table & Individual Student Inspector */}
        <div className="lg:col-span-7 space-y-6">
          {completedSheets.length > 0 ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Class Summary Statistics Cards */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Rekapitulasi Penilaian 1 Kelas
                    </span>
                    <h3 className="text-lg font-black text-slate-900">
                      {activeExam?.title} &bull; {activeExam?.class_name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportExcel}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Excel (.xlsx)</span>
                    </button>
                    <button
                      id="print-omr-recap-btn"
                      onClick={handlePrintSummary}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      title="Cetak format cetak resmi rekapitulasi nilai 1 kelas A4"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Rekap Nilai</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Total Diperiksa
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      {totalCompleted}{' '}
                      <span className="text-xs text-slate-400 font-normal">/ {sheets.length}</span>
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Rata-Rata Kelas
                    </span>
                    <span className="text-2xl font-black text-teal-700">{averageScore}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Tuntas / Lulus
                    </span>
                    <span className="text-2xl font-black text-emerald-700">{totalPassed}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[11px] font-semibold text-slate-500 block">Remedial</span>
                    <span className="text-2xl font-black text-rose-700">{totalRemedial}</span>
                  </div>
                </div>
              </div>

              {/* Class Results Table with Search & Filters */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">Daftar Nilai Siswa</h4>
                    <span className="text-xs text-slate-500 font-mono">
                      ({filteredCompletedSheets.length} Data)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Cari siswa / absen..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 w-44"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e: any) => setStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    >
                      <option value="all">Semua Status</option>
                      <option value="Lulus">Tuntas (Lulus)</option>
                      <option value="Remedial">Remedial</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 font-bold sticky top-0 bg-slate-50 z-10">
                        <th className="py-2.5 px-3">Absen</th>
                        <th className="py-2.5 px-3">Nama Siswa (Pindai LJK)</th>
                        <th className="py-2.5 px-3">Kelas</th>
                        <th className="py-2.5 px-3 text-center">Nilai</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCompletedSheets.map((item) => {
                        const res = item.result;
                        const isInspected = inspectedResult?.resultId === res.resultId;

                        return (
                          <tr
                            key={res.resultId}
                            onClick={() => setInspectedResult(res)}
                            className={`transition hover:bg-slate-50 cursor-pointer ${
                              isInspected ? 'bg-teal-50/60 font-medium' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-teal-700">
                              {res.studentIdNumber || '-'}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {res.studentName}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{res.className}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-black text-slate-900 text-sm">
                                {res.totalScore}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                ({res.percentage}%)
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  res.status === 'Lulus'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}
                              >
                                {res.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectedResult(res);
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-teal-800 border border-slate-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Detail</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inspected Student Detail Breakdown */}
              {inspectedResult && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        Rincian Hasil Lembar Siswa
                      </span>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>{inspectedResult.studentName}</span>
                        <span className="text-xs text-slate-500 font-normal">
                          (No. Absen: {inspectedResult.studentIdNumber})
                        </span>
                      </h3>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        inspectedResult.status === 'Lulus'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {inspectedResult.status === 'Lulus' ? 'TUNTAS (LULUS)' : 'REMEDIAL'}
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {inspectedResult.details?.map(
                      (item: QuestionEvaluationDetail, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs transition ${
                            item.isCorrect
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-rose-50/50 border-rose-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start space-x-2.5">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] mt-0.5 text-white ${
                                  item.isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                                }`}
                              >
                                {item.questionNumber}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {item.questionText || `Soal Nomor ${item.questionNumber}`}
                                </p>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  Jawaban Siswa:{' '}
                                  <b className="text-slate-900 font-mono">
                                    {typeof item.studentAnswer === 'object'
                                      ? JSON.stringify(item.studentAnswer)
                                      : String(item.studentAnswer || '(Kosong)')}
                                  </b>{' '}
                                  &bull; Kunci:{' '}
                                  <b className="text-teal-700 font-mono">
                                    {typeof item.correctAnswerKey === 'object'
                                      ? JSON.stringify(item.correctAnswerKey)
                                      : String(item.correctAnswerKey)}
                                  </b>
                                </p>
                                {item.questionType === 'short_answer' && item.aiFeedback && (
                                  <div className="mt-1.5 p-2 bg-teal-50 border border-teal-200 rounded-lg text-[11px] text-teal-800 flex items-start gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                                    <span>{item.aiFeedback}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <span
                              className={`font-black text-xs ${
                                item.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              +{item.scoreEarned}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Blank state waiting for scan */
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[420px] space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shadow-xs">
                <Users className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-bold text-slate-900">
                  Siap Memeriksa 1 Kelas (32 Lembar Siswa)
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Unggah berkas PDF hasil scan mesin scanner/fotokopi sekolah (berisi hingga 32 halaman LJK siswa) untuk memulai evaluasi otomatis.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left max-w-md text-xs space-y-2 text-slate-700">
                <p className="font-bold text-slate-900">Fitur Siap Pakai Pemeriksa OMR:</p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0"></span>
                  <span><b>Dukungan PDF 32 Lembar</b>: Membaca dan merender seluruh halaman 1 kelas sekaligus.</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0"></span>
                  <span><b>Tanpa Input Manual</b>: Kolom nama siswa, nomor absen, dan kelas dipindai langsung dari lembar LJK.</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0"></span>
                  <span><b>Koreksi Cermat Tiap Siswa</b>: Deteksi otomatis pilihan ganda, PGK, B/S, menjodohkan, dan AI Vision isian tulisan tangan.</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0"></span>
                  <span><b>Cetak &amp; Ekspor Excel</b>: Cetak langsung rekapitulasi nilai 1 kelas siap tanda tangan atau unduh file .xlsx.</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
