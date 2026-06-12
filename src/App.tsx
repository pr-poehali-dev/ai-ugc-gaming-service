import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpenIcon,
  CheckCircleIcon,
  TrophyIcon,
  StarIcon,
  UserGroupIcon,
  UserCircleIcon,
  BoltIcon,
  FireIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  ShareIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  PencilIcon,
  LockClosedIcon,
  CheckIcon,
  AcademicCapIcon,
  ClockIcon,
  SparklesIcon,
  PlayIcon,
  ChartBarIcon,
  NewspaperIcon,
  Squares2X2Icon,
  IdentificationIcon,
} from "@heroicons/react/24/solid";

// ─── URLs ──────────────────────────────────────────────────────────────────
const AUTH_URL = "https://functions.poehali.dev/16228047-1a09-4827-af8c-d5ca8dd48885";
const API_URL  = "https://functions.poehali.dev/58712cb3-8e82-4bb3-9940-6fa8d4df92b0";
const TOKEN_KEY = "aiquest_token";

// ─── Palette ──────────────────────────────────────────────────────────────
const G    = "#2d7a4f";
const GL   = "#e8f5ee";
const GM   = "#3d9962";
const B    = "#8b5e3c";
const BL   = "#f5ede4";
const BM   = "#a67048";
const STONE = "#f5f1ec";
const ACCENTS = [G, B, GM, BM, "#4a7c59", "#7a4f2d", "#5c9e72", "#9e6b42"];

// ─── Types ─────────────────────────────────────────────────────────────────
interface User { id: number; username: string; email: string; avatar: string; xp: number; level: number; streak: number; }
interface Course { id: number; title: string; emoji: string; xp: number; duration: string; level: string; color: string; accent: string; lessons: number; done: number; progress: number; tags: string[]; }
interface Task { id: number; title: string; xp: number; deadline: string; difficulty: string; emoji: string; color: string; completed: boolean; }
interface RatingEntry { rank: number; name: string; avatar: string; xp: number; level: number; badge: string; isMe: boolean; }
interface Achievement { id: number; title: string; desc: string; emoji: string; xp: number; rarity: string; color: string; unlocked: boolean; }
interface Post { id: number; author: string; avatar: string; content: string; tag: string; likes: number; comments: number; time: string; color: string; liked_by_me: boolean; }
type Tab = "courses" | "tasks" | "rating" | "profile" | "community" | "achievements";

// ─── API helpers ────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem(TOKEN_KEY) || ""; }
async function apiPost(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "X-Session-Token": getToken() }, body: JSON.stringify(body) });
  return res.json();
}
async function apiGet(url: string) {
  const res = await fetch(url, { headers: { "X-Session-Token": getToken() } });
  return res.json();
}
const authPost = (body: Record<string, string>) => apiPost(AUTH_URL, body);
const api      = (body: Record<string, unknown>) => apiPost(API_URL, body);

