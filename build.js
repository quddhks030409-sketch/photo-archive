// Netlify가 배포할 때마다 실행: content/series/*.json 을 모아 content/index.json 을 만든다.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'content', 'series');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : [];

const series = files
  .map((f) => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const ok = (list) => (list || []).filter((p) => p && p.image);
    // 소주제(chapters)의 사진도 photos 하나로 이어 붙이고, 어느 소주제인지 표시해 둔다.
    const chapters = (data.chapters || []).filter((c) => c && (c.title_ko || c.title_en));
    const photos = [
      ...ok(data.photos),
      ...chapters.flatMap((c, ci) => ok(c.photos).map((p) => ({ ...p, chapter: ci }))),
    ];
    return { slug: f.replace(/\.json$/, ''), ...data, chapters: chapters.map(({ photos: _, ...c }) => c), photos };
  })
  .filter((s) => !s.draft)
  .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

fs.writeFileSync(path.join(__dirname, 'content', 'index.json'), JSON.stringify({ series }, null, 2));
console.log(`Built content/index.json: ${series.length} series, ${series.reduce((n, s) => n + s.photos.length, 0)} photos`);
