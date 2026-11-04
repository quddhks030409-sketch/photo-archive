(() => {
  'use strict';

  // UI 문구 (사진 제목·설명은 관리자 페이지에서 한/영으로 따로 입력)
  const T = {
    ko: {
      series: '시리즈', archive: '아카이브', news: '소식', about: '소개', contact: '연락',
      newsBack: '← 모든 소식', newsEmpty: '아직 올린 소식이 없어요.', readMore: '원문 보러 가기', more: '자세히 보기',
      cat: { award: '수상', exhibition: '전시', press: '기사 · 인터뷰', publication: '출판', news: '소식' },
      latest: '시리즈', all: '전체', photos: '장', back: '← 모든 시리즈',
      prev: '이전 시리즈', next: '다음 시리즈',
      drag: '← 옆으로 넘겨 보세요 →', empty: '아직 올린 사진이 없어요.', notFound: '시리즈를 찾을 수 없어요.',
      email: '이메일', instagram: '인스타그램',
      name: '이름', subject: '제목', message: '메시지', send: '보내기',
      sending: '보내는 중…', sent: '메시지가 전달되었어요. 확인 후 답장드릴게요.',
      failed: '전송에 실패했어요. 이메일로 직접 연락해 주세요.',
    },
    en: {
      series: 'Series', archive: 'Archive', news: 'News', about: 'About', contact: 'Contact',
      newsBack: '← All news', newsEmpty: 'No news yet.', readMore: 'Read the original', more: 'Read more',
      cat: { award: 'Award', exhibition: 'Exhibition', press: 'Press', publication: 'Publication', news: 'News' },
      latest: 'Series', all: 'All', photos: ' photos', back: '← All series',
      prev: 'Previous', next: 'Next',
      drag: '← Drag to explore →', empty: 'No photographs yet.', notFound: 'Series not found.',
      email: 'Email', instagram: 'Instagram',
      name: 'Name', subject: 'Subject', message: 'Message', send: 'Send',
      sending: 'Sending…', sent: 'Thank you — your message has been sent.',
      failed: 'Something went wrong. Please email me directly.',
    },
  };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 */ } },
  };

  let lang = store.get('lang') || ((navigator.language || '').toLowerCase().startsWith('ko') ? 'ko' : 'en');
  const t = (k) => (T[lang] && T[lang][k]) || T.en[k] || k;
  const pick = (o, f) => (o ? o[`${f}_${lang}`] || o[`${f}_${lang === 'ko' ? 'en' : 'ko'}`] || '' : '');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const paras = (s) => esc(s).split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  // 올린 원본은 그대로 두고, 화면 크기에 맞게 Netlify 이미지 변환(/.netlify/images)으로 줄여서 보여준다.
  // 내 컴퓨터에서 미리 볼 때와 외부 주소 사진은 원본을 그대로 쓴다.
  const useCdn = !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const canResize = (src) => useCdn && /^\/[^/]/.test(src || '');
  const cdn = (src, w) => (canResize(src) ? `/.netlify/images?url=${encodeURIComponent(src)}&w=${w}&q=82` : src);
  const SIZES = {
    card: { w: 1200, set: [600, 900, 1200], sizes: '(max-width: 760px) 100vw, 33vw' },
    photo: { w: 2400, set: [1000, 1600, 2400], sizes: '(max-width: 1240px) 100vw, 1200px' },
    grid: { w: 800, set: [400, 800, 1200], sizes: '(max-width: 600px) 50vw, 33vw' },
    portrait: { w: 1200, set: [600, 1200], sizes: '(max-width: 860px) 100vw, 45vw' },
    hero: { w: 2400, set: [1200, 1800, 2400, 3000], sizes: '100vw' },
    side: { w: 1800, set: [800, 1200, 1800], sizes: '(max-width: 860px) 100vw, 60vw' },
    scroll: { w: 1600, set: [800, 1200, 1600], sizes: '(max-width: 760px) 85vw, 55vw' },
  };
  const srcAttrs = (src, kind) => {
    const k = SIZES[kind] || SIZES.photo;
    if (!canResize(src)) return `src="${esc(src)}"`;
    return `src="${esc(cdn(src, k.w))}" srcset="${k.set.map((w) => `${esc(cdn(src, w))} ${w}w`).join(', ')}" sizes="${k.sizes}"`;
  };
  const img = (src, alt, extra = '', kind = 'photo') => `<img class="fade" ${srcAttrs(src, kind)} alt="${esc(alt)}" loading="lazy" decoding="async"${extra}>`;
  const $ = (id) => document.getElementById(id);

  const page = document.body.dataset.page;
  let settings = {};
  let series = [];
  let news = [];
  let heroTimer = null;
  let archiveFilter = new URLSearchParams(location.search).get('s') || 'all';

  async function load() {
    const get = (u) => fetch(u, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const [s, idx] = await Promise.all([get('/content/settings.json'), get('/content/index.json')]);
    settings = s || {};
    series = ((idx && idx.series) || []).map((x) => ({ ...x, photos: x.photos || [] }));
    news = (idx && idx.news) || [];
  }

  /* ---------- 공통 ---------- */
  // 소식이 하나라도 있을 때만 메뉴에 '소식'을 보여 준다.
  const navLinks = () => [['series', '/series.html'], ['archive', '/archive.html'], ...(news.length || page === 'news' ? [['news', '/news.html']] : []), ['about', '/about.html'], ['contact', '/contact.html']];
  function header() {
    const el = $('site-header');
    if (!el) return;
    const links = navLinks();
    el.innerHTML = `
      <div class="header-inner">
        <a class="logo" href="/">${esc(settings.site_title || 'Kang ByeongWan')}</a>
        <button class="menu-btn" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
        <nav class="nav">
          ${links.map(([k, h]) => `<a href="${h}"${page === k ? ' aria-current="page"' : ''}>${t(k)}</a>`).join('')}
          <div class="lang">
            <button data-lang="ko" class="${lang === 'ko' ? 'on' : ''}">KO</button><span>/</span>
            <button data-lang="en" class="${lang === 'en' ? 'on' : ''}">EN</button>
          </div>
        </nav>
      </div>`;
  }

  function footer() {
    const el = $('site-footer');
    if (!el) return;
    const ig = settings.instagram;
    const name = settings.site_title || 'Kang ByeongWan';
    const links = navLinks();
    el.innerHTML = `
      <div class="footer-inner">
        <a class="footer-mark" href="/">${esc(name)}</a>
        <p class="footer-tag">Photography</p>
        <div class="footer-grid">
          <div>
            <span class="meta">${t('contact')}</span>
            ${settings.email ? `<a href="mailto:${esc(settings.email)}">${esc(settings.email)}</a><br>` : ''}
            ${ig ? `<a href="https://instagram.com/${esc(ig.replace(/^@/, ''))}" target="_blank" rel="noopener">Instagram</a>` : ''}
          </div>
          <nav class="footer-nav">
            <span class="meta">Menu</span>
            ${links.map(([k, h]) => `<a href="${h}">${t(k)}</a>`).join('')}
          </nav>
          <span class="footer-copy">© ${new Date().getFullYear()} ${esc(name)}. All rights reserved.</span>
        </div>
      </div>`;
  }

  const cover = (s) => s.cover || (s.photos[0] && s.photos[0].image) || '';
  const seriesMeta = (s) => [pick(s, 'location'), s.year].filter(Boolean).join(' · ');
  const card = (s) => `
    <a class="card" href="/series.html?s=${encodeURIComponent(s.slug)}">
      <div class="card-img">${cover(s) ? img(cover(s), pick(s, 'title'), '', 'card') : ''}</div>
      <h3>${esc(pick(s, 'title'))}</h3>
      <p class="meta">${esc([seriesMeta(s), s.photos.length + t('photos')].filter(Boolean).join(' · '))}</p>
    </a>`;
  const empty = () => `<p class="empty">${t('empty')}</p>`;

  /* ---------- 홈 ---------- */
  function home() {
    const hero = $('hero');
    let slides = (settings.hero || []).filter((h) => h && h.image);
    if (!slides.length) slides = series.filter(cover).map((s) => ({ image: cover(s), caption_ko: s.title_ko, caption_en: s.title_en }));
    clearInterval(heroTimer);
    hero.innerHTML = slides.map((s, i) => `
        <div class="hero-slide${i === 0 ? ' on' : ''}"><img ${srcAttrs(s.image, 'hero')} alt="${esc(pick(s, 'caption'))}"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}></div>`).join('') + `
      <div class="hero-text">
        <p class="hero-tagline">${esc(pick(settings, 'tagline'))}</p>
        <p class="hero-caption"></p>
      </div>
      ${slides.length > 1 ? `<div class="hero-dots">${slides.map((_, i) => `<button data-slide="${i}" class="${i === 0 ? 'on' : ''}" aria-label="${i + 1}"></button>`).join('')}</div>` : ''}
      <span class="scroll-cue" aria-hidden="true"></span>`;

    let cur = 0;
    const show = (n) => {
      const els = hero.querySelectorAll('.hero-slide');
      const dots = hero.querySelectorAll('.hero-dots button');
      if (!els.length) return;
      cur = (n + els.length) % els.length;
      els.forEach((e, i) => e.classList.toggle('on', i === cur));
      dots.forEach((d, i) => d.classList.toggle('on', i === cur));
      hero.querySelector('.hero-caption').textContent = pick(slides[cur], 'caption');
    };
    const start = () => { clearInterval(heroTimer); if (slides.length > 1) heroTimer = setInterval(() => show(cur + 1), 6000); };
    hero.onclick = (e) => { const b = e.target.closest('[data-slide]'); if (b) { show(+b.dataset.slide); start(); } };
    show(0);
    start();

    $('latest').innerHTML = series.map(card).join('') || empty();
  }

  /* ---------- 시리즈 ---------- */
  function seriesPage() {
    const main = $('main');
    const slug = new URLSearchParams(location.search).get('s');
    if (!slug) {
      document.title = `${t('series')} — ${settings.site_title || ''}`;
      main.innerHTML = `<section class="section"><div class="wrap"><h1 class="page-title">${t('series')}</h1><div class="grid">${series.map(card).join('') || empty()}</div></div></section>`;
      return;
    }
    const i = series.findIndex((s) => s.slug === slug);
    if (i < 0) {
      main.innerHTML = `<section class="series-head"><a class="back" href="/series.html">${t('back')}</a><p class="empty">${t('notFound')}</p></section>`;
      return;
    }
    const s = series[i];
    const title = pick(s, 'title');
    const prev = series[i - 1];
    const next = series[i + 1];
    const chs = s.chapters || [];
    // 사진을 소주제별 묶음으로 나누고, 묶음마다 배치 방식을 정한다.
    const groups = [];
    s.photos.forEach((p, j) => {
      const key = p.chapter != null ? p.chapter : -1;
      let g = groups[groups.length - 1];
      if (!g || g.key !== key) { g = { key, c: key >= 0 ? chs[key] : null, items: [] }; groups.push(g); }
      g.items.push({ p, j });
    });
    const LAYOUTS = ['stack', 'side-left', 'side-right', 'alternate', 'scroll', 'grid'];
    const layoutOf = (g) => [g.c && g.c.layout, s.layout].find((l) => LAYOUTS.includes(l)) || 'stack';
    const capOf = (p) => pick(p, 'caption');
    const textOf = (p) => pick(p, 'text');
    const pic = ({ p, j }, kind) => img(p.image, capOf(p) || title, ` data-lb="${j}"`, kind);
    const fig = (x, kind, withText) => `
          <figure>
            ${pic(x, kind)}
            ${capOf(x.p) || (withText && textOf(x.p)) ? `<figcaption>${esc(capOf(x.p))}${withText && textOf(x.p) ? `<span class="fig-text">${paras(textOf(x.p))}</span>` : ''}</figcaption>` : ''}
          </figure>`;
    const block = (g) => {
      const L = layoutOf(g);
      const head = g.c ? `
          <header class="chapter-head" id="ch-${g.key}">
            <h2>${esc(pick(g.c, 'title'))}</h2>
            ${pick(g.c, 'note') ? `<p class="meta">${esc(pick(g.c, 'note'))}</p>` : ''}
            ${pick(g.c, 'description') ? `<div class="lead">${paras(pick(g.c, 'description'))}</div>` : ''}
          </header>` : '';
      let body;
      if (L === 'side-left' || L === 'side-right' || L === 'alternate') {
        body = `<div class="lay-side ${L}">${g.items.map((x) => `
          <div class="side-row">
            <div class="side-img">${pic(x, 'side')}</div>
            <div class="side-text">
              ${capOf(x.p) ? `<h3>${esc(capOf(x.p))}</h3>` : ''}
              ${textOf(x.p) ? `<div class="side-body">${paras(textOf(x.p))}</div>` : ''}
            </div>
          </div>`).join('')}</div>`;
      } else if (L === 'scroll') {
        body = `<div class="lay-scroll" data-drag>${g.items.map((x) => fig(x, 'scroll')).join('')}</div>
          <p class="scroll-hint meta">${t('drag')}</p>`;
      } else if (L === 'grid') {
        body = `<div class="lay-grid">${g.items.map((x) => fig(x, 'grid')).join('')}</div>`;
      } else {
        body = `<div class="lay-stack">${g.items.map((x) => fig(x, 'photo', true)).join('')}</div>`;
      }
      return `<section class="photo-block">${head}${body}</section>`;
    };
    document.title = `${title} — ${settings.site_title || ''}`;
    main.innerHTML = `
      <header class="series-head">
        <a class="back" href="/series.html">${t('back')}</a>
        <h1>${esc(title)}</h1>
        <p class="meta">${esc(seriesMeta(s))}</p>
        ${pick(s, 'description') ? `<div class="lead">${paras(pick(s, 'description'))}</div>` : ''}
      </header>
      ${chs.length > 1 ? `<nav class="chapter-toc">${chs.map((c, ci) => (s.photos.some((p) => p.chapter === ci) ? `<a href="#ch-${ci}">${esc(pick(c, 'title'))}</a>` : '')).join('')}</nav>` : ''}
      <div class="photos">${groups.map(block).join('') || empty()}</div>
      <nav class="series-nav">
        ${prev ? `<a href="/series.html?s=${encodeURIComponent(prev.slug)}"><span class="meta">← ${t('prev')}</span><strong>${esc(pick(prev, 'title'))}</strong></a>` : ''}
        ${next ? `<a href="/series.html?s=${encodeURIComponent(next.slug)}"><span class="meta">${t('next')} →</span><strong>${esc(pick(next, 'title'))}</strong></a>` : ''}
      </nav>`;
    const sub = (p) => [title, p.chapter != null && chs[p.chapter] ? pick(chs[p.chapter], 'title') : ''].filter(Boolean).join(' · ');
    lbItems = s.photos.map((p) => ({ src: p.image, cap: pick(p, 'caption'), sub: sub(p) }));
  }

  /* ---------- 아카이브 ---------- */
  function archive() {
    const main = $('main');
    if (archiveFilter !== 'all' && !series.some((s) => s.slug === archiveFilter)) archiveFilter = 'all';
    const list = series
      .filter((s) => archiveFilter === 'all' || s.slug === archiveFilter)
      .flatMap((s) => s.photos.map((p) => ({ p, s })));
    document.title = `${t('archive')} — ${settings.site_title || ''}`;
    main.innerHTML = `
      <section class="section"><div class="wrap">
        <h1 class="page-title">${t('archive')}</h1>
        ${series.length > 1 ? `<div class="filters">
          <button data-filter="all" class="${archiveFilter === 'all' ? 'on' : ''}">${t('all')}</button>
          ${series.map((s) => `<button data-filter="${esc(s.slug)}" class="${archiveFilter === s.slug ? 'on' : ''}">${esc(pick(s, 'title'))}</button>`).join('')}
        </div>` : ''}
        <div class="masonry">
          ${list.map(({ p, s }, j) => {
            const ch = p.chapter != null && s.chapters && s.chapters[p.chapter] ? pick(s.chapters[p.chapter], 'title') : '';
            const name = pick(p, 'caption') || ch || pick(s, 'title');
            const sub = [pick(s, 'title'), ch].filter((x) => x && x !== name).join(' · ');
            return `<figure>${img(p.image, name, ` data-lb="${j}"`, 'grid')}<figcaption><span class="a-title">${esc(name)}</span>${sub ? `<span class="a-sub">${esc(sub)}</span>` : ''}</figcaption></figure>`;
          }).join('')}
        </div>
        ${list.length ? '' : empty()}
      </div></section>`;
    lbItems = list.map(({ p, s }) => ({ src: p.image, cap: pick(p, 'caption'), sub: pick(s, 'title'), href: `/series.html?s=${encodeURIComponent(s.slug)}` }));
  }

  /* ---------- 소식 ---------- */
  const newsDate = (d) => String(d || '').slice(0, 10).replace(/-/g, '.');
  const catLabel = (c) => (T[lang].cat || {})[c] || (T[lang].cat || {}).news;
  const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : '');
  function newsPage() {
    const main = $('main');
    const slug = new URLSearchParams(location.search).get('n');
    if (slug) {
      const n = news.find((x) => x.slug === slug);
      if (!n) { main.innerHTML = `<section class="series-head"><a class="back" href="/news.html">${t('newsBack')}</a><p class="empty">${t('newsEmpty')}</p></section>`; return; }
      const link = safeUrl(n.link);
      document.title = `${pick(n, 'title')} — ${settings.site_title || ''}`;
      main.innerHTML = `
        <article class="news-article">
          <a class="back" href="/news.html">${t('newsBack')}</a>
          <p class="meta">${esc(catLabel(n.category))} · ${esc(newsDate(n.date))}</p>
          <h1>${esc(pick(n, 'title'))}</h1>
          ${pick(n, 'summary') ? `<p class="news-lead">${esc(pick(n, 'summary'))}</p>` : ''}
          ${n.image ? `<figure class="news-figure">${img(n.image, pick(n, 'title'), ' data-lb="0"', 'photo')}</figure>` : ''}
          ${pick(n, 'body') ? `<div class="news-body">${paras(pick(n, 'body'))}</div>` : ''}
          ${link ? `<div class="news-btns"><a class="news-btn line" href="${esc(link)}" target="_blank" rel="noopener">${t('readMore')} ↗</a></div>` : ''}
        </article>`;
      lbItems = n.image ? [{ src: n.image, cap: pick(n, 'title'), sub: catLabel(n.category) }] : [];
      return;
    }
    document.title = `${t('news')} — ${settings.site_title || ''}`;
    main.innerHTML = `
      <section class="section"><div class="wrap">
        <h1 class="page-title">${t('news')}</h1>
        <div class="news-list">
          ${news.map((n) => {
            const link = safeUrl(n.link);
            const href = `/news.html?n=${encodeURIComponent(n.slug)}`;
            return `
            <article class="news-item${n.image ? '' : ' no-img'}">
              <div class="news-when"><span>${esc(newsDate(n.date))}</span><span class="meta">${esc(catLabel(n.category))}</span></div>
              <div class="news-text">
                <h2><a href="${href}">${esc(pick(n, 'title'))}</a></h2>
                ${pick(n, 'summary') ? `<p>${esc(pick(n, 'summary'))}</p>` : ''}
                <div class="news-btns">
                  <a class="news-btn" href="${href}">${t('more')} →</a>
                  ${link ? `<a class="news-btn line" href="${esc(link)}" target="_blank" rel="noopener">${t('readMore')} ↗</a>` : ''}
                </div>
              </div>
              ${n.image ? `<a class="news-thumb" href="${href}" tabindex="-1">${img(n.image, pick(n, 'title'), '', 'card')}</a>` : ''}
            </article>`;
          }).join('') || `<p class="empty">${t('newsEmpty')}</p>`}
        </div>
      </div></section>`;
  }

  /* ---------- 소개 ---------- */
  function about() {
    document.title = `${t('about')} — ${settings.site_title || ''}`;
    $('main').innerHTML = `
      <section class="section"><div class="wrap split">
        ${settings.about_image ? `<div class="portrait">${img(settings.about_image, settings.site_title || '', '', 'portrait')}</div>` : '<div></div>'}
        <div>
          <h1 class="page-title">${t('about')}</h1>
          <div class="prose">${paras(pick(settings, 'about'))}</div>
          ${contactInfo()}
        </div>
      </div></section>`;
  }

  function contactInfo() {
    const ig = settings.instagram;
    return `<div class="info-list">
      ${settings.email ? `<div><span class="meta">${t('email')}</span><a href="mailto:${esc(settings.email)}">${esc(settings.email)}</a></div>` : ''}
      ${ig ? `<div><span class="meta">${t('instagram')}</span><a href="https://instagram.com/${esc(ig.replace(/^@/, ''))}" target="_blank" rel="noopener">@${esc(ig.replace(/^@/, ''))}</a></div>` : ''}
    </div>`;
  }

  /* ---------- 연락 ---------- */
  function contact() {
    document.title = `${t('contact')} — ${settings.site_title || ''}`;
    $('contact-intro').innerHTML = paras(pick(settings, 'contact_intro')) + contactInfo();
  }

  function bindForm() {
    const form = $('contact-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('.submit');
      const status = $('form-status');
      btn.disabled = true;
      status.textContent = t('sending');
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.textContent = t('sent');
      } catch (err) {
        status.textContent = t('failed');
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ---------- 라이트박스 ---------- */
  let lbItems = [];
  let lbIndex = 0;
  const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const lb = document.createElement('div');
  lb.className = 'lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = `
    <span class="lb-count"></span>
    <button class="lb-btn lb-close" aria-label="Close">${icon('M5 5l14 14M19 5L5 19')}</button>
    <button class="lb-btn lb-prev" aria-label="Previous">${icon('M15 4l-8 8 8 8')}</button>
    <figure><img alt=""><figcaption><span class="lb-cap"></span><a class="lb-sub"></a></figcaption></figure>
    <button class="lb-btn lb-next" aria-label="Next">${icon('M9 4l8 8-8 8')}</button>`;
  document.body.appendChild(lb);

  function lbShow(n) {
    if (!lbItems.length) return;
    lbIndex = (n + lbItems.length) % lbItems.length;
    const it = lbItems[lbIndex];
    const im = lb.querySelector('img');
    im.src = cdn(it.src, 2400);
    im.alt = it.cap || it.sub || '';
    lb.querySelector('.lb-cap').textContent = it.cap || '';
    const sub = lb.querySelector('.lb-sub');
    sub.textContent = it.sub || '';
    if (it.href) sub.href = it.href; else sub.removeAttribute('href');
    lb.querySelector('.lb-count').textContent = `${lbIndex + 1} / ${lbItems.length}`;
    const multi = lbItems.length > 1;
    lb.querySelector('.lb-prev').hidden = !multi;
    lb.querySelector('.lb-next').hidden = !multi;
  }
  function lbOpen(n) { lbShow(n); lb.classList.add('open'); document.documentElement.style.overflow = 'hidden'; lb.querySelector('.lb-close').focus(); }
  function lbClose() { lb.classList.remove('open'); document.documentElement.style.overflow = ''; }

  lb.addEventListener('click', (e) => {
    if (e.target.closest('.lb-prev')) lbShow(lbIndex - 1);
    else if (e.target.closest('.lb-next')) lbShow(lbIndex + 1);
    else if (e.target.closest('.lb-close') || e.target === lb) lbClose();
  });
  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
    if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
  });

  /* ---------- 이벤트 ---------- */
  document.addEventListener('click', (e) => {
    const langBtn = e.target.closest('[data-lang]');
    if (langBtn) { lang = langBtn.dataset.lang; store.set('lang', lang); render(); return; }
    if (e.target.closest('.menu-btn')) {
      const h = $('site-header');
      const open = h.classList.toggle('menu-open');
      e.target.closest('.menu-btn').setAttribute('aria-expanded', open);
      document.documentElement.style.overflow = open ? 'hidden' : '';
      return;
    }
    const f = e.target.closest('[data-filter]');
    if (f) {
      archiveFilter = f.dataset.filter;
      const u = new URL(location.href);
      if (archiveFilter === 'all') u.searchParams.delete('s'); else u.searchParams.set('s', archiveFilter);
      history.replaceState(null, '', u);
      archive();
      markLoaded();
      return;
    }
    const lbEl = e.target.closest('[data-lb]');
    if (lbEl) lbOpen(+lbEl.dataset.lb);
  });

  document.addEventListener('load', (e) => { if (e.target.tagName === 'IMG') e.target.classList.add('loaded'); }, true);
  const markLoaded = () => document.querySelectorAll('img.fade').forEach((i) => { if (i.complete && i.naturalWidth) i.classList.add('loaded'); });

  if (page === 'home') {
    const onScroll = () => { const h = $('site-header'); if (h) h.classList.toggle('scrolled', scrollY > innerHeight - 90); };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 글자 복사·잘라내기 막기 (입력칸 안에서는 허용)
  // 연락 페이지 전체와 이메일 주소는 복사할 수 있게 둔다.
  const elOf = (e) => (e.target && e.target.nodeType === 3 ? e.target.parentElement : e.target);
  const inField = (e) => page === 'contact' || !!(elOf(e) && elOf(e).closest && elOf(e).closest('input, textarea, select, a[href^="mailto:"]'));
  ['copy', 'cut'].forEach((ev) => document.addEventListener(ev, (e) => { if (!inField(e)) e.preventDefault(); }));
  document.addEventListener('selectstart', (e) => { if (!inField(e)) e.preventDefault(); });
  // 사진 우클릭(이미지 저장) 막기, 끌어서 저장하기 막기
  const onImg = (e) => e.target && e.target.tagName === 'IMG';
  document.addEventListener('contextmenu', (e) => { if (onImg(e)) e.preventDefault(); });
  document.addEventListener('dragstart', (e) => { if (onImg(e)) e.preventDefault(); });

  // 가로 스크롤 묶음: 마우스로 끌어서 넘기기 (터치는 기본 스크롤)
  let drag = null;
  document.addEventListener('pointerdown', (e) => {
    const el = e.pointerType === 'mouse' && e.target.closest && e.target.closest('[data-drag]');
    if (!el) return;
    drag = { el, x: e.clientX, left: el.scrollLeft, moved: false };
    el.classList.add('dragging');
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) drag.moved = true;
    drag.el.scrollLeft = drag.left - dx;
  });
  let justDragged = false;
  addEventListener('pointerup', () => {
    if (!drag) return;
    drag.el.classList.remove('dragging');
    justDragged = drag.moved;
    drag = null;
    setTimeout(() => { justDragged = false; }, 60);
  });
  // 끌어서 넘긴 직후의 클릭은 사진 크게 보기를 열지 않게
  document.addEventListener('click', (e) => { if (justDragged) { e.stopPropagation(); e.preventDefault(); justDragged = false; } }, true);

  function render() {
    document.documentElement.lang = lang;
    header();
    footer();
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    if (page === 'home') home();
    else if (page === 'series') seriesPage();
    else if (page === 'archive') archive();
    else if (page === 'news') newsPage();
    else if (page === 'about') about();
    else if (page === 'contact') contact();
    markLoaded();
  }

  bindForm();
  load().then(render);
})();
