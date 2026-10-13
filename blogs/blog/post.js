(async () => {
  const art = document.getElementById('art');
  const slug = new URLSearchParams(location.search).get('slug');
  const fail = (m) => (art.innerHTML = `<a class="back" href="/blog">← Voltar ao blog</a><div class="note">${m}</div>`);
  if (!slug) return fail('Post não encontrado.');
  let p;
  try {
    const r = await fetch('/api/posts?slug=' + encodeURIComponent(slug));
    p = await r.json();
    if (!r.ok) return fail(r.status === 404 ? 'Esse post não existe ou foi removido.' : 'Não consegui carregar o post agora.');
  } catch {
    return fail('Não consegui carregar o post agora.');
  }
  document.title = p.title + ' | Blog';
  if (p.summary) {
    const m = document.createElement('meta');
    m.name = 'description';
    m.content = p.summary;
    document.head.append(m);
  }
  art.innerHTML = `<a class="back" href="/blog">← Voltar ao blog</a>
    ${p.category ? `<div><span class="tag">${esc(p.category)}</span></div>` : ''}
    <h1>${esc(p.title)}</h1>
    <div class="meta">${fmtDate(p.created_at)}${p.author ? ' · ' + esc(p.author) : ''}</div>
    ${p.cover ? `<img class="cv" src="${esc(p.cover)}" alt="${esc(p.title)}">` : ''}
    ${p.summary ? `${p.summaryAi ? '<div><span class="bupchip"><img src="/blog/bup.png" alt="">Resumo feito com Bup</span></div>' : ''}<p class="lead2">${esc(p.summary)}</p>` : ''}
    <div class="txt">${renderBody(p.body)}</div>
    ${p.gallery.length ? `<div class="gal">${p.gallery.map((g) => `<img src="${esc(g.url)}" alt="" loading="lazy">`).join('')}</div>` : ''}
    ${p.tags.length ? `<div class="tags">${p.tags.map((t) => `<span class="tag mint">#${esc(t)}</span>`).join('')}</div>` : ''}`;
  art.addEventListener('click', (e) => {
    const im = e.target.closest('.gal img');
    if (!im) return;
    const lb = document.createElement('div');
    lb.className = 'lb';
    lb.innerHTML = `<img src="${im.src}" alt="">`;
    const close = () => { lb.remove(); document.removeEventListener('keydown', k); };
    const k = (ev) => ev.key === 'Escape' && close();
    lb.onclick = close;
    document.addEventListener('keydown', k);
    document.body.append(lb);
  });
})();
