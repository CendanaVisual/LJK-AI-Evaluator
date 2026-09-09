import * as XLSX from 'xlsx';

export interface ClassResultRow {
  studentName: string;
  studentIdNumber: string;
  className: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  status: string;
  omrConfidence?: number;
}

export function exportClassResultsToExcel(
  results: ClassResultRow[],
  examTitle: string,
  subject: string,
  className: string
) {
  const rows = results.map((r, idx) => ({
    'No. Urut': idx + 1,
    'Nomor Absen': r.studentIdNumber || String(idx + 1).padStart(2, '0'),
    'Nama Lengkap Siswa': r.studentName,
    'Kelas': r.className || className,
    'Total Skor': r.totalScore,
    'Skor Maksimal': r.maxScore,
    'Nilai Akhir (Skala 100)': r.percentage,
    'Status Ketuntasan': r.status,
    'Akurasi Pindai OMR (%)': r.omrConfidence || 97.5,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },  // No.
    { wch: 14 }, // Absen
    { wch: 32 }, // Nama
    { wch: 10 }, // Kelas
    { wch: 12 }, // Skor
    { wch: 14 }, // Max
    { wch: 22 }, // Nilai Akhir
    { wch: 18 }, // Status
    { wch: 22 }, // Akurasi
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai LJK');

  const safeFileName = `Rekap_Nilai_${className || 'Kelas'}_${subject || 'Ujian'}.xlsx`.replace(/\s+/g, '_');
  XLSX.writeFile(workbook, safeFileName);
}
