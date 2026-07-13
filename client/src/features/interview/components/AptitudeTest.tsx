import { useState, useEffect, useRef } from 'react';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import { Clock, CheckCircle2, XCircle, ChevronRight, BookOpen } from 'lucide-react';

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
  medium: 'text-emerald-400 bg-emerald-50 border-emerald-200',
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
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleSubmitRef = useRef<((autoSubmit?: boolean) => void) | null>(null);

  useEffect(() => {
    const picked = shuffle(QUESTION_BANK).slice(0, questionCount);
    setQuestions(picked.map((q, i) => ({ ...q, id: i + 1 })));
    setLoading(false);
  }, [questionCount]);

  useEffect(() => {
    if (loading || submitted || timeLimit === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitRef.current?.(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [loading, submitted]);

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

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-[#f8fafc]">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 animate-pulse">
          <BookOpen size={28} className="text-blue-600" />
        </div>
        <p className="text-sm text-stone-400 font-medium">Preparing assessment...</p>
      </div>
    );
  }

  // â”€â”€ Submitted / Result state
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
        <h2 className="text-3xl font-black text-stone-900 mb-1">{pct}%</h2>
        <p className={`text-lg font-bold mb-2 ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
          {passed ? 'Assessment Passed!' : 'Below Threshold'}
        </p>
        <p className="text-stone-500 font-medium">
          You answered <strong>{result.score}</strong> out of <strong>{result.total}</strong> questions correctly.
        </p>
        <p className="text-xs text-stone-400 mt-4">Your results have been submitted to the interviewer.</p>
      </div>
    );
  }

  const q = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const timeWarning = timeLeft <= 120 && timeLimit > 0;

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      {/* â”€â”€ Top bar: timer + progress â”€â”€ */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-stone-200 shrink-0 gap-4">
        {/* Progress */}
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1.5">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Timer */}
        {timeLimit > 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-sm shrink-0 ${
            timeWarning ? 'bg-red-50 text-red-500 animate-pulse border border-red-200' : 'bg-stone-100 text-stone-600'
          }`}>
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* â”€â”€ Question + options â”€â”€ */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Category + difficulty badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{q.category}</span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${DIFFICULTY_COLOR[q.difficulty] || 'text-stone-400 bg-stone-100 border-stone-200'}`}>
              {q.difficulty}
            </span>
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-5 shadow-sm">
            <h3 className="text-base font-bold text-stone-900 leading-relaxed">
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
                      : 'border-stone-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 text-stone-700'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                    selected ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-500'
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

      {/* â”€â”€ Navigation footer â”€â”€ */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-stone-200 shrink-0">
        <button
          onClick={() => setCurrentQuestion(c => Math.max(0, c - 1))}
          disabled={currentQuestion === 0}
          className="px-4 py-2 text-sm font-bold text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          â† Previous
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
                  : 'bg-stone-200 text-stone-500 hover:bg-stone-300'
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
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-black rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 text-sm"
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

const QUESTION_BANK: OTDBQuestion[] = [
  // ── Computer Science ───────────────────────────────────────────────────────
  { id: 1,  question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correct_answer: "O(log n)", category: "Computer Science", difficulty: "medium", type: "multiple" },
  { id: 2,  question: "What does RAM stand for?", options: ["Read Access Memory", "Random Access Memory", "Rapid Application Module", "Readable Assigned Memory"], correct_answer: "Random Access Memory", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 3,  question: "Which data structure uses LIFO order?", options: ["Queue", "Stack", "Linked List", "Tree"], correct_answer: "Stack", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 4,  question: "Which sorting algorithm has the best average-case time complexity?", options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"], correct_answer: "Merge Sort", category: "Computer Science", difficulty: "medium", type: "multiple" },
  { id: 5,  question: "What does CPU stand for?", options: ["Central Program Unit", "Coded Processing Unit", "Central Processing Unit", "Core Processor Utility"], correct_answer: "Central Processing Unit", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 6,  question: "Which layer of the OSI model handles routing?", options: ["Transport", "Data Link", "Network", "Session"], correct_answer: "Network", category: "Computer Science", difficulty: "hard", type: "multiple" },
  { id: 7,  question: "What is the time complexity of inserting into a hash table (average case)?", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], correct_answer: "O(1)", category: "Computer Science", difficulty: "medium", type: "multiple" },
  { id: 8,  question: "Which data structure is used for Breadth-First Search (BFS)?", options: ["Stack", "Queue", "Heap", "Graph"], correct_answer: "Queue", category: "Computer Science", difficulty: "medium", type: "multiple" },
  { id: 9,  question: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "High Text Transfer Protocol", "HyperText Transport Procedure", "High Transfer Text Process"], correct_answer: "HyperText Transfer Protocol", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 10, question: "Which of the following is NOT a type of database index?", options: ["B-Tree", "Hash", "Bitmap", "Radix Heap"], correct_answer: "Radix Heap", category: "Computer Science", difficulty: "hard", type: "multiple" },
  { id: 11, question: "What is the worst-case time complexity of QuickSort?", options: ["O(n log n)", "O(n)", "O(n²)", "O(log n)"], correct_answer: "O(n²)", category: "Computer Science", difficulty: "medium", type: "multiple" },
  { id: 12, question: "In object-oriented programming, which concept restricts access to certain components?", options: ["Inheritance", "Polymorphism", "Encapsulation", "Abstraction"], correct_answer: "Encapsulation", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 13, question: "What does DNS stand for?", options: ["Domain Name System", "Dynamic Network Service", "Data Name Server", "Distributed Node System"], correct_answer: "Domain Name System", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 14, question: "Which protocol is used to send emails?", options: ["HTTP", "FTP", "SMTP", "TCP"], correct_answer: "SMTP", category: "Computer Science", difficulty: "medium", type: "multiple" },
  { id: 15, question: "What does HTML stand for?", options: ["Hyper Trainer Markup Language", "HyperText Markup Language", "High Text Machine Language", "Hyper Transfer Markup Language"], correct_answer: "HyperText Markup Language", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 16, question: "Which of the following is a primary key constraint?", options: ["Can be NULL", "Must be unique", "Can duplicate", "Is optional"], correct_answer: "Must be unique", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 17, question: "In SQL, which command retrieves data from a table?", options: ["GET", "SELECT", "FETCH", "READ"], correct_answer: "SELECT", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 18, question: "Who invented the World Wide Web?", options: ["Bill Gates", "Vint Cerf", "Tim Berners-Lee", "Steve Jobs"], correct_answer: "Tim Berners-Lee", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 19, question: "What is a deadlock in operating systems?", options: ["A program crash", "Two processes waiting on each other indefinitely", "A memory overflow", "A CPU scheduling error"], correct_answer: "Two processes waiting on each other indefinitely", category: "Computer Science", difficulty: "medium", type: "multiple" },
  { id: 20, question: "Which HTTP status code means 'Not Found'?", options: ["200", "301", "404", "500"], correct_answer: "404", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 21, question: "What is the purpose of a compiler?", options: ["Execute machine code", "Translate source code to machine code", "Manage memory", "Schedule CPU processes"], correct_answer: "Translate source code to machine code", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 22, question: "Which data structure is best for implementing a priority queue?", options: ["Array", "Linked List", "Binary Heap", "Stack"], correct_answer: "Binary Heap", category: "Computer Science", difficulty: "medium", type: "multiple" },
  { id: 23, question: "What does REST stand for in web services?", options: ["Remote Execution State Transfer", "Representational State Transfer", "Request Endpoint Service Technology", "Remote State Transport"], correct_answer: "Representational State Transfer", category: "Computer Science", difficulty: "medium", type: "multiple" },
  { id: 24, question: "In version control, what does 'git merge' do?", options: ["Deletes a branch", "Combines two branches into one", "Creates a new commit", "Reverts last commit"], correct_answer: "Combines two branches into one", category: "Computer Science", difficulty: "easy", type: "multiple" },
  { id: 25, question: "What is Big-O notation used for?", options: ["Measuring RAM usage", "Describing algorithm complexity", "Counting lines of code", "Benchmarking CPUs"], correct_answer: "Describing algorithm complexity", category: "Computer Science", difficulty: "easy", type: "multiple" },

  // ── Mathematics ─────────────────────────────────────────────────────────────
  { id: 26, question: "What is 15% of 200?", options: ["20", "25", "30", "35"], correct_answer: "30", category: "Mathematics", difficulty: "easy", type: "multiple" },
  { id: 27, question: "What is the square root of 144?", options: ["10", "11", "12", "14"], correct_answer: "12", category: "Mathematics", difficulty: "easy", type: "multiple" },
  { id: 28, question: "What is 2 to the power of 10?", options: ["512", "1024", "2048", "256"], correct_answer: "1024", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 29, question: "Solve: If 5x - 3 = 22, what is x?", options: ["4", "5", "6", "7"], correct_answer: "5", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 30, question: "What is the next prime after 23?", options: ["25", "27", "29", "31"], correct_answer: "29", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 31, question: "What is 0.125 as a fraction?", options: ["1/4", "1/8", "1/6", "1/10"], correct_answer: "1/8", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 32, question: "What type of triangle has all sides equal?", options: ["Scalene", "Isosceles", "Equilateral", "Right"], correct_answer: "Equilateral", category: "Mathematics", difficulty: "easy", type: "multiple" },
  { id: 33, question: "The area of a circle with radius 7 is approximately?", options: ["154", "144", "132", "168"], correct_answer: "154", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 34, question: "What is the LCM of 12 and 18?", options: ["6", "24", "36", "54"], correct_answer: "36", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 35, question: "A train travels 300 km in 5 hours. What is its average speed?", options: ["50 km/h", "60 km/h", "70 km/h", "80 km/h"], correct_answer: "60 km/h", category: "Mathematics", difficulty: "easy", type: "multiple" },
  { id: 36, question: "What is the value of log₁₀(1000)?", options: ["2", "3", "4", "10"], correct_answer: "3", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 37, question: "If a shirt costs $80 and is discounted 25%, what is the final price?", options: ["$55", "$60", "$65", "$70"], correct_answer: "$60", category: "Mathematics", difficulty: "easy", type: "multiple" },
  { id: 38, question: "What is the sum of interior angles of a pentagon?", options: ["360°", "450°", "540°", "720°"], correct_answer: "540°", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 39, question: "How many ways can 4 people be arranged in a line?", options: ["8", "16", "24", "32"], correct_answer: "24", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 40, question: "What is the probability of getting heads twice in a row when flipping a fair coin?", options: ["1/2", "1/4", "1/3", "1/8"], correct_answer: "1/4", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 41, question: "Simplify: (x² - 9) / (x - 3)", options: ["x + 3", "x - 3", "x² + 3", "x + 9"], correct_answer: "x + 3", category: "Mathematics", difficulty: "medium", type: "multiple" },
  { id: 42, question: "What is the slope of the line y = 3x + 5?", options: ["5", "3", "8", "15"], correct_answer: "3", category: "Mathematics", difficulty: "easy", type: "multiple" },

  // ── Logical Reasoning ────────────────────────────────────────────────────────
  { id: 43, question: "If all roses are flowers and some flowers fade quickly, which conclusion is valid?", options: ["All roses fade quickly", "Some roses may fade quickly", "No roses fade quickly", "All flowers are roses"], correct_answer: "Some roses may fade quickly", category: "Logical Reasoning", difficulty: "medium", type: "multiple" },
  { id: 44, question: "Find the next number: 2, 4, 8, 16, __", options: ["24", "28", "32", "30"], correct_answer: "32", category: "Logical Reasoning", difficulty: "easy", type: "multiple" },
  { id: 45, question: "Which figure completes the pattern? ○ □ △ ○ □ __", options: ["○", "□", "△", "◇"], correct_answer: "△", category: "Logical Reasoning", difficulty: "easy", type: "multiple" },
  { id: 46, question: "A is B's sister, B is C's brother. What is A to C?", options: ["Brother", "Sister", "Cousin", "Cannot be determined"], correct_answer: "Sister", category: "Logical Reasoning", difficulty: "medium", type: "multiple" },
  { id: 47, question: "Find the odd one out: Dog, Cat, Parrot, Lion, Rabbit", options: ["Dog", "Cat", "Parrot", "Lion"], correct_answer: "Parrot", category: "Logical Reasoning", difficulty: "easy", type: "multiple" },
  { id: 48, question: "If MANGO is coded as OCPIQ, how is APPLE coded?", options: ["CRNNG", "CQQNG", "CRRNG", "CRRNF"], correct_answer: "CRRNG", category: "Logical Reasoning", difficulty: "hard", type: "multiple" },
  { id: 49, question: "Complete the series: 1, 1, 2, 3, 5, 8, __", options: ["11", "12", "13", "14"], correct_answer: "13", category: "Logical Reasoning", difficulty: "easy", type: "multiple" },
  { id: 50, question: "If today is Wednesday, what day will it be 100 days from now?", options: ["Monday", "Tuesday", "Wednesday", "Friday"], correct_answer: "Friday", category: "Logical Reasoning", difficulty: "medium", type: "multiple" },

  // ── General Science ──────────────────────────────────────────────────────────
  { id: 51, question: "What is the chemical symbol for Gold?", options: ["Gd", "Go", "Au", "Ag"], correct_answer: "Au", category: "Science", difficulty: "easy", type: "multiple" },
  { id: 52, question: "Which planet is farthest from the Sun?", options: ["Saturn", "Uranus", "Jupiter", "Neptune"], correct_answer: "Neptune", category: "Science", difficulty: "easy", type: "multiple" },
  { id: 53, question: "What is the speed of light in a vacuum (approx)?", options: ["3×10⁶ m/s", "3×10⁸ m/s", "3×10¹⁰ m/s", "3×10⁴ m/s"], correct_answer: "3×10⁸ m/s", category: "Science", difficulty: "medium", type: "multiple" },
  { id: 54, question: "What gas makes up the majority of Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], correct_answer: "Nitrogen", category: "Science", difficulty: "easy", type: "multiple" },
  { id: 55, question: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi Apparatus"], correct_answer: "Mitochondria", category: "Science", difficulty: "easy", type: "multiple" },
  { id: 56, question: "Which fundamental force is responsible for keeping electrons in orbit around a nucleus?", options: ["Gravity", "Strong nuclear", "Weak nuclear", "Electromagnetic"], correct_answer: "Electromagnetic", category: "Science", difficulty: "medium", type: "multiple" },
  { id: 57, question: "What is the atomic number of Carbon?", options: ["4", "6", "8", "12"], correct_answer: "6", category: "Science", difficulty: "easy", type: "multiple" },
  { id: 58, question: "What unit is used to measure frequency?", options: ["Watt", "Volt", "Hertz", "Joule"], correct_answer: "Hertz", category: "Science", difficulty: "easy", type: "multiple" },
  { id: 59, question: "Which blood type is considered the universal donor?", options: ["A+", "B+", "AB+", "O-"], correct_answer: "O-", category: "Science", difficulty: "medium", type: "multiple" },
  { id: 60, question: "How many bones are in the adult human body?", options: ["186", "196", "206", "216"], correct_answer: "206", category: "Science", difficulty: "easy", type: "multiple" },
];
