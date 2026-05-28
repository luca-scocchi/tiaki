/**
 * ============================================================
 * TIAKI LOGISTICS — Componenti JavaScript
 * Navbar mobile, contatore statistiche, form validation.
 * Vanilla JS ES2022+, nessuna dipendenza esterna.
 * ============================================================
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   NAVBAR — Sticky + Glassmorphism + Menu Mobile
   ══════════════════════════════════════════════════════════ */

function initNavbar() {
  const navbar      = document.getElementById('navbar');
  const hamburger   = document.getElementById('navbar-hamburger');
  const mobileMenu  = document.getElementById('navbar-mobile-menu');
  const mobileLinks = mobileMenu?.querySelectorAll('.navbar__mobile-link');

  if (!navbar) return;

  /* ── Effetto glassmorphism allo scroll ─────────────────── */
  let lastScrollY   = window.scrollY;
  let ticking       = false;

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  }

  function updateNavbar() {
    const scrollY = window.scrollY;

    if (scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScrollY = scrollY;
    ticking     = false;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  updateNavbar(); // Stato iniziale

  /* ── Menu hamburger mobile ─────────────────────────────── */
  if (!hamburger || !mobileMenu) return;

  function openMenu() {
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Blocca scroll body
    // Focus sul primo link
    mobileLinks?.[0]?.focus();
  }

  function closeMenu() {
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  // Chiudi cliccando su un link
  mobileLinks?.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Chiudi premendo Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });

  // Chiudi al resize se schermo desktop
  const mediaQuery = window.matchMedia('(min-width: 1024px)');
  mediaQuery.addEventListener('change', (e) => {
    if (e.matches) closeMenu();
  });
}


/* ══════════════════════════════════════════════════════════
   CONTATORE STATISTICHE — Animazione con Intersection Observer
   ══════════════════════════════════════════════════════════ */

function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  // Funzione di easing (ease-out)
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCounter(el) {
    const target   = parseFloat(el.dataset.counter);
    const suffix   = el.dataset.suffix ?? '';
    const prefix   = el.dataset.prefix ?? '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
    const duration = 2000; // ms
    let startTime  = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed  = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutCubic(progress);
      const current  = target * eased;

      el.textContent = prefix + current.toFixed(decimals) + suffix;

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
    }

    window.requestAnimationFrame(step);
  }

  // Osserva quando i contatori entrano nel viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = 'true';
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(counter => observer.observe(counter));
}


/* ══════════════════════════════════════════════════════════
   FORM VALIDATION — Lato client con feedback immediato
   ══════════════════════════════════════════════════════════ */

function initFormValidation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const successMsg = form.querySelector('.form-success');

  /* ── Regole di validazione ─────────────────────────────── */
  const rules = {
    required: (value) => value.trim() !== '' || 'Questo campo è obbligatorio',
    email:    (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Inserisci un indirizzo email valido',
    minLength: (min) => (value) => value.trim().length >= min || `Minimo ${min} caratteri richiesti`,
    phone:    (value) => !value || /^[\d\s\-\+\(\)]{7,}$/.test(value) || 'Inserisci un numero di telefono valido',
  };

  /* ── Valida un singolo campo ───────────────────────────── */
  function validateField(input) {
    const group        = input.closest('.form-group');
    const errorEl      = group?.querySelector('.form-error');
    const validations  = (input.dataset.validate ?? '').split('|').filter(Boolean);

    let errorMsg = '';

    for (const rule of validations) {
      const [ruleName, ...args] = rule.split(':');
      const validator = rules[ruleName];

      if (!validator) continue;

      const result = typeof validator === 'function'
        ? (args.length ? validator(args[0])(input.value) : validator(input.value))
        : true;

      if (typeof result === 'string') {
        errorMsg = result;
        break;
      }
    }

    if (errorMsg) {
      group?.classList.add('has-error');
      if (errorEl) errorEl.textContent = errorMsg;
      input.setAttribute('aria-invalid', 'true');
      return false;
    } else {
      group?.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
      input.removeAttribute('aria-invalid');
      return true;
    }
  }

  /* ── Campo "Altro" nel select ruolo ───────────────────── */
  const roleSelect      = form.querySelector('#contact-role');
  const roleCustomGroup = form.querySelector('#role-custom-group');
  if (roleSelect && roleCustomGroup) {
    roleSelect.addEventListener('change', () => {
      const show = roleSelect.value === 'altro';
      roleCustomGroup.style.display = show ? 'flex' : 'none';
      if (!show) roleCustomGroup.querySelector('input').value = '';
    });
  }

  /* ── Valida in tempo reale (blur) ──────────────────────── */
  const inputs = form.querySelectorAll('[data-validate]');
  inputs.forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      // Rimuovi l'errore non appena l'utente inizia a correggere
      if (input.closest('.form-group')?.classList.contains('has-error')) {
        validateField(input);
      }
    });
  });

  /* ── Submit ────────────────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Valida tutti i campi
    let allValid = true;
    inputs.forEach(input => {
      if (!validateField(input)) allValid = false;
    });

    if (!allValid) {
      // Focus sul primo campo con errore
      form.querySelector('.has-error input, .has-error textarea, .has-error select')?.focus();
      return;
    }

    const errorMsgGlobal = form.querySelector('.form-error-global');
    
    // Nascondi eventuale messaggio di successo precedente e errore precedente
    if (successMsg) {
      successMsg.classList.remove('visible');
    }
    if (errorMsgGlobal) {
      errorMsgGlobal.style.display = 'none';
    }

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled   = true;
      submitBtn.innerHTML  = 'Invio in corso… <span style="display:inline-block;animation:spin 1s linear infinite;">⏳</span>';
    }

    try {
      // Recupera dati del form
      const data = Object.fromEntries(new FormData(form));

      // Configurazione per FormSubmit.co
      data['_subject'] = 'Nuova richiesta demo - TIAKI Logistics';
      data['_captcha'] = 'false'; // UX fluida senza captcha

      // AbortController per timeout di 8 secondi (previene caricamento infinito in caso di blocco di rete)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Invia i dati al server Node.js locale che li smista via SMTP
      const response = await fetch('/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Errore di rete: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Invio non riuscito');
      }

      // Mostra messaggio successo
      if (successMsg) {
        successMsg.classList.add('visible');
        successMsg.focus();
      }
      form.reset();

    } catch (err) {
      console.error('Errore invio form:', err);
      let errMsg = err.message || err;
      if (err.name === 'AbortError') {
        errMsg = 'Richiesta scaduta (timeout). Verifica la tua connessione internet o disattiva eventuali estensioni / ad-blocker.';
      }
      // Mostra errore generico
      if (submitBtn) {
        submitBtn.textContent = 'Errore - Riprova';
      }
      if (errorMsgGlobal) {
        const detailEl = errorMsgGlobal.querySelector('.error-detail');
        if (detailEl) detailEl.textContent = errMsg;
        errorMsgGlobal.style.display = 'block';
        errorMsgGlobal.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled  = false;
        submitBtn.innerHTML = 'Invia richiesta <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
      }
    }
  });
}


/* ══════════════════════════════════════════════════════════
   TAB AUDIENCE — Switcher Logistici / Committenza
   ══════════════════════════════════════════════════════════ */

