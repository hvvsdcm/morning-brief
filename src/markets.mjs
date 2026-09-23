import { COLLECT, MARKETS } from './config.mjs';

const DAY = 86400;

/**
 * 거래소 현지 날짜 기준으로 "직전 거래일 종가"를 찾아 변화량을 계산한다.
 * range=1mo 응답의 마지막 봉은 오늘(장중) 봉일 수도, 이미 끝난 전일 봉일 수도 있어서
 * 마지막 봉을 그대로 쓰면 변화율이 0이 되거나 이틀치가 된다.
 */
export function computeQuote({ timestamps, closes, price, marketTime, gmtoffset = 0 }) {
  const dayOf = (t) => Math.floor((t + gmtoffset) / DAY);
  const today = dayOf(marketTime);
  let prevClose = null;
  for (let i = timestamps.length - 1; i >= 0; i--) {
    if (closes[i] != null && dayOf(timestamps[i]) < today) {
      prevClose = closes[i];
      break;
    }
  }
  const change = prevClose == null ? null : price - prevClose;
  return {
    price,
    prevClose,
    change,
    changePct: prevClose ? (change / prevClose) * 100 : null,
    spark: closes.filter((c) => c != null),
  };
}

async function fetchQuote(m) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(m.symbol)}?range=1mo&interval=1d`;
  const res = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (morning-brief)' },
    signal: AbortSignal.timeout(COLLECT.timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const result = (await res.json())?.chart?.result?.[0];
  if (!result?.meta?.regularMarketPrice) throw new Error('시세 없음');
  const { meta } = result;
  const q = computeQuote({
    timestamps: result.timestamp ?? [],
    closes: result.indicators?.quote?.[0]?.close ?? [],
    price: meta.regularMarketPrice,
    marketTime: meta.regularMarketTime,
    gmtoffset: meta.gmtoffset ?? 0,
  });
  // 장중 가격을 스파크라인 끝점으로 맞춘다.
  if (q.spark.length) q.spark[q.spark.length - 1] = q.price;
  return { ...m, ...q, asOf: new Date(meta.regularMarketTime * 1000).toISOString() };
}

export async function collectMarkets({ log = () => {} } = {}) {
  const out = await Promise.all(
    MARKETS.map((m) =>
      fetchQuote(m).catch((err) => {
        log(`시세 실패 ${m.symbol}: ${err.message}`);
        return null;
      }),
    ),
  );
  return out.filter(Boolean);
}
