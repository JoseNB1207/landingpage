'use strict';

/* ══════════════════════════════════════════════════════════════
   ORBITAL v4 — script.js — Performance-optimized
   - Starfield deferred to requestIdleCallback (reduces TBT)
   - SpaceX API fetch deferred until page loaded
   - Scroll handlers use passive + RAF throttle
   - No layout thrashing (no getBCR in scroll path)
══════════════════════════════════════════════════════════════ */

// ── UTILS ──
const $ = (sel) => document.getElementById(sel);
const $q = (sel) => document.querySelector(sel);

// RAF-throttled scroll handler factory (prevents layout thrashing)
function onScrollRAF(fn) {
  let ticking = false;
  return () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => { fn(); ticking = false; });
    }
  };
}


// ── 1. HEADER SCROLL STATE ──
(function initHeader() {
  const header = $('header');
  if (!header) return;
  const update = () => header.classList.toggle('scrolled', window.scrollY > 15);
  window.addEventListener('scroll', onScrollRAF(update), { passive: true });
  update();
})();


// ── 2. MOBILE NAVIGATION ──
(function initMobileNav() {
  const btn = $('hamburger');
  const nav = $('mobileNav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    nav.setAttribute('aria-hidden', !open);
  });

  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      nav.setAttribute('aria-hidden', 'true');
    });
  });
})();


// ── 3. SMOOTH SCROLLING ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#' || href === '') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      // Read layout ONCE, avoid thrashing
      const top = target.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});


