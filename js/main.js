// Hero parallax: tilts the screenshot stack towards the mouse.
// Only runs for a fine pointer that can hover, and never under prefers-reduced-motion.
(() => {
  const hero = document.querySelector('.hero');
  const scene = document.querySelector('.scene');
  if (!hero || !scene) return;

  const canTilt = window.matchMedia(
    '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)'
  );

  let targetX = 0, targetY = 0; // -0.5 … 0.5
  let x = 0, y = 0;
  let frame = 0;

  const render = () => {
    x += (targetX - x) * 0.12;
    y += (targetY - y) * 0.12;
    scene.style.setProperty('--rx', (-y).toFixed(4));
    scene.style.setProperty('--ry', x.toFixed(4));

    const settled = Math.abs(targetX - x) < 0.0005 && Math.abs(targetY - y) < 0.0005;
    frame = settled ? 0 : requestAnimationFrame(render);
  };

  const kick = () => { if (!frame) frame = requestAnimationFrame(render); };

  hero.addEventListener('pointermove', (e) => {
    if (!canTilt.matches || e.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    targetX = (e.clientX - r.left) / r.width - 0.5;
    targetY = (e.clientY - r.top) / r.height - 0.5;
    kick();
  });

  hero.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
    kick();
  });

  canTilt.addEventListener('change', () => {
    if (canTilt.matches) return;
    cancelAnimationFrame(frame);
    frame = 0;
    targetX = targetY = x = y = 0;
    scene.style.removeProperty('--rx');
    scene.style.removeProperty('--ry');
  });
})();

// Phone menu: a disclosure button that shows the nav links on small screens.
(() => {
  const toggle = document.querySelector('.nav__toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    links.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav')) setOpen(false);
  });
})();
