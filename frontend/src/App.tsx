import React, { useState, useRef, useEffect } from 'react';
import { Home, Play, Trophy, Camera, CheckCircle2, HeartHandshake, Zap, Award, VideoOff, LogOut, User } from 'lucide-react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { API_BASE_URL } from './config';

// --- Types ---
interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
}

// ASL one-handed alphabet hints (Thai)
const ASL_HINTS: Record<string, string> = {
  A: 'กำหมัด นิ้วโป้งวางข้างกำปั้น',
  B: 'เหยียดนิ้วทั้งสี่ชิดกัน นิ้วโป้งพับเข้า',
  C: 'งอมือเป็นรูปตัว C',
  D: 'นิ้วชี้ตั้งตรง นิ้วที่เหลือกลมล้อมรอบนิ้วโป้ง',
  E: 'งอปลายนิ้วทุกนิ้วลงเล็กน้อย',
  F: 'นิ้วโป้งและนิ้วชี้ติดกันเป็นวงกลม ที่เหลือตั้งตรง',
  G: 'นิ้วชี้และโป้งชี้ออกด้านข้าง ขนานกัน',
  H: 'นิ้วชี้และกลางเหยียดออกชิดกัน ชี้ด้านข้าง',
  I: 'ชูนิ้วก้อยเพียงนิ้วเดียว',
  J: 'ชูนิ้วก้อยแล้วขีดตัว J ในอากาศ',
  K: 'นิ้วชี้และกลางตั้งขึ้น นิ้วโป้งอยู่ระหว่างสองนิ้ว',
  L: 'นิ้วโป้งและชี้ตั้งขึ้น เป็นรูปตัว L',
  M: 'วางสามนิ้ว (ชี้ กลาง นาง) พาดบนนิ้วโป้งที่พับ',
  N: 'วางสองนิ้ว (ชี้ กลาง) พาดบนนิ้วโป้งที่พับ',
  O: 'งอมือให้ทุกนิ้วแตะโป้ง เป็นรูปวงกลม',
  P: 'คว่ำมือ นิ้วกลางชี้ลง',
  Q: 'คว่ำมือ นิ้วโป้งและชี้ชี้ลง',
  R: 'ไขว้นิ้วชี้และกลางเข้าหากัน',
  S: 'กำหมัด นิ้วโป้งทับนิ้วอื่น',
  T: 'กำหมัด นิ้วโป้งอยู่ระหว่างนิ้วชี้และกลาง',
  U: 'นิ้วชี้และกลางเหยียดชิดกัน ตั้งขึ้น',
  V: 'นิ้วชี้และกลางเหยียดแยกออก เป็นรูป V',
  W: 'เหยียดสามนิ้ว (ชี้ กลาง นาง) แยกออก',
  X: 'งอนิ้วชี้เล็กน้อย เป็นรูปตะขอ',
  Y: 'ชูนิ้วโป้งและก้อย (ไอเลิฟยู)',
  Z: 'ใช้นิ้วชี้ขีดตัว Z ในอากาศ',
};

const TOTAL_TIME = 30;
const LETTERS_PER_GAME = 5;
const SCORE_PER_CORRECT = 10;
const MAX_LIVES = 3;
const DETECTION_INTERVAL_MS = 2500;

function generateWordList(): string[] {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters.slice(0, LETTERS_PER_GAME);
}

type PageState = 'home' | 'game' | 'rank';

const SESSION_LOG_INTERVAL = 30; // วินาที

async function getToken(): Promise<string | null> {
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

async function callAuthLog(endpoint: string) {
  try {
    const token = await getToken();
    if (!token) return;
    await fetch(`${API_BASE_URL}/user/${endpoint}`, {
      method: endpoint === 'session-check' ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // ไม่ block การทำงานหลัก
  }
}

function AppContent() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [currentPage, setCurrentPage] = useState<PageState>('home');

  // เรียก login-log เมื่อ user เข้ามา
  useEffect(() => {
    if (user) {
      callAuthLog('login-log');
    }
  }, [user?.userId]);

  // session-check ทุก SESSION_LOG_INTERVAL วินาที
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      callAuthLog('session-check');
    }, SESSION_LOG_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await callAuthLog('logout-log');
    signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage('home')}>
              <HeartHandshake className="h-8 w-8 text-indigo-600 mr-2" />
              <span className="font-bold text-xl text-indigo-900 tracking-tight">SignBridge</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage('home')}
                className={`p-2 rounded-md transition-colors ${currentPage === 'home' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}
              >
                <Home className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage('rank')}
                className={`p-2 rounded-md transition-colors ${currentPage === 'rank' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}
              >
                <Trophy className="h-5 w-5" />
              </button>

              {/* Login / User menu */}
              <div className="flex items-center space-x-2 ml-2 pl-4 border-l border-slate-200">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                  {user?.username || 'ผู้ใช้'}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-slate-500 hover:text-red-500 hover:bg-slate-50 transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'home' && <HomeView onPlay={() => setCurrentPage('game')} onRank={() => setCurrentPage('rank')} />}
        {currentPage === 'game' && <GameView onQuit={() => setCurrentPage('home')} />}
        {currentPage === 'rank' && <LeaderboardView />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Authenticator signUpAttributes={['email']}>
      <AppContent />
    </Authenticator>
  );
}

