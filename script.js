'use strict';

/* ══════════════════════════════════════════════════════════════
   STARAPI v3 — script.js
   Deep Space Canvas Starfield + SpaceX API Live Data + HUD Interactivity
══════════════════════════════════════════════════════════════ */

// ── 1. ANIMATED DEEP SPACE STARFIELD CANVAS ──
(function initStarfield() {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // Resize handler
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initStars();
  });

  // Mouse parallax offset
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX - width / 2) * 0.03;
    targetMouseY = (e.clientY - height / 2) * 0.03;
  }, { passive: true });

  // Star generation
  const STAR_COUNT = Math.min(220, Math.floor((width * height) / 7000));
  const STAR_COLORS = [
    'rgba(255, 255, 255, ',
    'rgba(147, 197, 253, ',  // electric blue tint
    'rgba(196, 181, 253, ',  // soft violet tint
    'rgba(103, 232, 249, ',  // cyan glow
  ];

  let stars = [];

  function initStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        depth: Math.random() * 0.8 + 0.2,
      });
    }
  }
  initStars();

  // Shooting stars (meteors)
  let shootingStars = [];

  function spawnShootingStar() {
    const startX = Math.random() * width * 0.8;
    const startY = Math.random() * height * 0.4;
    const length = Math.random() * 90 + 70;
    const speed = Math.random() * 7 + 8;
    const angle = (Math.PI / 4) + (Math.random() * 0.2 - 0.1); // ~45 degrees

    shootingStars.push({
      x: startX,
      y: startY,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      length: length,
      life: 0,
      maxLife: Math.random() * 35 + 30,
      opacity: 1,
    });

    // Schedule next shooting star (every 4 to 8 seconds)
    setTimeout(spawnShootingStar, Math.random() * 4000 + 4000);
  }
  setTimeout(spawnShootingStar, 2500);

  // Animation Loop
  function render() {
    ctx.clearRect(0, 0, width, height);

    // Smooth mouse parallax
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    // Draw static & twinkling stars
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];

      // Twinkle
      star.alpha += star.twinkleSpeed;
      if (star.alpha > 0.95 || star.alpha < 0.2) {
        star.twinkleSpeed = -star.twinkleSpeed;
      }

      // Parallax coordinate
      const renderX = (star.x + mouseX * star.depth + width) % width;
      const renderY = (star.y + mouseY * star.depth + height) % height;

      ctx.beginPath();
      ctx.arc(renderX, renderY, star.size, 0, Math.PI * 2);
      ctx.fillStyle = star.color + Math.max(0.1, Math.min(1, star.alpha)) + ')';
      ctx.fill();

      // Soft glow for larger stars
      if (star.size > 1.4) {
        ctx.beginPath();
        ctx.arc(renderX, renderY, star.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = star.color + (star.alpha * 0.2) + ')';
        ctx.fill();
      }
    }

    // Draw shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      s.x += s.dx;
      s.y += s.dy;
      s.life++;
      s.opacity = 1 - (s.life / s.maxLife);

      if (s.opacity <= 0) {
        shootingStars.splice(i, 1);
        continue;
      }

      const tailX = s.x - (s.dx / Math.hypot(s.dx, s.dy)) * s.length;
      const tailY = s.y - (s.dy / Math.hypot(s.dx, s.dy)) * s.length;

      const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
      grad.addColorStop(0.3, `rgba(96, 165, 250, ${s.opacity * 0.8})`);
      grad.addColorStop(0.7, `rgba(168, 85, 247, ${s.opacity * 0.4})`);
      grad.addColorStop(1, 'rgba(59, 130, 246, 0)');

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Bright head point
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  render();
})();


// ── 2. HEADER SCROLL STATE ──
(function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 15);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


// ── 3. MOBILE NAVIGATION ──
(function initMobileNav() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('mobileNav');
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


// ── 4. SMOOTH SCROLLING ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#' || href === '') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 64,
        behavior: 'smooth'
      });
    }
  });
});


