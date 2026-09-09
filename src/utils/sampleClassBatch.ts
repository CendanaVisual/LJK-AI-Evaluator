import { Exam } from '../types';

export interface ClassSheetItem {
  pageNumber: number;
  dataUrl: string;
  studentName: string;
  studentAbsen: string;
  className: string;
}

export const CLASS_ROSTER_32 = [
  { absen: '01', name: 'Anak Agung Gede Wira Pratama' },
  { absen: '02', name: 'Ahmad Fauzi Rahman' },
  { absen: '03', name: 'Aisyah Putri Azzahra' },
  { absen: '04', name: 'Bagus Arya Kusuma' },
  { absen: '05', name: 'Cahya Ramadhani' },
  { absen: '06', name: 'Dewa Ayu Made Saraswati' },
  { absen: '07', name: 'Dimas Aditya Nugraha' },
  { absen: '08', name: 'Fadhil Ihsan Pratama' },
  { absen: '09', name: 'Gede Raditya Mahendra' },
  { absen: '10', name: 'Hafiz Al Ghifari' },
  { absen: '11', name: 'I Kadek Yoga Saputra' },
  { absen: '12', name: 'I Made Arta Dharmawan' },
  { absen: '13', name: 'I Putu Daffa Satria' },
  { absen: '14', name: 'Intan Nuraini' },
  { absen: '15', name: 'Kadek Dwi Lestari' },
  { absen: '16', name: 'Kevin Christian Wijaya' },
  { absen: '17', name: 'Komang Ayu Gayatri' },
  { absen: '18', name: 'Latifah Nur Rahmah' },
  { absen: '19', name: 'Made Bayu Anggara' },
  { absen: '20', name: 'Muhammad Rizky Pratama' },
  { absen: '21', name: 'Nabila Syakira' },
  { absen: '22', name: 'Ni Kadek Sintya Dewi' },
  { absen: '23', name: 'Ni Made Anggun Kirana' },
  { absen: '24', name: 'Ni Putu Cantika Putri' },
  { absen: '25', name: 'Nyoman Tri Astawa' },
  { absen: '26', name: 'Putu Bagus Dananjaya' },
  { absen: '27', name: 'Rafa Raihan Hidayat' },
  { absen: '28', name: 'Ratu Ayu Cantika' },
  { absen: '29', name: 'Rizka Amanda Sari' },
  { absen: '30', name: 'Syifa Nur Salsabila' },
  { absen: '31', name: 'Wayan Krisna Murti' },
  { absen: '32', name: 'Zahra Aulia Wardani' },
];

/**
 * Generates a realistic simulated LJK sheet image for a student in a class batch.
 */
