import { isAdmin, send } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido' });
  if (!isAdmin(req)) {
    await new Promise((r) => setTimeout(r, 600)); // freia tentativas em sequência
    return send(res, 401, { error: 'Senha incorreta' });
  }
  return send(res, 200, { ok: true });
}
