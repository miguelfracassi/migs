import { sql, init, isAdmin, send } from './_db.js';

const slugify = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'post';

const clean = (v, max) => String(v ?? '').trim().slice(0, max);

const tagsOf = (t) => (t ? t.split(',').map((x) => x.trim()).filter(Boolean) : []);

const card = (r) => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  summary: r.summary,
  summaryAi: !!r.summary_ai,
  category: r.category,
  tags: tagsOf(r.tags),
  author: r.author,
  status: r.status,
  created_at: r.created_at,
  updated_at: r.updated_at,
  cover: r.cover_id ? `/api/img?id=${r.cover_id}` : null,
});

function fields(b) {
  const status = b.status === 'draft' ? 'draft' : 'published';
  return {
    title: clean(b.title, 140),
    summary: clean(b.summary, 400),
    body: clean(b.body, 40000),
    category: clean(b.category, 40),
    tags: tagsOf(clean(b.tags, 200)).slice(0, 8).join(', '),
    author: clean(b.author, 60),
    status,
    summary_ai: b.summaryAi === true,
  };
}

export default async function handler(req, res) {
  try {
    await init();
    const admin = isAdmin(req);

    // ---------- leitura (pública) ----------
    if (req.method === 'GET') {
      const { slug, id, all } = req.query;

      if (slug || id) {
        const rows = id
          ? await sql`SELECT * FROM blog_posts WHERE id = ${Number(id) || 0}`
          : await sql`SELECT * FROM blog_posts WHERE slug = ${String(slug)}`;
        const p = rows[0];
        if (!p || (p.status !== 'published' && !admin)) return send(res, 404, { error: 'Post não encontrado' });
        const imgs = await sql`SELECT id, role FROM blog_images WHERE post_id = ${p.id} ORDER BY position, id`;
        const cover = imgs.find((i) => i.role === 'cover');
        return send(res, 200, {
          ...card({ ...p, cover_id: cover?.id }),
          body: p.body,
          coverId: cover?.id || null,
          gallery: imgs.filter((i) => i.role === 'gallery').map((i) => ({ id: i.id, url: `/api/img?id=${i.id}` })),
        });
      }

      const rows =
        admin && all
          ? await sql`SELECT p.id, p.slug, p.title, p.summary, p.summary_ai, p.category, p.tags, p.author, p.status, p.created_at, p.updated_at,
              (SELECT i.id FROM blog_images i WHERE i.post_id = p.id AND i.role = 'cover' ORDER BY i.position, i.id LIMIT 1) AS cover_id
              FROM blog_posts p ORDER BY p.created_at DESC`
          : await sql`SELECT p.id, p.slug, p.title, p.summary, p.summary_ai, p.category, p.tags, p.author, p.status, p.created_at, p.updated_at,
              (SELECT i.id FROM blog_images i WHERE i.post_id = p.id AND i.role = 'cover' ORDER BY i.position, i.id LIMIT 1) AS cover_id
              FROM blog_posts p WHERE p.status = 'published' ORDER BY p.created_at DESC`;
      return send(res, 200, rows.map(card));
    }

    // ---------- escrita (só com senha) ----------
    if (!admin) return send(res, 401, { error: 'Senha incorreta' });

    if (req.method === 'POST') {
      const f = fields(req.body || {});
      if (!f.title) return send(res, 400, { error: 'O título é obrigatório' });
      let slug = slugify(f.title);
      const exists = await sql`SELECT 1 FROM blog_posts WHERE slug = ${slug}`;
      if (exists.length) slug += '-' + Date.now().toString(36);
      const r = await sql`INSERT INTO blog_posts (slug, title, summary, summary_ai, body, category, tags, author, status)
        VALUES (${slug}, ${f.title}, ${f.summary}, ${f.summary_ai}, ${f.body}, ${f.category}, ${f.tags}, ${f.author}, ${f.status})
        RETURNING id, slug`;
      return send(res, 201, r[0]);
    }

    if (req.method === 'PUT') {
      const id = Number(req.query.id);
      if (!id) return send(res, 400, { error: 'id inválido' });
      const b = req.body || {};
      const f = fields(b);
      if (!f.title) return send(res, 400, { error: 'O título é obrigatório' });
      const r = await sql`UPDATE blog_posts SET title = ${f.title}, summary = ${f.summary}, summary_ai = ${f.summary_ai}, body = ${f.body},
        category = ${f.category}, tags = ${f.tags}, author = ${f.author}, status = ${f.status}, updated_at = now()
        WHERE id = ${id} RETURNING id, slug`;
      if (!r.length) return send(res, 404, { error: 'Post não encontrado' });

      // Mantém só as imagens que o painel ainda mostra; o resto é apagado.
      const keep = (Array.isArray(b.keep) ? b.keep : [])
        .map((k) => ({ id: Number(k?.id), pos: Number(k?.pos) || 0 }))
        .filter((k) => Number.isInteger(k.id) && k.id > 0)
        .slice(0, 5);
      const keepCover = Number(b.keepCover) > 0 ? Number(b.keepCover) : null;
      const keepIds = keep.map((k) => k.id).concat(keepCover ? [keepCover] : []);
      await sql`DELETE FROM blog_images WHERE post_id = ${id} AND NOT (id = ANY(${keepIds}::int[]))`;
      await Promise.all(
        keep.map((k) => sql`UPDATE blog_images SET position = ${k.pos} WHERE id = ${k.id} AND post_id = ${id}`)
      );
      return send(res, 200, r[0]);
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      if (!id) return send(res, 400, { error: 'id inválido' });
      await sql`DELETE FROM blog_posts WHERE id = ${id}`; // as imagens saem junto (ON DELETE CASCADE)
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'Método não permitido' });
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: e.message || 'Erro no servidor' });
  }
}
