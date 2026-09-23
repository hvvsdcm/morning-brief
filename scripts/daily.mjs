// 매일 아침 실행: 수집 → AI 편집 → 검증 → 사이트 빌드 → GitHub 푸시.
// 사용법: node scripts/daily.mjs [--force] [--no-publish]
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runClaude } from '../src/ai.mjs';
import { collectNews } from '../src/collect.mjs';
import { finalizeEdition } from '../src/edition.mjs';
import { collectMarkets } from '../src/markets.mjs';
import { buildUserPrompt, EDITION_SCHEMA, SYSTEM_PROMPT } from '../src/prompt.mjs';
import { publish } from '../src/publish.mjs';
import { kstParts } from '../src/text.mjs';
import { buildSite, ROOT } from './build.mjs';

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const doPublish = !args.has('--no-publish');

const { date } = kstParts();
const logDir = join(ROOT, 'logs');
const editionPath = join(ROOT, 'data', 'editions', `${date}.json`);
mkdirSync(logDir, { recursive: true });
mkdirSync(join(ROOT, 'data', 'editions'), { recursive: true });
mkdirSync(join(ROOT, 'data', 'raw'), { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(join(logDir, `${date}.log`), `${line}\n`);
}

async function generate() {
  const now = new Date();
  const [{ items, feedStatus }, markets] = await Promise.all([collectNews({ now, log }), collectMarkets({ log })]);
  log(`기사 ${items.length}건 (피드 ${feedStatus.filter((f) => f.ok).length}/${feedStatus.length}), 시장 지표 ${markets.length}개`);
  writeFileSync(join(ROOT, 'data', 'raw', `${date}.json`), JSON.stringify({ items, feedStatus, markets }, null, 1));

  const prompt = buildUserPrompt({ date, items, markets });
  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      log(`AI 편집 시작 (시도 ${attempt}, 프롬프트 ${prompt.length.toLocaleString()}자)`);
      const { output, meta } = await runClaude({ system: SYSTEM_PROMPT, prompt, schema: EDITION_SCHEMA });
      const edition = finalizeEdition({ raw: output, items, markets, date, generatedAt: new Date().toISOString(), feedStatus, model: meta.model });
      log(`AI 편집 완료 (${Math.round(meta.durationMs / 1000)}초, ${meta.model}) — 기사 ${edition.sections.reduce((n, s) => n + s.stories.length, 0)}건, ${edition.stats.chars}자, 약 ${edition.stats.readingMinutes}분`);
      return edition;
    } catch (err) {
      lastErr = err;
      log(`AI 편집 실패: ${err.message}`);
    }
  }
  throw lastErr;
}

try {
  if (existsSync(editionPath) && !force) {
    log(`${date} 호가 이미 있어 생성을 건너뜁니다 (--force로 재생성)`);
  } else {
    const edition = await generate();
    writeFileSync(editionPath, `${JSON.stringify(edition, null, 2)}\n`);
    log(`저장: ${editionPath}`);
  }
  const built = buildSite();
  log(`사이트 빌드: ${built.editions}개 호`);
  if (doPublish) log(publish({ root: ROOT, message: `${date} 호 발행` }));
} catch (err) {
  log(`실패: ${err.stack ?? err.message}`);
  process.exitCode = 1;
}
