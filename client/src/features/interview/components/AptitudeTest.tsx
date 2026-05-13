import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import { Clock, CheckCircle2, XCircle, AlertTriangle, ChevronRight, BookOpen } from 'lucide-react';

interface OTDBQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  category: string;
  difficulty: string;
  type: string;
}

interface AptitudeTestProps {
  interviewId: string;
  onComplete: () => void;
  questionCount?: number;
  timeLimit?: number; // in seconds, 0 = no limit
}

// Decode HTML entities from Open Trivia DB responses
function decodeHTML(str: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

// Shuffle an array (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  hard: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export const AptitudeTest = ({
  interviewId,
  onComplete,
  questionCount = 20,
  timeLimit = 1200, // 20 minutes default
}: AptitudeTestProps) => {
  const [questions, setQuestions] = useState<OTDBQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch questions from Open Trivia DB
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Mix of categories: General Knowledge (9), Science (17), Math (19), Computers (18)
      const categories = [9, 17, 19, 18];
      const perCategory = Math.ceil(questionCount / categories.length);

      const results = await Promise.all(
        categories.map(cat =>
          fetch(`https://opentdb.com/api.php?amount=${perCategory}&category=${cat}&type=multiple`)
            .then(r => r.json())
        )
      );

      const allRaw = results.flatMap(r => r.results || []);

      if (allRaw.length === 0) {
        throw new Error('No questions received from API');
      }

      const processed: OTDBQuestion[] = allRaw
        .slice(0, questionCount)
        .map((q: any, i: number) => ({
          id: i + 1,
          question: decodeHTML(q.question),
          options: shuffle([q.correct_answer, ...q.incorrect_answers].map(decodeHTML)),
          correct_answer: decodeHTML(q.correct_answer),
          category: decodeHTML(q.category),
          difficulty: q.difficulty,
          type: q.type,
        }));

      setQuestions(processed);
    } catch (err) {
      setError('Failed to load questions. Using offline bank instead.');
      // Fallback to a small offline set
      setQuestions(OFFLINE_FALLBACK.slice(0, questionCount));
    } finally {
      setLoading(false);
    }
  }, [questionCount]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  // ── Countdown timer
  useEffect(() => {
    if (loading || submitted || timeLimit === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [loading, submitted]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSelect = (questionId: number, option: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && Object.keys(answers).length < questions.length) {
      if (!window.confirm(`You have answered ${Object.keys(answers).length} of ${questions.length} questions. Submit anyway?`)) {
        return;
      }
    }
    clearInterval(timerRef.current!);
    setSubmitting(true);

    try {
      let score = 0;
      questions.forEach(q => {
        if (answers[q.id] === q.correct_answer) score++;
      });

      await api.post(`/interviews/${interviewId}/aptitude-result`, {
        score,
        total: questions.length,
        answers,
      });

      setResult({ score, total: questions.length });
      setSubmitted(true);
      onComplete();
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-[#f8fafc]">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 animate-pulse">
          <BookOpen size={28} className="text-blue-600" />
        </div>
        <p className="text-lg font-black text-slate-900 mb-1">Loading Assessment</p>
        <p className="text-sm text-slate-400 font-medium">Fetching {questionCount} questions from question bank...</p>
        <div className="mt-6 flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state
  if (error && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-[#f8fafc] text-center">
        <AlertTriangle size={40} className="text-amber-500 mb-4" />
        <p className="font-bold text-slate-900 mb-2">{error}</p>
        <button onClick={fetchQuestions} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl mt-4">Try Again</button>
      </div>
    );
  }

  // ── Submitted / Result state
  if (submitted && result) {
    const pct = Math.round((result.score / result.total) * 100);
    const passed = pct >= 60;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-[#f8fafc]">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${passed ? 'bg-emerald-100' : 'bg-red-100'}`}>
          {passed
            ? <CheckCircle2 size={44} className="text-emerald-600" />
            : <XCircle size={44} className="text-red-500" />}
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-1">{pct}%</h2>
        <p className={`text-lg font-bold mb-2 ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
          {passed ? 'Assessment Passed!' : 'Below Threshold'}
        </p>
        <p className="text-slate-500 font-medium">
          You answered <strong>{result.score}</strong> out of <strong>{result.total}</strong> questions correctly.
        </p>
        <p className="text-xs text-slate-400 mt-4">Your results have been submitted to the interviewer.</p>
      </div>
    );
  }

  const q = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const timeWarning = timeLeft <= 120 && timeLimit > 0;

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      {/* ── Top bar: timer + progress ── */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0 gap-4">
        {/* Progress */}
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Timer */}
        {timeLimit > 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-sm shrink-0 ${
            timeWarning ? 'bg-red-50 text-red-500 animate-pulse border border-red-200' : 'bg-slate-100 text-slate-600'
          }`}>
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* ── Question + options ── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Category + difficulty badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{q.category}</span>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${DIFFICULTY_COLOR[q.difficulty] || 'text-slate-400 bg-slate-100 border-slate-200'}`}>
              {q.difficulty}
            </span>
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 leading-relaxed">
              <span className="text-blue-600 font-black mr-2">Q{currentQuestion + 1}.</span>
              {q.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(q.id, opt)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all font-semibold text-sm ${
                    selected
                      ? 'border-blue-500 bg-blue-50 shadow-[0_0_0_2px_rgba(59,130,246,0.3)] text-blue-900'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 text-slate-700'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                    selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {['A', 'B', 'C', 'D'][i]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Navigation footer ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200 shrink-0">
        <button
          onClick={() => setCurrentQuestion(c => Math.max(0, c - 1))}
          disabled={currentQuestion === 0}
          className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        {/* Question dots */}
        <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQuestion(i)}
              className={`w-6 h-6 rounded-md text-[9px] font-black transition-all ${
                i === currentQuestion
                  ? 'bg-blue-600 text-white scale-110'
                  : answers[questions[i]?.id]
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentQuestion < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestion(c => Math.min(questions.length - 1, c + 1))}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 text-sm"
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
            ) : (
              <><CheckCircle2 size={14} /> Submit Assessment</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Offline fallback (used when Open Trivia DB is unavailable) ──
const OFFLINE_FALLBACK: OTDBQuestion[] = [
  { id: 1, question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correct_answer: "O(log n)", category: "Computer Science", difficulty: "medium", type: "multiple" },
  { id: 2, question: "What does RAM stand for?", options: ["Read Access Memory", "Random Access Memory", "Rapid Application Module", "Readable Assigned Memory"], correct_answer: "Random Access Memory", category: "Computers", difficulty: "easy", type: "multiple" },
  { id: 3, question: "What is 15% of 200?", options: ["20", "25", "30", "35"], correct_answer: "30", category: "Mathematics", difficulty: "easy", type: "multiple" },
  { id: 4, question: "Which data structure uses LIFO order?", options: ["Queue", "Stack", "Linked List", "Tree"], correct_answer: "Stack", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 5, question: "What is the square root of 144?", options: ["10", "11", "12", "14"], correct_answer: "12", category: "Mathematics", difficulty: "easy", type: "multiple" },
  { id: 6, question: "In SQL, which command retrieves data from a table?", options: ["GET", "SELECT", "FETCH", "READ"], correct_answer: "SELECT", category: "Computers", difficulty: "easy", type: "multiple" },
  { id: 7, question: "What is 2 to the power of 10?", options: ["512", "1024", "2048", "256"], correct_answer: "1024", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 8, question: "Which sorting algorithm has the best average-case complexity?", options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"], correct_answer: "Merge Sort", category: "Computer Science", difficulty: "hard", type: "multiple" },
  { id: 9, question: "What is the chemical symbol for Gold?", options: ["Gd", "Go", "Au", "Ag"], correct_answer: "Au", category: "Science", difficulty: "easy", type: "multiple" },
  { id: 10, question: "Solve: If 5x - 3 = 22, what is x?", options: ["4", "5", "6", "7"], correct_answer: "5", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 11, question: "Which protocol is used to send emails?", options: ["HTTP", "FTP", "SMTP", "TCP"], correct_answer: "SMTP", category: "Computers", difficulty: "medium", type: "multiple" },
  { id: 12, question: "What is the next prime after 23?", options: ["25", "27", "29", "31"], correct_answer: "29", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 13, question: "What does HTML stand for?", options: ["Hyper Trainer Marking Language", "Hyper Text Markup Language", "High Text Machine Language", "Hyper Transfer Markup Language"], correct_answer: "Hyper Text Markup Language", category: "Computers", difficulty: "easy", type: "multiple" },
  { id: 14, question: "Which planet is farthest from the Sun?", options: ["Saturn", "Uranus", "Jupiter", "Neptune"], correct_answer: "Neptune", category: "Science", difficulty: "easy", type: "multiple" },
  { id: 15, question: "What is the area of a circle with radius 7?", options: ["49π", "14π", "21π", "7π"], correct_answer: "49π", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 16, question: "Which layer of the OSI model handles routing?", options: ["Transport", "Data Link", "Network", "Session"], correct_answer: "Network", category: "Computers", difficulty: "hard", type: "multiple" },
  { id: 17, question: "What is 0.125 as a fraction?", options: ["1/4", "1/8", "1/6", "1/10"], correct_answer: "1/8", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 18, question: "Who invented the World Wide Web?", options: ["Bill Gates", "Vint Cerf", "Tim Berners-Lee", "Steve Jobs"], correct_answer: "Tim Berners-Lee", category: "Computers", difficulty: "easy", type: "multiple" },
  { id: 19, question: "What type of triangle has all sides equal?", options: ["Scalene", "Isosceles", "Equilateral", "Right"], correct_answer: "Equilateral", category: "Mathematics", difficulty: "easy", type: "multiple" },
  { id: 20, question: "What does CPU stand for?", options: ["Central Program Unit", "Coded Processing Unit", "Central Processing Unit", "Core Processor Utility"], correct_answer: "Central Processing Unit", category: "Computers", difficulty: "easy", type: "multiple" },
];
