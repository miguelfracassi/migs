const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
const para = (t) => `<p>${esc(t).replace(/\n/g, '<br>')}</p>`;
// Texto do post: parágrafos separados por linha em branco; "## Título" vira subtítulo.
const renderBody = (t) =>
  String(t || '')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      const m = b.match(/^##\s+(.+?)(?:\n([\s\S]*))?$/);
      if (m) return `<h3>${esc(m[1])}</h3>` + (m[2] && m[2].trim() ? para(m[2].trim()) : '');
      return para(b);
    })
    .join('');
