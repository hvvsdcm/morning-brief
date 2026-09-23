import { READING, SECTIONS, SECTION_IDS } from './config.mjs';
import { formatKoreanDate } from './text.mjs';

const str = (description) => ({ type: 'string', description });
const sourceIds = {
  type: 'array',
  minItems: 1,
  maxItems: 4,
  items: { type: 'string' },
  description: '근거가 된 기사 id(예: "n12"). 반드시 입력 목록에 있는 id만 쓴다.',
};

const story = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'analysis', 'implication', 'sourceIds'],
  properties: {
    title: str('신문 기사 제목. 25자 안팎, 핵심 사실 중심'),
    summary: str('무슨 일이 있었나. 80~120자'),
    analysis: str('왜 이런 일이 생겼고 어떤 맥락·파급이 있나. 120~190자'),
    implication: str('독자(한국 개인 투자자·직장인)에게 주는 시사점. 50~80자'),
    sourceIds,
  },
};

/** claude --json-schema에 넘기는 출력 계약. edition.mjs가 같은 구조를 검증한다. */
export const EDITION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['headline', 'summary', 'lead', 'sections', 'marketComment', 'watchlist', 'terms'],
  properties: {
    headline: str('오늘 호 전체를 관통하는 한 문장. 40자 이내'),
    summary: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      description: '3분 요약. 오늘 꼭 알아야 할 것을 중요도 순으로',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['text', 'sourceIds'],
        properties: { text: str('한 문장, 60자 이내'), sourceIds },
      },
    },
    lead: {
      type: 'object',
      additionalProperties: false,
      required: ['section', 'title', 'dek', 'body', 'whyItMatters', 'watchPoints', 'sourceIds'],
      properties: {
        section: { type: 'string', enum: SECTION_IDS },
        title: str('1면 톱 제목. 30자 안팎'),
        dek: str('부제. 제목을 보충하는 한 문장, 60자 이내'),
        body: { type: 'array', minItems: 3, maxItems: 4, items: str('문단. 문단 합계 550~700자') },
        whyItMatters: str('왜 중요한가. 80~120자'),
        watchPoints: { type: 'array', minItems: 2, maxItems: 3, items: str('앞으로 지켜볼 점, 한 문장') },
        sourceIds: { ...sourceIds, maxItems: 6 },
      },
    },
    sections: {
      type: 'array',
      minItems: 4,
      maxItems: SECTIONS.length,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'stories'],
        properties: {
          id: { type: 'string', enum: SECTION_IDS },
          stories: { type: 'array', minItems: 1, maxItems: 3, items: story },
        },
      },
    },
    marketComment: str('시장 지표 해설 2~3문장. 제공된 수치만 인용'),
    watchlist: {
      type: 'array',
      maxItems: 5,
      description: '기사에 명시된 오늘·이번 주 일정. 없으면 빈 배열',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['when', 'what', 'sourceIds'],
        properties: { when: str('예: "오늘 21:30", "25일(금)"'), what: str('무슨 일정인지 한 문장'), sourceIds },
      },
    },
    terms: {
      type: 'array',
      maxItems: 3,
      description: '본문에 나온 낯선 경제·기술 용어 풀이',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['term', 'explain'],
        properties: { term: str('용어'), explain: str('쉬운 풀이, 80자 이내') },
      },
    },
  },
};

export const SYSTEM_PROMPT = `당신은 한국 경제신문의 편집장이다. 매일 아침 바쁜 한국 독자(개인 투자자·직장인)가 10분 안에 "오늘 세상이 어떻게 움직이는지" 파악하도록 신문 한 호를 편집한다.

원칙
1. 근거: 제공된 기사 목록과 시장 수치만 근거로 쓴다. 목록에 없는 사실·수치·날짜·인용을 만들지 않는다. 기사 요약만으로 확신할 수 없는 세부 사항은 쓰지 않는다.
2. 출처: 모든 요약·기사·일정에 근거 기사 id를 sourceIds로 단다. 같은 이슈를 다룬 여러 매체 id를 함께 달면 좋다.
3. 선정: 여러 매체가 동시에 다룬 이슈, 시장·산업·정책·생활에 파급이 큰 이슈를 고른다. 단발성 사건사고, 연예·스포츠, 개별 소형주 공시, 광고성 기사는 뺀다. 같은 이슈는 호 전체에서 한 번만 다룬다.
4. 분석: 사실 나열에 그치지 말고 원인, 맥락, 파급 경로, 서로 다른 뉴스 사이의 연결(예: 금리 → 환율 → 수출주)을 설명한다. 추정은 "~로 보인다", "~가능성이 있다"처럼 추정임을 드러낸다.
5. 문체: 모두 한국어로 쓴다. 영문 기사는 번역해 소화한다. 신문 문체(~다)로 간결하게 쓰고, 과장·감탄·이모지를 쓰지 않는다. 투자 권유를 하지 않는다.
6. 지면: 1면 톱은 오늘 가장 중요한 이슈 하나다. 지면은 ${SECTIONS.map((s) => `${s.id}(${s.name})`).join(', ')}이다. 지면 기사는 모두 합쳐 ${READING.stories}건이다. 각 지면에 2건을 기본으로 싣고, 그날 가장 중요한 지면 한두 곳만 3건으로 늘린다. 1면 톱 이슈는 지면 기사로 반복하지 않는다. 기사 입력의 지면 힌트는 참고용이며 더 맞는 지면으로 옮겨도 된다. 다룰 만한 기사가 없는 지면은 생략해도 된다.
7. 분량: 전체 본문이 약 ${READING.targetChars.toLocaleString('ko-KR')}자(10분 분량)가 되게 기사 수와 스키마 설명의 글자 수를 지킨다.`;

function fmtNum(n, digits) {
  return n == null ? '-' : n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtTimeKst(d) {
  if (!d) return '시각 미상';
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
}

export function buildUserPrompt({ date, items, markets }) {
  const lines = [`오늘은 ${formatKoreanDate(date)}(KST)이다. 아래 자료로 오늘 호를 편집하라.`, ''];
  if (markets.length) {
    lines.push('## 시장 지표 (전 거래일 대비)');
    for (const m of markets) {
      const pct = m.changePct == null ? '' : ` (${m.changePct >= 0 ? '+' : ''}${m.changePct.toFixed(2)}%)`;
      lines.push(`- ${m.label}: ${fmtNum(m.price, m.digits)}${m.unit ?? ''}${pct}, 기준 ${fmtTimeKst(new Date(m.asOf))}`);
    }
    lines.push('');
  }
  lines.push(`## 기사 목록 (${items.length}건, 형식: id [매체 · 발행시각] 제목 — 요약)`);
  for (const s of SECTIONS) {
    const group = items.filter((it) => it.hint === s.id);
    if (!group.length) continue;
    lines.push('', `### 지면 힌트: ${s.id} (${s.name})`);
    for (const it of group) {
      const when = fmtTimeKst(it.publishedAt ? new Date(it.publishedAt) : null);
      lines.push(`${it.id} [${it.source} · ${when}] ${it.title}${it.summary ? ` — ${it.summary}` : ''}`);
    }
  }
  return lines.join('\n');
}
