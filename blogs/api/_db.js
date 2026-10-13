import { neon } from '@neondatabase/serverless';
import { createHash, timingSafeEqual } from 'node:crypto';

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED;

export const sql = url ? neon(url) : null;

let ready = null;

// Cria as tabelas na primeira chamada (e só nessa).
export function init() {
  if (!sql) throw new Error('Banco não configurado. Conecte o Neon e defina DATABASE_URL na Vercel.');
  if (!ready) {
    ready = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT '',
        tags TEXT NOT NULL DEFAULT '',
        author TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'published',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS summary_ai BOOLEAN NOT NULL DEFAULT false`;
      await sql`CREATE TABLE IF NOT EXISTS blog_images (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        mime TEXT NOT NULL,
        data TEXT NOT NULL
      )`;
      await sql`CREATE INDEX IF NOT EXISTS blog_images_post_idx ON blog_images (post_id)`;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

const hash = (s) => createHash('sha256').update(String(s)).digest();

// Senha do painel: variável BLOG_PASSWORD, ou 2015 se não existir.
export function isAdmin(req) {
  const given = req.headers['x-admin-password'] || '';
  const real = process.env.BLOG_PASSWORD || '2015';
  return timingSafeEqual(hash(given), hash(real));
}

export function send(res, status, obj) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(obj);
}
