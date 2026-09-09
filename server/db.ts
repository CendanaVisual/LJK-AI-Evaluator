import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_Gosd9XVI1cTB@ep-square-waterfall-b38o9f42-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function testConnection(): Promise<{ ok: boolean; timestamp?: string; error?: string }> {
  try {
    const res = await pool.query('SELECT NOW() as current_time');
    return { ok: true, timestamp: res.rows[0]?.current_time };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Database connection error' };
  }
}

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    // Auto-migrate if legacy uuid schema exists
    const checkLegacy = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'id';
    `);
    if (checkLegacy.rows.length > 0 && checkLegacy.rows[0].data_type === 'uuid') {
      console.log('Legacy uuid schema detected, migrating to relational serial schema...');
      await client.query('DROP TABLE IF EXISTS student_answers, exam_results, questions, exams, users CASCADE;');
    }

    await client.query(`
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
      );
    `);

    // Check if sample exam exists; if not, seed default exam with all 5 question types
    const checkExam = await client.query('SELECT id FROM exams LIMIT 1');
    if (checkExam.rows.length === 0) {
      const examRes = await client.query(`
        INSERT INTO exams (title, code, subject, class_name, academic_year, total_questions, passing_score, description)
        VALUES (
          'Asesmen Sumatif IPA & Sains Terpadu',
          'EXAM-IPA-2025',
          'Ilmu Pengetahuan Alam',
          'Kelas VIII A',
          '2024/2025 Semester 2',
          10,
          75.0,
          'Ujian terpadu mencakup Pilihan Ganda, PG Kompleks, Benar/Salah, Menjodohkan, dan Isian Singkat berbasis AI OCR.'
        ) RETURNING id;
      `);
      const examId = examRes.rows[0].id;

      // Seed 10 sample questions representing all 5 types
      const seedQuestions = [
        // 1. Pilihan Ganda (Single Choice)
        {
          num: 1,
          type: 'single_choice',
          text: 'Bagian sel tumbuhan yang berfungsi sebagai tempat terjadinya fotosintesis adalah...',
          key: 'C',
          weight: 10,
          options: ['Mitokondria', 'Ribosom', 'Kloroplas', 'Badan Golgi'],
        },
        {
          num: 2,
          type: 'single_choice',
          text: 'Zat yang dihasilkan dari proses fotosintesis yang dibutuhkan makhluk hidup adalah...',
          key: 'A',
          weight: 10,
          options: ['Oksigen & Glukosa', 'Karbon Dioksida', 'Nitrogen', 'Metana'],
        },
        {
          num: 3,
          type: 'single_choice',
          text: 'Satuan internasional (SI) untuk besaran kuat arus listrik adalah...',
          key: 'B',
          weight: 10,
          options: ['Volt', 'Ampere', 'Ohm', 'Watt'],
        },
        // 2. Pilihan Ganda Kompleks (Multi Choice)
        {
          num: 4,
          type: 'multi_choice',
          text: 'Manakah dari pernyataan berikut yang merupakan komponen penyusun darah manusia? (Pilih lebih dari satu)',
          key: ['A', 'C', 'D'],
          weight: 10,
          options: ['Eritrosit (Sel darah merah)', 'Klorofil', 'Leukosit (Sel darah putih)', 'Trombosit (Keping darah)'],
        },
        {
          num: 5,
          type: 'multi_choice',
          text: 'Pilihlah sumber energi alternatif yang ramah lingkungan dan dapat diperbarui:',
          key: ['A', 'B', 'D'],
          weight: 10,
          options: ['Energi Surya (Matahari)', 'Energi Angin (Bayu)', 'Batu Bara', 'Energi Panas Bumi (Geotermal)'],
        },
        // 3. Pernyataan Benar/Salah (True/False)
        {
          num: 6,
          type: 'true_false',
          text: 'Tentukan Benar (B) atau Salah (S) untuk pernyataan: "Bunyi dapat merambat melalui ruang hampa udara."',
          key: 'S',
          weight: 10,
          options: ['Pernyataan 1: Bunyi merambat di ruang hampa'],
        },
        {
          num: 7,
          type: 'true_false',
          text: 'Tentukan Benar (B) atau Salah (S) untuk pernyataan: "Bumi mengitari matahari menyebabkan pergantian musim."',
          key: 'B',
          weight: 10,
          options: ['Pernyataan 2: Revolusi bumi menyebabkan musim'],
        },
        // 4. Menjodohkan (Matching)
        {
          num: 8,
          type: 'matching',
          text: 'Jodohkan organ ekskresi dengan zat sisa yang dikeluarkannya: 1. Ginjal, 2. Paru-paru, 3. Kulit',
          key: { '1': 'C', '2': 'A', '3': 'B' },
          weight: 15,
          options: ['A. Karbon dioksida & Uap air', 'B. Keringat & Garam', 'C. Urine & Urea'],
        },
        // 5. Isian Singkat (AI Vision Handwriting OCR)
        {
          num: 9,
          type: 'short_answer',
          text: 'Sebutkan pigmen hijau daun yang berfungsi menangkap energi cahaya matahari!',
          key: {
            accepted_answers: ['klorofil', 'chlorophyll', 'zat hijau daun'],
            keywords: ['klorofil', 'chlorophyll'],
            max_score: 12.5,
          },
          weight: 12.5,
          options: ['Area Kotak Tulisan Tangan Maksimal 15 Karakter'],
        },
        {
          num: 10,
          type: 'short_answer',
          text: 'Apa nama gaya tarik menarik antar partikel yang sejenis?',
          key: {
            accepted_answers: ['kohesi', 'gaya kohesi'],
            keywords: ['kohesi'],
            max_score: 12.5,
          },
          weight: 12.5,
          options: ['Area Kotak Tulisan Tangan Maksimal 15 Karakter'],
        },
      ];

      for (const q of seedQuestions) {
        await client.query(
          `
          INSERT INTO questions (exam_id, question_number, question_type, question_text, answer_key, weight, options)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
          [examId, q.num, q.type, q.text, JSON.stringify(q.key), q.weight, JSON.stringify(q.options)]
        );
      }

      // Also seed 3 sample student results so the dashboard displays realistic analytics immediately!
      const students = [
        { name: 'Ahmad Fauzi', nis: '20240801', class: 'Kelas VIII A', score: 95.0, status: 'Lulus' },
        { name: 'Siti Nurhaliza', nis: '20240802', class: 'Kelas VIII A', score: 87.5, status: 'Lulus' },
        { name: 'Budi Pratama', nis: '20240803', class: 'Kelas VIII A', score: 65.0, status: 'Remedial' },
        { name: 'Dewi Lestari', nis: '20240804', class: 'Kelas VIII A', score: 90.0, status: 'Lulus' },
        { name: 'Rehan Saputra', nis: '20240805', class: 'Kelas VIII A', score: 72.5, status: 'Remedial' },
      ];

      for (const st of students) {
        await client.query(
          `
          INSERT INTO exam_results (exam_id, student_name, student_id_number, class_name, total_score, max_possible_score, percentage, status, omr_confidence, raw_details)
          VALUES ($1, $2, $3, $4, $5, 100.0, $5, $6, 98.4, $7)
        `,
          [
            examId,
            st.name,
            st.nis,
            st.class,
            st.score,
            st.status,
            JSON.stringify({
              notes: 'Hasil pemindaian LJK OMR dengan deteksi 4 titik anchor & AI OCR',
              confidence: 98.4,
            }),
          ]
        );
      }
    }
  } finally {
    client.release();
  }
}
