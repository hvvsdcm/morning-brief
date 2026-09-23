import { SITE } from './config.mjs';
import { escapeHtml as esc, formatKoreanDate } from './text.mjs';

// 테두리형 아이콘(24x24, stroke). 모두 장식용이므로 aria-hidden, 의미는 옆 텍스트나 aria-label이 전달한다.
const ICON_PATHS = {
  building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
  landmark: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7"/><path d="M12 2l8 5H4z"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  flat: '<path d="M5 12h14"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>',
  newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/>',
  lightbulb: '<path d="M9 18h6M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
};

export function icon(name, cls = 'icon') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`;
}

export function safeUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '#';
  } catch {
    return '#';
  }
}

const kstTime = (iso) =>
  new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
const kstMonthDay = (iso) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  return `${p.month}/${p.day}`;
};
const shortDate = (date) => {
  const [, m, d] = date.split('-').map(Number);
  return `${m}월 ${d}일`;
};

function fmtNum(n, digits) {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function sources(list, cls = 'sources') {
  if (!list?.length) return '';
  const counts = {};
  const links = list.map((s) => {
    counts[s.source] = (counts[s.source] ?? 0) + 1;
    const label = counts[s.source] > 1 ? `${s.source} ${counts[s.source]}` : s.source;
    return `<li><a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer" title="${esc(s.title)}" aria-label="${esc(`${s.source}: ${s.title} (새 창)`)}">${esc(label)}</a></li>`;
  });
  return `<div class="${cls}"><span class="sources-label">출처</span><ul>${links.join('')}</ul></div>`;
}

function sparkline(values) {
  if (!values || values.length < 2) return '';
  const w = 96;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><polyline points="${pts.join(' ')}" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
}

function marketCard(m, generatedAt) {
  const dir = m.changePct == null || Math.abs(m.changePct) < 0.005 ? 'flat' : m.changePct > 0 ? 'up' : 'down';
  const word = { up: '상승', down: '하락', flat: '보합' }[dir];
  const unit = m.unit ?? '';
  const value = unit === '$' ? `$${fmtNum(m.price, m.digits)}` : `${fmtNum(m.price, m.digits)}${unit === '%' ? '%' : ''}`;
  const unitSuffix = unit && unit !== '$' && unit !== '%' ? `<span class="mkt-unit">${esc(unit)}</span>` : '';
  const pct = m.changePct == null ? '—' : `${m.changePct > 0 ? '+' : ''}${m.changePct.toFixed(2)}%`;
  const abs = m.change == null ? '' : `${m.change > 0 ? '+' : ''}${fmtNum(m.change, m.digits)}`;
  // 휴장 등으로 발행 시점보다 36시간 넘게 오래된 시세는 기준일을 드러낸다.
  const stale = Date.parse(generatedAt) - Date.parse(m.asOf) > 36 * 3600_000;
  const label = `${m.label} ${value}${unit && unit !== '$' && unit !== '%' ? unit : ''}, 전 거래일 대비 ${pct.replace(/^[+-]/, '')} ${word}${stale ? `, ${kstMonthDay(m.asOf)} 기준` : ''}`;
  return `<li class="mkt ${dir}" aria-label="${esc(label)}">
  <div class="mkt-head"><span class="mkt-label">${esc(m.label)}</span>${stale ? `<span class="mkt-asof">${esc(kstMonthDay(m.asOf))} 기준</span>` : ''}</div>
  <div class="mkt-value">${esc(value)}${unitSuffix}</div>
  <div class="mkt-change">${icon(dir, 'icon mkt-dir')}<span>${esc(pct)}</span><span class="mkt-abs">${esc(abs)}</span></div>
  ${sparkline(m.spark)}
</li>`;
}

function renderMarkets(e) {
  if (!e.markets?.length) return '';
  return `<section class="block markets" id="markets" aria-labelledby="markets-h">
  <h2 class="block-title" id="markets-h">${icon('chart')}시장 지표<span class="block-note">전 거래일 대비 · 한 달 추이</span></h2>
  <ul class="mkt-grid">${e.markets.map((m) => marketCard(m, e.generatedAt)).join('')}</ul>
  ${e.marketComment ? `<p class="mkt-comment">${esc(e.marketComment)}</p>` : ''}
</section>`;
}

function renderSummary(e) {
  return `<section class="block summary" id="summary" aria-labelledby="summary-h">
  <h2 class="block-title" id="summary-h">${icon('list')}3분 요약</h2>
  <ol class="summary-list">${e.summary.map((s) => `<li><p>${esc(s.text)}</p></li>`).join('')}</ol>
</section>`;
}

