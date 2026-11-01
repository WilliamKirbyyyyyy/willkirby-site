// willkirby.co.uk motion, shared by the homepage and the three inner pages.
// Everything here is progressive: without it (or under reduced motion) the
// page is already complete, because hidden start states only apply under html.anim.
(() => {
  const root = document.documentElement;
  const $ = (s) => document.querySelector(s);

  // Phone menu.
  const toggle = $('.nav__toggle');
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

  // ---------- Pins first, so every trigger after them includes their spacing ----------
  const drawing = $('.drawing');
  const scan = $('.drawing__scan');

  // Once the scan has revealed the still, the Spark clip takes over from the same frame.
  // It only loads then, and pauses while the hero is off screen. The clip is fetched whole and
  // played from a blob, because Safari needs byte-range responses and the host doesn't send them.
  const video = $('.drawing__video');
  let videoOn = false;
  const playVideo = () => {
    if (!video || videoOn) return;
    videoOn = true;
    fetch(innerWidth < 700 ? video.dataset.srcSm : video.dataset.src)
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => {
        video.src = URL.createObjectURL(blob);
        video.addEventListener('playing', () => video.classList.add('is-playing'), { once: true });
        video.play().catch(() => {});
        new IntersectionObserver(([e]) => {
          if (e.isIntersecting) video.play().catch(() => {}); else video.pause();
        }).observe(video);
      })
      .catch(() => {}); // the still stays up
  };

  // Homepage hero: the scan reveals the screenshot top to bottom, then the clip takes over.
  const buildReveal = (tl) => {
    tl.set(scan, { opacity: 1 })
      .fromTo(drawing, { '--reveal': '0%' }, { '--reveal': '100%', duration: 1, ease: 'none' }, 0);
    tl.to(scan, { opacity: 0, duration: 0.08 }, 1);
    tl.call(playVideo, null, 1);
    return tl;
  };

  if (drawing) {
    // Desktop: the hero pins and scrolling drives the scan. Phones: it plays once the drawing is in view.
    mm.add(desktop, () => {
      buildReveal(gsap.timeline({
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=140%', pin: true, scrub: 0.6 },
      }));
    });
    mm.add('(max-width: 960px), (max-height: 599px)', () => {
      buildReveal(gsap.timeline({
        delay: 0.4,
        scrollTrigger: { trigger: '.drawing', start: 'top 80%', once: true },
      })).timeScale(0.55);
    });
  }

  // Homepage RIVET story: it pins, and each stretch of scrolling brings in the next
  // point and swaps the screenshot to match. Very short screens step through without the pin.
  const story = $('[data-story]');
  if (story) {
    const steps = story.querySelectorAll('[data-story-step]');
    const shots = story.querySelectorAll('.story__frame img');
    const now = story.querySelector('[data-story-now]');
    let current = 0;
    const show = (i) => {
      if (i === current) return;
      current = i;
      steps.forEach((s, j) => s.classList.toggle('is-on', j === i));
      shots.forEach((s, j) => s.classList.toggle('is-on', j === i));
      now.textContent = String(i + 1).padStart(2, '0');
      scramble(now, 0.3);
    };
    mm.add('(min-height: 560px)', () => {
      story.classList.add('is-pinned');
      ScrollTrigger.create({
        trigger: story, start: 'top top', end: `+=${steps.length * 70}%`, pin: true,
        onUpdate: (self) => show(Math.min(steps.length - 1, Math.floor(self.progress * steps.length))),
      });
      return () => story.classList.remove('is-pinned');
    });
    mm.add('(max-height: 559px)', () => {
      steps.forEach((s, i) => ScrollTrigger.create({
        trigger: s, start: 'top 70%', end: 'bottom 70%', onToggle: (self) => { if (self.isActive) show(i); },
      }));
    });
  }

  // Homepage investigation: the tally pins, the count runs up to 12, the zero lands, then each finding steps in.
  const tally = $('[data-tally]');
  if (tally) {
    const num = tally.querySelector('[data-tally-to]');
    const to = Number(num.dataset.tallyTo);
    const buildTally = (tl) => {
      const state = { v: 0 };
      tl.fromTo(state, { v: 0 }, {
        v: to, duration: 1, ease: 'none', onUpdate: () => { num.textContent = Math.round(state.v); },
      })
        .from(tally.querySelector('.tally__num--zero'), { opacity: 0, y: 60, duration: 0.4 }, '-=0.1');
      tally.querySelectorAll('[data-tally-step]').forEach((row) => tl.to(row, { opacity: 1, duration: 0.4 }));
      return tl.to({}, { duration: 0.3 }); // a beat before it lets go
    };
    mm.add('(min-height: 560px)', () => {
      tally.classList.add('is-pinned');
      buildTally(gsap.timeline({
        scrollTrigger: { trigger: tally, start: 'top top', end: '+=180%', pin: true, scrub: 0.5 },
      }));
      return () => tally.classList.remove('is-pinned');
    });
    mm.add('(max-height: 559px)', () => {
      buildTally(gsap.timeline({ scrollTrigger: { trigger: tally, start: 'top 70%', once: true } })).timeScale(0.5);
    });
  }

  // RIVET sheet: the design directions pin and slide sideways on desktop.
  // Phones (and no-motion) keep a native swipeable strip.
  const strip = $('[data-hstrip]');
  if (strip) {
    const track = strip.querySelector('[data-hstrip-track]');
    const bar = strip.querySelector('[data-hstrip-bar]');
    mm.add(desktop, () => {
      strip.classList.add('is-pinned');
      const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
      gsap.to(track, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: {
          trigger: strip, start: 'top top', end: () => `+=${distance()}`,
          pin: true, scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: (self) => { if (bar) bar.style.transform = `scaleX(${self.progress})`; },
        },
      });
      return () => strip.classList.remove('is-pinned');
    });
  }

  // ---------- Openers ----------
  const intro = () => {
    root.classList.add('is-drawn');
    gsap.to('.line__in', { y: 0, duration: 1.1, ease: 'power4.out', stagger: 0.09, delay: 0.05 });
    gsap.fromTo('.hero__copy > :not(.hero__title)', { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: 0.3 });
    document.querySelectorAll('.titleblock [data-count-to]').forEach((el) => {
      el.textContent = '0';
      gsap.delayedCall(1, () => countUp(el));
    });
  };

  // Inner sheets: the cover's number and name slide in from the edges, then the rest settles.
  const pageIntro = () => {
    const from = {
      left: { xPercent: -40 }, right: { xPercent: 40 }, up: { y: 90 }, fade: { y: 16 },
    };
    gsap.utils.toArray('[data-intro]').forEach((el, i) => {
      gsap.fromTo(el, { opacity: 0, ...from[el.dataset.intro] }, {
        opacity: 1, xPercent: 0, y: 0, duration: 1.1, ease: 'power4.out', delay: 0.05 + i * 0.08,
      });
    });
  };

  const loader = $('.loader');
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
    if (drawing) intro(); else pageIntro();
  }

  // ---------- Statement: words fill in as you scroll ----------
  const statement = $('[data-words]');
  if (statement) {
    const text = statement.textContent.trim();
    statement.setAttribute('aria-label', text);
    statement.innerHTML = text.split(/\s+/).map((w) => `<span class="word" aria-hidden="true">${w}</span>`).join(' ');
    gsap.to('.statement .word', {
      color: '#ECEAE4', stagger: 0.1, duration: 0.3, ease: 'none',
      scrollTrigger: { trigger: '.statement', start: 'top top', end: 'bottom bottom', scrub: 0.4 },
    });
  }

  // ---------- Typed labels: each mono label types itself in once it arrives ----------
  gsap.utils.toArray('[data-type]').forEach((el) => {
    const text = el.textContent.trim();
    const read = document.createElement('span');
    read.className = 'sr-only';
    read.textContent = text;
    const out = document.createElement('span');
    out.setAttribute('aria-hidden', 'true');
    el.replaceChildren(read, out);
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => {
        el.style.visibility = 'visible';
        out.classList.add('is-typing');
        const state = { n: 0 };
        gsap.to(state, {
          n: text.length, duration: Math.min(1.1, 0.2 + text.length * 0.035), ease: 'none',
          onUpdate: () => { out.textContent = text.slice(0, Math.round(state.n)); },
          onComplete: () => gsap.delayedCall(0.8, () => out.classList.remove('is-typing')),
        });
      },
    });
  });

  // ---------- Headings rise word by word out of their own masks ----------
  const maskWords = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 1) { maskWords(n); return; }
      if (n.nodeType !== 3 || !n.nodeValue.trim()) return;
      const frag = document.createDocumentFragment();
      n.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(part); return; }
        const mask = document.createElement('span');
        mask.className = 'wmask';
        const inner = document.createElement('span');
        inner.className = 'wmask__in';
        inner.textContent = part;
        mask.append(inner);
        frag.append(mask);
      });
      n.replaceWith(frag);
    });
  };
  gsap.utils.toArray('[data-lines]').forEach((el) => {
    maskWords(el);
    const words = el.querySelectorAll('.wmask__in');
    gsap.set(words, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.045 }),
    });
  });

  // ---------- Chapters ----------
  // Each cover sinks back as its body slides over it.
  gsap.utils.toArray('.chapter').forEach((chapter) => {
    gsap.to(chapter.querySelector('.cover__inner'), {
      scale: 0.9, opacity: 0.3, ease: 'none',
      scrollTrigger: { trigger: chapter.querySelector('.chapter__body'), start: 'top bottom', end: 'top top', scrub: true },
    });
  });

  // Homepage RIVET chapter: the name slides in and the badge spins up as it scrolls into place.
  if ($('.chapter--rivet:not(.chapter--page)')) {
    const rivetEntry = { trigger: '.chapter--rivet', start: 'top bottom', end: 'top top', scrub: true };
    gsap.from('.chapter--rivet .cover__name', { xPercent: 40, ease: 'none', scrollTrigger: rivetEntry });
    gsap.from('.chapter--rivet .cover__badge', { y: 160, rotate: -40, scale: 0.6, ease: 'none', scrollTrigger: { ...rivetEntry } });
  }

  // Screenshots stamp down one after another.
  const stamp = (items) => {
    if (!items.length) return;
    gsap.set(items, { opacity: 0 });
    ScrollTrigger.batch(items, {
      start: 'top 88%', once: true,
      onEnter: (batch) => gsap.fromTo(batch,
        { opacity: 0, scale: 1.3, rotate: () => gsap.utils.random(-6, 6) },
        { opacity: 1, scale: 1, rotate: 0, duration: 0.45, ease: 'power4.out', stagger: 0.07 }),
    });
  };
  stamp(gsap.utils.toArray('.evidence__item'));
  stamp(gsap.utils.toArray('[data-stamp]'));

  // About photo: on the homepage it settles as the chapter arrives; on the About sheet it drifts as you leave the cover.
  const photo = $('.about__photo');
  if (photo && photo.closest('.chapter--page')) {
    gsap.fromTo(photo, { scale: 1.04, yPercent: 0 }, {
      scale: 1.16, yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: '.cover--about', start: 'top top', end: 'bottom top', scrub: true },
    });
  } else if (photo) {
    gsap.fromTo(photo, { scale: 1.18 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.chapter--about', start: 'top bottom', end: 'top top', scrub: true },
    });
  }

  // RIVET sheet: the big counter follows the milestone in view; each screenshot wipes in.
  const msNow = $('[data-ms-now]');
  if (msNow) {
    gsap.utils.toArray('.ms__item').forEach((item) => {
      ScrollTrigger.create({
        trigger: item, start: 'top 55%', end: 'bottom 55%',
        onToggle: (self) => {
          if (!self.isActive || msNow.textContent === item.dataset.ms) return;
          msNow.textContent = item.dataset.ms;
          scramble(msNow, 0.35);
        },
      });
      gsap.to(item.querySelector('.ms__shot'), {
        clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'power3.inOut',
        scrollTrigger: { trigger: item, start: 'top 80%', once: true },
      });
    });
  }

  // About: the headset build sheet swaps to the render for whichever part is in view.
  const build = $('[data-build]');
  if (build) {
    const frames = build.querySelectorAll('.build__frames img');
    const parts = build.querySelectorAll('.build__parts li');
    const now = build.querySelector('[data-build-now]');
    const show = (step) => {
      frames.forEach((f) => f.classList.toggle('is-on', f.dataset.step === step));
      parts.forEach((p) => p.classList.toggle('is-on', p.dataset.step === step));
      const label = step.padStart(2, '0');
      if (now.textContent !== label) { now.textContent = label; scramble(now, 0.3); }
    };
    show('1');
    parts.forEach((li) => ScrollTrigger.create({
      trigger: li, start: 'top 65%', end: 'bottom 65%',
      onToggle: (self) => { if (self.isActive) show(li.dataset.step); },
    }));
  }

  // Figures drift a little inside their frames.
  gsap.utils.toArray('[data-parallax]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -7, scale: 1.18 }, {
      yPercent: 7, scale: 1.18, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
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

  // Contact, up next and footer.
  if ($('.contact')) {
    gsap.from('.contact__rows li', {
      opacity: 0, x: -24, duration: 0.6, ease: 'power3.out', stagger: 0.05,
      scrollTrigger: { trigger: '.contact__rows', start: 'top 85%' },
    });
  }
  const nextWord = $('[data-next-word]');
  if (nextWord) {
    // The next page's title grows into place as you reach the end of this one.
    gsap.fromTo(nextWord, { xPercent: 35, scale: 0.55, transformOrigin: '0% 100%' }, {
      xPercent: 0, scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.next', start: 'top bottom', end: 'bottom bottom', scrub: true },
    });
  }
  if ($('.footer__word')) {
    gsap.from('.footer__word', {
      yPercent: 70, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
    });
  }
})();
