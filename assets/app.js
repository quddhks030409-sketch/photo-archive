(() => {
  'use strict';

  // UI 문구 (사진 제목·설명은 관리자 페이지에서 한/영으로 따로 입력)
  const T = {
    ko: {
      series: '시리즈', archive: '아카이브', about: '소개', contact: '연락',
      latest: '시리즈', all: '전체', photos: '장', back: '← 모든 시리즈',
      prev: '이전 시리즈', next: '다음 시리즈',
      empty: '아직 올린 사진이 없어요.', notFound: '시리즈를 찾을 수 없어요.',
      email: '이메일', instagram: '인스타그램',
      name: '이름', subject: '제목', message: '메시지', send: '보내기',
      sending: '보내는 중…', sent: '메시지가 전달되었어요. 확인 후 답장드릴게요.',
      failed: '전송에 실패했어요. 이메일로 직접 연락해 주세요.',
    },
    en: {
      series: 'Series', archive: 'Archive', about: 'About', contact: 'Contact',
      latest: 'Series', all: 'All', photos: ' photos', back: '← All series',
      prev: 'Previous', next: 'Next',
      empty: 'No photographs yet.', notFound: 'Series not found.',
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
  let heroTimer = null;
  let archiveFilter = new URLSearchParams(location.search).get('s') || 'all';

  async function load() {
    const get = (u) => fetch(u, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const [s, idx] = await Promise.all([get('/content/settings.json'), get('/content/index.json')]);
    settings = s || {};
    series = ((idx && idx.series) || []).map((x) => ({ ...x, photos: x.photos || [] }));
  }

  /* ---------- 공통 ---------- */
  function header() {
    const el = $('site-header');
    if (!el) return;
    const links = [['series', '/series.html'], ['archive', '/archive.html'], ['about', '/about.html'], ['contact', '/contact.html']];
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
    el.innerHTML = `
      <div class="footer-inner">
        <span>© ${new Date().getFullYear()} ${esc(settings.site_title || '')}</span>
        <span class="footer-links">
          ${settings.email ? `<a href="mailto:${esc(settings.email)}">${esc(settings.email)}</a>` : ''}
          ${ig ? `<a href="https://instagram.com/${esc(ig.replace(/^@/, ''))}" target="_blank" rel="noopener">Instagram</a>` : ''}
        </span>
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
    document.title = `${title} — ${settings.site_title || ''}`;
    main.innerHTML = `
      <header class="series-head">
        <a class="back" href="/series.html">${t('back')}</a>
        <h1>${esc(title)}</h1>
        <p class="meta">${esc(seriesMeta(s))}</p>
        ${pick(s, 'description') ? `<div class="lead">${paras(pick(s, 'description'))}</div>` : ''}
      </header>
      ${chs.length > 1 ? `<nav class="chapter-toc">${chs.map((c, ci) => (s.photos.some((p) => p.chapter === ci) ? `<a href="#ch-${ci}">${esc(pick(c, 'title'))}</a>` : '')).join('')}</nav>` : ''}
      <div class="photos">
        ${s.photos.map((p, j) => {
          const c = p.chapter != null && p.chapter !== (s.photos[j - 1] || {}).chapter ? chs[p.chapter] : null;
          return `${c ? `
          <header class="chapter-head" id="ch-${p.chapter}">
            <h2>${esc(pick(c, 'title'))}</h2>
            ${pick(c, 'note') ? `<p class="meta">${esc(pick(c, 'note'))}</p>` : ''}
            ${pick(c, 'description') ? `<div class="lead">${paras(pick(c, 'description'))}</div>` : ''}
          </header>` : ''}
          <figure>
            ${img(p.image, pick(p, 'caption') || title, ` data-lb="${j}"`)}
            ${pick(p, 'caption') ? `<figcaption>${esc(pick(p, 'caption'))}</figcaption>` : ''}
          </figure>`;
        }).join('') || empty()}
      </div>
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
          ${list.map(({ p, s }, j) => `<figure>${img(p.image, pick(p, 'caption') || pick(s, 'title'), ` data-lb="${j}"`, 'grid')}</figure>`).join('')}
        </div>
        ${list.length ? '' : empty()}
      </div></section>`;
    lbItems = list.map(({ p, s }) => ({ src: p.image, cap: pick(p, 'caption'), sub: pick(s, 'title'), href: `/series.html?s=${encodeURIComponent(s.slug)}` }));
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

  function render() {
    document.documentElement.lang = lang;
    header();
    footer();
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    if (page === 'home') home();
    else if (page === 'series') seriesPage();
    else if (page === 'archive') archive();
    else if (page === 'about') about();
    else if (page === 'contact') contact();
    markLoaded();
  }

  bindForm();
  load().then(render);
})();
