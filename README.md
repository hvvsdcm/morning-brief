# 모닝 브리프

매일 아침 10분이면 읽는 신문형 뉴스 브리핑입니다. 경제, AI·테크, 정책, 국제 뉴스를 AI가 고르고 분석합니다.

- 주소: https://hvvsdcm.github.io/morning-brief/ (휴대폰에서는 "홈 화면에 추가"를 하면 앱처럼 열 수 있습니다)
- 발행: 매일 09:20에 이 PC가 자동 생성 → 약 5분 뒤 사이트 반영 → 10시 전 완료. 아침 자동 실행은 그날 호가 이미 있어도 최신 뉴스로 새로 만듭니다.

## 매일 일어나는 일

1. 국내외 매체 RSS 27개에서 최근 30시간 기사를 모읍니다 (약 400건).
2. Yahoo Finance에서 코스피·나스닥·환율·금리·유가 등 14개 지표를 받습니다.
3. 이 PC의 Claude Code(`claude -p`)가 편집장 역할로 1면 톱, 3분 요약, 5개 지면(지면별 2~3건), 체크포인트, 용어 풀이를 씁니다.
4. AI는 기사 URL을 직접 쓰지 않고 수집된 기사 번호만 인용합니다. 없는 번호는 버리고, 근거가 남지 않은 기사는 싣지 않습니다. 시장 숫자는 AI가 아니라 수집 데이터로 표시합니다.
5. `docs/`에 정적 사이트를 만들고 GitHub에 푸시하면 GitHub Pages가 발행합니다.

## 자주 쓰는 명령

| 하고 싶은 일 | 명령 |
|---|---|
| 지금 바로 오늘 호 만들기·발행 | `npm run daily` |
| 오늘 호를 다시 만들기 | `npm run daily -- --force` |
| 발행하지 않고 만들어만 보기 | `npm run daily -- --force --no-publish` |
| 로컬에서 보기 | `npm run build` 후 `npm run serve` → http://localhost:4173 |
| 테스트 | `npm test` |
| 자동 실행 등록·시각 변경 | `powershell -ExecutionPolicy Bypass -File scripts\install-schedule.ps1 [-At 08:50]` |
| 자동 실행 끄기 | `powershell -ExecutionPolicy Bypass -File scripts\install-schedule.ps1 -Remove` |

## 설정 바꾸기

- 매체·지면·시장 지표·분량: `src/config.mjs`
- 편집 원칙(무엇을 고르고 어떻게 분석할지): `src/prompt.mjs`의 `SYSTEM_PROMPT`
- 사용할 Claude 모델: 환경 변수 `MORNING_BRIEF_MODEL` (예: `sonnet`). 비우면 Claude Code 기본 모델을 씁니다.

## 문제가 생기면

- 실행 기록: `logs/YYYY-MM-DD.log`
- 작업 스케줄러는 **로그인한 상태**에서만 실행됩니다. 09:20에 PC가 꺼져 있었으면 켜는 즉시 실행됩니다.
- 생성이 실패하면 사이트는 직전 호를 유지하고, 화면 위에 "오늘 호가 아직 발행되지 않았습니다" 안내가 뜹니다.
- Claude Code 로그인이 만료되면 AI 편집이 실패합니다. 터미널에서 `claude`를 한 번 실행해 로그인하세요.

## 구조

```
src/collect.mjs   RSS 수집·정리·중복 제거
src/markets.mjs   시장 지표
src/prompt.mjs    편집 지침·출력 스키마
src/ai.mjs        claude CLI 실행
src/edition.mjs   출처 검증·읽기 시간 계산
src/render.mjs    HTML 생성
web/              CSS·JS·아이콘 원본 (빌드 시 docs/로 복사)
scripts/          daily(전체 실행), build, serve, 스케줄 등록
data/editions/    발행된 호 JSON (사이트의 원본)
docs/             GitHub Pages가 서비스하는 결과물
design/           설계 문서
```