function initAudienceTabs() {
  const tabs    = document.querySelectorAll('[data-tab]');
  const panels  = document.querySelectorAll('[data-panel]');

  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      // Aggiorna tab
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Aggiorna pannelli
      panels.forEach(panel => {
        if (panel.dataset.panel === target) {
          panel.hidden = false;
          panel.setAttribute('aria-hidden', 'false');
        } else {
          panel.hidden = true;
          panel.setAttribute('aria-hidden', 'true');
        }
      });
    });
  });
}


/**
 * ============================================================
 * TIAKI LOGISTICS — Main JS
 * Entry point: inizializza tutti i moduli e gli effetti globali.
 * Progressive enhancement: il sito funziona senza JS.
 * ============================================================
 */

'use strict';

/* Marca il documento come "JS attivo" — sblocca le animazioni .reveal */
document.documentElement.classList.add('js-ready');




/* ══════════════════════════════════════════════════════════
   SCROLL REVEAL — Intersection Observer per animazioni
   ══════════════════════════════════════════════════════════ */

function initScrollReveal() {
  // Rispetta preferenze utente per riduzione movimento
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealEls.forEach(el => observer.observe(el));
}


/* ══════════════════════════════════════════════════════════
   SMOOTH SCROLL — Ancora con offset per navbar fissa
   ══════════════════════════════════════════════════════════ */

function initSmoothScroll() {
  // La maggior parte dei browser moderni supporta scroll-behavior: smooth nativo.
  // Qui gestiamo solo l'offset per la navbar fissa.
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navbarHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')
      ) || 72;

      const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 16;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}


/* ══════════════════════════════════════════════════════════
   BARRE ESG HERO — Animazione all'entrata
   ══════════════════════════════════════════════════════════ */

function initEsgBars() {
  const bars = document.querySelectorAll('.hero__esg-fill');
  if (!bars.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const width = entry.target.dataset.width ?? '0%';
          // Ritardo lieve per effetto visivo
          setTimeout(() => {
            entry.target.style.width = width;
          }, 300);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  bars.forEach(bar => {
    bar.style.width = '0%'; // Parte da zero
    observer.observe(bar);
  });
}


/* ══════════════════════════════════════════════════════════
   UTILITY — Debounce
   ══════════════════════════════════════════════════════════ */

function debounce(fn, delay = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}


/* ══════════════════════════════════════════════════════════
   UTILITY — Trap focus nel menu mobile
   ══════════════════════════════════════════════════════════ */

function initFocusTrap() {
  const menu = document.getElementById('navbar-mobile-menu');
  if (!menu) return;

  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    const focusable = menu.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}


/* ══════════════════════════════════════════════════════════
   LAZY LOADING POLYFILL (fallback browser vecchi)
   ══════════════════════════════════════════════════════════ */

function initLazyImages() {
  // I browser moderni supportano loading="lazy" nativo.
  // Questo è un fallback minimale per browser non supportati.
  if ('loading' in HTMLImageElement.prototype) return;

  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if (!lazyImages.length) return;

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) img.src = img.dataset.src;
        imageObserver.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => imageObserver.observe(img));
}


