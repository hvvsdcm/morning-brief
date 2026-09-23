const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—' };

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

/** HTML 조각을 한 줄짜리 평문으로 만든다. */
export function toPlainText(value) {
  if (value == null) return '';
  const s = typeof value === 'object' ? (value['#text'] ?? '') : String(value);
  // 엔티티로 감싼 태그(&lt;p&gt;)까지 지우도록 먼저 디코드한다.
  return decodeEntities(decodeEntities(s).replace(/<[^>]*>/g, ' '))
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(s, max) {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const KST_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** KST 기준 { date: 'YYYY-MM-DD', time: 'HH:MM' } */
export function kstParts(d = new Date()) {
  const p = Object.fromEntries(KST_PARTS.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 'YYYY-MM-DD' → '2026년 9월 24일 목요일' */
export function formatKoreanDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}년 ${m}월 ${d}일 ${wd}요일`;
}

/** 타임존이 없는 'YYYY-MM-DD HH:MM:SS'는 KST로 해석한다. */
export function parseFeedDate(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s)) s = `${s.replace(' ', 'T')}+09:00`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
