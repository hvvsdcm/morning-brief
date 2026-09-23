import { READING, SECTIONS } from './config.mjs';

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** 공백을 뺀 글자 수로 읽기 시간을 분 단위로 낸다. */
export function readingMinutes(texts) {
  const chars = texts.reduce((n, t) => n + clean(t).replace(/\s/g, '').length, 0);
  return { chars, minutes: Math.max(1, Math.round(chars / READING.charsPerMinute) + READING.glanceMinutes) };
}

/**
 * AI 출력을 발행 가능한 호로 바꾼다.
 * AI가 인용한 기사 id를 실제 기사로 바꾸고, 근거가 없는 항목은 지면에서 뺀다.
 * 1면 톱에 근거가 없거나 실을 기사가 너무 적으면 예외를 던져 발행을 막는다.
 */
export function finalizeEdition({ raw, items, markets, date, generatedAt, feedStatus, model }) {
  const byId = new Map(items.map((it) => [it.id, it]));
  const cited = new Set();
  const resolve = (ids) => {
    const out = [];
    for (const id of new Set(ids ?? [])) {
      const it = byId.get(String(id).trim());
      if (!it) continue;
      cited.add(it.id);
      out.push({ title: it.title, source: it.source, url: it.link });
    }
    return out;
  };

  const leadSources = resolve(raw.lead?.sourceIds);
  if (!leadSources.length) throw new Error('1면 톱 기사에 유효한 출처가 없습니다');
  const leadSection = SECTIONS.find((s) => s.id === raw.lead.section);
  const lead = {
    section: leadSection?.id ?? null,
    sectionName: leadSection?.name ?? '종합',
    title: clean(raw.lead.title),
    dek: clean(raw.lead.dek),
    body: (raw.lead.body ?? []).map(clean).filter(Boolean),
    whyItMatters: clean(raw.lead.whyItMatters),
    watchPoints: (raw.lead.watchPoints ?? []).map(clean).filter(Boolean),
    sources: leadSources,
  };

  // AI가 같은 지면을 두 번 내보내도 하나로 합치고, 지면 순서는 설정 순서를 따른다.
  const storiesBySection = new Map();
  for (const sec of raw.sections ?? []) {
    const list = storiesBySection.get(sec.id) ?? [];
    for (const st of sec.stories ?? []) {
      const sources = resolve(st.sourceIds);
      if (!sources.length) continue;
      list.push({
        title: clean(st.title),
        summary: clean(st.summary),
        analysis: clean(st.analysis),
        implication: clean(st.implication),
        sources,
      });
    }
    storiesBySection.set(sec.id, list);
  }
  const sections = SECTIONS.map((s) => ({ ...s, stories: (storiesBySection.get(s.id) ?? []).slice(0, 3) })).filter((s) => s.stories.length);
  const storyCount = sections.reduce((n, s) => n + s.stories.length, 0);
  if (storyCount < 5) throw new Error(`출처가 확인된 지면 기사가 ${storyCount}건뿐입니다 (최소 5건)`);

  const summary = (raw.summary ?? [])
    .map((s) => ({ text: clean(s.text), sources: resolve(s.sourceIds) }))
    .filter((s) => s.text && s.sources.length);
  const watchlist = (raw.watchlist ?? [])
    .map((w) => ({ when: clean(w.when), what: clean(w.what), sources: resolve(w.sourceIds) }))
    .filter((w) => w.what && w.sources.length);
  const terms = (raw.terms ?? []).map((t) => ({ term: clean(t.term), explain: clean(t.explain) })).filter((t) => t.term && t.explain);
  const marketComment = markets.length ? clean(raw.marketComment) : '';

  const reading = readingMinutes([
    raw.headline,
    ...summary.map((s) => s.text),
    lead.title, lead.dek, ...lead.body, lead.whyItMatters, ...lead.watchPoints,
    ...sections.flatMap((s) => s.stories.flatMap((st) => [st.title, st.summary, st.analysis, st.implication])),
    marketComment,
    ...watchlist.map((w) => `${w.when} ${w.what}`),
    ...terms.map((t) => `${t.term} ${t.explain}`),
  ]);

  return {
    version: 1,
    date,
    generatedAt,
    model,
    headline: clean(raw.headline),
    summary,
    lead,
    sections,
    markets,
    marketComment,
    watchlist,
    terms,
    stats: {
      articles: items.length,
      feedsOk: feedStatus.filter((f) => f.ok).length,
      feedsTotal: feedStatus.length,
      cited: cited.size,
      chars: reading.chars,
      readingMinutes: reading.minutes,
    },
  };
}
