// 사이트를 배포할 때마다 실행돼요 (Cloudflare Pages: npm run build → dist 폴더).
// 1) content/series, content/news 를 모아 content/index.json 을 만들고
// 2) 올린 사진을 화면 크기별로 미리 줄여 둬요. 원본은 GitHub에 그대로 남아요.
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
// 화면 크기별로 만들어 둘 사진 너비 (assets/app.js 의 WIDTHS 와 같아야 해요)
const WIDTHS = [400, 800, 1200, 1600, 2400];
const MAX = WIDTHS[WIDTHS.length - 1];
const RESIZABLE = /\.(jpe?g|png|webp|avif|tiff?)$/i;
// 사이트에 올리지 않는 파일과 폴더
const SKIP = new Set(['.git', '.github', 'node_modules', 'dist', 'functions', 'images', 'build.js', 'package.json', 'package-lock.json', 'README.md', 'netlify.toml', '.gitignore', '.DS_Store']);

/* ---------- 1. 글과 사진 목록 ---------- */
function readJsonDir(dir) {
  return fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => ({ slug: f.replace(/\.json$/, ''), ...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }))
    : [];
}
const byDate = (a, b) => String(b.date || '').localeCompare(String(a.date || ''));

const series = readJsonDir(path.join(ROOT, 'content', 'series'))
  .map((data) => {
    const ok = (list) => (list || []).filter((p) => p && p.image);
    // 소주제(chapters)의 사진도 photos 하나로 이어 붙이고, 어느 소주제인지 표시해 둔다.
    const chapters = (data.chapters || []).filter((c) => c && (c.title_ko || c.title_en));
    const photos = [...ok(data.photos), ...chapters.flatMap((c, ci) => ok(c.photos).map((p) => ({ ...p, chapter: ci })))];
    return { ...data, chapters: chapters.map(({ photos: _, ...c }) => c), photos };
  })
  .filter((s) => !s.draft)
  .sort(byDate);

const news = readJsonDir(path.join(ROOT, 'content', 'news'))
  .filter((n) => !n.draft && (n.title_ko || n.title_en))
  .sort(byDate);

/* ---------- 2. 사이트 파일 복사 ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const name of fs.readdirSync(ROOT)) {
  if (SKIP.has(name)) continue;
  fs.cpSync(path.join(ROOT, name), path.join(OUT, name), { recursive: true });
}
fs.mkdirSync(path.join(OUT, 'content'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'content', 'index.json'), JSON.stringify({ series, news }, null, 2));
console.log(`content/index.json: ${series.length} series, ${series.reduce((n, s) => n + s.photos.length, 0)} photos, ${news.length} news`);

/* ---------- 3. 사진 줄이기 ---------- */
// images/ 안의 사진은 같은 주소에 긴 변 2400px 로 줄여서 올리고 (크게 보기용),
// /img/<너비>/... 에 더 작은 크기들을 만들어 둬요.
function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? listFiles(p) : [p];
  });
}

async function resizeAll() {
  const files = listFiles(path.join(ROOT, 'images')).filter((f) => !path.basename(f).startsWith('.'));
  if (!files.length) return;
  const sharp = require('sharp');
  sharp.cache(false);
  let done = 0;
  let failed = 0;

  async function one(file) {
    const rel = path.relative(ROOT, file); // images/uploads/a.jpg
    const dest = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (!RESIZABLE.test(file)) {
      fs.copyFileSync(file, dest); // gif, svg 등은 그대로
      return;
    }
    try {
      const ext = path.extname(file).toLowerCase();
      const fmt = ext === '.png' ? 'png' : ext === '.webp' ? 'webp' : 'jpeg';
      const encode = (s) => (fmt === 'png' ? s.png({ compressionLevel: 9 }) : fmt === 'webp' ? s.webp({ quality: 82 }) : s.jpeg({ quality: 82, progressive: true }));
      // 한 번만 읽어서 2400px 로 줄인 뒤, 그걸로 작은 크기들을 만들어요 (빠름)
      const big = await encode(sharp(file, { failOn: 'none' }).rotate().resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })).toBuffer();
      fs.writeFileSync(dest, big);
      const sub = path.relative('images', rel); // uploads/a.jpg
      for (const w of WIDTHS) {
        if (w === MAX) continue; // 가장 큰 크기는 원래 주소(images/...)에 이미 있어요
        const out = path.join(OUT, 'img', String(w), sub);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        await encode(sharp(big).resize({ width: w, height: w, fit: 'inside', withoutEnlargement: true })).toFile(out);
      }
      done++;
    } catch (err) {
      failed++;
      console.warn(`사진을 줄이지 못해 원본을 그대로 올려요: ${rel} (${err.message})`);
      fs.copyFileSync(file, dest);
    }
  }

  // 여러 장을 동시에 처리
  const queue = files.slice();
  const workers = Array.from({ length: Math.max(1, Math.min(4, os.cpus().length)) }, async () => {
    while (queue.length) await one(queue.shift());
  });
  await Promise.all(workers);
  console.log(`사진 ${done}장을 크기별로 줄였어요${failed ? ` (실패 ${failed}장)` : ''}`);
}

const t0 = Date.now();
resizeAll()
  .then(() => console.log(`완료: dist 폴더 (${((Date.now() - t0) / 1000).toFixed(1)}초)`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
