-- =========================================================
-- SKEMA DATABASE POSTGRESQL (NEON DB) - SMARTLJK AI
-- Mendukung 5 Tipe Soal: Single Choice, Multi Choice,
-- Benar/Salah, Menjodohkan (Matching), dan Isian Singkat
-- =========================================================

-- 1. Tabel Users (Guru & Pengawas)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'teacher',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Exams (Daftar Ujian)
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

-- 3. Tabel Questions (Mendukung 5 Tipe Soal & Kunci Jawaban Fleksibel JSONB)
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_type VARCHAR(50) NOT NULL, 
    -- Nilai yang valid: 'single_choice', 'multi_choice', 'true_false', 'matching', 'short_answer'
    question_text TEXT,
    answer_key JSONB NOT NULL,
    -- Format answer_key:
    -- single_choice: "C"
    -- multi_choice : ["A", "C", "D"]
    -- true_false   : "B" atau "S"
    -- matching     : {"1": "B", "2": "A", "3": "C"}
    -- short_answer : {"accepted_answers": ["klorofil", "zat hijau daun"], "keywords": ["klorofil"], "max_score": 10}
    weight NUMERIC(5,2) DEFAULT 1.0,
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Exam Results (Hasil Penilaian Siswa per Lembar)
CREATE TABLE IF NOT EXISTS exam_results (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_name VARCHAR(150) NOT NULL,
    student_id_number VARCHAR(50) NOT NULL,
    class_name VARCHAR(100),
    total_score NUMERIC(6,2) DEFAULT 0.0,
    max_possible_score NUMERIC(6,2) DEFAULT 100.0,
    percentage NUMERIC(5,2) DEFAULT 0.0,
    status VARCHAR(20) DEFAULT 'Lulus', -- 'Lulus', 'Remedial'
    scan_image_url TEXT,
    omr_confidence NUMERIC(5,2) DEFAULT 0.0,
    raw_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Student Answers (Rincian Jawaban Siswa per Butir Soal)
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

-- Indexing untuk performa kueri analitik
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_result_id ON student_answers(result_id);