// ─── Rarity styles ──────────────────────────────────────────────────────────
const rarityMap: Record<string, { bg: string; text: string; border: string }> = {
  "Легендарное": { bg: "#fff7ed", text: "#92400e", border: "#fcd9a4" },
  "Эпическое":   { bg: GL,       text: "#14532d", border: "#bcdece" },
  "Редкое":      { bg: BL,       text: "#78350f", border: "#dbc9b4" },
  "Обычное":     { bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db" },
};

// ─── Shared UI ──────────────────────────────────────────────────────────────
function XpBar({ progress, green = true }: { progress: number; green?: boolean }) {
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#e8e0d6" }}>
      <div className="h-full rounded-full relative overflow-hidden transition-all duration-700"
        style={{ width: `${Math.min(progress, 100)}%`, background: green ? `linear-gradient(90deg, ${G}, ${GM})` : `linear-gradient(90deg, ${B}, ${BM})` }}>
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl ${className}`} style={{ background: "#f0ebe4" }} />;
}

function Tag({ children, accent = G }: { children: React.ReactNode; accent?: string }) {
  return (
    <span className="badge-game text-[10px]" style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}>
      {children}
    </span>
  );
}

const NAV_ITEMS: { id: Tab; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: "courses",      label: "Курсы",      Icon: BookOpenIcon },
  { id: "tasks",        label: "Задания",    Icon: CheckCircleIcon },
  { id: "rating",       label: "Рейтинг",   Icon: TrophyIcon },
  { id: "achievements", label: "Достижения", Icon: StarIcon },
  { id: "community",    label: "Сообщество", Icon: UserGroupIcon },
  { id: "profile",      label: "Профиль",   Icon: UserCircleIcon },
];

// ─── Auth Screen ─────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", email: "", login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    const body = mode === "register"
      ? { action: "register", username: form.username, email: form.email, password: form.password }
      : { action: "login", login: form.login, password: form.password };
    const data = await authPost(body);
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    localStorage.setItem(TOKEN_KEY, data.token);
    onAuth(data.user);
  };

  return (
    <div className="min-h-screen grid-bg font-rubik flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-green pulse-ring" style={{ background: G }}>
            <AcademicCapIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-mono-rubik text-3xl tracking-tight" style={{ color: G }}>AIQuest</h1>
          <p className="text-sm mt-1" style={{ color: BM }}>Обучение ИИ — это игра</p>
        </div>
        <div className="card-game rounded-3xl p-6">
          <div className="flex rounded-xl p-1 mb-6" style={{ background: STONE }}>
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={mode === m ? { background: "#fff", color: G, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" } : { color: BM }}>
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="text-xs mb-1 block font-medium" style={{ color: BM }}>Имя игрока</label>
                <input value={form.username} onChange={set("username")} placeholder="SuperAI_User"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                  style={{ background: STONE, border: "1px solid #e8e0d6", color: "#2d2015" }} />
              </div>
            )}
            {mode === "register" ? (
              <div>
                <label className="text-xs mb-1 block font-medium" style={{ color: BM }}>Email</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                  style={{ background: STONE, border: "1px solid #e8e0d6", color: "#2d2015" }} />
              </div>
            ) : (
              <div>
                <label className="text-xs mb-1 block font-medium" style={{ color: BM }}>Email или имя</label>
                <input value={form.login} onChange={set("login")} placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                  style={{ background: STONE, border: "1px solid #e8e0d6", color: "#2d2015" }} />
              </div>
            )}
            <div>
              <label className="text-xs mb-1 block font-medium" style={{ color: BM }}>Пароль</label>
              <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                style={{ background: STONE, border: "1px solid #e8e0d6", color: "#2d2015" }} />
            </div>
            {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626" }}>{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              style={{ background: G, boxShadow: `0 4px 16px ${G}40` }}>
              {loading ? <><ClockIcon className="w-4 h-4" /> Загрузка...</>
                : mode === "login"
                  ? <><BoltIcon className="w-4 h-4" /> Войти в игру</>
                  : <><SparklesIcon className="w-4 h-4" /> Создать аккаунт</>}
            </button>
          </form>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: BM, opacity: 0.7 }}>
          Учи ИИ-сервисы · Зарабатывай XP · Побеждай
        </p>
      </div>
    </div>
  );
}

// ─── Courses Tab ─────────────────────────────────────────────────────────────
const COURSE_ICONS = [BookOpenIcon, AcademicCapIcon, SparklesIcon, PlayIcon, ChartBarIcon, NewspaperIcon];

function CoursesTab({ onXpGain }: { onXpGain: (xp: number, total: number) => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(API_URL).then(d => { if (d.courses) setCourses(d.courses); setLoading(false); });
  }, []);

  const startLesson = async (course: Course) => {
    if (course.done >= course.lessons) return;
    const newDone = course.done + 1;
    const data = await api({ action: "update_course_progress", course_id: course.id, lessons_done: newDone });
    if (data.ok) {
      setCourses(cs => cs.map(c => c.id === course.id
        ? { ...c, done: newDone, progress: Math.round(newDone / c.lessons * 100) } : c));
      if (newDone >= course.lessons) onXpGain(course.xp, -1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#1a1008" }}>Курсы по ИИ</h2>
          <p className="text-sm mt-0.5" style={{ color: BM }}>{courses.length} курсов доступно</p>
        </div>
        <Tag accent={G}>Актуально</Tag>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-52" />) :
          courses.map((c, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            const isGreen = i % 2 === 0;
            const CourseIcon = COURSE_ICONS[i % COURSE_ICONS.length];
            return (
              <div key={c.id} className={`card-game rounded-2xl overflow-hidden hover-lift cursor-pointer animate-fade-in stagger-${Math.min(i+1,6)}`}>
                <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${isGreen ? BM : GM})` }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
                        <CourseIcon className="w-6 h-6" style={{ color: accent }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm leading-tight" style={{ color: "#1a1008" }}>{c.title}</h3>
                        <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: BM }}>
                          <ClockIcon className="w-3 h-3" /><span>{c.duration}</span>
                          <span className="mx-1">·</span>
                          <span>{c.lessons} уроков</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-xs font-bold mb-1" style={{ color: accent }}>+{c.xp} XP</div>
                      <Tag accent={isGreen ? G : B}>{c.level}</Tag>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mb-4 flex-wrap">
                    {c.tags.map(t => <Tag key={t} accent={accent}>{t}</Tag>)}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs" style={{ color: BM }}>
                      <span>{c.done}/{c.lessons} уроков</span><span>{c.progress}%</span>
                    </div>
                    <XpBar progress={c.progress} green={isGreen} />
                  </div>
                  <button onClick={() => startLesson(c)} disabled={c.done >= c.lessons}
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={c.progress >= 100
                      ? { background: GL, color: G, border: `1px solid ${G}30` }
                      : { background: accent, color: "#fff", boxShadow: `0 3px 12px ${accent}40` }}>
                    {c.progress >= 100
                      ? <><CheckIcon className="w-4 h-4" /> Пройден</>
                      : c.progress > 0
                        ? <><PlayIcon className="w-4 h-4" /> Продолжить</>
                        : <><PlayIcon className="w-4 h-4" /> Начать курс</>}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────
