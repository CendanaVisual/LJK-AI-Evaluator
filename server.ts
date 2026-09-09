import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import QRCode from 'qrcode';
import { pool, initDatabase, testConnection } from './server/db';
import { processOMRSheet } from './server/omr_processor';
import { generateExamExcel } from './server/excel_exporter';
import { evaluateHandwritingWithGemini, SYSTEM_PROMPT_HANDWRITING_OCR } from './server/gemini';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Initialize Neon PostgreSQL Database
  initDatabase().catch((err) => {
    console.error('Database initialization warning:', err.message);
  });

  // -------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // DB Connection status
  app.get('/api/db/status', async (req, res) => {
    const status = await testConnection();
    res.json(status);
  });

  // Get AI Prompt definition
  app.get('/api/ai/system-prompt', (req, res) => {
    res.json({ systemPrompt: SYSTEM_PROMPT_HANDWRITING_OCR });
  });

  // Generate QR Code data URL
  app.post('/api/generate-qr', async (req, res) => {
    try {
      const { text } = req.body;
      const qrDataUrl = await QRCode.toDataURL(text || 'SMARTLJK-EXAM-METADATA', {
        width: 160,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      res.json({ qrDataUrl });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // EXAMS: List
  app.get('/api/exams', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT e.*, 
          COUNT(DISTINCT q.id) as question_count,
          COUNT(DISTINCT r.id) as total_submissions
        FROM exams e
        LEFT JOIN questions q ON q.exam_id = e.id
        LEFT JOIN exam_results r ON r.exam_id = e.id
        GROUP BY e.id
        ORDER BY e.id DESC
      `);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // EXAMS: Get One with Questions
  app.get('/api/exams/:id', async (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      const examRes = await pool.query('SELECT * FROM exams WHERE id = $1', [examId]);
      if (examRes.rows.length === 0) {
        return res.status(404).json({ error: 'Exam not found' });
      }

      const questionsRes = await pool.query(
        'SELECT * FROM questions WHERE exam_id = $1 ORDER BY question_number ASC',
        [examId]
      );

      res.json({
        exam: examRes.rows[0],
        questions: questionsRes.rows,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // EXAMS: Create Exam + Questions
  app.post('/api/exams', async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const {
        title,
        code,
        subject,
        className,
        academicYear = '2024/2025',
        passingScore = 75.0,
        description = '',
        questions = [],
      } = req.body;

      const examInsert = await client.query(
        `
        INSERT INTO exams (title, code, subject, class_name, academic_year, total_questions, passing_score, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
        [title, code, subject, className, academicYear, questions.length, passingScore, description]
      );

      const newExam = examInsert.rows[0];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await client.query(
          `
          INSERT INTO questions (exam_id, question_number, question_type, question_text, answer_key, weight, options)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
          [
            newExam.id,
            q.questionNumber || i + 1,
            q.questionType,
            q.questionText || `Soal No. ${i + 1}`,
            JSON.stringify(q.answerKey),
            q.weight || 10,
            JSON.stringify(q.options || []),
          ]
        );
      }

      await client.query('COMMIT');
      res.status(201).json(newExam);
    } catch (err: any) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // EXAMS: Update Exam
  app.put('/api/exams/:id', async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const examId = parseInt(req.params.id, 10);
      const {
        title,
        code,
        subject,
        className,
        academicYear,
        passingScore,
        description,
        questions = [],
      } = req.body;

      await client.query(
        `
        UPDATE exams
        SET title = $1, code = $2, subject = $3, class_name = $4,
            academic_year = $5, passing_score = $6, description = $7,
            total_questions = $8, updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
      `,
        [title, code, subject, className, academicYear, passingScore, description, questions.length, examId]
      );

      // Re-insert questions
      await client.query('DELETE FROM questions WHERE exam_id = $1', [examId]);
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await client.query(
          `
          INSERT INTO questions (exam_id, question_number, question_type, question_text, answer_key, weight, options)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
          [
            examId,
            q.questionNumber || i + 1,
            q.questionType,
            q.questionText || `Soal No. ${i + 1}`,
            JSON.stringify(q.answerKey),
            q.weight || 10,
            JSON.stringify(q.options || []),
          ]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true, message: 'Exam updated successfully' });
    } catch (err: any) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // EXAMS: Delete Exam
  app.delete('/api/exams/:id', async (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      await pool.query('DELETE FROM exams WHERE id = $1', [examId]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // OMR & AI VISION PROCESSING
  app.post('/api/omr/process', async (req, res) => {
    try {
      const { examId, imageBase64, pageIndex, studentName, studentIdNumber, className, manualCorners } = req.body;
      if (!examId || !imageBase64) {
        return res.status(400).json({ error: 'examId and imageBase64 are required' });
      }

      const result = await processOMRSheet({
        examId: Number(examId),
        imageBase64,
        pageIndex: pageIndex ? Number(pageIndex) : undefined,
        studentName,
        studentIdNumber,
        className,
        manualCorners,
      });

      res.json(result);
    } catch (err: any) {
      console.error('Error processing OMR sheet:', err);
      res.status(500).json({ error: err.message || 'Failed to process sheet' });
    }
  });

  // AI OCR TEST ENDPOINT
  app.post('/api/ai-ocr/test', async (req, res) => {
    try {
      const { imageBase64, questionText, acceptedAnswers, keywords, maxScore } = req.body;
      const result = await evaluateHandwritingWithGemini({
        imageBase64: imageBase64 || '',
        questionNumber: 1,
        questionText: questionText || 'Isian Singkat',
        answerKey: {
          accepted_answers: acceptedAnswers || ['fotosintesis'],
          keywords: keywords || ['fotosintesis'],
          max_score: maxScore || 10,
        },
        maxScore: maxScore || 10,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // RESULTS: List by Exam ID or All
  app.get('/api/results', async (req, res) => {
    try {
      const { examId } = req.query;
      let query = `
        SELECT r.*, e.title as exam_title, e.code as exam_code, e.passing_score
        FROM exam_results r
        JOIN exams e ON e.id = r.exam_id
      `;
      const params: any[] = [];
      if (examId) {
        const parsedExamId = parseInt(examId as string, 10);
        if (!isNaN(parsedExamId)) {
          query += ` WHERE r.exam_id = $1`;
          params.push(parsedExamId);
        }
      }
      query += ` ORDER BY r.id DESC`;

      const results = await pool.query(query, params);
      res.json(results.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // RESULTS: Delete Single Result
  app.delete('/api/results/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await pool.query('DELETE FROM exam_results WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // EXCEL EXPORT
  app.get('/api/results/export/:examId', async (req, res) => {
    try {
      const examId = parseInt(req.params.examId, 10);
      const examRes = await pool.query('SELECT * FROM exams WHERE id = $1', [examId]);
      if (examRes.rows.length === 0) {
        return res.status(404).json({ error: 'Exam not found' });
      }
      const exam = examRes.rows[0];

      const resultsRes = await pool.query(
        'SELECT * FROM exam_results WHERE exam_id = $1 ORDER BY total_score DESC',
        [examId]
      );
      const questionsRes = await pool.query(
        'SELECT * FROM questions WHERE exam_id = $1 ORDER BY question_number ASC',
        [examId]
      );

      const excelBuffer = generateExamExcel({
        exam: {
          title: exam.title,
          code: exam.code,
          subject: exam.subject,
          className: exam.class_name,
          academicYear: exam.academic_year,
          passingScore: Number(exam.passing_score),
        },
        results: resultsRes.rows,
        questions: questionsRes.rows,
      });

      const filename = `Rekap_Nilai_${exam.code}_${Date.now()}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // Vite Integration (Dev Mode & Production Fallback)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartLJK AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
