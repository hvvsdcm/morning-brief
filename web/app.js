// 읽기 진행률·남은 시간, 목차 강조, 테마·글자 크기, 오늘 호 발행 여부 안내.
(() => {
  const root = document.documentElement;
  const body = document.body;
  const store = {
    get: (k) => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* 사생활 보호 모드 */
      }
    },
  };

  // ── 테마 ──
  const themeBtn = document.getElementById('theme-toggle');
  const syncThemeLabel = () => {
    const light = root.dataset.theme === 'light';
    themeBtn?.setAttribute('aria-label', light ? '어두운 화면으로 전환' : '밝은 화면으로 전환');
  };
  syncThemeLabel();
  themeBtn?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    store.set('mb-theme', root.dataset.theme);
    syncThemeLabel();
  });

  // ── 글자 크기 ──
  const SCALES = [0.9, 1, 1.1, 1.2, 1.3];
  const fontBtns = document.querySelectorAll('[data-font]');
  const currentScale = () => {
    const v = parseFloat(getComputedStyle(root).getPropertyValue('--fs')) || 1;
    return SCALES.reduce((best, s) => (Math.abs(s - v) < Math.abs(best - v) ? s : best), 1);
  };
  const syncFontBtns = () => {
    const i = SCALES.indexOf(currentScale());
    fontBtns.forEach((b) => {
      b.disabled = b.dataset.font === '-1' ? i <= 0 : i >= SCALES.length - 1;
    });
  };
  fontBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const i = SCALES.indexOf(currentScale()) + Number(b.dataset.font);
      const next = SCALES[Math.min(SCALES.length - 1, Math.max(0, i))];
      root.style.setProperty('--fs', String(next));
      store.set('mb-font', String(next));
      syncFontBtns();
      onScroll();
    }),
  );
  syncFontBtns();

  // ── 읽기 진행률 · 남은 시간 ──
  const bar = document.getElementById('progress-bar');
  const remaining = document.querySelector('[data-remaining]');
  const total = Number(body.dataset.readingMinutes) || 0;
  const main = document.getElementById('main');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (!main || !total) return;
      const start = main.offsetTop;
      const span = main.offsetHeight - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, (window.scrollY - start + window.innerHeight * 0.2) / span)) : 1;
      if (bar) bar.style.width = `${(p * 100).toFixed(1)}%`;
      if (remaining && total) {
        const left = Math.ceil(total * (1 - p));
        remaining.textContent = p >= 0.98 ? '다 읽음' : `남은 약 ${Math.max(1, left)}분`;
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // ── 목차: 지금 읽는 지면 강조 ──
  const tocLinks = [...document.querySelectorAll('.toc a')];
  const targets = tocLinks.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
  const tocList = document.querySelector('.toc ul');
  if (targets.length) {
    let pending = false;
    const mark = () => {
      pending = false;
      // 화면 위쪽 35% 선을 넘어선 블록 중 가장 아래 것을 현재 위치로 본다.
      let current = targets[0];
      for (const t of targets) if (t.getBoundingClientRect().top < window.innerHeight * 0.35) current = t;
      tocLinks.forEach((a) => {
        const on = a.hash === `#${current.id}`;
        if (on && a.getAttribute('aria-current') !== 'true' && tocList) {
          // 페이지 세로 스크롤을 건드리지 않도록 목차 가로 스크롤만 옮긴다.
          tocList.scrollTo({ left: a.offsetLeft - (tocList.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
        }
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!pending) {
          pending = true;
          requestAnimationFrame(mark);
        }
      },
      { passive: true },
    );
    mark();
  }

  // ── 오늘 호 발행 여부 ──
  const notice = document.getElementById('stale-notice');
  const editionDate = body.dataset.editionDate;
  if (notice && editionDate && body.dataset.latest === 'true') {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date())
        .map((x) => [x.type, x.value]),
    );
    const today = `${parts.year}-${parts.month}-${parts.day}`;
    if (editionDate < today) {
      const [, m, d] = editionDate.split('-').map(Number);
      const hour = Number(parts.hour);
      const publishHour = Number(body.dataset.publishHour) || 10;
      notice.textContent =
        hour < publishHour
          ? `오늘 호는 오전 ${publishHour}시 전에 발행됩니다. 지금은 ${m}월 ${d}일 호를 보고 있습니다.`
          : `오늘 호가 아직 발행되지 않았습니다. 가장 최근인 ${m}월 ${d}일 호를 보고 있습니다.`;
      notice.hidden = false;
    }
  }
})();
