-- Создаём системного пользователя для демо-постов
INSERT INTO t_p62618369_ai_ugc_gaming_servic.users (username, email, password_hash, avatar, xp, level)
VALUES
  ('Алекс_Про',  'alex_pro@aiquest.demo',   'demo', '🦁', 12450, 42),
  ('Маша_ИИ',   'masha_ai@aiquest.demo',    'demo', '🦊', 11230, 39),
  ('DmitryAI',  'dmitry_ai@aiquest.demo',   'demo', '🐺', 10890, 37),
  ('ИринаК',    'irina_k@aiquest.demo',     'demo', '🦋',  8760, 30)
ON CONFLICT (username) DO NOTHING;

-- Демо-посты сообщества
INSERT INTO t_p62618369_ai_ugc_gaming_servic.posts (user_id, content, tag, likes_count, comments_count, created_at)
SELECT u.id,
       'Только что завершил курс по Midjourney v6! Промпты для реалистичных людей теперь работают в разы лучше. Делюсь своим лучшим промптом в комментариях 👇',
       'Midjourney', 42, 8,
       NOW() - INTERVAL '5 minutes'
FROM t_p62618369_ai_ugc_gaming_servic.users u WHERE u.username = 'Алекс_Про' LIMIT 1;

INSERT INTO t_p62618369_ai_ugc_gaming_servic.posts (user_id, content, tag, likes_count, comments_count, created_at)
SELECT u.id,
       'GPT-4o vs Claude 3.5 — мой честный сравнительный обзор после 2 недель тестирования. Спойлер: у обоих есть крутые фишки для UGC!',
       'Обзор', 87, 23,
       NOW() - INTERVAL '1 hour'
FROM t_p62618369_ai_ugc_gaming_servic.users u WHERE u.username = 'Маша_ИИ' LIMIT 1;

INSERT INTO t_p62618369_ai_ugc_gaming_servic.posts (user_id, content, tag, likes_count, comments_count, created_at)
SELECT u.id,
       'Автоматизировал создание контента с помощью n8n + OpenAI. Теперь 50 постов в день делаются за 10 минут! Готов поделиться флоу.',
       'Автоматизация', 134, 45,
       NOW() - INTERVAL '3 hours'
FROM t_p62618369_ai_ugc_gaming_servic.users u WHERE u.username = 'DmitryAI' LIMIT 1;

INSERT INTO t_p62618369_ai_ugc_gaming_servic.posts (user_id, content, tag, likes_count, comments_count, created_at)
SELECT u.id,
       'Попробовала Sora для генерации видео — результаты просто WOW! Качество намного лучше, чем ожидала. Видео в комментариях!',
       'Видео-ИИ', 56, 12,
       NOW() - INTERVAL '1 day'
FROM t_p62618369_ai_ugc_gaming_servic.users u WHERE u.username = 'ИринаК' LIMIT 1;
