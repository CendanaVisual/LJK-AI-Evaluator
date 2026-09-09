import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LjkGenerator } from './components/LjkGenerator';
import { OmrScanner } from './components/OmrScanner';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TechnicalDocs } from './components/TechnicalDocs';
import { ActiveTab, Exam } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generator');
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number>(1);
  const [loadingExams, setLoadingExams] = useState<boolean>(true);

  // Preloaded simulation data for scanner
  const [preloadedImage, setPreloadedImage] = useState<string | undefined>(undefined);
  const [preloadedStudent, setPreloadedStudent] = useState<string | undefined>(undefined);
  const [preloadedNis, setPreloadedNis] = useState<string | undefined>(undefined);

  // Load exams from database
  const loadExams = async () => {
    try {
      setLoadingExams(true);
      const res = await fetch('/api/exams');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setExams(data);
          if (data.length > 0 && (!selectedExamId || !data.some((e: Exam) => e.id === selectedExamId))) {
            setSelectedExamId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleExamSaved = (savedId: number) => {
    loadExams();
    setSelectedExamId(savedId);
  };

  const handleSimulateScan = (imageB64: string, studentName: string, nis: string) => {
    setPreloadedImage(imageB64);
    setPreloadedStudent(studentName);
    setPreloadedNis(nis);
    setActiveTab('scanner');
  };

  const currentExam = exams.find((e) => e.id === selectedExamId) || null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickPrint={() => {
          if (activeTab !== 'generator') {
            setActiveTab('generator');
            setTimeout(() => {
              document.getElementById('print-ljk-btn')?.click();
            }, 250);
          } else {
            document.getElementById('print-ljk-btn')?.click();
          }
        }}
      />

      {/* Main Content Area based on Tab */}
      <main className="flex-1 pb-16">
        {activeTab === 'generator' && (
          <LjkGenerator
            currentExam={currentExam}
            onExamSaved={handleExamSaved}
          />
        )}

        {activeTab === 'scanner' && (
          <OmrScanner
            exams={exams}
            selectedExamId={selectedExamId}
            onSelectExamId={setSelectedExamId}
            preloadedImageBase64={preloadedImage}
            preloadedStudentName={preloadedStudent}
            preloadedNis={preloadedNis}
            onScanSaved={() => {
              loadExams();
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <TeacherDashboard
            exams={exams}
            selectedExamId={selectedExamId}
            onSelectExamId={setSelectedExamId}
          />
        )}

        {activeTab === 'docs' && <TechnicalDocs />}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-600">
            SmartLJK AI &bull; SD NEGERI 7 PEDUNGAN &bull; Optical Mark Recognition &amp; AI Vision Evaluator
          </p>
          <p className="text-slate-400">
            Database Serverless Neon PostgreSQL &bull; OpenCV Perspective Transform Engine
          </p>
        </div>
      </footer>
    </div>
  );
}
