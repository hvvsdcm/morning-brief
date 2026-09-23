// 지면, 피드, 시장 지표 설정. 지면 id는 AI 출력 스키마와 렌더러가 함께 쓰는 계약이다.

export const SECTIONS = [
  { id: 'kr-economy', name: '국내 경제·증시', icon: 'building' },
  { id: 'global-economy', name: '글로벌 경제·시장', icon: 'globe' },
  { id: 'ai-tech', name: 'AI·테크', icon: 'cpu' },
  { id: 'policy-society', name: '정책·사회', icon: 'landmark' },
  { id: 'world', name: '국제·지정학', icon: 'flag' },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);

// hint: 해당 피드 기사가 주로 속하는 지면. AI가 최종 배치를 다시 판단한다.
export const FEEDS = [
  { id: 'yna-economy', source: '연합뉴스', hint: 'kr-economy', url: 'https://www.yna.co.kr/rss/economy.xml' },
  { id: 'yna-market', source: '연합뉴스', hint: 'kr-economy', url: 'https://www.yna.co.kr/rss/market.xml' },
  { id: 'yna-industry', source: '연합뉴스', hint: 'kr-economy', url: 'https://www.yna.co.kr/rss/industry.xml' },
  { id: 'hk-economy', source: '한국경제', hint: 'kr-economy', url: 'https://www.hankyung.com/feed/economy' },
  { id: 'hk-finance', source: '한국경제', hint: 'kr-economy', url: 'https://www.hankyung.com/feed/finance' },
  { id: 'mk-economy', source: '매일경제', hint: 'kr-economy', url: 'https://www.mk.co.kr/rss/30100041/' },
  { id: 'gn-kr-business', source: '구글뉴스', hint: 'kr-economy', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ko&gl=KR&ceid=KR:ko' },

  { id: 'gn-us-business', source: 'Google News', hint: 'global-economy', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en' },
  { id: 'cnbc-top', source: 'CNBC', hint: 'global-economy', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
  { id: 'cnbc-markets', source: 'CNBC', hint: 'global-economy', url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html' },
  { id: 'bbc-business', source: 'BBC', hint: 'global-economy', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },

  { id: 'hk-it', source: '한국경제', hint: 'ai-tech', url: 'https://www.hankyung.com/feed/it' },
  { id: 'aitimes', source: 'AI타임스', hint: 'ai-tech', url: 'https://www.aitimes.com/rss/allArticle.xml' },
  { id: 'gn-kr-tech', source: '구글뉴스', hint: 'ai-tech', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=ko&gl=KR&ceid=KR:ko' },
  { id: 'gn-us-tech', source: 'Google News', hint: 'ai-tech', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en' },
  { id: 'techcrunch-ai', source: 'TechCrunch', hint: 'ai-tech', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { id: 'verge-ai', source: 'The Verge', hint: 'ai-tech', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { id: 'mit-tr', source: 'MIT Technology Review', hint: 'ai-tech', url: 'https://www.technologyreview.com/feed/' },
  { id: 'bbc-tech', source: 'BBC', hint: 'ai-tech', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
  { id: 'hn', source: 'Hacker News', hint: 'ai-tech', url: 'https://hnrss.org/frontpage?points=200' },

  { id: 'yna-politics', source: '연합뉴스', hint: 'policy-society', url: 'https://www.yna.co.kr/rss/politics.xml' },
  { id: 'yna-society', source: '연합뉴스', hint: 'policy-society', url: 'https://www.yna.co.kr/rss/society.xml' },
  { id: 'gn-kr-nation', source: '구글뉴스', hint: 'policy-society', url: 'https://news.google.com/rss/headlines/section/topic/NATION?hl=ko&gl=KR&ceid=KR:ko' },

  { id: 'yna-international', source: '연합뉴스', hint: 'world', url: 'https://www.yna.co.kr/rss/international.xml' },
  { id: 'gn-kr-world', source: '구글뉴스', hint: 'world', url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=ko&gl=KR&ceid=KR:ko' },
  { id: 'gn-us-world', source: 'Google News', hint: 'world', url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en' },
  { id: 'bbc-world', source: 'BBC', hint: 'world', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
];

// digits: 표시 소수 자릿수. unit: 값 뒤에 붙는 단위.
export const MARKETS = [
  { symbol: '^KS11', label: '코스피', group: '국내', digits: 2 },
  { symbol: '^KQ11', label: '코스닥', group: '국내', digits: 2 },
  { symbol: 'KRW=X', label: '원/달러', group: '환율', digits: 1, unit: '원' },
  { symbol: '^GSPC', label: 'S&P 500', group: '미국', digits: 2 },
  { symbol: '^IXIC', label: '나스닥', group: '미국', digits: 2 },
  { symbol: '^DJI', label: '다우존스', group: '미국', digits: 2 },
  { symbol: '^VIX', label: 'VIX 공포지수', group: '미국', digits: 2 },
  { symbol: '^TNX', label: '미 국채 10년', group: '금리', digits: 3, unit: '%' },
  { symbol: 'DX-Y.NYB', label: '달러인덱스', group: '환율', digits: 2 },
  { symbol: 'JPY=X', label: '엔/달러', group: '환율', digits: 2, unit: '엔' },
  { symbol: '^N225', label: '닛케이225', group: '아시아', digits: 2 },
  { symbol: 'CL=F', label: 'WTI 유가', group: '원자재', digits: 2, unit: '$' },
  { symbol: 'GC=F', label: '금', group: '원자재', digits: 1, unit: '$' },
  { symbol: 'BTC-USD', label: '비트코인', group: '가상자산', digits: 0, unit: '$' },
];

export const COLLECT = {
  windowHours: 30, // 이보다 오래된 기사는 제외
  perFeedLimit: 18, // 피드별 최신 기사 상한
  summaryChars: 140, // 프롬프트에 넣는 기사 요약 길이
  minFeedsOk: 5, // 성공한 피드가 이보다 적으면 발행 중단
  timeoutMs: 20000,
};

export const READING = {
  charsPerMinute: 500, // 공백 제외 글자 기준 한국어 이해 독해 속도
  glanceMinutes: 1, // 시장 지표·목차를 훑는 시간
  targetChars: 5500, // AI에게 주는 전체 목표(공백 포함) ≈ 공백 제외 4,600자 → 약 10분. AI는 필드별 글자 수를 잘 지키므로 분량은 기사 수가 좌우한다
  stories: '11~12', // 지면 기사 총수. 15건이면 약 12분, 12건이면 약 10분(2026-09-24 실측)
};

export const SITE = {
  title: '모닝 브리프',
  tagline: '매일 아침 10분, 오늘 알아야 할 흐름',
  publishHourKst: 10,
};
