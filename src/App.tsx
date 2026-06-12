import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/16228047-1a09-4827-af8c-d5ca8dd48885";
const TOKEN_KEY = "aiquest_token";

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
}

async function apiAuth(body: Record<string, string>) {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function apiMe(token: string) {
  const res = await fetch(AUTH_URL, {
    headers: { "X-Session-Token": token },
  });
  return res.json();
}

function AuthScreen({ onAuth }: { onAuth: (user: User, token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", email: "", login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const body = mode === "register"
      ? { action: "register", username: form.username, email: form.email, password: form.password }
      : { action: "login", login: form.login, password: form.password };
    const data = await apiAuth(body);
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    localStorage.setItem(TOKEN_KEY, data.token);
    onAuth(data.user, data.token);
  };

  return (
    <div className="min-h-screen bg-background grid-bg font-rubik flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-neon-purple/20 border-2 border-neon-purple/50 flex items-center justify-center text-4xl mx-auto mb-4 neon-glow-purple animate-float">
            🧠
          </div>
          <h1 className="font-mono-rubik text-3xl text-white tracking-tight">AIQuest</h1>
          <p className="text-white/40 text-sm mt-1">Обучение ИИ — это игра</p>
        </div>

        <div className="card-game rounded-3xl p-6" style={{ border: "1px solid rgba(168,85,247,0.2)" }}>
          <div className="flex rounded-2xl bg-white/5 p-1 mb-6">
            {(["login", "register"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                style={mode === m ? { background: "rgba(168,85,247,0.3)", color: "#a855f7" } : { color: "rgba(255,255,255,0.4)" }}
              >
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="text-white/50 text-xs mb-1 block">Имя игрока</label>
                <input
                  value={form.username}
                  onChange={set("username")}
                  placeholder="SuperAI_User"
                  className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder-white/25 text-sm outline-none focus:border-neon-purple/50 transition-colors"
                />
              </div>
            )}
            {mode === "register" ? (
              <div>
                <label className="text-white/50 text-xs mb-1 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder-white/25 text-sm outline-none focus:border-neon-purple/50 transition-colors"
                />
              </div>
            ) : (
              <div>
                <label className="text-white/50 text-xs mb-1 block">Email или имя</label>
                <input
                  value={form.login}
                  onChange={set("login")}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder-white/25 text-sm outline-none focus:border-neon-purple/50 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="text-white/50 text-xs mb-1 block">Пароль</label>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder-white/25 text-sm outline-none focus:border-neon-purple/50 transition-colors"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50 mt-2"
              style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 0 20px rgba(168,85,247,0.35)" }}
            >
              {loading ? "⏳ Загрузка..." : mode === "login" ? "⚡ Войти в игру" : "🚀 Создать аккаунт"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/25 text-xs mt-4">
          Учи ИИ-сервисы · Зарабатывай XP · Побеждай
        </p>
      </div>
    </div>
  );
}

type Tab = "courses" | "tasks" | "rating" | "profile" | "community" | "achievements";

const COURSES = [
  { id: 1, title: "ChatGPT с нуля", emoji: "🤖", xp: 500, duration: "2ч 30м", level: "Новичок", color: "from-purple-600 to-purple-900", accent: "#a855f7", progress: 65, lessons: 12, done: 8, tags: ["Промпты", "GPT-4"] },
  { id: 2, title: "Midjourney для UGC", emoji: "🎨", xp: 750, duration: "3ч 15м", level: "Средний", color: "from-pink-600 to-pink-900", accent: "#f472b6", progress: 30, lessons: 15, done: 5, tags: ["Изображения", "Промпты"] },
  { id: 3, title: "Claude & Gemini", emoji: "⚡", xp: 600, duration: "2ч", level: "Средний", color: "from-cyan-600 to-cyan-900", accent: "#22d3ee", progress: 0, lessons: 10, done: 0, tags: ["LLM", "Сравнение"] },
  { id: 4, title: "ИИ для видео", emoji: "🎬", xp: 900, duration: "4ч", level: "Продвинутый", color: "from-orange-600 to-orange-900", accent: "#fb923c", progress: 10, lessons: 18, done: 2, tags: ["Видео", "Sora"] },
  { id: 5, title: "Автоматизация с ИИ", emoji: "⚙️", xp: 800, duration: "3ч 45м", level: "Продвинутый", color: "from-green-600 to-green-900", accent: "#4ade80", progress: 0, lessons: 16, done: 0, tags: ["Автоматизация", "n8n"] },
  { id: 6, title: "ИИ-копирайтинг", emoji: "✍️", xp: 450, duration: "1ч 45м", level: "Новичок", color: "from-yellow-600 to-yellow-900", accent: "#facc15", progress: 90, lessons: 8, done: 7, tags: ["Тексты", "SEO"] },
];

const TASKS = [
  { id: 1, title: "Напишите 3 промпта для ChatGPT", xp: 150, deadline: "Сегодня", difficulty: "Легко", emoji: "✏️", color: "#a855f7" },
  { id: 2, title: "Создайте UGC пост про Midjourney", xp: 300, deadline: "2 дня", difficulty: "Средне", emoji: "📱", color: "#f472b6" },
  { id: 3, title: "Сравните Claude и GPT-4", xp: 200, deadline: "3 дня", difficulty: "Средне", emoji: "🔍", color: "#22d3ee" },
  { id: 4, title: "Смонтируй видео с ИИ-инструментами", xp: 500, deadline: "5 дней", difficulty: "Сложно", emoji: "🎥", color: "#fb923c" },
  { id: 5, title: "Запусти автоматизацию в Zapier", xp: 400, deadline: "Неделя", difficulty: "Сложно", emoji: "⚙️", color: "#4ade80" },
];

const RATING = [
  { rank: 1, name: "Алекс_Про", xp: 12450, avatar: "🦁", badge: "🏆", level: 42 },
  { rank: 2, name: "Маша_ИИ", xp: 11230, avatar: "🦊", badge: "🥈", level: 39 },
  { rank: 3, name: "DmitryAI", xp: 10890, avatar: "🐺", badge: "🥉", level: 37 },
  { rank: 4, name: "Nikita_UGC", xp: 9340, avatar: "🐉", badge: "⭐", level: 33 },
  { rank: 5, name: "ИринаК", xp: 8760, avatar: "🦋", badge: "⭐", level: 30 },
  { rank: 6, name: "ТыСам", xp: 7820, avatar: "🚀", badge: "⭐", level: 27, isMe: true },
  { rank: 7, name: "Pavel_G", xp: 6540, avatar: "🎯", badge: "⭐", level: 23 },
  { rank: 8, name: "Sasha_Pro", xp: 5920, avatar: "💎", badge: "⭐", level: 21 },
];

const ACHIEVEMENTS = [
  { id: 1, title: "Первый шаг", desc: "Пройди первый урок", emoji: "👣", xp: 50, unlocked: true, rarity: "Обычное", color: "#a855f7" },
  { id: 2, title: "Скоростной", desc: "Заверши курс за 1 день", emoji: "⚡", xp: 200, unlocked: true, rarity: "Редкое", color: "#facc15" },
  { id: 3, title: "UGC Мастер", desc: "Опубликуй 10 заданий", emoji: "🎬", xp: 500, unlocked: true, rarity: "Эпическое", color: "#f472b6" },
  { id: 4, title: "Промпт-гений", desc: "Напиши 50 промптов", emoji: "🧠", xp: 300, unlocked: false, rarity: "Редкое", color: "#22d3ee" },
  { id: 5, title: "Топ-10", desc: "Попади в топ-10 рейтинга", emoji: "🏆", xp: 1000, unlocked: false, rarity: "Легендарное", color: "#fb923c" },
  { id: 6, title: "Социальный", desc: "Получи 100 лайков", emoji: "❤️", xp: 400, unlocked: false, rarity: "Эпическое", color: "#4ade80" },
  { id: 7, title: "Нетстоп", desc: "7 дней подряд", emoji: "🔥", xp: 250, unlocked: true, rarity: "Редкое", color: "#fb923c" },
  { id: 8, title: "Всезнайка", desc: "Пройди все курсы", emoji: "🎓", xp: 2000, unlocked: false, rarity: "Легендарное", color: "#a855f7" },
];

const COMMUNITY = [
  { id: 1, author: "Алекс_Про", avatar: "🦁", time: "5 мин назад", content: "Только что завершил курс по Midjourney v6! Промпты для реалистичных людей теперь работают в разы лучше. Делюсь своим лучшим промптом:", tag: "Midjourney", likes: 42, comments: 8, color: "#a855f7" },
  { id: 2, author: "Маша_ИИ", avatar: "🦊", time: "1 час назад", content: "GPT-4o vs Claude 3.5 — мой честный сравнительный обзор после 2 недель тестирования. Спойлер: у обоих есть крутые фишки для UGC!", tag: "Обзор", likes: 87, comments: 23, color: "#f472b6" },
  { id: 3, author: "DmitryAI", avatar: "🐺", time: "3 часа назад", content: "Автоматизировал создание контента с помощью n8n + OpenAI. Теперь 50 постов в день делаются за 10 минут!", tag: "Автоматизация", likes: 134, comments: 45, color: "#22d3ee" },
  { id: 4, author: "ИринаК", avatar: "🦋", time: "Вчера", content: "Попробовала Sora для генерации видео — результаты просто WOW! Качество намного лучше, чем ожидала.", tag: "Видео-ИИ", likes: 56, comments: 12, color: "#4ade80" },
];

const NAV_ITEMS: { id: Tab; label: string; emoji: string }[] = [
  { id: "courses", label: "Курсы", emoji: "📚" },
  { id: "tasks", label: "Задания", emoji: "✅" },
  { id: "rating", label: "Рейтинг", emoji: "🏆" },
  { id: "achievements", label: "Достижения", emoji: "🎖️" },
  { id: "community", label: "Сообщество", emoji: "💬" },
  { id: "profile", label: "Профиль", emoji: "👤" },
];

const rarityColor: Record<string, string> = {
  "Легендарное": "#fb923c",
  "Эпическое": "#a855f7",
  "Редкое": "#22d3ee",
  "Обычное": "#9ca3af",
};

function XpBar({ progress, color = "#a855f7" }: { progress: number; color?: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full relative overflow-hidden transition-all duration-700"
        style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }}
      >
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>
    </div>
  );
}

function CoursesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-white">Курсы по ИИ</h2>
          <p className="text-white/50 text-sm mt-0.5">6 курсов · 79 уроков</p>
        </div>
        <div className="badge-game bg-neon-purple/20 text-neon-purple border border-neon-purple/30">🔥 3 новых</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COURSES.map((c, i) => (
          <div key={c.id} className={`card-game rounded-2xl overflow-hidden hover-lift cursor-pointer animate-fade-in stagger-${Math.min(i + 1, 6)}`}>
            <div className={`h-1.5 w-full bg-gradient-to-r ${c.color}`} />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${c.accent}22`, border: `1px solid ${c.accent}44` }}>
                    {c.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm leading-tight">{c.title}</h3>
                    <p className="text-white/40 text-xs mt-0.5">{c.duration} · {c.lessons} уроков</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold" style={{ color: c.accent }}>+{c.xp} XP</div>
                  <div className="badge-game mt-1 text-[10px]" style={{ background: `${c.accent}22`, color: c.accent, border: `1px solid ${c.accent}33` }}>{c.level}</div>
                </div>
              </div>
              <div className="flex gap-1.5 mb-3">
                {c.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/50 border border-white/10">{t}</span>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white/40">
                  <span>{c.done}/{c.lessons} уроков</span>
                  <span>{c.progress}%</span>
                </div>
                <XpBar progress={c.progress} color={c.accent} />
              </div>
              <button
                className="mt-3 w-full py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{
                  background: c.progress > 0 ? `${c.accent}22` : `linear-gradient(135deg, ${c.accent}, ${c.accent}aa)`,
                  color: c.progress > 0 ? c.accent : '#fff',
                  border: c.progress > 0 ? `1px solid ${c.accent}44` : 'none',
                }}
              >
                {c.progress === 0 ? "Начать курс" : c.progress === 100 ? "✓ Пройден" : "Продолжить"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TasksTab() {
  const [done, setDone] = useState<number[]>([3]);
  const active = TASKS.filter(t => !done.includes(t.id));
  const completed = TASKS.filter(t => done.includes(t.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-white">Задания</h2>
          <p className="text-white/50 text-sm mt-0.5">{active.length} активных · {completed.length} выполнено</p>
        </div>
        <div className="badge-game bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30">
          ⚡ {TASKS.filter(t => !done.includes(t.id)).reduce((a, t) => a + t.xp, 0)} XP доступно
        </div>
      </div>
      <div className="space-y-3">
        {active.map((t, i) => (
          <div key={t.id} className={`card-game rounded-2xl p-4 animate-fade-in stagger-${i + 1} hover-lift`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${t.color}22`, border: `1px solid ${t.color}44` }}>
                {t.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm">{t.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-white/40">⏰ {t.deadline}</span>
                  <span className="badge-game text-[10px]" style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}33` }}>{t.difficulty}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-sm" style={{ color: t.color }}>+{t.xp}</div>
                <div className="text-[10px] text-white/40">XP</div>
              </div>
              <button
                onClick={() => setDone([...done, t.id])}
                className="ml-2 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 hover:opacity-80"
                style={{ background: `${t.color}33`, color: t.color }}
              >
                <Icon name="Check" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {completed.length > 0 && (
        <div>
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Выполнено</p>
          <div className="space-y-2">
            {completed.map(t => (
              <div key={t.id} className="card-game rounded-2xl p-4 opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-white/5">{t.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white/70 text-sm line-through">{t.title}</h3>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-neon-green/20 flex items-center justify-center">
                    <Icon name="Check" size={14} className="text-neon-green" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RatingTab() {
  const top3 = [RATING[1], RATING[0], RATING[2]];
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-white">Рейтинг</h2>
        <p className="text-white/50 text-sm mt-0.5">Топ игроков этой недели</p>
      </div>
      <div className="grid grid-cols-3 gap-3 animate-fade-in stagger-1">
        {top3.map((p, i) => {
          const isCenter = i === 1;
          return (
            <div key={p.rank} className={`card-game rounded-2xl p-4 text-center flex flex-col items-center gap-2 ${isCenter ? "neon-glow-yellow" : ""}`} style={isCenter ? { border: "1px solid #facc1544" } : {}}>
              <div className="text-3xl">{p.badge}</div>
              <div className={`text-4xl ${isCenter ? "animate-float" : ""}`}>{p.avatar}</div>
              <div className="font-bold text-white text-xs truncate w-full text-center">{p.name}</div>
              <div className="font-mono text-xs" style={{ color: isCenter ? "#facc15" : "#a855f7" }}>{p.xp.toLocaleString()} XP</div>
            </div>
          );
        })}
      </div>
      <div className="space-y-2">
        {RATING.map((p, i) => (
          <div key={p.rank} className={`card-game rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in stagger-${Math.min(i + 1, 6)} ${p.isMe ? "border border-neon-purple/40 neon-glow-purple" : ""}`}>
            <div className={`w-8 text-center font-bold text-sm ${p.rank <= 3 ? "text-neon-yellow" : "text-white/40"}`}>#{p.rank}</div>
            <div className="text-2xl">{p.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold text-sm ${p.isMe ? "text-neon-purple" : "text-white"}`}>{p.name}</span>
                {p.isMe && <span className="badge-game text-[9px] bg-neon-purple/20 text-neon-purple border border-neon-purple/30">Это ты</span>}
              </div>
              <div className="text-white/40 text-xs">Уровень {p.level}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-sm text-white">{p.xp.toLocaleString()}</div>
              <div className="text-[10px] text-white/40">XP</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsTab() {
  const unlocked = ACHIEVEMENTS.filter(a => a.unlocked);
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-white">Достижения</h2>
        <p className="text-white/50 text-sm mt-0.5">{unlocked.length}/{ACHIEVEMENTS.length} разблокировано</p>
      </div>
      <div className="card-game rounded-2xl p-4 animate-fade-in stagger-1">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/60">Прогресс коллекции</span>
          <span className="text-neon-purple font-bold">{unlocked.length}/{ACHIEVEMENTS.length}</span>
        </div>
        <XpBar progress={(unlocked.length / ACHIEVEMENTS.length) * 100} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((a, i) => (
          <div key={a.id} className={`card-game rounded-2xl p-4 animate-fade-in stagger-${Math.min(i + 1, 6)} ${a.unlocked ? "hover-lift cursor-pointer" : "opacity-40"}`} style={a.unlocked ? { border: `1px solid ${a.color}33` } : {}}>
            <div className="flex items-start justify-between mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={a.unlocked ? { background: `${a.color}22`, border: `1px solid ${a.color}33` } : { background: "rgba(255,255,255,0.05)" }}>
                {a.unlocked ? a.emoji : "🔒"}
              </div>
              <span className="badge-game text-[9px]" style={{ background: `${rarityColor[a.rarity]}22`, color: rarityColor[a.rarity], border: `1px solid ${rarityColor[a.rarity]}33` }}>{a.rarity}</span>
            </div>
            <h3 className="font-bold text-white text-sm">{a.title}</h3>
            <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{a.desc}</p>
            <div className="mt-2 font-bold text-xs" style={{ color: a.unlocked ? a.color : "#4b5563" }}>+{a.xp} XP</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityTab() {
  const [liked, setLiked] = useState<number[]>([]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-white">Сообщество</h2>
          <p className="text-white/50 text-sm mt-0.5">Делитесь опытом с ИИ</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-purple text-white text-sm font-semibold hover:opacity-90 transition-opacity active:scale-95">
          <Icon name="Plus" size={14} />
          Пост
        </button>
      </div>
      <div className="space-y-4">
        {COMMUNITY.map((p, i) => (
          <div key={p.id} className={`card-game rounded-2xl p-4 animate-fade-in stagger-${i + 1} hover-lift cursor-pointer`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${p.color}22`, border: `1px solid ${p.color}33` }}>{p.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">{p.author}</span>
                  <span className="badge-game text-[10px]" style={{ background: `${p.color}22`, color: p.color, border: `1px solid ${p.color}33` }}>{p.tag}</span>
                  <span className="text-white/30 text-xs ml-auto">{p.time}</span>
                </div>
                <p className="text-white/70 text-sm mt-2 leading-relaxed">{p.content}</p>
                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() => setLiked(liked.includes(p.id) ? liked.filter(x => x !== p.id) : [...liked, p.id])}
                    className={`flex items-center gap-1.5 text-xs transition-all active:scale-90 ${liked.includes(p.id) ? "text-neon-pink" : "text-white/40 hover:text-white/70"}`}
                  >
                    <Icon name="Heart" size={14} />
                    <span>{p.likes + (liked.includes(p.id) ? 1 : 0)}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                    <Icon name="MessageCircle" size={14} />
                    <span>{p.comments}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors ml-auto">
                    <Icon name="Share2" size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileTab({ user, onLogout }: { user: User; onLogout: () => void }) {
  const nextLevelXp = (user.level + 1) * 300;
  const xpToNext = Math.max(0, nextLevelXp - user.xp);
  return (
    <div className="space-y-5">
      <div className="card-game rounded-3xl p-6 animate-fade-in" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(34,211,238,0.08))", border: "1px solid rgba(168,85,247,0.25)" }}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl pulse-ring" style={{ background: "rgba(168,85,247,0.2)", border: "2px solid rgba(168,85,247,0.5)" }}>{user.avatar}</div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-neon-yellow flex items-center justify-center text-xs font-black text-black">{user.level}</div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-white">{user.username}</h2>
            <p className="text-white/50 text-sm">{user.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-neon-purple font-bold">{user.xp.toLocaleString()} XP</span>
              {user.streak > 0 && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="text-neon-orange text-sm">🔥 {user.streak} дней</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/50 mb-1.5">
            <span>Уровень {user.level}</span>
            <span>До {user.level + 1} уровня: {xpToNext} XP</span>
          </div>
          <XpBar progress={Math.min(100, (user.xp / nextLevelXp) * 100)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 animate-fade-in stagger-1">
        {[
          { label: "Курсов", value: "0", sub: "пройдено", emoji: "📚" },
          { label: "Заданий", value: "0", sub: "выполнено", emoji: "✅" },
          { label: "Серия", value: String(user.streak), sub: "дней 🔥", emoji: "🔥" },
        ].map((s, i) => (
          <div key={i} className="card-game rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{s.emoji}</div>
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-[11px] text-white/40">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="animate-fade-in stagger-2">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Достижения</p>
        <div className="flex gap-3 flex-wrap">
          {ACHIEVEMENTS.filter(a => a.unlocked).map(a => (
            <div key={a.id} className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl hover-lift cursor-pointer" style={{ background: `${a.color}22`, border: `1px solid ${a.color}44` }} title={a.title}>
              {a.emoji}
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2 animate-fade-in stagger-3">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Настройки</p>
        {[
          { label: "Редактировать профиль", icon: "Edit3", color: "#a855f7" },
          { label: "Настройки уведомлений", icon: "Bell", color: "#22d3ee" },
          { label: "Поделиться профилем", icon: "Share2", color: "#4ade80" },
        ].map((item, i) => (
          <button key={i} className="card-game w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-left hover-lift">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${item.color}22` }}>
              <Icon name={item.icon} size={16} style={{ color: item.color }} />
            </div>
            <span className="text-white/80 text-sm font-medium flex-1">{item.label}</span>
            <Icon name="ChevronRight" size={14} className="text-white/30" />
          </button>
        ))}
        <button
          onClick={onLogout}
          className="card-game w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-left hover-lift"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/15">
            <Icon name="LogOut" size={16} className="text-red-400" />
          </div>
          <span className="text-red-400 text-sm font-medium flex-1">Выйти из аккаунта</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("courses");
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const checkSession = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setAuthChecked(true); return; }
    const data = await apiMe(token);
    if (data.user) setUser(data.user);
    else localStorage.removeItem(TOKEN_KEY);
    setAuthChecked(true);
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const handleAuth = (u: User) => setUser(u);

  const handleLogout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) await apiAuth({ action: "logout" });
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl animate-float mb-4">🧠</div>
          <div className="text-white/40 text-sm font-rubik">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  const renderTab = () => {
    switch (tab) {
      case "courses": return <CoursesTab />;
      case "tasks": return <TasksTab />;
      case "rating": return <RatingTab />;
      case "achievements": return <AchievementsTab />;
      case "community": return <CommunityTab />;
      case "profile": return <ProfileTab user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="min-h-screen bg-background grid-bg font-rubik">
      <div className="max-w-2xl mx-auto px-4 pb-28 pt-6">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-neon-purple/20 border border-neon-purple/40 flex items-center justify-center text-lg">🧠</div>
            <span className="font-mono-rubik text-white text-lg tracking-tight">AIQuest</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neon-yellow/15 border border-neon-yellow/30">
              <span className="text-sm">⚡</span>
              <span className="font-bold text-neon-yellow text-sm">{user.xp.toLocaleString()} XP</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-lg cursor-pointer hover:scale-110 transition-transform" onClick={() => setTab("profile")}>
              {user.avatar}
            </div>
          </div>
        </div>
        <div key={tab}>{renderTab()}</div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-2xl mx-auto px-4 pb-4">
          <div className="rounded-2xl px-2 py-2 flex items-center justify-around" style={{ background: "rgba(10,8,20,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {NAV_ITEMS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[48px]"
                  style={active ? { background: "rgba(168,85,247,0.2)" } : {}}
                >
                  <span className={`text-lg transition-transform duration-200 ${active ? "scale-110" : ""}`}>{item.emoji}</span>
                  <span className={`text-[10px] font-semibold transition-colors duration-200 ${active ? "text-neon-purple" : "text-white/35"}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}