const TASK_ICONS = [SparklesIcon, NewspaperIcon, Squares2X2Icon, PlayIcon, ChartBarIcon];

function TasksTab({ onXpGain }: { onXpGain: (xp: number, total: number) => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);

  useEffect(() => {
    api({ action: "get_tasks" }).then(d => { if (d.tasks) setTasks(d.tasks); setLoading(false); });
  }, []);

  const complete = async (task: Task) => {
    if (task.completed || completing) return;
    setCompleting(task.id);
    const data = await api({ action: "complete_task", task_id: task.id });
    setCompleting(null);
    if (data.ok) {
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, completed: true } : t));
      onXpGain(data.xp_gained, data.total_xp);
    }
  };

  const active = tasks.filter(t => !t.completed);
  const done   = tasks.filter(t => t.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#1a1008" }}>Задания</h2>
          <p className="text-sm mt-0.5" style={{ color: BM }}>{active.length} активных · {done.length} выполнено</p>
        </div>
        <div className="badge-game flex items-center gap-1.5" style={{ background: BL, color: B, border: `1px solid ${B}30` }}>
          <BoltIcon className="w-3 h-3" />{active.reduce((s, t) => s + t.xp, 0)} XP доступно
        </div>
      </div>
      <div className="space-y-3">
        {loading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />) :
          active.map((t, i) => {
            const accent = i % 2 === 0 ? G : B;
            const accentL = i % 2 === 0 ? GL : BL;
            const TaskIcon = TASK_ICONS[i % TASK_ICONS.length];
            return (
              <div key={t.id} className={`card-game rounded-2xl p-4 animate-fade-in stagger-${i+1} hover-lift`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
                    <TaskIcon className="w-6 h-6" style={{ color: accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm" style={{ color: "#1a1008" }}>{t.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: BM }}>
                        <ClockIcon className="w-3 h-3" />{t.deadline}
                      </span>
                      <Tag accent={accent}>{t.difficulty}</Tag>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-sm" style={{ color: accent }}>+{t.xp}</div>
                    <div className="text-[10px]" style={{ color: BM }}>XP</div>
                  </div>
                  <button onClick={() => complete(t)} disabled={completing === t.id}
                    className="ml-1 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 hover:opacity-80 disabled:opacity-50"
                    style={{ background: accentL, color: accent, border: `1px solid ${accent}30` }}>
                    {completing === t.id
                      ? <ClockIcon className="w-4 h-4 animate-spin" />
                      : <CheckIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
      {done.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: BM, opacity: 0.6 }}>Выполнено</p>
          <div className="space-y-2">
            {done.map(t => (
              <div key={t.id} className="card-game rounded-2xl p-4 opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: STONE }}>
                    <CheckCircleIcon className="w-5 h-5" style={{ color: G }} />
                  </div>
                  <div className="flex-1"><h3 className="font-medium text-sm line-through" style={{ color: BM }}>{t.title}</h3></div>
                  <CheckCircleIcon className="w-5 h-5 flex-shrink-0" style={{ color: G }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rating Tab ───────────────────────────────────────────────────────────────
function RatingTab() {
  const [rating, setRating] = useState<RatingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api({ action: "get_rating" }).then(d => { if (d.rating) setRating(d.rating); setLoading(false); });
  }, []);

  const top3 = rating.length >= 3 ? [rating[1], rating[0], rating[2]] : rating.slice(0, 3);
  const podiumBg    = [BL, GL, BL];
  const podiumColor = [B,  G,  B ];

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold" style={{ color: "#1a1008" }}>Рейтинг</h2>
        <p className="text-sm mt-0.5" style={{ color: BM }}>Топ игроков по XP</p>
      </div>
      {loading ? <Skeleton className="h-40" /> : top3.length >= 2 && (
        <div className="grid grid-cols-3 gap-3 animate-fade-in stagger-1">
          {top3.map((p, i) => {
            const isCenter = i === 1;
            return (
              <div key={p.rank} className={`card-game rounded-2xl p-4 text-center flex flex-col items-center gap-2 ${isCenter ? "shadow-green" : ""}`}
                style={{ background: podiumBg[i], border: `1px solid ${podiumColor[i]}30` }}>
                <TrophyIcon className="w-7 h-7" style={{ color: podiumColor[i] }} />
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCenter ? "pulse-ring" : ""}`}
                  style={{ background: `${podiumColor[i]}20`, border: `2px solid ${podiumColor[i]}50` }}>
                  <UserCircleIcon className="w-8 h-8" style={{ color: podiumColor[i] }} />
                </div>
                <div className="font-bold text-xs truncate w-full text-center" style={{ color: "#1a1008" }}>{p.name}</div>
                <div className="font-bold text-xs" style={{ color: podiumColor[i] }}>{p.xp.toLocaleString()} XP</div>
              </div>
            );
          })}
        </div>
      )}
      <div className="space-y-2">
        {loading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />) :
          rating.map((p, i) => (
            <div key={p.rank} className={`card-game rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in stagger-${Math.min(i+1,6)}`}
              style={p.isMe ? { border: `1px solid ${G}40`, background: GL } : {}}>
              <div className="w-8 text-center font-bold text-sm flex-shrink-0" style={{ color: p.rank <= 3 ? B : "#9ca3af" }}>#{p.rank}</div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: p.isMe ? GL : STONE, border: `1.5px solid ${p.isMe ? G : "#e8e0d6"}` }}>
                <UserCircleIcon className="w-6 h-6" style={{ color: p.isMe ? G : BM }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: p.isMe ? G : "#1a1008" }}>{p.name}</span>
                  {p.isMe && <Tag accent={G}>Это ты</Tag>}
                </div>
                <div className="text-xs" style={{ color: BM }}>Уровень {p.level}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-sm" style={{ color: "#1a1008" }}>{p.xp.toLocaleString()}</div>
                <div className="text-[10px]" style={{ color: BM }}>XP</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Achievements Tab ─────────────────────────────────────────────────────────
const ACHIEVEMENT_ICONS = [StarIcon, BoltIcon, TrophyIcon, SparklesIcon, ChartBarIcon, HeartIcon, FireIcon, AcademicCapIcon];

function AchievementsTab() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api({ action: "get_achievements" }).then(d => { if (d.achievements) setAchievements(d.achievements); setLoading(false); });
  }, []);

  const unlocked = achievements.filter(a => a.unlocked);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold" style={{ color: "#1a1008" }}>Достижения</h2>
        <p className="text-sm mt-0.5" style={{ color: BM }}>{unlocked.length}/{achievements.length} разблокировано</p>
      </div>
      {!loading && achievements.length > 0 && (
        <div className="card-game rounded-2xl p-4 animate-fade-in stagger-1">
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: BM }}>Прогресс коллекции</span>
            <span className="font-bold" style={{ color: G }}>{unlocked.length}/{achievements.length}</span>
          </div>
          <XpBar progress={(unlocked.length / achievements.length) * 100} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {loading ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-36" />) :
          achievements.map((a, i) => {
            const rm = rarityMap[a.rarity] ?? rarityMap["Обычное"];
            const AchIcon = ACHIEVEMENT_ICONS[i % ACHIEVEMENT_ICONS.length];
            return (
              <div key={a.id} className={`card-game rounded-2xl p-4 animate-fade-in stagger-${Math.min(i+1,6)} ${a.unlocked ? "hover-lift cursor-pointer" : "opacity-40"}`}
                style={a.unlocked ? { border: `1px solid ${rm.border}` } : {}}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={a.unlocked ? { background: rm.bg, border: `1px solid ${rm.border}` } : { background: STONE }}>
                    {a.unlocked
                      ? <AchIcon className="w-6 h-6" style={{ color: rm.text }} />
                      : <LockClosedIcon className="w-5 h-5" style={{ color: BM }} />}
                  </div>
                  <span className="badge-game text-[9px]" style={{ background: rm.bg, color: rm.text, border: `1px solid ${rm.border}` }}>{a.rarity}</span>
                </div>
                <h3 className="font-bold text-sm" style={{ color: "#1a1008" }}>{a.title}</h3>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: BM }}>{a.desc}</p>
                <div className="mt-2 font-bold text-xs" style={{ color: a.unlocked ? G : "#9ca3af" }}>+{a.xp} XP</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── Community Tab ────────────────────────────────────────────────────────────
function CommunityTab() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ content: "", tag: "" });
  const [posting, setPosting] = useState(false);

  const load = useCallback(() => {
    api({ action: "get_posts" }).then(d => { if (d.posts) setPosts(d.posts); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleLike = async (post: Post) => {
    const data = await api({ action: "like_post", post_id: post.id });
    if (data.liked !== undefined)
      setPosts(ps => ps.map(p => p.id === post.id ? { ...p, likes: data.likes, liked_by_me: data.liked } : p));
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;
    setPosting(true);
    const data = await api({ action: "create_post", content: newPost.content, tag: newPost.tag || "Пост" });
    setPosting(false);
    if (data.ok) { setNewPost({ content: "", tag: "" }); setShowForm(false); load(); }
  };

  const POST_COLORS = [G, B, GM, BM, "#4a7c59", "#7a4f2d"];
  const POST_BG     = [GL, BL, GL, BL, GL, BL];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#1a1008" }}>Сообщество</h2>
          <p className="text-sm mt-0.5" style={{ color: BM }}>Делитесь опытом с ИИ</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 text-white"
          style={{ background: showForm ? B : G }}>
          {showForm ? <XMarkIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
          {showForm ? "Отмена" : "Пост"}
        </button>
      </div>
      {showForm && (
        <form onSubmit={submitPost} className="card-game rounded-2xl p-4 animate-fade-in space-y-3" style={{ border: `1px solid ${G}30` }}>
          <textarea value={newPost.content} onChange={e => setNewPost(n => ({ ...n, content: e.target.value }))}
            placeholder="Поделитесь своим опытом с ИИ-инструментами..." rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ background: STONE, border: "1px solid #e8e0d6", color: "#2d2015" }} />
          <input value={newPost.tag} onChange={e => setNewPost(n => ({ ...n, tag: e.target.value }))}
            placeholder="Тег (ChatGPT, Midjourney...)"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: STONE, border: "1px solid #e8e0d6", color: "#2d2015" }} />
          <button type="submit" disabled={posting || !newPost.content.trim()}
            className="w-full py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            style={{ background: G }}>
            {posting
              ? <><ClockIcon className="w-4 h-4 animate-spin" /> Публикация...</>
              : <><SparklesIcon className="w-4 h-4" /> Опубликовать</>}
          </button>
        </form>
      )}
      <div className="space-y-4">
        {loading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />) :
          posts.map((p, i) => {
            const color = POST_COLORS[i % POST_COLORS.length];
            const bg    = POST_BG[i % POST_BG.length];
            return (
              <div key={p.id} className={`card-game rounded-2xl p-4 animate-fade-in stagger-${Math.min(i+1,6)} hover-lift`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: bg, border: `1px solid ${color}25` }}>
                    <UserCircleIcon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: "#1a1008" }}>{p.author}</span>
                      <Tag accent={color}>{p.tag}</Tag>
                      <span className="text-xs ml-auto" style={{ color: BM, opacity: 0.6 }}>{p.time}</span>
                    </div>
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: "#3d2e1e" }}>{p.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <button onClick={() => toggleLike(p)}
                        className="flex items-center gap-1.5 text-xs transition-all active:scale-90"
                        style={{ color: p.liked_by_me ? B : BM }}>
                        <HeartIcon className="w-4 h-4" style={{ opacity: p.liked_by_me ? 1 : 0.5 }} />
                        <span>{p.likes}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-xs" style={{ color: BM }}>
                        <ChatBubbleOvalLeftIcon className="w-4 h-4 opacity-50" /><span>{p.comments}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-xs ml-auto" style={{ color: BM }}>
                        <ShareIcon className="w-4 h-4 opacity-50" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
const UNLOCKED_ICONS = [StarIcon, BoltIcon, TrophyIcon, FireIcon, SparklesIcon, AcademicCapIcon];

function ProfileTab({ user, onLogout, achievements }: { user: User; onLogout: () => void; achievements: Achievement[] }) {
  const nextLevelXp = (user.level + 1) * 300;
  const xpToNext = Math.max(0, nextLevelXp - user.xp);
  const unlocked = achievements.filter(a => a.unlocked);

  return (
    <div className="space-y-5">
      <div className="card-game-green rounded-3xl p-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center pulse-ring"
              style={{ background: GL, border: `2px solid ${G}60` }}>
              <UserCircleIcon className="w-12 h-12" style={{ color: G }} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background: B }}>
              {user.level}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black" style={{ color: "#1a1008" }}>{user.username}</h2>
            <p className="text-sm" style={{ color: BM }}>{user.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-bold flex items-center gap-1" style={{ color: G }}>
                <BoltIcon className="w-4 h-4" />{user.xp.toLocaleString()} XP
              </span>
              {user.streak > 0 && (
                <><span style={{ color: "#d0c0b0" }}>·</span>
                  <span className="flex items-center gap-1 text-sm" style={{ color: B }}>
                    <FireIcon className="w-4 h-4" />{user.streak} дней
                  </span></>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: BM }}>
            <span>Уровень {user.level}</span>
            <span>До {user.level + 1}: {xpToNext} XP</span>
          </div>
          <XpBar progress={Math.min(100, (user.xp / nextLevelXp) * 100)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 animate-fade-in stagger-1">
        {[
          { value: String(unlocked.length), sub: "достижений", Icon: StarIcon, bg: GL, color: G },
          { value: String(user.xp),          sub: "очков XP",  Icon: BoltIcon, bg: GL, color: G },
          { value: String(user.streak),       sub: "дней подряд", Icon: FireIcon, bg: BL, color: B },
        ].map((s, i) => (
          <div key={i} className="card-game rounded-2xl p-4 text-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: s.bg }}>
              <s.Icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div className="text-lg font-black" style={{ color: "#1a1008" }}>{s.value}</div>
            <div className="text-[11px]" style={{ color: BM }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {unlocked.length > 0 && (
        <div className="animate-fade-in stagger-2">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: BM, opacity: 0.6 }}>Достижения</p>
          <div className="flex gap-3 flex-wrap">
            {unlocked.map((a, i) => {
              const AIcon = UNLOCKED_ICONS[i % UNLOCKED_ICONS.length];
              const rm = rarityMap[a.rarity] ?? rarityMap["Обычное"];
              return (
                <div key={a.id} className="w-14 h-14 rounded-2xl flex items-center justify-center hover-lift cursor-pointer"
                  style={{ background: rm.bg, border: `1px solid ${rm.border}` }} title={a.title}>
                  <AIcon className="w-6 h-6" style={{ color: rm.text }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2 animate-fade-in stagger-3">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: BM, opacity: 0.6 }}>Настройки</p>
        {[
          { label: "Редактировать профиль",  Icon: PencilIcon,                color: G, bg: GL },
          { label: "Настройки уведомлений",  Icon: BellIcon,                  color: B, bg: BL },
          { label: "Поделиться профилем",    Icon: ShareIcon,                 color: GM, bg: GL },
          { label: "Идентификация",          Icon: IdentificationIcon,        color: BM, bg: BL },
        ].map((item, i) => (
          <button key={i} className="card-game w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-left hover-lift">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: item.bg }}>
              <item.Icon className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <span className="text-sm font-medium flex-1" style={{ color: "#2d2015" }}>{item.label}</span>
            <ChevronRightIcon className="w-4 h-4" style={{ color: BM }} />
          </button>
        ))}
        <button onClick={onLogout} className="card-game w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-left hover-lift">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#fef2f2" }}>
            <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-sm font-medium flex-1 text-red-500">Выйти из аккаунта</span>
        </button>
      </div>
    </div>
  );
}

// ─── XP Toast ─────────────────────────────────────────────────────────────────
function XpToast({ xp, onDone }: { xp: number; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
      <div className="px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 text-white shadow-green"
        style={{ background: G, boxShadow: `0 4px 20px ${G}50` }}>
        <BoltIcon className="w-4 h-4" />+{xp} XP получено!
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<Tab>("courses");
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const checkSession = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setAuthChecked(true); return; }
    const data = await apiGet(AUTH_URL);
    if (data.user) setUser(data.user);
    else localStorage.removeItem(TOKEN_KEY);
    setAuthChecked(true);
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const achievementsLoaded = useRef(false);
  useEffect(() => {
    if (user && !achievementsLoaded.current) {
      achievementsLoaded.current = true;
      api({ action: "get_achievements" }).then(d => { if (d.achievements) setAchievements(d.achievements); });
    }
  }, [user]);

  const handleAuth = (u: User) => setUser(u);

  const handleLogout = async () => {
    await authPost({ action: "logout" });
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const handleXpGain = (xp: number, totalXp: number) => {
    setXpToast(xp);
    if (totalXp >= 0 && user) setUser(u => u ? { ...u, xp: totalXp, level: Math.max(1, Math.floor(totalXp / 300)) } : u);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse" style={{ background: GL }}>
            <AcademicCapIcon className="w-9 h-9" style={{ color: G }} />
          </div>
          <div className="text-sm font-rubik" style={{ color: BM }}>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  const renderTab = () => {
    switch (tab) {
      case "courses":      return <CoursesTab onXpGain={handleXpGain} />;
      case "tasks":        return <TasksTab onXpGain={handleXpGain} />;
      case "rating":       return <RatingTab />;
      case "achievements": return <AchievementsTab />;
      case "community":    return <CommunityTab />;
      case "profile":      return <ProfileTab user={user} onLogout={handleLogout} achievements={achievements} />;
    }
  };

  return (
    <div className="min-h-screen grid-bg font-rubik">
      {xpToast !== null && <XpToast xp={xpToast} onDone={() => setXpToast(null)} />}
      <div className="max-w-2xl mx-auto px-4 pb-28 pt-6">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: G }}>
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-mono-rubik text-lg tracking-tight" style={{ color: G }}>AIQuest</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: GL, border: `1px solid ${G}30` }}>
              <BoltIcon className="w-4 h-4" style={{ color: G }} />
              <span className="font-bold text-sm" style={{ color: G }}>{user.xp.toLocaleString()} XP</span>
            </div>
            <button onClick={() => setTab("profile")}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
              style={{ background: BL, border: `1px solid ${B}30` }}>
              <UserCircleIcon className="w-5 h-5" style={{ color: B }} />
            </button>
          </div>
        </div>
        <div key={tab}>{renderTab()}</div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-2xl mx-auto px-4 pb-4">
          <div className="rounded-2xl px-2 py-2 flex items-center justify-around"
            style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", border: "1px solid #e8e0d6", boxShadow: "0 -2px 16px rgba(0,0,0,0.08)" }}>
            {NAV_ITEMS.map(item => {
              const active = tab === item.id;
              return (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[48px]"
                  style={active ? { background: GL } : {}}>
                  <item.Icon className={`w-5 h-5 transition-all duration-200 ${active ? "scale-110" : ""}`}
                    style={{ color: active ? G : "#a0917e" }} />
                  <span className="text-[10px] font-semibold transition-colors duration-200"
                    style={{ color: active ? G : "#a0917e" }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