// ── 5. LIVE DATA FROM OFFICIAL SPACEX API ──
(function fetchSpaceXData() {
  const endpoints = {
    launches: 'https://api.spacexdata.com/v5/launches',
    latest: 'https://api.spacexdata.com/v5/launches/latest',
    upcoming: 'https://api.spacexdata.com/v5/launches/upcoming',
    rockets: 'https://api.spacexdata.com/v5/rockets',
  };

  // 1. Fetch latest launch
  fetch(endpoints.latest)
    .then(r => {
      if (!r.ok) throw new Error('API error');
      return r.json();
    })
    .then(data => {
      const nameEl = document.getElementById('lp-name');
      const statusEl = document.getElementById('lp-status');
      const dateEl = document.getElementById('lp-date');
      const rocketEl = document.getElementById('lp-rocket');

      if (nameEl) nameEl.textContent = data.name || 'Starlink Mission';

      if (statusEl) {
        if (data.success === true) {
          statusEl.textContent = '✓ ÉXITO NOMINAL';
          statusEl.style.color = '#38bdf8'; // electric cyan
        } else if (data.success === false) {
          statusEl.textContent = '✗ ANOMALÍA';
          statusEl.style.color = '#f87171'; // red
        } else {
          statusEl.textContent = '● EN ÓRBITA';
          statusEl.style.color = '#a78bfa'; // violet
        }
      }

      if (dateEl && data.date_utc) {
        const d = new Date(data.date_utc);
        dateEl.textContent = d.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }

      if (rocketEl) {
        // Rocket ID resolution
        if (data.rocket) {
          fetch(`${endpoints.rockets}/${data.rocket}`)
            .then(res => res.json())
            .then(rocketData => {
              if (rocketData.name) rocketEl.textContent = rocketData.name;
            })
            .catch(() => {
              rocketEl.textContent = 'Falcon 9';
            });
        } else {
          rocketEl.textContent = 'Falcon 9 Block 5';
        }
      }
    })
    .catch(() => {
      const nameEl = document.getElementById('lp-name');
      if (nameEl) nameEl.textContent = 'Starlink Group (Online)';
      const statusEl = document.getElementById('lp-status');
      if (statusEl) {
        statusEl.textContent = '✓ NOMINAL';
        statusEl.style.color = '#38bdf8';
      }
    });

  // 2. Total launches count
  fetch(endpoints.launches)
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const count = data.length;
        const liveCount = document.getElementById('liveCount');
        const heroNumber = document.querySelector('.hero-number');
        const pmVal = document.querySelector('.pm-val');

        if (liveCount) liveCount.textContent = count;
        if (heroNumber) heroNumber.textContent = count;
        if (pmVal) pmVal.textContent = count;
      }
    })
    .catch(() => { });

  // 3. Upcoming launch for tag banner
  fetch(endpoints.upcoming)
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const next = data[0];
        const tag = document.querySelector('.hero-tag');
        if (tag && next.name) {
          let dateStr = 'T-Minus';
          if (next.date_utc) {
            const d = new Date(next.date_utc);
            dateStr = d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
          }
          tag.innerHTML = `<span class="led" aria-hidden="true"></span>
            PRÓXIMO LANZAMIENTO: <strong style="color:var(--white);margin-left:4px">${next.name}</strong> · ${dateStr}`;
        }
      }
    })
    .catch(() => { });
})();


// ── 6. REVEAL ANIMATIONS ON SCROLL ──
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


// ── 7. FAQ ACCORDION ──
(function initFAQ() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      const answerId = btn.getAttribute('aria-controls');
      const answer = document.getElementById(answerId);

      // Close other opened FAQs
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


// ── 8. TOAST NOTIFICATIONS ──
function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toastMsg');
  if (!toast) return;
  if (msgEl) msgEl.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4200);
}


