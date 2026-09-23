import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseFeed, selectItems } from '../src/collect.mjs';
import { finalizeEdition } from '../src/edition.mjs';
import { computeQuote } from '../src/markets.mjs';
import { renderEdition, safeUrl } from '../src/render.mjs';

const feed = { id: 'f', source: '테스트', hint: 'kr-economy' };

test('RSS: 구글뉴스 제목의 " - 매체" 꼬리를 떼고 원 매체를 출처로 쓴다', () => {
  const xml = `<?xml version="1.0"?><rss><channel><item>
    <title>코스피 7천 돌파 - 한국경제</title><link>https://news.google.com/a</link>
    <description>&lt;a href="x"&gt;코스피 7천 돌파&lt;/a&gt;</description>
    <pubDate>Wed, 23 Sep 2026 20:00:00 GMT</pubDate><source url="https://hankyung.com">한국경제</source>
  </item></channel></rss>`;
  const [it] = parseFeed(xml, feed);
  assert.equal(it.title, '코스피 7천 돌파');
  assert.equal(it.source, '한국경제');
  assert.equal(it.summary, ''); // 제목을 되풀이한 설명은 버린다
  assert.equal(it.publishedAt.toISOString(), '2026-09-23T20:00:00.000Z');
});

test('Atom: alternate 링크와 HTML 요약을 평문으로 읽는다', () => {
  const xml = `<feed xmlns="http://www.w3.org/2005/Atom"><entry>
    <title type="html">AI &amp; chips</title>
    <link rel="replies" href="https://x/replies"/><link rel="alternate" href="https://x/post"/>
    <summary type="html">&lt;p&gt;Big &lt;b&gt;news&lt;/b&gt;&lt;/p&gt;</summary>
    <updated>2026-09-23T18:50:37+00:00</updated></entry></feed>`;
  const [it] = parseFeed(xml, feed);
  assert.equal(it.title, 'AI & chips');
  assert.equal(it.link, 'https://x/post');
  assert.equal(it.summary, 'Big news');
});

test('타임존 없는 피드 시각은 KST로 해석한다', () => {
  const xml = '<rss><channel><item><title>t</title><link>https://a</link><pubDate>2026-09-24 00:00:00</pubDate></item></channel></rss>';
  assert.equal(parseFeed(xml, feed)[0].publishedAt.toISOString(), '2026-09-23T15:00:00.000Z');
});

test('selectItems: 오래된 기사 제외, 피드 간 같은 제목 중복 제거, 바이라인 제거', () => {
  const now = new Date('2026-09-24T00:00:00Z');
  const mk = (title, hoursAgo, extra = {}) => ({ title, link: `https://a/${title}${hoursAgo}`, summary: '', source: 's', publishedAt: new Date(now - hoursAgo * 3600_000), ...extra });
  const items = selectItems(
    [
      { feed: { id: 'a', hint: 'kr-economy' }, items: [mk('금리 동결', 1, { summary: '(서울=연합뉴스) 홍길동 기자 = 한국은행이 금리를 동결했다.' }), mk('옛날 기사', 48)] },
      { feed: { id: 'b', hint: 'world' }, items: [mk('금리 동결!', 2)] },
    ],
    now,
  );
  assert.deepEqual(items.map((i) => i.title), ['금리 동결']);
  assert.equal(items[0].id, 'n1');
  assert.equal(items[0].summary, '한국은행이 금리를 동결했다.');
});

const baseItems = Array.from({ length: 8 }, (_, i) => ({ id: `n${i + 1}`, title: `기사${i + 1}`, source: '연합뉴스', link: `https://yna.co.kr/${i + 1}` }));
const story = (ids) => ({ title: 't', summary: 's', analysis: 'a', implication: 'i', sourceIds: ids });
const raw = (over = {}) => ({
  headline: 'h',
  summary: [{ text: '요약', sourceIds: ['n1'] }, { text: '근거 없음', sourceIds: ['n999'] }],
  lead: { section: 'world', title: 'L', dek: 'd', body: ['p'], whyItMatters: 'w', watchPoints: ['x'], sourceIds: ['n1', 'n404'] },
  sections: [
    { id: 'world', stories: [story(['n2'])] },
    { id: 'kr-economy', stories: [story(['n3']), story(['bogus'])] },
    { id: 'ai-tech', stories: [story(['n4']), story(['n5'])] },
    { id: 'kr-economy', stories: [story(['n6'])] },
  ],
  marketComment: 'm',
  watchlist: [{ when: '오늘', what: '발표', sourceIds: ['n7'] }, { when: '내일', what: '지어낸 일정', sourceIds: ['zz'] }],
  terms: [],
  ...over,
});
const finalize = (r) => finalizeEdition({ raw: r, items: baseItems, markets: [], date: '2026-09-24', generatedAt: '2026-09-24T00:00:00Z', feedStatus: [{ ok: true }], model: 'm' });

test('finalizeEdition: 없는 기사 id는 버리고, 근거가 사라진 항목은 지면에서 뺀다', () => {
  const e = finalize(raw());
  assert.deepEqual(e.lead.sources.map((s) => s.url), ['https://yna.co.kr/1']);
  assert.deepEqual(e.summary.map((s) => s.text), ['요약']);
  assert.deepEqual(e.watchlist.map((w) => w.what), ['발표']);
  // 설정 순서(kr-economy가 world보다 앞)로 정렬되고, 같은 지면이 두 번 와도 합쳐진다.
  assert.deepEqual(e.sections.map((s) => [s.id, s.stories.length]), [['kr-economy', 2], ['ai-tech', 2], ['world', 1]]);
  assert.equal(e.marketComment, ''); // 시장 데이터가 없으면 AI 해설도 싣지 않는다
});

test('finalizeEdition: 1면 톱 근거가 없거나 실을 기사가 5건 미만이면 발행을 막는다', () => {
  assert.throws(() => finalize(raw({ lead: { ...raw().lead, sourceIds: ['n404'] } })), /1면 톱/);
  assert.throws(() => finalize(raw({ sections: [{ id: 'world', stories: [story(['n2'])] }] })), /최소 5건/);
});

test('computeQuote: 마지막 봉이 오늘 장중이면 그 전 봉을, 아직 개장 전이면 마지막 봉을 전일 종가로 쓴다', () => {
  const day = 86400;
  const base = 1_790_000_000 - (1_790_000_000 % day);
  const timestamps = [base, base + day, base + 2 * day];
  const closes = [100, 110, 121];
  const intraday = computeQuote({ timestamps, closes, price: 121, marketTime: base + 2 * day + 3600 });
  assert.equal(intraday.prevClose, 110);
  assert.equal(intraday.changePct.toFixed(2), '10.00');
  const beforeOpen = computeQuote({ timestamps: timestamps.slice(0, 2), closes: closes.slice(0, 2), price: 110, marketTime: base + day + 3600 });
  assert.equal(beforeOpen.prevClose, 100);
});

test('렌더: 기사 텍스트의 HTML을 이스케이프하고 http(s)가 아닌 링크는 막는다', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '#');
  assert.equal(safeUrl('https://a.com/x?y=1'), 'https://a.com/x?y=1');
  const e = finalize(raw());
  e.lead.title = '<script>alert(1)</script>';
  e.lead.sources[0].url = 'javascript:alert(1)';
  const html = renderEdition(e, { number: 1, prefix: '', isLatest: true });
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('href="javascript:'));
});
