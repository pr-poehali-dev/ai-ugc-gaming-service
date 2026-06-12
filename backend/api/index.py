"""Основное API: курсы, задания, достижения, рейтинг, сообщество, лайки, выполнение заданий."""
import json
import os
import psycopg2
from datetime import datetime

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p62618369_ai_ugc_gaming_servic')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def ok(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, default=str)}


def err(msg, status=400):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}


def get_user_by_token(cur, token):
    if not token:
        return None
    cur.execute(
        f"""SELECT u.id, u.username, u.avatar, u.xp, u.level, u.streak
            FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id
            WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    token = event.get('headers', {}).get('X-Session-Token', '')
    action = body.get('action', '') if method == 'POST' else (event.get('queryStringParameters') or {}).get('action', '')

    conn = get_conn()
    cur = conn.cursor()
    user_row = get_user_by_token(cur, token)
    user_id = user_row[0] if user_row else None

    try:
        if action == 'get_courses' or (method == 'GET' and not action):
            return get_courses(cur, user_id)
        if action == 'get_tasks':
            return get_tasks(cur, user_id)
        if action == 'complete_task':
            if not user_id:
                return err('Не авторизован', 401)
            return complete_task(cur, conn, user_id, body.get('task_id'))
        if action == 'get_rating':
            return get_rating(cur, user_id)
        if action == 'get_achievements':
            return get_achievements(cur, user_id)
        if action == 'get_posts':
            return get_posts(cur, user_id)
        if action == 'like_post':
            if not user_id:
                return err('Не авторизован', 401)
            return toggle_like(cur, conn, user_id, body.get('post_id'))
        if action == 'create_post':
            if not user_id:
                return err('Не авторизован', 401)
            return create_post(cur, conn, user_id, body)
        if action == 'update_course_progress':
            if not user_id:
                return err('Не авторизован', 401)
            return update_course_progress(cur, conn, user_id, body.get('course_id'), body.get('lessons_done'))
        return err('Unknown action', 404)
    finally:
        conn.close()


def get_courses(cur, user_id):
    cur.execute(f"""
        SELECT c.id, c.title, c.emoji, c.xp_reward, c.duration, c.level_name,
               c.color_gradient, c.accent_color, c.total_lessons, c.tags,
               COALESCE(p.lessons_done, 0) as lessons_done
        FROM {SCHEMA}.courses c
        LEFT JOIN {SCHEMA}.user_course_progress p
            ON p.course_id = c.id AND p.user_id = %s
        ORDER BY c.sort_order
    """, (user_id,))
    rows = cur.fetchall()
    courses = []
    for r in rows:
        total = r[8] or 1
        done = r[10]
        courses.append({
            'id': r[0], 'title': r[1], 'emoji': r[2], 'xp': r[3],
            'duration': r[4], 'level': r[5], 'color': r[6], 'accent': r[7],
            'lessons': total, 'done': done,
            'progress': round(done / total * 100) if total > 0 else 0,
            'tags': list(r[9]) if r[9] else [],
        })
    return ok({'courses': courses})


def get_tasks(cur, user_id):
    cur.execute(f"""
        SELECT t.id, t.title, t.xp_reward, t.deadline_label, t.difficulty, t.emoji, t.accent_color,
               CASE WHEN ut.id IS NOT NULL THEN true ELSE false END as completed
        FROM {SCHEMA}.tasks t
        LEFT JOIN {SCHEMA}.user_tasks ut ON ut.task_id = t.id AND ut.user_id = %s
        ORDER BY t.sort_order
    """, (user_id,))
    rows = cur.fetchall()
    tasks = [{'id': r[0], 'title': r[1], 'xp': r[2], 'deadline': r[3],
               'difficulty': r[4], 'emoji': r[5], 'color': r[6], 'completed': r[7]} for r in rows]
    return ok({'tasks': tasks})


def complete_task(cur, conn, user_id, task_id):
    if not task_id:
        return err('task_id required')
    cur.execute(f"SELECT id FROM {SCHEMA}.user_tasks WHERE user_id = %s AND task_id = %s", (user_id, task_id))
    if cur.fetchone():
        return err('Задание уже выполнено')
    cur.execute(f"SELECT xp_reward FROM {SCHEMA}.tasks WHERE id = %s", (task_id,))
    task = cur.fetchone()
    if not task:
        return err('Задание не найдено', 404)
    xp_reward = task[0]
    cur.execute(f"INSERT INTO {SCHEMA}.user_tasks (user_id, task_id) VALUES (%s, %s)", (user_id, task_id))
    cur.execute(f"UPDATE {SCHEMA}.users SET xp = xp + %s WHERE id = %s RETURNING xp, level", (xp_reward, user_id))
    row = cur.fetchone()
    new_xp, level = row
    new_level = max(1, new_xp // 300)
    if new_level != level:
        cur.execute(f"UPDATE {SCHEMA}.users SET level = %s WHERE id = %s", (new_level, user_id))
    conn.commit()
    return ok({'ok': True, 'xp_gained': xp_reward, 'total_xp': new_xp, 'level': new_level})


def get_rating(cur, user_id):
    cur.execute(f"""
        SELECT id, username, avatar, xp, level,
               RANK() OVER (ORDER BY xp DESC) as rank
        FROM {SCHEMA}.users
        ORDER BY xp DESC
        LIMIT 20
    """)
    rows = cur.fetchall()
    rating = []
    badges = {1: '🏆', 2: '🥈', 3: '🥉'}
    for r in rows:
        rank = r[5]
        rating.append({
            'rank': rank, 'name': r[1], 'avatar': r[2], 'xp': r[3], 'level': r[4],
            'badge': badges.get(rank, '⭐'),
            'isMe': r[0] == user_id,
        })
    return ok({'rating': rating})


def get_achievements(cur, user_id):
    cur.execute(f"""
        SELECT a.id, a.title, a.description, a.emoji, a.xp_reward, a.rarity, a.accent_color,
               CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as unlocked
        FROM {SCHEMA}.achievements a
        LEFT JOIN {SCHEMA}.user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = %s
        ORDER BY a.sort_order
    """, (user_id,))
    rows = cur.fetchall()
    achievements = [{'id': r[0], 'title': r[1], 'desc': r[2], 'emoji': r[3],
                     'xp': r[4], 'rarity': r[5], 'color': r[6], 'unlocked': r[7]} for r in rows]
    return ok({'achievements': achievements})


def get_posts(cur, user_id):
    cur.execute(f"""
        SELECT p.id, u.username, u.avatar, p.content, p.tag, p.likes_count, p.comments_count,
               p.created_at, u.xp,
               CASE WHEN pl.id IS NOT NULL THEN true ELSE false END as liked_by_me
        FROM {SCHEMA}.posts p
        JOIN {SCHEMA}.users u ON p.user_id = u.id
        LEFT JOIN {SCHEMA}.post_likes pl ON pl.post_id = p.id AND pl.user_id = %s AND pl.active = TRUE
        ORDER BY p.created_at DESC
        LIMIT 20
    """, (user_id,))
    rows = cur.fetchall()
    COLORS = ['#a855f7', '#f472b6', '#22d3ee', '#4ade80', '#fb923c', '#facc15']
    posts = []
    for i, r in enumerate(rows):
        created = r[7]
        now = datetime.now()
        diff = now - created
        if diff.seconds < 3600:
            time_label = f"{diff.seconds // 60} мин назад"
        elif diff.days == 0:
            time_label = f"{diff.seconds // 3600} ч назад"
        elif diff.days == 1:
            time_label = "Вчера"
        else:
            time_label = f"{diff.days} дн назад"
        posts.append({
            'id': r[0], 'author': r[1], 'avatar': r[2], 'content': r[3],
            'tag': r[4], 'likes': r[5], 'comments': r[6],
            'time': time_label, 'color': COLORS[i % len(COLORS)],
            'liked_by_me': r[9],
        })
    return ok({'posts': posts})


def toggle_like(cur, conn, user_id, post_id):
    if not post_id:
        return err('post_id required')
    cur.execute(f"SELECT id, active FROM {SCHEMA}.post_likes WHERE user_id = %s AND post_id = %s", (user_id, post_id))
    existing = cur.fetchone()
    if existing:
        currently_active = existing[1]
        new_active = not currently_active
        delta = 1 if new_active else -1
        cur.execute(f"UPDATE {SCHEMA}.post_likes SET active = %s WHERE id = %s", (new_active, existing[0]))
        cur.execute(f"UPDATE {SCHEMA}.posts SET likes_count = GREATEST(0, likes_count + %s) WHERE id = %s RETURNING likes_count", (delta, post_id))
        new_count = cur.fetchone()[0]
        conn.commit()
        return ok({'liked': new_active, 'likes': new_count})
    else:
        cur.execute(
            f"INSERT INTO {SCHEMA}.post_likes (user_id, post_id, active) VALUES (%s, %s, TRUE) ON CONFLICT DO NOTHING",
            (user_id, post_id)
        )
        cur.execute(f"UPDATE {SCHEMA}.posts SET likes_count = likes_count + 1 WHERE id = %s RETURNING likes_count", (post_id,))
        new_count = cur.fetchone()[0]
        conn.commit()
        return ok({'liked': True, 'likes': new_count})


def create_post(cur, conn, user_id, body):
    content = (body.get('content') or '').strip()
    tag = (body.get('tag') or 'Пост').strip()
    if not content:
        return err('Текст поста обязателен')
    if len(content) > 1000:
        return err('Пост слишком длинный (макс 1000 символов)')
    cur.execute(
        f"INSERT INTO {SCHEMA}.posts (user_id, content, tag) VALUES (%s, %s, %s) RETURNING id",
        (user_id, content, tag)
    )
    post_id = cur.fetchone()[0]
    conn.commit()
    return ok({'ok': True, 'post_id': post_id})


def update_course_progress(cur, conn, user_id, course_id, lessons_done):
    if course_id is None or lessons_done is None:
        return err('course_id and lessons_done required')
    cur.execute(f"SELECT total_lessons, xp_reward FROM {SCHEMA}.courses WHERE id = %s", (course_id,))
    course = cur.fetchone()
    if not course:
        return err('Курс не найден', 404)
    total_lessons, xp_reward = course
    lessons_done = min(int(lessons_done), total_lessons)
    cur.execute(f"""
        INSERT INTO {SCHEMA}.user_course_progress (user_id, course_id, lessons_done)
        VALUES (%s, %s, %s)
        ON CONFLICT (user_id, course_id) DO UPDATE SET lessons_done = EXCLUDED.lessons_done,
        completed_at = CASE WHEN EXCLUDED.lessons_done >= %s THEN NOW() ELSE NULL END
    """, (user_id, course_id, lessons_done, total_lessons))
    if lessons_done >= total_lessons:
        cur.execute(f"UPDATE {SCHEMA}.users SET xp = xp + %s WHERE id = %s RETURNING xp", (xp_reward, user_id))
        new_xp = cur.fetchone()[0]
        new_level = max(1, new_xp // 300)
        cur.execute(f"UPDATE {SCHEMA}.users SET level = %s WHERE id = %s", (new_level, user_id))
    conn.commit()
    return ok({'ok': True, 'lessons_done': lessons_done})