(() => {
  const $ = (s) => document.querySelector(s);
  const MAXG = 5;
  let pw = sessionStorage.getItem('blogpw') || '';
  let ed = null; // post em edição

  /* ---------- utilidades ---------- */
  const toast = (msg, kind) => {
    const t = document.createElement('div');
    t.className = 'toast' + (kind === 'err' ? ' err' : '');
    t.textContent = msg;
    document.body.append(t);
    setTimeout(() => t.remove(), kind === 'err' ? 5000 : 2500);
  };

  async function api(path, opt = {}) {
    const r = await fetch(path, { ...opt, headers: { 'Content-Type': 'application/json', 'X-Admin-Password': pw } });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && path !== '/api/login') logout(true);
    if (!r.ok) throw new Error(j.error || 'Algo deu errado (' + r.status + ')');
    return j;
  }

  // Reduz a foto no navegador antes de enviar (máx. 1400px, JPEG).
  const toData = (file) =>
    new Promise((res, rej) => {
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, 1400 / Math.max(img.width, img.height));
        const w = Math.round(img.width * k), h = Math.round(img.height * k);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
        x.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(u);
        res(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('Não consegui ler a imagem ' + file.name)); };
      img.src = u;
    });

  const lock = (on) => document.body.classList.toggle('lock', on);

  /* ---------- login ---------- */
  function showPanel() { $('#gate').hidden = true; $('#panel').hidden = false; backToList(); }
  function logout(expired) {
    pw = ''; sessionStorage.removeItem('blogpw');
    $('#panel').hidden = true; $('#gate').hidden = false; $('#pw').value = '';
    if (expired) toast('Sessão expirada. Entre de novo.', 'err');
  }
  $('#gf').onsubmit = async (e) => {
    e.preventDefault();
    const b = $('#gb'); b.disabled = true; b.textContent = 'Entrando...';
    pw = $('#pw').value;
    try {
      await api('/api/login', { method: 'POST' });
      sessionStorage.setItem('blogpw', pw);
      showPanel();
    } catch (err) {
      pw = ''; toast(err.message, 'err'); $('#pw').select();
    } finally { b.disabled = false; b.textContent = 'Entrar'; }
  };
  $('#out').onclick = () => logout(false);

  /* ---------- lista de posts ---------- */
  async function loadList() {
    const box = $('#list');
    box.innerHTML = '<p style="font-weight:600">Carregando...</p>';
    try {
      const rows = await api('/api/posts?all=1');
      if (!rows.length) { box.innerHTML = '<p style="font-weight:600">Nenhum post ainda. Toque em "Criar postagem" para começar.</p>'; return; }
      box.innerHTML = rows.map((p) => `<div class="prow" data-id="${p.id}" data-t="${esc(p.title)}">
        <div class="th">${p.cover ? `<img src="${esc(p.cover)}" alt="">` : '📝'}</div>
        <div class="in"><b>${esc(p.title)}<span class="st${p.status === 'draft' ? ' d' : ''}">${p.status === 'draft' ? 'Rascunho' : 'Publicado'}</span></b><small>${fmtDate(p.created_at)}${p.category ? ' · ' + esc(p.category) : ''}</small></div>
        <div class="ac2"><a class="btn sm gh" href="/blog/post?slug=${encodeURIComponent(p.slug)}" target="_blank" rel="noopener">Ver</a><button class="btn sm" data-a="edit">Editar</button><button class="btn sm rd" data-a="del">Apagar</button></div></div>`).join('');
    } catch (err) { box.innerHTML = `<p style="font-weight:600">${esc(err.message)}</p>`; }
  }
  $('#list').onclick = async (e) => {
    const b = e.target.closest('button[data-a]'); if (!b) return;
    const row = b.closest('.prow'), id = row.dataset.id;
    if (b.dataset.a === 'del') {
      if (!confirm(`Apagar "${row.dataset.t}"? Isso não dá para desfazer.`)) return;
      try { await api('/api/posts?id=' + id, { method: 'DELETE' }); toast('Post apagado'); loadList(); } catch (err) { toast(err.message, 'err'); }
    } else {
      b.disabled = true;
      try { openEditor(await api('/api/posts?id=' + id)); } catch (err) { toast(err.message, 'err'); } finally { b.disabled = false; }
    }
  };
  function backToList() { $('#vEdit').hidden = true; $('#vList').hidden = false; ed = null; window.scrollTo(0, 0); loadList(); }

  /* ---------- editor ---------- */
  const F = { title: $('#fTitle'), summary: $('#fSummary'), body: $('#fBody'), category: $('#fCat'), tags: $('#fTags'), author: $('#fAuthor'), status: $('#fStatus') };

  function openEditor(p) {
    ed = { id: p?.id || null, summaryAi: !!p?.summaryAi, cover: p?.cover ? { id: p.coverId, url: p.cover } : null, gallery: (p?.gallery || []).map((g) => ({ id: g.id, url: g.url })) };
    F.title.value = p?.title || ''; F.summary.value = p?.summary || ''; F.body.value = p?.body || '';
    F.category.value = p?.category || ''; F.tags.value = (p?.tags || []).join(', ');
    F.author.value = p ? p.author : 'Miguel Fracassi'; F.status.value = p?.status || 'published';
    $('#eTitle').textContent = p ? 'Editar postagem' : 'Nova postagem';
    renderImgs(); chip();
    $('#vList').hidden = true; $('#vEdit').hidden = false; window.scrollTo(0, 0);
  }
  const chip = () => { $('#aiChip').hidden = !(ed && ed.summaryAi && F.summary.value.trim()); };
  F.summary.addEventListener('input', () => { if (ed) { ed.summaryAi = false; chip(); } }); // se você mexer no resumo, ele deixa de ser "feito com Bup"
  $('#newPost').onclick = () => openEditor(null);
  $('#cancel').onclick = $('#cancel2').onclick = () => { if (confirm('Sair sem salvar?')) backToList(); };

  function renderImgs() {
    const cb = $('#coverBox');
    cb.innerHTML = ed.cover
      ? `<div class="pv"><img src="${esc(ed.cover.url)}" alt=""><button class="x" type="button" data-x="cover" aria-label="Remover">×</button></div>`
      : `<label class="drop"><span style="font-size:2rem">🖼️</span>Escolher imagem principal<input id="coverIn" type="file" accept="image/*"></label>`;
    const gb = $('#galBox');
    gb.innerHTML = ed.gallery.map((g, i) => `<div class="pv"><img src="${esc(g.url)}" alt=""><button class="x" type="button" data-x="${i}" aria-label="Remover">×</button></div>`).join('') +
      (ed.gallery.length < MAXG ? `<label class="drop"><span style="font-size:1.6rem">＋</span>Adicionar (${ed.gallery.length}/${MAXG})<input id="galIn" type="file" accept="image/*" multiple></label>` : '');
    const ci = $('#coverIn'); if (ci) ci.onchange = async () => { const f = ci.files[0]; if (f) await setCover(f); };
    const gi = $('#galIn'); if (gi) gi.onchange = async () => { await addGallery([...gi.files]); };
  }
  $('#coverBox').onclick = (e) => { if (e.target.closest('[data-x]')) { ed.cover = null; renderImgs(); } };
  $('#galBox').onclick = (e) => { const b = e.target.closest('[data-x]'); if (b) { ed.gallery.splice(+b.dataset.x, 1); renderImgs(); } };

  async function setCover(file) {
    try { const d = await toData(file); ed.cover = { url: d, data: d }; renderImgs(); } catch (err) { toast(err.message, 'err'); }
  }
  async function addGallery(files) {
    const room = MAXG - ed.gallery.length;
    if (files.length > room) toast(`Só cabem mais ${room} imagem(ns). As outras foram ignoradas.`, 'err');
    for (const f of files.slice(0, room)) {
      try { const d = await toData(f); ed.gallery.push({ url: d, data: d }); } catch (err) { toast(err.message, 'err'); }
    }
    renderImgs();
  }

  async function save() {
    const title = F.title.value.trim();
    if (!title) { toast('Coloque um título', 'err'); F.title.focus(); return; }
    if (!ed.cover && !confirm('Esse post está sem imagem principal. Salvar assim mesmo?')) return;
    const btn = $('#save'); btn.disabled = true; btn.textContent = 'Salvando...';
    try {
      const payload = {
        title, summary: F.summary.value, body: F.body.value, category: F.category.value, tags: F.tags.value,
        author: F.author.value, status: F.status.value, summaryAi: !!ed.summaryAi && !!F.summary.value.trim(),
        keepCover: ed.cover?.id || null,
        keep: ed.gallery.map((g, i) => (g.id ? { id: g.id, pos: i } : null)).filter(Boolean),
      };
      const r = await api(ed.id ? '/api/posts?id=' + ed.id : '/api/posts', { method: ed.id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      ed.id = r.id; // se alguma imagem falhar, salvar de novo atualiza em vez de duplicar
      let fails = 0;
      if (ed.cover?.data) {
        try { const u = await api(`/api/img?post=${r.id}&role=cover&pos=0`, { method: 'POST', body: JSON.stringify({ data: ed.cover.data }) }); ed.cover = { id: u.id, url: u.url }; } catch { fails++; }
      }
      for (let i = 0; i < ed.gallery.length; i++) {
        const g = ed.gallery[i]; if (!g.data) continue;
        try { const u = await api(`/api/img?post=${r.id}&role=gallery&pos=${i}`, { method: 'POST', body: JSON.stringify({ data: g.data }) }); ed.gallery[i] = { id: u.id, url: u.url }; } catch { fails++; }
      }
      if (fails) { renderImgs(); toast(`Post salvo, mas ${fails} imagem(ns) não subiram. Toque em Salvar de novo.`, 'err'); return; }
      toast('Post salvo!');
      backToList();
    } catch (err) { toast(err.message, 'err'); }
    finally { btn.disabled = false; btn.textContent = 'Salvar postagem'; }
  }
  $('#save').onclick = save;

  /* ---------- Bup IA ---------- */
  const modal = $('#bupModal'), log = $('#bupLog'), qr = $('#bupQr'), form = $('#bupForm'), inp = $('#bupIn');
  const STEPS = [
    { k: 'title', q: 'Oi! Eu sou o Bup 👋 Vou te ajudar a montar o post. Primeiro: qual é o título? Se ainda não tem, escreva "sugira" que eu crio um.' },
    { k: 'topic', q: 'Show! Sobre o que é o post? Conta com as suas palavras.' },
    { k: 'details', q: 'Tem algum ponto importante que não pode faltar? Datas, nomes, novidades... Se não tiver, toque em Pular.', skip: true },
    { k: 'tone', q: 'Qual tom você quer no texto?', opts: ['Descontraído', 'Animado', 'Profissional', 'Informativo'] },
    { k: 'size', q: 'E o tamanho?', opts: ['Curto', 'Médio', 'Longo'] },
    { k: 'photos', q: 'Agora as fotos! Envie a imagem principal e até 5 extras. A primeira que você escolher vira a principal.', photos: true },
    { k: 'photoDesc', q: 'O que aparece nelas? Uma frase já ajuda. (Eu não consigo ver as imagens, então me conta.)', skip: true, needPhotos: true },
  ];
  let bup = null;

  const bubble = (txt, who, cls = '') => {
    const d = document.createElement('div');
    d.className = `bb ${who} ${cls}`;
    if (who === 'b' && !cls) {
      d.classList.add('has-av');
      const im = Object.assign(new Image(), { src: '/blog/bup.png', alt: '' });
      const t = document.createElement('span'); t.textContent = txt;
      d.append(im, t);
    } else if (typeof txt === 'string') d.textContent = txt; else d.append(txt);
    log.append(d); log.scrollTop = log.scrollHeight; return d;
  };
  const setQr = (btns) => {
    qr.innerHTML = '';
    btns.forEach((b) => {
      const el = document.createElement(b.file ? 'label' : 'button');
      el.textContent = b.t;
      if (b.file) {
        const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = true;
        i.onchange = () => b.on([...i.files]); el.append(i);
      } else { el.type = 'button'; el.onclick = b.on; }
      qr.append(el);
    });
  };
  const typing = () => bubble(Object.assign(document.createElement('span'), { innerHTML: '<i></i><i></i><i></i>' }), 'b', 'ty');

  function openBup() {
    bup = { i: -1, a: {}, photos: [], done: false, busy: false };
    log.innerHTML = ''; qr.innerHTML = ''; inp.value = '';
    modal.hidden = false; lock(true); next();
    setTimeout(() => inp.focus(), 50);
  }
  function closeBup() { modal.hidden = true; lock(false); }
  $('#bupOpen').onclick = openBup;
  $('#bupClose').onclick = closeBup;
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeBup(); });

  function next() {
    do { bup.i++; } while (STEPS[bup.i] && STEPS[bup.i].needPhotos && !bup.photos.length);
    const s = STEPS[bup.i];
    if (!s) return generate();
    bubble(s.q, 'b');
    const q = [];
    if (s.opts) s.opts.forEach((o) => q.push({ t: o, on: () => answer(o) }));
    if (s.photos) { q.push({ t: '📷 Escolher fotos', file: true, on: addPhotos }); q.push({ t: 'Pular fotos', on: () => { bubble('Sem fotos por enquanto', 'u'); next(); } }); }
    if (s.skip) q.push({ t: 'Pular', on: () => { bubble('Pular', 'u'); next(); } });
    if (s.k === 'title') q.push({ t: 'Sugira um título', on: () => answer('sugira') });
    setQr(q);
    inp.disabled = !!s.photos || !!s.opts; inp.placeholder = s.photos ? 'Use os botões acima' : s.opts ? 'Escolha uma opção acima' : 'Escreva aqui';
    if (!inp.disabled) inp.focus();
  }

  async function addPhotos(files) {
    if (!files.length) return;
    const list = files.slice(0, MAXG + 1);
    if (files.length > list.length) toast('Usei só as 6 primeiras fotos.', 'err');
    const wrap = document.createElement('div'); wrap.className = 'ph';
    for (const f of list) {
      try { const d = await toData(f); bup.photos.push(d); const im = new Image(); im.src = d; wrap.append(im); } catch (err) { toast(err.message, 'err'); }
    }
    if (!bup.photos.length) return;
    bubble(wrap, 'u'); next();
  }

  function answer(txt) {
    txt = String(txt).trim(); if (!txt || bup.busy) return;
    bubble(txt, 'u');
    if (bup.done) return revise(txt);
    bup.a[STEPS[bup.i].k] = txt;
    next();
  }
  form.onsubmit = (e) => { e.preventDefault(); const v = inp.value; if (inp.disabled) return; inp.value = ''; answer(v); };

  const apply = (r) => {
    F.title.value = r.title; F.summary.value = r.summary; F.body.value = r.body;
    F.category.value = r.category; F.tags.value = r.tags.join(', ');
    ed.summaryAi = !!r.summary; chip();
  };
  function applyPhotos() {
    const p = bup.photos.slice();
    if (!p.length) return;
    if (!ed.cover) ed.cover = { url: p[0], data: p[0] }, p.shift();
    while (p.length && ed.gallery.length < MAXG) { const d = p.shift(); ed.gallery.push({ url: d, data: d }); }
    renderImgs();
  }

  async function generate() {
    bup.busy = true; setQr([]); inp.disabled = true;
    const t = typing();
    try {
      const r = await api('/api/ai', { method: 'POST', body: JSON.stringify({ mode: 'generate', answers: { ...bup.a, photoCount: bup.photos.length } }) });
      t.remove(); apply(r); applyPhotos();
      bup.done = true;
      bubble('Pronto! Preenchi o formulário com o título, o texto e as informações' + (bup.photos.length ? ', e coloquei as fotos' : '') + '. Quer mudar alguma coisa? Escreva o pedido, tipo "deixa mais curto".', 'b');
      finishQr();
    } catch (err) {
      t.remove(); bubble('Não consegui criar agora: ' + err.message, 'b', 'err');
      setQr([{ t: 'Tentar de novo', on: generate }, { t: 'Fechar', on: closeBup }]);
    } finally { bup.busy = false; inp.disabled = false; inp.placeholder = 'Quer mudar algo? Ex: deixa mais curto'; }
  }
  function finishQr() {
    setQr([
      { t: 'Mais curto', on: () => answer('Deixe o texto mais curto') },
      { t: 'Mais animado', on: () => answer('Deixe o tom mais animado') },
      { t: 'Mais profissional', on: () => answer('Deixe o tom mais profissional') },
      { t: 'Está ótimo, fechar', on: closeBup },
    ]);
  }
  async function revise(instruction) {
    bup.busy = true; setQr([]);
    const t = typing();
    try {
      const cur = { title: F.title.value, summary: F.summary.value, body: F.body.value, category: F.category.value, tags: F.tags.value };
      const r = await api('/api/ai', { method: 'POST', body: JSON.stringify({ mode: 'revise', current: cur, instruction }) });
      t.remove(); apply(r);
      bubble('Feito! Atualizei o formulário. Mais alguma mudança?', 'b');
    } catch (err) { t.remove(); bubble('Não consegui mudar agora: ' + err.message, 'b', 'err'); }
    finally { bup.busy = false; finishQr(); }
  }

  /* ---------- início ---------- */
  if (pw) api('/api/login', { method: 'POST' }).then(showPanel).catch(() => { pw = ''; sessionStorage.removeItem('blogpw'); });
})();
