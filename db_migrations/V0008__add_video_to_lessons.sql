-- Добавляем видео к урокам
ALTER TABLE t_p62618369_ai_ugc_gaming_servic.lessons
    ADD COLUMN IF NOT EXISTS video_url TEXT,
    ADD COLUMN IF NOT EXISTS video_xp INTEGER DEFAULT 30;

-- Таблица просмотров видео (чтобы не давать XP дважды)
CREATE TABLE IF NOT EXISTS t_p62618369_ai_ugc_gaming_servic.user_video_views (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p62618369_ai_ugc_gaming_servic.users(id),
    lesson_id INTEGER REFERENCES t_p62618369_ai_ugc_gaming_servic.lessons(id),
    viewed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Тестовые Vimeo-видео для первых уроков
UPDATE t_p62618369_ai_ugc_gaming_servic.lessons
SET video_url = 'https://vimeo.com/76979871', video_xp = 30
WHERE day_number = 1;

UPDATE t_p62618369_ai_ugc_gaming_servic.lessons
SET video_url = 'https://vimeo.com/148751763', video_xp = 30
WHERE day_number = 2;

UPDATE t_p62618369_ai_ugc_gaming_servic.lessons
SET video_url = 'https://vimeo.com/217499569', video_xp = 30
WHERE day_number = 3;

UPDATE t_p62618369_ai_ugc_gaming_servic.lessons
SET video_url = 'https://vimeo.com/259411563', video_xp = 30
WHERE day_number = 4;

UPDATE t_p62618369_ai_ugc_gaming_servic.lessons
SET video_url = 'https://vimeo.com/76979871', video_xp = 30
WHERE day_number = 5;

UPDATE t_p62618369_ai_ugc_gaming_servic.lessons
SET video_url = 'https://vimeo.com/148751763', video_xp = 30
WHERE day_number = 6;

UPDATE t_p62618369_ai_ugc_gaming_servic.lessons
SET video_url = 'https://vimeo.com/217499569', video_xp = 30
WHERE day_number = 7;
