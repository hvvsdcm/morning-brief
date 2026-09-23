import { XMLParser } from 'fast-xml-parser';
import { COLLECT, FEEDS } from './config.mjs';
import { parseFeedDate, toPlainText, truncate } from './text.mjs';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  htmlEntities: true,
  // 대형 피드(연합뉴스 120건)가 기본 확장 한도(1000회·10만 자)에 걸리지 않게 한다.
  processEntities: { enabled: true, maxTotalExpansions: 1e6, maxExpandedLength: 1e8 },
  isArray: (name) => name === 'item' || name === 'entry' || name === 'link',
});

function atomLink(links) {
  if (!Array.isArray(links)) return '';
  const alt = links.find((l) => typeof l === 'object' && (!l['@_rel'] || l['@_rel'] === 'alternate'));
  const pick = alt ?? links[0];
  return typeof pick === 'object' ? (pick['@_href'] ?? toPlainText(pick)) : String(pick ?? '');
}

/**
 * RSS 2.0 / Atom 문자열을 공통 기사 형태로 바꾼다.
 * @returns {{title:string, summary:string, link:string, source:string, publishedAt:Date|null}[]}
 */
export function parseFeed(xml, feed) {
  const doc = parser.parse(xml);
  const rssItems = doc?.rss?.channel?.item ?? doc?.['rdf:RDF']?.item;
  if (rssItems) {
    return rssItems.map((it) => {
      let title = toPlainText(it.title);
      // 구글뉴스는 제목 끝에 " - 매체명"을 붙이고 <source>에 원 매체를 준다.
      const origin = toPlainText(it.source);
      if (origin && title.endsWith(` - ${origin}`)) title = title.slice(0, -(origin.length + 3));
      const summary = toPlainText(it.description ?? it['content:encoded']);
      return {
        title,
        summary: summary === title || summary.startsWith(title) ? '' : summary,
        link: toPlainText(Array.isArray(it.link) ? it.link[0] : it.link),
        source: origin || feed.source,
        publishedAt: parseFeedDate(toPlainText(it.pubDate ?? it['dc:date'])),
      };
    });
  }
  const entries = doc?.feed?.entry;
  if (entries) {
    return entries.map((e) => ({
      title: toPlainText(e.title),
      summary: toPlainText(e.summary ?? e.content),
      link: atomLink(e.link),
      source: feed.source,
      publishedAt: parseFeedDate(toPlainText(e.published ?? e.updated)),
    }));
  }
  throw new Error('RSS/Atom 형식이 아님');
}

function titleKey(title) {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

// "(서울=연합뉴스) 홍길동 기자 = " 같은 바이라인은 요약 길이만 잡아먹는다.
function stripByline(s) {
  return s.replace(/^\([^)]{1,30}=[^)]{1,20}\)\s*/, '').replace(/^[^=.]{1,40}기자\s*=\s*/, '');
}

/** 최근 기사만 남기고 피드별 상한을 적용한 뒤 중복을 제거하고 id를 붙인다. */
export function selectItems(perFeed, now = new Date()) {
  const cutoff = now.getTime() - COLLECT.windowHours * 3600_000;
  const seen = new Set();
  const out = [];
  for (const { feed, items } of perFeed) {
    const recent = items
      .filter((it) => it.title && it.link)
      .filter((it) => !it.publishedAt || (it.publishedAt.getTime() >= cutoff && it.publishedAt.getTime() <= now.getTime() + 3600_000))
      .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
      .slice(0, COLLECT.perFeedLimit);
    for (const it of recent) {
      const key = titleKey(it.title);
      if (!key || seen.has(key) || seen.has(it.link)) continue;
      seen.add(key);
      seen.add(it.link);
      out.push({ ...it, feed: feed.id, hint: feed.hint, summary: truncate(stripByline(it.summary), COLLECT.summaryChars) });
    }
  }
  return out.map((it, i) => ({ id: `n${i + 1}`, ...it }));
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (morning-brief; personal news digest)' },
    signal: AbortSignal.timeout(COLLECT.timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** 모든 피드를 병렬로 받는다. 실패한 피드는 status에만 남기고 건너뛴다. */
export async function collectNews({ now = new Date(), log = () => {} } = {}) {
  const results = await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const items = parseFeed(await fetchText(feed.url), feed);
        return { feed, items, ok: true };
      } catch (err) {
        log(`피드 실패 ${feed.id}: ${err.message}`);
        return { feed, items: [], ok: false, error: err.message };
      }
    }),
  );
  const okFeeds = results.filter((r) => r.ok);
  if (okFeeds.length < COLLECT.minFeedsOk) {
    throw new Error(`성공한 피드가 ${okFeeds.length}개뿐이라 발행을 중단합니다 (최소 ${COLLECT.minFeedsOk}개)`);
  }
  const items = selectItems(okFeeds, now);
  return {
    items,
    feedStatus: results.map((r) => ({ id: r.feed.id, ok: r.ok, count: r.items.length, error: r.error })),
  };
}
