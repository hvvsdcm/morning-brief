// data/editions/*.json → docs/ 정적 사이트. GitHub Pages는 main 브랜치 /docs를 서비스한다.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderArchive, renderEdition, renderEmpty } from '../src/render.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function buildSite({ root = ROOT } = {}) {
  const editionsDir = join(root, 'data', 'editions');
  const out = join(root, 'docs');
  mkdirSync(join(out, 'editions'), { recursive: true });
  mkdirSync(join(out, 'assets'), { recursive: true });

  for (const f of readdirSync(join(root, 'web'))) {
    const dest = f.endsWith('.webmanifest') ? join(out, f) : join(out, 'assets', f);
    copyFileSync(join(root, 'web', f), dest);
  }
  writeFileSync(join(out, '.nojekyll'), '');

  let dates = [];
  try {
    dates = readdirSync(editionsDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map((f) => f.slice(0, 10)).sort();
  } catch {
    // 아직 호가 없음
  }
  const editions = dates.map((d) => JSON.parse(readFileSync(join(editionsDir, `${d}.json`), 'utf8')));

  editions.forEach((e, i) => {
    const ctx = { number: i + 1, prev: dates[i - 1], next: dates[i + 1] };
    writeFileSync(join(out, 'editions', `${e.date}.html`), renderEdition(e, { ...ctx, prefix: '../', isLatest: false }));
    if (i === editions.length - 1) writeFileSync(join(out, 'index.html'), renderEdition(e, { ...ctx, prefix: '', isLatest: true }));
  });
  if (!editions.length) writeFileSync(join(out, 'index.html'), renderEmpty());

  const list = editions
    .map((e) => ({ date: e.date, headline: e.headline, readingMinutes: e.stats.readingMinutes }))
    .reverse();
  writeFileSync(join(out, 'archive.html'), renderArchive(list));
  return { editions: editions.length };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(buildSite());
}
