-- Курсы
CREATE TABLE IF NOT EXISTS t_p62618369_ai_ugc_gaming_servic.courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    duration VARCHAR(20),
    level_name VARCHAR(20),
    color_gradient VARCHAR(60),
    accent_color VARCHAR(10),
    total_lessons INTEGER DEFAULT 0,
    tags TEXT[],
    sort_order INTEGER DEFAULT 0
);

-- Прогресс пользователя по курсам
CREATE TABLE IF NOT EXISTS t_p62618369_ai_ugc_gaming_servic.user_course_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p62618369_ai_ugc_gaming_servic.users(id),
    course_id INTEGER REFERENCES t_p62618369_ai_ugc_gaming_servic.courses(id),
    lessons_done INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    UNIQUE(user_id, course_id)
);

-- Задания
CREATE TABLE IF NOT EXISTS t_p62618369_ai_ugc_gaming_servic.tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    deadline_label VARCHAR(30),
    difficulty VARCHAR(20),
    emoji VARCHAR(10),
    accent_color VARCHAR(10),
    sort_order INTEGER DEFAULT 0
);

-- Выполненные задания пользователями
CREATE TABLE IF NOT EXISTS t_p62618369_ai_ugc_gaming_servic.user_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p62618369_ai_ugc_gaming_servic.users(id),
    task_id INTEGER REFERENCES t_p62618369_ai_ugc_gaming_servic.tasks(id),
    completed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, task_id)
);

-- Достижения
CREATE TABLE IF NOT EXISTS t_p62618369_ai_ugc_gaming_servic.achievements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(200),
    emoji VARCHAR(10),
    xp_reward INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'Обычное',
    accent_color VARCHAR(10),
    sort_order INTEGER DEFAULT 0
);

-- Достижения пользователей
CREATE TABLE IF NOT EXISTS t_p62618369_ai_ugc_gaming_servic.user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p62618369_ai_ugc_gaming_servic.users(id),
    achievement_id INTEGER REFERENCES t_p62618369_ai_ugc_gaming_servic.achievements(id),
    unlocked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Посты сообщества
CREATE TABLE IF NOT EXISTS t_p62618369_ai_ugc_gaming_servic.posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p62618369_ai_ugc_gaming_servic.users(id),
    content TEXT NOT NULL,
    tag VARCHAR(50),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Лайки постов
CREATE TABLE IF NOT EXISTS t_p62618369_ai_ugc_gaming_servic.post_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p62618369_ai_ugc_gaming_servic.users(id),
    post_id INTEGER REFERENCES t_p62618369_ai_ugc_gaming_servic.posts(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);