/* ══════════════════════════════════════════════════════════
   COOKIE BANNER MINIMALE (placeholder)
   ══════════════════════════════════════════════════════════ */

function initCookieBanner() {
  const banner   = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('cookie-accept');
  if (!banner || !acceptBtn) return;

  try {
    // Controlla se già accettato
    if (localStorage.getItem('cookiesAccepted')) {
      banner.hidden = true;
      return;
    }

    // Mostra banner
    banner.hidden = false;

    acceptBtn.addEventListener('click', () => {
      try {
        localStorage.setItem('cookiesAccepted', '1');
      } catch (e) {
        console.warn('Impossibile salvare preferenza cookie in localStorage:', e);
      }
      banner.style.transform = 'translateY(100%)';
      banner.style.opacity   = '0';
      setTimeout(() => { banner.hidden = true; }, 400);
    });
  } catch (err) {
    console.warn('Errore cookie banner (localStorage potrebbe essere disabilitato):', err);
    banner.hidden = true; // Nascondi in caso di errore per non disturbare la navigazione
  }
}


/* ══════════════════════════════════════════════════════════
   PRICING TOGGLE — Switcher Mensile / Annuale per card pricing
   ══════════════════════════════════════════════════════════ */

function initPricingToggle() {
  const toggle = document.getElementById('billing-toggle');
  const labelMonthly = document.getElementById('toggle-label-monthly');
  const labelYearly = document.getElementById('toggle-label-yearly');

  if (!toggle) return;

  const priceEls = document.querySelectorAll('[data-monthly-price]');
  const periodEls = document.querySelectorAll('[data-period]');
  const subPriceEls = document.querySelectorAll('[data-monthly-sub]');

  function updatePricing(isYearly) {
    // 1. Aggiorna lo stato attivo delle label
    if (isYearly) {
      labelMonthly?.classList.remove('active');
      labelYearly?.classList.add('active');
    } else {
      labelMonthly?.classList.add('active');
      labelYearly?.classList.remove('active');
    }

    // 2. Transizione fluida e aggiornamento dei prezzi principali
    priceEls.forEach(el => {
      const targetVal = isYearly ? el.dataset.yearlyPrice : el.dataset.monthlyPrice;
      el.style.transition = 'opacity 0.15s ease';
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = targetVal;
        el.style.opacity = '1';
      }, 150);
    });

    // 3. Transizione fluida e aggiornamento della periodicità (/mese vs /anno)
    periodEls.forEach(el => {
      el.style.transition = 'opacity 0.15s ease';
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = isYearly ? '/anno' : '/mese';
        el.style.opacity = '1';
      }, 150);
    });

    // 4. Transizione fluida e aggiornamento del prezzo secondario
    subPriceEls.forEach(el => {
      const targetSub = isYearly ? el.dataset.yearlySub : el.dataset.monthlySub;
      el.style.transition = 'opacity 0.15s ease';
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = targetSub;
        el.style.opacity = '1';
      }, 150);
    });
  }

  // Ascolta il cambiamento del toggle
  toggle.addEventListener('change', () => {
    updatePricing(toggle.checked);
  });
}


/* ══════════════════════════════════════════════════════════
   INIT — Avvia tutti i moduli al DOMContentLoaded
   ══════════════════════════════════════════════════════════ */

function safeInit(fnName, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`Errore durante l'inizializzazione di ${fnName}:`, err);
  }
}

function init() {
  safeInit('initNavbar', initNavbar);
  safeInit('initScrollReveal', initScrollReveal);
  safeInit('initSmoothScroll', initSmoothScroll);
  safeInit('initCounters', initCounters);
  safeInit('initEsgBars', initEsgBars);
  safeInit('initFocusTrap', initFocusTrap);
  safeInit('initLazyImages', initLazyImages);
  safeInit('initCookieBanner', initCookieBanner);
  safeInit('initFormValidation(contact-form)', () => initFormValidation('contact-form'));
  safeInit('initFormValidation(demo-form)', () => initFormValidation('demo-form'));
  safeInit('initAudienceTabs', initAudienceTabs);
  safeInit('initPricingToggle', initPricingToggle);

  // Gestione resize con debounce
  window.addEventListener('resize', debounce(() => {
    // Ricalcola altezza navbar su resize
    const navbar = document.getElementById('navbar');
    if (navbar) {
      document.documentElement.style.setProperty(
        '--navbar-height',
        `${navbar.offsetHeight}px`
      );
    }
  }, 200));
}

// Attendi che il DOM sia pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init(); // DOM già pronto
}