import { sql, init, isAdmin, send } from './_db.js';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

export default async function handler(req, res) {
  try {
    await init();

    // Mostrar imagem (público). O id nunca muda de conteúdo, então o cache pode ser longo.
    if (req.method === 'GET') {
      const id = Number(req.query.id);
      if (!id) return send(res, 400, { error: 'id inválido' });
      const rows = await sql`SELECT i.mime, i.data FROM blog_images i
        JOIN blog_posts p ON p.id = i.post_id WHERE i.id = ${id}`;
      if (!rows.length) return send(res, 404, { error: 'Imagem não encontrada' });
      res.setHeader('Content-Type', rows[0].mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.status(200).send(Buffer.from(rows[0].data, 'base64'));
    }

    // Enviar imagem (só com senha): uma por requisição, para não estourar o limite da Vercel.
    if (req.method === 'POST') {
      if (!isAdmin(req)) return send(res, 401, { error: 'Senha incorreta' });
      const post = Number(req.query.post);
      const role = req.query.role === 'cover' ? 'cover' : 'gallery';
      const pos = Number(req.query.pos) || 0;
      const d = String(req.body?.data || '');
      const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,/.exec(d.slice(0, 40));
      if (!post || !m) return send(res, 400, { error: 'Imagem inválida' });
      const b64 = d.slice(m[0].length);
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return send(res, 400, { error: 'Imagem inválida' });
      if (b64.length > 3_000_000) return send(res, 413, { error: 'Imagem grande demais' });

      const exists = await sql`SELECT 1 FROM blog_posts WHERE id = ${post}`;
      if (!exists.length) return send(res, 404, { error: 'Post não encontrado' });

      if (role === 'cover') await sql`DELETE FROM blog_images WHERE post_id = ${post} AND role = 'cover'`;
      else {
        const n = await sql`SELECT count(*)::int AS n FROM blog_images WHERE post_id = ${post} AND role = 'gallery'`;
        if (n[0].n >= 5) return send(res, 400, { error: 'Máximo de 5 imagens extras' });
      }
      const r = await sql`INSERT INTO blog_images (post_id, role, position, mime, data)
        VALUES (${post}, ${role}, ${pos}, ${m[1]}, ${b64}) RETURNING id`;
      return send(res, 201, { id: r[0].id, url: `/api/img?id=${r[0].id}` });
    }

    return send(res, 405, { error: 'Método não permitido' });
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: e.message || 'Erro no servidor' });
  }
}
