-- Таблица ответов гостей. Приложение создаёт её само при первом запросе (lib/storage-postgres.ts),
-- этот файл — для справки или ручного запуска в SQL Editor (Vercel → Storage → Neon, или Neon Console).

CREATE TABLE IF NOT EXISTS rsvp_entries (
  id           text        PRIMARY KEY,
  name         text        NOT NULL,
  drinks       text[]      NOT NULL DEFAULT '{}',
  custom_drink text        NOT NULL DEFAULT '',
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rsvp_entries_submitted_at_idx ON rsvp_entries (submitted_at);