export function generateSingleStudentLjkImage(
  student: { absen: string; name: string },
  exam: Exam,
  pageNumber: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1414; // A4 aspect ratio
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background Paper (Clean white with subtle realistic paper tone)
  ctx.fillStyle = '#fcfcfd';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 4 Black Corner Alignment Markers for OMR Perspective
  ctx.fillStyle = '#111827';
  const markerSize = 42;
  ctx.fillRect(40, 40, markerSize, markerSize); // Top-Left
  ctx.fillRect(1000 - 40 - markerSize, 40, markerSize, markerSize); // Top-Right
  ctx.fillRect(40, 1414 - 40 - markerSize, markerSize, markerSize); // Bottom-Left
  ctx.fillRect(1000 - 40 - markerSize, 1414 - 40 - markerSize, markerSize, markerSize); // Bottom-Right

  // Header Border & School Title
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(100, 40, 800, 160);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LEMBAR JAWABAN KOMPUTER (LJK) DIGITAL', 500, 75);

  ctx.font = '600 15px sans-serif';
  ctx.fillText('SD NEGERI 7 PEDUNGAN • KEC. DENPASAR SELATAN', 500, 102);

  ctx.font = '13px sans-serif';
  ctx.fillText(`Mata Pelajaran: ${exam.subject} | ${exam.title} (${exam.academic_year || '2026/2027'})`, 500, 125);

  // Student Identity Box (Directly in LJK)
  ctx.strokeRect(100, 215, 800, 120);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(101, 216, 798, 118);

  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('KOLOM IDENTITAS PESERTA DIDIK:', 120, 240);

  ctx.font = '13px sans-serif';
  ctx.fillText('NAMA SISWA  :', 120, 270);
  ctx.fillText('NOMOR ABSEN :', 120, 295);
  ctx.fillText('KELAS       :', 120, 320);

  // Handwritten / Filled Identity directly on LJK
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(student.name.toUpperCase(), 230, 270);
  ctx.fillText(student.absen, 230, 295);
  ctx.fillText(`${exam.class_name || 'VI A'} (SDN 7 Pedungan)`, 230, 320);

  // Watermark / Page Indicator
  ctx.fillStyle = '#64748b';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Lembar ${pageNumber} dari 32 | ID Ujian: ${exam.code || 'EXAM-2026'}`, 880, 240);

  // Divider Line
  ctx.strokeStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(100, 350);
  ctx.lineTo(900, 350);
  ctx.stroke();

  // Answer Section Title
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('BAGIAN I: LEMBAR ISIAN JAWABAN SISWA (PILIHAN GANDA, B/S, MENJODOHKAN)', 100, 380);

  // Draw 10 question bubble rows
  const questionsTotal = Math.min(10, exam.total_questions || 10);
  let yPos = 410;

  for (let q = 1; q <= questionsTotal; q++) {
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Nomor ${q}.`, 110, yPos + 18);

    if (q <= 5) {
      // Single choice bubbles: A, B, C, D
      const options = ['A', 'B', 'C', 'D'];
      const markedIdx = (pageNumber + q) % 4; // realistic variety

      options.forEach((opt, idx) => {
        const xBubble = 240 + idx * 55;
        const yBubble = yPos + 14;

        ctx.beginPath();
        ctx.arc(xBubble, yBubble, 14, 0, Math.PI * 2);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Check if marked
        if (idx === markedIdx) {
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(xBubble, yBubble, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(opt, xBubble, yBubble + 4);
        } else {
          ctx.fillStyle = '#475569';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(opt, xBubble, yBubble + 4);
        }
      });
    } else if (q <= 7) {
      // Multi-choice bubbles (Pilihan Ganda Kompleks)
      const options = ['A', 'B', 'C', 'D'];
      options.forEach((opt, idx) => {
        const xBubble = 240 + idx * 55;
        const yBubble = yPos + 14;
        const isMarked = (idx === 0 || idx === 2); // A & C marked

        ctx.strokeStyle = '#0284c7';
        ctx.strokeRect(xBubble - 12, yBubble - 12, 24, 24);

        if (isMarked) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(xBubble - 10, yBubble - 10, 20, 20);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(opt, xBubble, yBubble + 4);
        } else {
          ctx.fillStyle = '#0284c7';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(opt, xBubble, yBubble + 4);
        }
      });
    } else if (q === 8) {
      // Benar / Salah
      const options = ['B', 'S'];
      options.forEach((opt, idx) => {
        const xBubble = 240 + idx * 75;
        const yBubble = yPos + 14;
        const isMarked = idx === 0; // Benar

        ctx.beginPath();
        ctx.arc(xBubble, yBubble, 14, 0, Math.PI * 2);
        ctx.strokeStyle = '#10b981';
        ctx.stroke();

        if (isMarked) {
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(xBubble, yBubble, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = '#10b981';
        }
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(opt === 'B' ? 'BENAR' : 'SALAH', xBubble, yBubble + 4);
      });
    } else {
      // Isian Singkat Handwriting Box (Question 9 & 10)
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(230, yPos - 2, 420, 34);

      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(231, yPos - 1, 418, 32);

      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'italic bold 14px "Comic Sans MS", cursive, sans-serif';
      ctx.textAlign = 'left';
      const sampleAnswer = q === 9 ? 'klorofil' : 'fotosintesis';
      ctx.fillText(sampleAnswer, 245, yPos + 20);

      ctx.fillStyle = '#6366f1';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('[KOTAK TULISAN TANGAN AI OCR]', 640, yPos + 20);
    }

    yPos += 45;
  }

  // Footer / Verification QR Simulation
  ctx.fillStyle = '#334155';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SMARTLJK AI • SISTEM OMR DAN VISION EVALUATOR SDN 7 PEDUNGAN', 500, 1340);
  ctx.fillText('Generated for Automatic Classroom Batch Scanning (32 Students)', 500, 1360);

  return canvas.toDataURL('image/jpeg', 0.88);
}

/**
 * Generates an entire 32-student class batch of LJK sheet images.
 */
export function generate32StudentClassBatch(exam: Exam): ClassSheetItem[] {
  return CLASS_ROSTER_32.map((student, idx) => {
    const pageNumber = idx + 1;
    const dataUrl = generateSingleStudentLjkImage(student, exam, pageNumber);
    return {
      pageNumber,
      dataUrl,
      studentName: student.name,
      studentAbsen: student.absen,
      className: exam.class_name || 'VI A',
    };
  });
}