// --- Views ---

interface HomeViewProps {
  onPlay: () => void;
  onRank: () => void;
}

function HomeView({ onPlay, onRank }: HomeViewProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center max-w-2xl space-y-6 mt-8">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium mb-4">
          <Zap className="h-4 w-4 mr-1 text-indigo-600" /> Interactive Learning
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          {"เรียนรู้ "}<span className="text-indigo-600">{"ภาษามือ"}</span><br />{"ด้วย AI แบบเรียลไทม์"}
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          {"ฝึกภาษามือ อเมริกัน ตัวอักษร A - Z ผ่านเกมแบบโต้ตอบ กล้องของคุณจะจับภาพและส่งให้ AI วิเคราะห์ผลแบบเรียลไทม์"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button
          onClick={onPlay}
          className="flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <Play className="h-6 w-6 mr-2 fill-current" />
          {"เริ่มเล่นเกม"}
        </button>
        <button
          onClick={onRank}
          className="flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-indigo-700 bg-white border-2 border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
        >
          <Trophy className="h-6 w-6 mr-2" />
          {"ดูอันดับคะแนน"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12">
        <FeatureCard icon={<Camera />} title="AI วิเคราะห์เรียลไทม์" desc="ส่งภาพกล้องไปยัง Backend ทุก 2.5 วินาที เพื่อให้ AI ตรวจจับตัวอักษรที่คุณทำ" />
        <FeatureCard icon={<Award />} title="5 ตัวอักษรต่อรอบ" desc="สุ่ม 5 ตัวจาก A - Z แต่ละตัวมีเวลา 30 วินาที มี 3 ชีวิต" />
        <FeatureCard icon={<HeartHandshake />} title="บันทึกคะแนน" desc="คะแนนสูงสุดของคุณถูกบันทึกใน Leaderboard Server แบบเรียลไทม์" />
      </div>
    </div>
  );
}

interface GameViewProps {
  onQuit: () => void;
}

type GameState = 'playing' | 'success' | 'timeout' | 'completed';

function GameView({ onQuit }: GameViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);

  const [wordList] = useState<string[]>(generateWordList);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(MAX_LIVES);
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_TIME);
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [detectedLetter, setDetectedLetter] = useState<string>('...');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const wordIndexRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const gameStateRef = useRef<GameState>('playing');
  const scoreRef = useRef(0);
  const isHandlingRef = useRef(false);
  const scoreSavedRef = useRef(false);

  wordIndexRef.current = wordIndex;
  livesRef.current = lives;
  gameStateRef.current = gameState;
  scoreRef.current = score;

  const currentWord = wordList[wordIndex];

  const saveScore = async (finalScore: number) => {
    if (scoreSavedRef.current) return;
    scoreSavedRef.current = true;
    try {
      const { apiService } = await import('./services/api');
      const response = await apiService.post('/leaderboard/score', { score: finalScore });
      console.log('✅ Score saved successfully:', response);
    } catch (err: any) {
      console.error('❌ Failed to save score:', err.message || err);
      // Don't break the game flow, just warn user in console
      console.warn('⚠️  Score may not have been saved. Make sure you are logged in.');
    }
  };

  // Camera setup
  useEffect(() => {
    let localStream: MediaStream | null = null;
    async function setupCamera() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraError(false);
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }
      } catch (err) {
        console.warn('Error accessing camera:', err);
        setCameraError(true);
      }
    }
    setupCamera();
    return () => { localStream?.getTracks().forEach(t => t.stop()); };
  }, []);

  // Save score when game ends
  useEffect(() => {
    if (gameState === 'timeout' || gameState === 'completed') {
      saveScore(scoreRef.current);
    }
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer - resets when word changes or game resumes
  useEffect(() => {
    if (gameState !== 'playing') return;
    setTimeLeft(TOTAL_TIME);
    const timerId = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timerId);
  }, [gameState, wordIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle time running out
  useEffect(() => {
    if (timeLeft > 0 || gameState !== 'playing') return;
    const newLives = livesRef.current - 1;
    setLives(newLives);
    if (newLives <= 0) {
      setGameState('timeout');
      return;
    }
    const nextIdx = wordIndexRef.current + 1;
    if (nextIdx >= wordList.length) {
      setGameState('completed');
      return;
    }
    setWordIndex(nextIdx);
    setDetectedLetter('...');
  }, [timeLeft, gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSuccess = () => {
    if (isHandlingRef.current) return;
    isHandlingRef.current = true;
    setGameState('success');
    setScore(s => s + SCORE_PER_CORRECT);
    setFeedbackMsg('ถูกต้อง! 🎉');
    setTimeout(() => {
      isHandlingRef.current = false;
      const nextIdx = wordIndexRef.current + 1;
      if (nextIdx >= wordList.length) {
        setGameState('completed');
      } else {
        setWordIndex(nextIdx);
        setDetectedLetter('...');
        setGameState('playing');
      }
    }, 1500);
  };

  // Real-time sign detection - polls backend less aggressively to avoid overloading the backend
  useEffect(() => {
    if (gameState !== 'playing' || cameraError) return;
    let isChecking = false;

    const intervalId = setInterval(async () => {
      if (document.hidden) return;
      if (
        isChecking ||
        !videoRef.current ||
        !canvasRef.current ||
        videoRef.current.readyState !== 4 ||
        gameStateRef.current !== 'playing'
      ) return;

      isChecking = true;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.6);

        try {
          const res = await fetch(`${API_BASE_URL}/game/detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image }),
          });
          const data = await res.json() as { predicted: string };
          setDetectedLetter(data.predicted);
          if (data.predicted === wordList[wordIndexRef.current] && gameStateRef.current === 'playing') {
            handleSuccess();
          }
        } catch {
          setDetectedLetter('เชื่อมต่อ Backend ไม่ได้');
        }
      }
      isChecking = false;
    }, DETECTION_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [gameState, cameraError, wordList]); // eslint-disable-line react-hooks/exhaustive-deps

  // Game Over / Completed screen
  if (gameState === 'timeout' || gameState === 'completed') {
    const isVictory = gameState === 'completed';
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in zoom-in-95 duration-500">
        {isVictory
          ? <Award className="h-24 w-24 text-yellow-400" />
          : <Trophy className="h-24 w-24 text-slate-400" />}
        <h2 className="text-4xl font-bold text-slate-800">
          {isVictory ? 'ยินดีด้วย! ผ่านครบทุกด่านแล้ว 🎉' : 'หมดชีวิต!'}
        </h2>
        <div className="text-2xl text-slate-600">
          {"คะแนนของคุณ: "}<span className="text-indigo-600 font-bold text-4xl">{score}</span>
        </div>
        <p className="text-sm text-slate-400 bg-slate-100 px-4 py-2 rounded-lg">
          {"คะแนนถูกบันทึกใน Leaderboard แล้ว"}
        </p>
        <div className="flex gap-4 mt-8">
          <button onClick={onQuit} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
            {"เล่นอีกครั้ง"}
          </button>
          <button onClick={onQuit} className="px-6 py-3 bg-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-300">
            {"กลับหน้าแรก"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Game Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-2">
          <Trophy className="text-yellow-500 h-6 w-6" />
          <span className="font-bold text-xl">{score}</span>
        </div>
        <div className="text-center hidden sm:block">
          <div className="text-sm text-slate-500 font-medium">{"ตัวอักษรที่"}</div>
          <div className="font-bold text-xl text-indigo-600">
            {wordIndex + 1} <span className="text-slate-400 text-sm">/ {wordList.length}</span>
          </div>
        </div>
        {/* Lives */}
        <div className="flex items-center space-x-1">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <span key={i} className={`text-xl transition-all ${i < lives ? '' : 'opacity-20 grayscale'}`}>{"❤️"}</span>
          ))}
        </div>
        <div className="text-center">
          <div className="text-sm text-slate-500 font-medium">{"เวลา"}</div>
          <div className={`font-mono font-bold text-2xl ${timeLeft <= 10 ? 'text-red-500' : 'text-slate-800'}`}>
            {timeLeft.toString().padStart(2, '0')}
          </div>
        </div>
        <button onClick={onQuit} className="text-slate-400 hover:text-red-500 font-medium text-sm transition-colors">
          {"ออกเกม"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Target Letter */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-100">
            <div
              className="h-full bg-indigo-500 transition-all duration-1000"
              style={{ width: `${(timeLeft / TOTAL_TIME) * 100}%` }}
            />
          </div>
          <div className="text-sm font-bold tracking-widest text-indigo-400 uppercase">{"ทำท่ามือตัวอักษร"}</div>
          <div className="text-[8rem] font-black text-indigo-600 leading-none select-none">{currentWord}</div>
          <p className="text-slate-500 bg-slate-50 p-4 rounded-xl w-full text-sm">
            {"💡 "}{ASL_HINTS[currentWord] ?? ''}
          </p>
        </div>

        {/* Right: Camera Feed */}
        <div className="space-y-4">
          <div className="relative bg-slate-900 rounded-3xl overflow-hidden aspect-video shadow-inner border-4 border-slate-800 flex items-center justify-center">
            {cameraError ? (
              <div className="text-slate-400 flex flex-col items-center p-6 text-center">
                <VideoOff className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-bold text-lg text-slate-300">{"ไม่สามารถเข้าถึงกล้องได้"}</p>
                <div className="mt-2 text-sm text-indigo-400 px-4 py-2">
                  {"โปรดอนุญาตให้เข้าถึงกล้องเพื่อจับภาพ"}
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <canvas ref={canvasRef} className="hidden" />
              </>
            )}

            {/* Success overlay */}
            {gameState === 'success' && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 z-10 backdrop-blur-sm">
                <div className="flex flex-col items-center p-6 rounded-2xl bg-white shadow-2xl animate-in zoom-in-90">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-2" />
                  <div className="font-bold text-xl text-green-700">{feedbackMsg}</div>
                </div>
              </div>
            )}
          </div>

          {/* AI detection status */}
          {gameState === 'playing' && !cameraError && (
            <div className="flex justify-center">
              <div className="w-full bg-white text-slate-700 px-6 py-4 rounded-2xl font-sans text-lg flex items-center justify-center shadow-sm border border-slate-200">
                <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse mr-3 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                {"AI เห็น:"}
                <span className="ml-3 font-black text-indigo-600 text-3xl min-w-[40px] text-center leading-none">
                  {detectedLetter}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeaderboardView() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { apiService } = await import('./services/api');
        const data: LeaderboardEntry[] = await apiService.get('/leaderboard/leaderboard');
        
        if (Array.isArray(data) && data.length > 0) {
          setLeaderboard(data);
          console.log('✅ Real leaderboard loaded:', data);
        } else {
          setError('ยังไม่มีข้อมูลตารางคะแนน');
          console.log('ℹ️ No leaderboard data yet');
        }
      } catch (err: any) {
        console.error('❌ Failed to load leaderboard:', err);
        setError('ไม่สามารถโหลดตารางคะแนนได้');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
      <div className="text-center mb-10">
        <div className="inline-flex justify-center items-center h-20 w-20 rounded-full bg-yellow-100 mb-4">
          <Trophy className="h-10 w-10 text-yellow-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900">{"ตารางคะแนนสูงสุด"}</h2>
        <p className="text-slate-500 mt-2">{"แข่งขันและเรียนรู้ไปพร้อมกับทุกคน"}</p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-amber-700">ℹ️ {error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-2 right-2 px-3 py-1 bg-slate-100 text-slate-400 text-xs rounded-full font-medium">
          {isLoading ? 'กำลังโหลด...' : 'Live'}
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p>ยังไม่มีคะแนนในตารางอันดับ</p>
            <p className="text-sm mt-2">เล่นเกมและส่งคะแนนของคุณ!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-4">
            {leaderboard.map((user, index) => (
              <div
                key={`${user.rank}-${user.name}`}
                className={`flex items-center p-6 transition-colors hover:bg-slate-50 ${index < 3 ? 'bg-gradient-to-r from-transparent to-yellow-50/30' : ''}`}
              >
                <div className="w-12 font-bold text-2xl text-slate-400 text-center">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : user.rank}
                </div>
                <div className="ml-6 flex-1 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-4">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-bold text-lg text-slate-800">{user.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl text-indigo-600">{user.score}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Points</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Shared Components ---
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-center flex flex-col items-center">
      <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-lg text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