// ── 4. REVEAL ANIMATIONS ON SCROLL (IntersectionObserver — no scroll event) ──
(function initReveals() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 80}ms`;
    observer.observe(el);
  });
})();


// ── 5. FAQ ACCORDION ──
(function initFAQ() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      const answerId = btn.getAttribute('aria-controls');
      const answer = document.getElementById(answerId);

      document.querySelectorAll('.faq-q').forEach(otherBtn => {
        if (otherBtn !== btn) {
          otherBtn.setAttribute('aria-expanded', 'false');
          const otherAns = document.getElementById(otherBtn.getAttribute('aria-controls'));
          if (otherAns) otherAns.hidden = true;
        }
      });

      btn.setAttribute('aria-expanded', !isOpen);
      if (answer) answer.hidden = isOpen;
    });
  });
})();


// ── 6. TOAST NOTIFICATIONS ──
function showToast(msg) {
  const toast = $('toast');
  const msgEl = $('toastMsg');
  if (!toast) return;
  if (msgEl) msgEl.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4200);
}


// ── 7. FORMS HANDLING ──
(function initForms() {
  function setupForm(form, successMsg) {
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      let isValid = true;

      form.querySelectorAll('[required]').forEach(field => {
        field.style.borderColor = '';
        field.style.boxShadow = '';
        const val = field.value.trim();
        if (!val || (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))) {
          field.style.borderColor = '#f87171';
          field.style.boxShadow = '0 0 10px rgba(248,113,113,0.3)';
          isValid = false;
        }
      });

      if (isValid) {
        const btn = form.querySelector('[type="submit"]');
        const origHTML = btn ? btn.innerHTML : '';
        if (btn) {
          btn.style.opacity = '0.7';
          btn.disabled = true;
          btn.innerHTML = '<span>GENERANDO CREDENCIALES...</span>';
          setTimeout(() => {
            btn.style.opacity = '';
            btn.disabled = false;
            btn.innerHTML = origHTML;
          }, 2400);
        }
        form.reset();
        showToast(successMsg);
      }
    });
  }

  setupForm($('ctaForm'), '✓ ¡PASE DE TRIPULANTE GENERADO! Bienvenido a bordo de ORBITAL.');
  setupForm($('pfForm'), '✓ ¡ALERTA ACTIVADA! Te avisaremos antes del próximo despegue.');
})();


// ── 8. PARALLAX HERO BACKGROUND (RAF-throttled, no layout thrash) ──
(function initHeroParallax() {
  const img = $q('.hero-img');
  if (!img) return;
  const maxScroll = window.innerHeight * 1.2;
  window.addEventListener('scroll', onScrollRAF(() => {
    const sy = window.scrollY;
    if (sy < maxScroll) {
      img.style.transform = `scale(1.05) translateY(${sy * 0.18}px)`;
    }
  }), { passive: true });
})();


// ── 9. ROTATING MISSION CONTROL STATUS ──
(function initStatusTicker() {
  const status = $('headerStatus');
  if (!status) return;
  status.style.transition = 'opacity 0.28s ease';
  const messages = [
    'MISIÓN ONLINE · EN ÓRBITA',
    'STARSHIP & FALCON · LISTOS EN PLATAFORMA',
    'STARLINK ENJAMBRE · 6,000+ ACTIVOS',
    'CABINA DRAGON · TELEMETRÍA NOMINAL',
  ];
  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % messages.length;
    status.style.opacity = '0';
    setTimeout(() => {
      status.textContent = messages[idx];
      status.style.opacity = '1';
    }, 280);
  }, 4200);
})();


// ── 10. INTERACTIVE MISSION COCKPIT MODAL ──
(function initAppModal() {
  const modal = $('appModal');
  if (!modal) return;

  const closeBtn = $('modalClose');
  const backdrop = $('modalBackdrop');
  const simRegisterBtn = $('simRegisterBtn');
  const simSoundBtn = $('simSoundBtn');
  const simSpeed = $('simSpeed');
  const simAltitude = $('simAltitude');

  function openModal(e) {
    if (e) e.preventDefault();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    startTelemetryLiveTick();
    playBeep(660, 0.08);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    stopTelemetryLiveTick();
  }

  const triggers = [
    $('nav-cta-btn'), $('panelLaunchTrigger'), $('step-open-app-btn'),
    $('cta2-main-btn'), $('footerAppTrigger'),
    ...document.querySelectorAll('.mob-cta')
  ];
  triggers.forEach(btn => { if (btn) btn.addEventListener('click', openModal); });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  if (simRegisterBtn) {
    simRegisterBtn.addEventListener('click', () => {
      closeModal();
      const ctaSection = $('cta');
      if (ctaSection) {
        ctaSection.scrollIntoView({ behavior: 'smooth' });
        const nameInput = $('f-name');
        if (nameInput) setTimeout(() => nameInput.focus(), 600);
      }
    });
  }

  let tickInterval = null;
  function startTelemetryLiveTick() {
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(() => {
      if (simSpeed) simSpeed.textContent = (27600 + Math.floor(Math.random() * 45 - 20)).toLocaleString('es-ES') + ' km/h';
      if (simAltitude) simAltitude.textContent = (542 + (Math.random() * 0.8 - 0.4)).toFixed(1) + ' km';
    }, 1800);
  }
  function stopTelemetryLiveTick() {
    if (tickInterval) clearInterval(tickInterval);
  }

  // Web Audio — lazy init AudioContext only on user interaction
  let audioCtx = null;
  let soundEnabled = true;
  function playBeep(freq = 580, duration = 0.1) {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + duration);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) { }
  }

  if (simSoundBtn) {
    simSoundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      simSoundBtn.querySelector('span').textContent = soundEnabled
        ? 'SONIDO DE MISIÓN: ACTIVADO 🔊'
        : 'SONIDO DE MISIÓN: SILENCIADO 🔇';
      if (soundEnabled) playBeep(880, 0.12);
    });
  }
})();


// ── 11. SPACEX API — deferred until page is interactive ──
function fetchSpaceXData() {
  const API = 'https://api.spacexdata.com/v5';

  // Latest launch
  fetch(`${API}/launches/latest`)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      const nameEl = $('lp-name'), statusEl = $('lp-status'), dateEl = $('lp-date'), rocketEl = $('lp-rocket');
      if (nameEl) nameEl.textContent = data.name || 'Starlink Mission';
      if (statusEl) {
        const map = { true: ['✓ ÉXITO NOMINAL', '#38bdf8'], false: ['✗ ANOMALÍA', '#f87171'] };
        const [text, color] = map[data.success] || ['● EN ÓRBITA', '#a78bfa'];
        statusEl.textContent = text;
        statusEl.style.color = color;
      }
      if (dateEl && data.date_utc) {
        dateEl.textContent = new Date(data.date_utc).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
      }
      if (rocketEl && data.rocket) {
        fetch(`${API}/rockets/${data.rocket}`)
          .then(r => r.json())
          .then(rd => { if (rd.name) rocketEl.textContent = rd.name; })
          .catch(() => { rocketEl.textContent = 'Falcon 9'; });
      }
    })
    .catch(() => {
      const nameEl = $('lp-name'), statusEl = $('lp-status');
      if (nameEl) nameEl.textContent = 'Starlink Group (Online)';
      if (statusEl) { statusEl.textContent = '✓ NOMINAL'; statusEl.style.color = '#38bdf8'; }
    });

  // All launches count
  fetch(`${API}/launches`)
    .then(r => r.json())
    .then(data => {
      if (!Array.isArray(data)) return;
      const count = data.length;
      [$('liveCount'), $q('.hero-number'), $q('.pm-val')].forEach(el => {
        if (el) el.textContent = count;
      });
    })
    .catch(() => { });

  // Upcoming launch
  fetch(`${API}/launches/upcoming`)
    .then(r => r.json())
    .then(data => {
      if (!Array.isArray(data) || !data.length) return;
      const next = data[0];
      const tag = $q('.hero-tag');
      if (tag && next.name) {
        let dateStr = 'T-Minus';
        if (next.date_utc) {
          dateStr = new Date(next.date_utc).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        }
        tag.innerHTML = `<span class="led" aria-hidden="true"></span>
          PRÓXIMO LANZAMIENTO: <strong style="color:var(--white);margin-left:4px">${next.name}</strong> · ${dateStr}`;
      }
    })
    .catch(() => { });
}

// Defer SpaceX API until browser is idle (reduces TBT)
if ('requestIdleCallback' in window) {
  requestIdleCallback(fetchSpaceXData, { timeout: 4000 });
} else {
  setTimeout(fetchSpaceXData, 1000);
}


// ── 12. ANIMATED STARFIELD — deferred to idle time (biggest TBT win) ──
function initStarfield() {
  const canvas = $('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // Debounced resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    }, 150);
  }, { passive: true });

  // Mouse parallax — passive, RAF-throttled
  let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
  window.addEventListener('mousemove', onScrollRAF(() => {
    mouseX = targetMouseX;
    mouseY = targetMouseY;
  }), { passive: true });
  window.addEventListener('mousemove', e => {
    targetMouseX = (e.clientX - width / 2) * 0.03;
    targetMouseY = (e.clientY - height / 2) * 0.03;
  }, { passive: true });

  // Reduce star count for better perf
  const STAR_COUNT = Math.min(160, Math.floor((width * height) / 9000));
  const STAR_COLORS = [
    'rgba(255,255,255,', 'rgba(147,197,253,', 'rgba(196,181,253,', 'rgba(103,232,249,',
  ];
  let stars = [];

  function initStars() {
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.7 + 0.2,
      twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      depth: Math.random() * 0.8 + 0.2,
    }));
  }
  initStars();

  let shootingStars = [];
  function spawnShootingStar() {
    const angle = Math.PI / 4;
    const speed = Math.random() * 7 + 8;
    shootingStars.push({
      x: Math.random() * width * 0.8,
      y: Math.random() * height * 0.4,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      length: Math.random() * 90 + 70,
      life: 0, maxLife: Math.random() * 35 + 30, opacity: 1,
    });
    setTimeout(spawnShootingStar, Math.random() * 4000 + 4000);
  }
  setTimeout(spawnShootingStar, 3500);

  // Check if tab is visible to pause animation
  let visible = !document.hidden;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  function render() {
    requestAnimationFrame(render);
    if (!visible) return; // skip drawing if tab hidden

    ctx.clearRect(0, 0, width, height);
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.alpha += s.twinkleSpeed;
      if (s.alpha > 0.95 || s.alpha < 0.2) s.twinkleSpeed = -s.twinkleSpeed;

      const rx = (s.x + mouseX * s.depth + width) % width;
      const ry = (s.y + mouseY * s.depth + height) % height;
      const alpha = Math.max(0.1, Math.min(1, s.alpha));

      ctx.beginPath();
      ctx.arc(rx, ry, s.size, 0, Math.PI * 2);
      ctx.fillStyle = s.color + alpha + ')';
      ctx.fill();

      if (s.size > 1.4) {
        ctx.beginPath();
        ctx.arc(rx, ry, s.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = s.color + (s.alpha * 0.2) + ')';
        ctx.fill();
      }
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      s.x += s.dx; s.y += s.dy; s.life++;
      s.opacity = 1 - (s.life / s.maxLife);
      if (s.opacity <= 0) { shootingStars.splice(i, 1); continue; }

      const mag = Math.hypot(s.dx, s.dy);
      const tailX = s.x - (s.dx / mag) * s.length;
      const tailY = s.y - (s.dy / mag) * s.length;

      const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255,255,255,${s.opacity})`);
      grad.addColorStop(0.3, `rgba(96,165,250,${s.opacity * 0.8})`);
      grad.addColorStop(1, 'rgba(59,130,246,0)');

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.fill();
    }
  }
  render();
}

// Defer starfield to idle time — this is the #1 TBT fix
if ('requestIdleCallback' in window) {
  requestIdleCallback(initStarfield, { timeout: 2000 });
} else {
  setTimeout(initStarfield, 500);
}
