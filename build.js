// Netlify가 배포할 때마다 실행: content/series/*.json 을 모아 content/index.json 을 만든다.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'content', 'series');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : [];

const series = files
  .map((f) => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    return { slug: f.replace(/\.json$/, ''), ...data, photos: (data.photos || []).filter((p) => p && p.image) };
  })
  .filter((s) => !s.draft)
  .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

fs.writeFileSync(path.join(__dirname, 'content', 'index.json'), JSON.stringify({ series }, null, 2));
console.log(`Built content/index.json: ${series.length} series, ${series.reduce((n, s) => n + s.photos.length, 0)} photos`);
