// willkirby.co.uk v3 motion.
// Everything here is progressive: without it (or under reduced motion) the
// page is already complete, because hidden start states only apply under html.anim.
(() => {
  const root = document.documentElement;

  // UK clock for the sheet bar and the case-file HUD.
  const clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const tick = () => { const t = fmt.format(new Date()); clocks.forEach((c) => { c.textContent = t; }); };
    tick();
    setInterval(tick, 1000);
  }

  // Phone menu.
  const toggle = document.querySelector('.nav__toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      links.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    links.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.nav')) setOpen(false); });
  }

  if (!root.classList.contains('anim')) return;

  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) {
    root.classList.remove('anim', 'is-loading');
    return;
  }
  window.__wkReady = true;
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync.
  if (window.Lenis) {
    const lenis = new window.Lenis({ lerp: 0.11 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains('skip-link')) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.4 });
    });
  }

  // Swap random glyphs through an element's text, settling left to right.
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/+-';
  const scramble = (el, duration = 0.8) => {
    if (!el) return;
    const nodes = [];
    const walk = (n) => {
      if (n.nodeType === 3 && n.nodeValue.trim()) nodes.push({ n, text: n.nodeValue });
      else n.childNodes.forEach(walk);
    };
    walk(el);
    const state = { p: 0 };
    gsap.to(state, {
      p: 1, duration, ease: 'none',
      onUpdate: () => nodes.forEach(({ n, text }) => {
        const settled = Math.floor(text.length * state.p);
        n.nodeValue = text.slice(0, settled) + text.slice(settled).replace(/[A-Za-z0-9]/g,
          () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
      }),
      onComplete: () => nodes.forEach(({ n, text }) => { n.nodeValue = text; }),
    });
  };

  const countUp = (el, duration = 1.4) => {
    const to = Number(el.dataset.countTo);
    const state = { v: 0 };
    gsap.to(state, {
      v: to, duration, ease: 'power3.out',
      onUpdate: () => { el.textContent = Math.round(state.v); },
    });
  };

  const mm = gsap.matchMedia();
  const desktop = '(min-width: 961px) and (min-height: 600px)';

  // ---------- Hero ----------
  const drawing = document.querySelector('.drawing');
  const scan = document.querySelector('.drawing__scan');
  const markers = gsap.utils.toArray('.marker');
  const notes = gsap.utils.toArray('[data-note]');
  gsap.set(markers, { xPercent: -50, yPercent: -50, scale: 0 });

  // The scan reveals the screenshot top to bottom; each marker pops as the scan passes it.
  const buildReveal = (tl) => {
    tl.set(scan, { opacity: 1 })
      .fromTo(drawing, { '--reveal': '0%' }, { '--reveal': '100%', duration: 1, ease: 'none' }, 0);
    markers.forEach((m, i) => {
      const at = Math.min(parseFloat(m.style.getPropertyValue('--y')) / 100, 0.95);
      tl.to(m, { scale: 1, duration: 0.08, ease: 'back.out(3)' }, at);
      tl.call(() => notes[i] && notes[i].classList.add('is-on'), null, at);
    });
    tl.to(scan, { opacity: 0, duration: 0.08 }, 1);
    return tl;
  };

  const intro = () => {
    root.classList.add('is-drawn');
    gsap.to('.line__in', { y: 0, duration: 1.1, ease: 'power4.out', stagger: 0.09, delay: 0.05 });
    gsap.fromTo('.hero__copy > :not(.hero__title)', { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: 0.3 });
    document.querySelectorAll('.titleblock [data-count-to]').forEach((el) => {
      el.textContent = '0';
      gsap.delayedCall(1, () => countUp(el));
    });
    document.querySelectorAll('.sheet__bar > span').forEach((s, i) => gsap.delayedCall(0.2 + i * 0.1, () => scramble(s, 0.6)));
  };

  // Desktop: the hero pins and scrolling drives the scan. Phones: it plays once the drawing is in view.
  // Created first, before every trigger below it, so their positions include the pin spacing.
  mm.add(desktop, () => {
    buildReveal(gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=140%', pin: true, scrub: 0.6 },
    }));
    return () => notes.forEach((n) => n.classList.remove('is-on'));
  });
  mm.add('(max-width: 960px), (max-height: 599px)', () => {
    buildReveal(gsap.timeline({
      delay: 0.4,
      scrollTrigger: { trigger: '.drawing', start: 'top 80%', once: true },
    })).timeScale(0.55);
  });

  // ---------- Loader ----------
  const loader = document.querySelector('.loader');
  if (root.classList.contains('is-loading') && loader) {
    try { sessionStorage.setItem('wk-loaded', '1'); } catch (e) { /* private mode */ }
    loader.style.animation = 'none';
    const count = loader.querySelector('[data-count]');
    const state = { p: 0 };
    gsap.timeline()
      .to(state, {
        p: 1, duration: 0.9, ease: 'power2.inOut',
        onUpdate: () => {
          count.textContent = String(Math.round(state.p * 100)).padStart(3, '0');
          loader.style.setProperty('--p', state.p);
        },
      })
      .fromTo(loader,
        { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
        { clipPath: 'polygon(0 0, 100% 0, 100% 0%, 0 0%)', duration: 0.8, ease: 'power4.inOut' }, '+=0.1')
      .add(() => { root.classList.remove('is-loading'); intro(); }, '-=0.45');
  } else {
    root.classList.remove('is-loading');
    intro();
  }

  // ---------- Statement: words fill in, then the page turns orange ----------
  const statement = document.querySelector('[data-words]');
  if (statement) {
    const text = statement.textContent.trim();
    statement.setAttribute('aria-label', text);
    statement.innerHTML = text.split(/\s+/).map((w) => `<span class="word" aria-hidden="true">${w}</span>`).join(' ');
    gsap.timeline({
      scrollTrigger: { trigger: '.statement', start: 'top top', end: 'bottom bottom', scrub: 0.4 },
    })
      .to('.statement .word', { color: '#121212', stagger: 0.1, duration: 0.3, ease: 'none' })
      .to('.statement', { backgroundColor: '#FF5C1A', duration: 0.5, ease: 'none' }, '+=0.3')
      .to('.statement__eyebrow', { color: '#121212', duration: 0.8, ease: 'none' }, '<');
  }

  // ---------- Chapters ----------
  // Each cover sinks back as its body slides over it.
  gsap.utils.toArray('.chapter').forEach((chapter) => {
    gsap.to(chapter.querySelector('.cover__inner'), {
      scale: 0.9, opacity: 0.3, ease: 'none',
      scrollTrigger: { trigger: chapter.querySelector('.chapter__body'), start: 'top bottom', end: 'top top', scrub: true },
    });
  });

  // RIVET: the number and name slide in from the edges, the screenshot drops in.
  const rivetEntry = { trigger: '.chapter--rivet', start: 'top bottom', end: 'top top', scrub: true };
  gsap.from('.chapter--rivet .cover__num', { xPercent: -40, ease: 'none', scrollTrigger: rivetEntry });
  gsap.from('.chapter--rivet .cover__name', { xPercent: 40, ease: 'none', scrollTrigger: { ...rivetEntry } });
  gsap.from('.chapter--rivet .cover__frame', { y: 120, rotate: -3, ease: 'none', scrollTrigger: { ...rivetEntry } });

  // Investigation: the HUD and title decode when the case file opens.
  ScrollTrigger.create({
    trigger: '.chapter--case', start: 'top 60%', once: true,
    onEnter: () => {
      document.querySelectorAll('.hud__tl, .hud__tr, .hud__bl, .hud__br')
        .forEach((h, i) => gsap.delayedCall(i * 0.12, () => scramble(h, 0.7)));
      scramble(document.querySelector('.case__title'), 1.1);
    },
  });
  gsap.from('.hud__cross', {
    rotate: 90, scale: 0, stagger: 0.08, duration: 0.6, ease: 'back.out(2)',
    scrollTrigger: { trigger: '.chapter--case', start: 'top 40%' },
  });

  // Evidence screenshots stamp down one after another.
  const evidence = gsap.utils.toArray('.evidence__item');
  gsap.set(evidence, { opacity: 0 });
  ScrollTrigger.batch(evidence, {
    start: 'top 88%', once: true,
    onEnter: (batch) => gsap.fromTo(batch,
      { opacity: 0, scale: 1.3, rotate: () => gsap.utils.random(-6, 6) },
      { opacity: 1, scale: 1, rotate: 0, duration: 0.45, ease: 'power4.out', stagger: 0.07 }),
  });

  // About: the photo settles as the cover arrives.
  gsap.fromTo('.about__photo', { scale: 1.18 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.chapter--about', start: 'top bottom', end: 'top top', scrub: true },
  });

  // Generic reveals and counters.
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }),
  });
  document.querySelectorAll('.chapter__body [data-count-to]').forEach((el) => {
    el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) });
  });

  // Contact + footer.
  gsap.from('.contact__title', {
    yPercent: 30, opacity: 0, duration: 1, ease: 'power4.out',
    scrollTrigger: { trigger: '.contact', start: 'top 70%' },
  });
  gsap.from('.contact__rows li', {
    opacity: 0, x: -24, duration: 0.6, ease: 'power3.out', stagger: 0.05,
    scrollTrigger: { trigger: '.contact__rows', start: 'top 85%' },
  });
  gsap.from('.footer__word', {
    yPercent: 70, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });

  // Nav goes dark over the case file and the contact block.
  const nav = document.querySelector('.nav');
  const darkZone = (trigger, endTrigger, end) => ScrollTrigger.create({
    trigger, endTrigger, start: 'top 56px', end,
    onToggle: (self) => nav.classList.toggle('nav--dark', self.isActive),
  });
  darkZone('.chapter--case', '.chapter--case', 'bottom 56px');
  darkZone('.contact', '.footer', 'bottom top');
})();