function renderLead(e) {
  const l = e.lead;
  return `<article class="lead" id="lead" aria-labelledby="lead-h">
  <p class="kicker">1면 · ${esc(l.sectionName)}</p>
  <h2 class="lead-title" id="lead-h">${esc(l.title)}</h2>
  <p class="lead-dek">${esc(l.dek)}</p>
  <div class="lead-body">${l.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
  <div class="lead-aside">
    <section class="callout why" aria-label="왜 중요한가"><h3>${icon('lightbulb')}왜 중요한가</h3><p>${esc(l.whyItMatters)}</p></section>
    ${l.watchPoints.length ? `<section class="callout watch" aria-label="지켜볼 점"><h3>${icon('eye')}지켜볼 점</h3><ul>${l.watchPoints.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></section>` : ''}
  </div>
  ${sources(l.sources)}
</article>`;
}

function renderStory(st, id) {
  return `<article class="story" id="${id}" aria-labelledby="${id}-h">
  <h3 class="story-title" id="${id}-h">${esc(st.title)}</h3>
  <p class="story-summary">${esc(st.summary)}</p>
  <div class="story-analysis"><span class="tag">분석</span><p>${esc(st.analysis)}</p></div>
  <div class="story-implication"><span class="tag">시사점</span><p>${esc(st.implication)}</p></div>
  ${sources(st.sources)}
</article>`;
}

function renderSection(s) {
  return `<section class="paper-section" id="sec-${s.id}" aria-labelledby="sec-${s.id}-h">
  <header class="section-head"><h2 id="sec-${s.id}-h">${icon(s.icon)}${esc(s.name)}</h2><span class="section-count">${s.stories.length}건</span></header>
  <div class="stories">${s.stories.map((st, i) => renderStory(st, `${s.id}-${i + 1}`)).join('')}</div>
</section>`;
}

function renderExtras(e) {
  const parts = [];
  if (e.watchlist.length) {
    parts.push(`<section class="block checkpoints" id="checkpoints" aria-labelledby="checkpoints-h">
  <h2 class="block-title" id="checkpoints-h">${icon('calendar')}체크포인트</h2>
  <ul class="check-list">${e.watchlist.map((w) => `<li><span class="check-when">${esc(w.when)}</span><span class="check-what">${esc(w.what)}</span></li>`).join('')}</ul>
</section>`);
  }
  if (e.terms.length) {
    parts.push(`<section class="block terms" id="terms" aria-labelledby="terms-h">
  <h2 class="block-title" id="terms-h">${icon('book')}용어 풀이</h2>
  <dl class="term-list">${e.terms.map((t) => `<div><dt>${esc(t.term)}</dt><dd>${esc(t.explain)}</dd></div>`).join('')}</dl>
</section>`);
  }
  return parts.length ? `<div class="extras">${parts.join('')}</div>` : '';
}

function toc(e) {
  const links = [
    ['summary', '3분 요약'],
    ...(e.markets?.length ? [['markets', '시장']] : []),
    ['lead', '1면'],
    ...e.sections.map((s) => [`sec-${s.id}`, s.name]),
    ...(e.watchlist.length || e.terms.length ? [[e.watchlist.length ? 'checkpoints' : 'terms', '체크포인트·용어']] : []),
  ];
  return `<nav class="toc" aria-label="지면 목차"><ul>${links.map(([id, name]) => `<li><a href="#${id}">${esc(name)}</a></li>`).join('')}</ul></nav>`;
}

function head({ title, description, prefix, canonicalPath }) {
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#101114" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f6f1e7" media="(prefers-color-scheme: light)">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${canonicalPath ? `<link rel="canonical" href="${esc(canonicalPath)}">` : ''}
<link rel="icon" href="${prefix}assets/icon.svg" type="image/svg+xml">
<link rel="manifest" href="${prefix}manifest.webmanifest">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700;900&display=swap">
<link rel="stylesheet" href="${prefix}assets/style.css">
<script>(function(){try{var t=localStorage.getItem('mb-theme');if(t)document.documentElement.dataset.theme=t;var f=localStorage.getItem('mb-font');if(f)document.documentElement.style.setProperty('--fs',f);}catch(e){}})();</script>
<script src="${prefix}assets/app.js" defer></script>
</head>`;
}

function topbar({ prefix, minutes }) {
  return `<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="${prefix}index.html" aria-label="${SITE.title} 최신 호">${icon('newspaper')}<span>${SITE.title}</span></a>
    <div class="topbar-actions">
      ${minutes ? `<span class="remaining" id="remaining" aria-live="off">${icon('clock')}<span data-remaining>약 ${minutes}분</span></span>` : ''}
      <div class="fs-group" role="group" aria-label="글자 크기">
        <button type="button" class="icon-btn" data-font="-1" aria-label="글자 작게">${icon('minus')}</button>
        <span class="fs-label" aria-hidden="true">가</span>
        <button type="button" class="icon-btn" data-font="1" aria-label="글자 크게">${icon('plus')}</button>
      </div>
      <button type="button" class="icon-btn" id="theme-toggle" aria-label="밝은 화면으로 전환">${icon('sun', 'icon when-dark')}${icon('moon', 'icon when-light')}</button>
      <a class="icon-btn" href="${prefix}archive.html" aria-label="지난 호">${icon('archive')}</a>
    </div>
  </div>
  <div class="progress" aria-hidden="true"><span id="progress-bar"></span></div>
</header>`;
}

/**
 * 한 호를 완성된 HTML 문서로 만든다.
 * @param {object} e finalizeEdition 결과
 * @param {{number:number, prefix:string, isLatest:boolean, prev?:string, next?:string}} ctx
 */
export function renderEdition(e, { number, prefix, isLatest, prev, next }) {
  const storyCount = e.sections.reduce((n, s) => n + s.stories.length, 0);
  const title = `${SITE.title} · ${formatKoreanDate(e.date)}`;
  const nav = `<nav class="edition-nav" aria-label="호 이동">
    ${prev ? `<a href="${prefix}editions/${prev}.html">${icon('left')}<span>이전 호<small>${esc(shortDate(prev))}</small></span></a>` : '<span></span>'}
    <a class="to-archive" href="${prefix}archive.html">${icon('archive')}<span>전체 지난 호</span></a>
    ${next ? `<a class="next" href="${prefix}editions/${next}.html"><span>다음 호<small>${esc(shortDate(next))}</small></span>${icon('right')}</a>` : '<span></span>'}
  </nav>`;
  return `<!doctype html>
<html lang="ko" data-theme="dark">
${head({ title, description: e.headline, prefix })}
<body data-edition-date="${e.date}" data-latest="${isLatest}" data-reading-minutes="${e.stats.readingMinutes}" data-publish-hour="${SITE.publishHourKst}">
<a class="skip" href="#main">본문 바로가기</a>
${topbar({ prefix, minutes: e.stats.readingMinutes })}
<div class="notice" id="stale-notice" role="status" hidden></div>
<main id="main" class="page">
  <header class="masthead">
    <p class="masthead-meta"><time datetime="${e.date}">${esc(formatKoreanDate(e.date))}</time><span>제 ${number}호</span><span>${esc(kstTime(e.generatedAt))} 발행</span>${isLatest ? '' : '<span class="badge">지난 호</span>'}</p>
    <h1 class="nameplate">${SITE.title}</h1>
    <p class="headline-of-day">${esc(e.headline)}</p>
    <p class="masthead-stats">${icon('clock')}약 ${e.stats.readingMinutes}분 분량<span aria-hidden="true">·</span>기사 ${storyCount + 1}건<span aria-hidden="true">·</span>원문 ${e.stats.cited}건 인용</p>
  </header>
  ${toc(e)}
  <div class="front">
    ${renderSummary(e)}
    ${renderMarkets(e)}
  </div>
  ${renderLead(e)}
  ${e.sections.map(renderSection).join('\n')}
  ${renderExtras(e)}
  ${nav}
  <footer class="colophon">
    <p>${icon('compass')}공개 기사 ${e.stats.articles}건(매체 피드 ${e.stats.feedsOk}/${e.stats.feedsTotal}개)을 AI가 선별·요약·분석했습니다. 모든 기사는 출처 원문에 근거하며, 중요한 판단 전에는 원문을 확인하세요. 투자 권유가 아닙니다.</p>
    <p class="colophon-meta">시세: Yahoo Finance · 편집: ${esc((e.model ?? 'AI').replace(/\[[^\]]*\]$/, ''))}</p>
  </footer>
</main>
</body>
</html>
`;
}

export function renderArchive(list) {
  // list: [{date, headline, readingMinutes}] 최신순
  const byMonth = new Map();
  for (const it of list) {
    const key = it.date.slice(0, 7);
    byMonth.set(key, [...(byMonth.get(key) ?? []), it]);
  }
  const months = [...byMonth].map(([ym, items]) => {
    const [y, m] = ym.split('-').map(Number);
    return `<section class="archive-month" aria-labelledby="m-${ym}"><h2 id="m-${ym}">${y}년 ${m}월</h2><ol class="archive-list">${items
      .map(
        (it) => `<li><a href="editions/${it.date}.html"><time datetime="${it.date}">${esc(formatKoreanDate(it.date))}</time><span class="archive-headline">${esc(it.headline)}</span><span class="archive-min">${icon('clock')}약 ${it.readingMinutes}분</span></a></li>`,
      )
      .join('')}</ol></section>`;
  });
  return `<!doctype html>
<html lang="ko" data-theme="dark">
${head({ title: `지난 호 · ${SITE.title}`, description: `${SITE.title} 지난 호 모음`, prefix: '' })}
<body data-latest="false">
<a class="skip" href="#main">본문 바로가기</a>
${topbar({ prefix: '', minutes: 0 })}
<main id="main" class="page archive">
  <header class="masthead compact"><h1 class="nameplate">지난 호</h1><p class="headline-of-day">${list.length}개 호 · 최신순</p></header>
  ${list.length ? months.join('') : '<p class="empty">아직 발행된 호가 없습니다. 첫 호는 오전 10시 전에 발행됩니다.</p>'}
</main>
</body>
</html>
`;
}

/** 아직 한 번도 발행되지 않았을 때의 첫 화면 */
export function renderEmpty() {
  return `<!doctype html>
<html lang="ko" data-theme="dark">
${head({ title: SITE.title, description: SITE.tagline, prefix: '' })}
<body data-latest="false">
${topbar({ prefix: '', minutes: 0 })}
<main id="main" class="page"><header class="masthead"><h1 class="nameplate">${SITE.title}</h1><p class="headline-of-day">첫 호는 오전 10시 전에 발행됩니다.</p></header></main>
</body>
</html>
`;
}
