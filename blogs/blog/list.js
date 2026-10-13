(async () => {
  const grid = document.getElementById('posts'), cats = document.getElementById('cats');
  let posts = [], cur = '';
  try {
    const r = await fetch('/api/posts');
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'erro');
    posts = j;
  } catch (e) {
    grid.innerHTML = `<div class="note" style="grid-column:1/-1">Não consegui carregar os posts agora. Tente de novo em instantes.</div>`;
    return;
  }
  const draw = () => {
    const list = cur ? posts.filter((p) => p.category === cur) : posts;
    if (!list.length) {
      grid.innerHTML = `<div class="note" style="grid-column:1/-1">${posts.length ? 'Nenhum post nessa categoria.' : 'Ainda não tem nenhum post por aqui. Volte em breve!'}</div>`;
      return;
    }
    grid.innerHTML = list
      .map(
        (p, i) => `<a class="pcard" style="animation-delay:${Math.min(i, 8) * 70}ms" href="/blog/post?slug=${encodeURIComponent(p.slug)}">
        <div class="im">${p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy">` : '📝'}</div>
        <div class="pb">${p.category ? `<span class="tag">${esc(p.category)}</span>` : ''}<h3>${esc(p.title)}</h3>${p.summary ? `<p>${esc(p.summary)}</p>` : ''}${p.summary && p.summaryAi ? '<span class="bupchip"><img src="/blog/bup.png" alt="">Resumo feito com Bup</span>' : ''}<div class="meta">${fmtDate(p.created_at)}${p.author ? ' · ' + esc(p.author) : ''}</div></div></a>`
      )
      .join('');
  };
  const names = [...new Set(posts.map((p) => p.category).filter(Boolean))];
  if (names.length > 1) {
    cats.innerHTML = ['', ...names].map((c) => `<button class="chip${c === cur ? ' on' : ''}" data-c="${esc(c)}">${c ? esc(c) : 'Tudo'}</button>`).join('');
    cats.onclick = (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      cur = b.dataset.c;
      cats.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
      draw();
    };
  }
  draw();
})();