// ── 9. FORMS HANDLING & VALIDATION ──
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
        if (!val) {
          field.style.borderColor = '#f87171';
          field.style.boxShadow = '0 0 10px rgba(248, 113, 113, 0.3)';
          isValid = false;
        } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          field.style.borderColor = '#f87171';
          field.style.boxShadow = '0 0 10px rgba(248, 113, 113, 0.3)';
          isValid = false;
        }
      });

      if (isValid) {
        const btn = form.querySelector('[type="submit"]');
        const origContent = btn ? btn.innerHTML : '';
        if (btn) {
          btn.style.opacity = '0.7';
          btn.disabled = true;
          btn.innerHTML = `<span>GENERANDO CREDENCIALES...</span>`;
          setTimeout(() => {
            btn.style.opacity = '';
            btn.disabled = false;
            btn.innerHTML = origContent;
          }, 2400);
        }
        form.reset();
        showToast(successMsg);
      }
    });
  }

  setupForm(document.getElementById('ctaForm'), '✓ ¡PASE DE TRIPULANTE GENERADO! Bienvenido a bordo de ORBITAL.');
  setupForm(document.getElementById('pfForm'), '✓ ¡ALERTA ACTIVADA! Te avisaremos antes del próximo despegue.');
})();


// ── 10. PARALLAX HERO BACKGROUND ──
(function initHeroParallax() {
  const img = document.querySelector('.hero-img');
  if (!img) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY < window.innerHeight * 1.2) {
      img.style.transform = `scale(1.05) translateY(${window.scrollY * 0.18}px)`;
    }
  }, { passive: true });
})();


// ── 11. ROTATING MISSION CONTROL STATUS ──
(function initStatusTicker() {
  const status = document.getElementById('headerStatus');
  if (!status) return;

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
  status.style.transition = 'opacity 0.28s ease';
})();


// ── 12. INTERACTIVE MISSION COCKPIT MODAL CONTROLLER ──
(function initAppModal() {
  const modal = document.getElementById('appModal');
  const closeBtn = document.getElementById('modalClose');
  const backdrop = document.getElementById('modalBackdrop');
  const simRegisterBtn = document.getElementById('simRegisterBtn');
  const simSoundBtn = document.getElementById('simSoundBtn');
  const simSpeed = document.getElementById('simSpeed');
  const simAltitude = document.getElementById('simAltitude');
  if (!modal) return;

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

  // Trigger buttons
  const triggers = [
    document.getElementById('hero-launch-app-btn'),
    document.getElementById('nav-cta-btn'),
    document.getElementById('panelLaunchTrigger'),
    document.getElementById('step-open-app-btn'),
    document.getElementById('cta2-main-btn'),
    document.getElementById('footerAppTrigger'),
    ...document.querySelectorAll('.mob-cta')
  ];

  triggers.forEach(btn => {
    if (btn) btn.addEventListener('click', openModal);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  if (simRegisterBtn) {
    simRegisterBtn.addEventListener('click', () => {
      closeModal();
      const ctaSection = document.getElementById('cta');
      if (ctaSection) {
        ctaSection.scrollIntoView({ behavior: 'smooth' });
        const nameInput = document.getElementById('f-name');
        if (nameInput) setTimeout(() => nameInput.focus(), 600);
      }
    });
  }

  // Live telemetry subtle tick effect
  let tickInterval = null;
  function startTelemetryLiveTick() {
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(() => {
      if (simSpeed) {
        const baseSpeed = 27600 + Math.floor(Math.random() * 45 - 20);
        simSpeed.textContent = baseSpeed.toLocaleString('es-ES') + ' km/h';
      }
      if (simAltitude) {
        const baseAlt = 542 + (Math.random() * 0.8 - 0.4);
        simAltitude.textContent = baseAlt.toFixed(1) + ' km';
      }
    }, 1800);
  }

  function stopTelemetryLiveTick() {
    if (tickInterval) clearInterval(tickInterval);
  }

  // Web Audio Cockpit Synthesizer
  let audioCtx = null;
  let soundEnabled = true;

  function playBeep(freq = 580, duration = 0.1) {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx) audioCtx = new AudioContext();
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

