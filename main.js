/* ==========================================================================
   Raymundo Aparicio Olarte — Portfolio
   Vanilla JS, no dependencies. IIFE pattern, no ES modules.
   Every init is wrapped in safe() so one failure never breaks the rest.
   ========================================================================== */

(function () {
  'use strict';

  function safe(fn, name) {
    try {
      fn();
    } catch (err) {
      if (window.console && console.warn) {
        console.warn('[portfolio] init failed: ' + name, err);
      }
    }
  }

  /* Throttle to one call per animation frame. */
  function onFrame(fn) {
    var ticking = false;
    return function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        fn();
      });
    };
  }

  /* ---------- Sticky header background on scroll ---------- */
  function initHeaderScroll() {
    var header = document.getElementById('siteHeader');
    if (!header) return;

    var update = onFrame(function () {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    });
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ---------- Scroll progress bar ---------- */
  function initScrollProgress() {
    var bar = document.getElementById('scrollProgress');
    if (!bar) return;

    var update = onFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, pct)) + ')';
    });
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ---------- Mobile nav toggle ---------- */
  function initMobileNav() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('mainNav');
    if (!toggle || !nav) return;

    function closeNav() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeNav();
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ---------- Scrollspy: highlight the section you're reading ---------- */
  function initScrollSpy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.main-nav a[href^="#"]')
    );
    if (!links.length) return;

    var sections = links
      .map(function (link) {
        var el = document.querySelector(link.getAttribute('href'));
        return el ? { link: link, el: el } : null;
      })
      .filter(Boolean);
    if (!sections.length) return;

    var update = onFrame(function () {
      var probe = window.scrollY + window.innerHeight * 0.32;
      var current = sections[0];
      sections.forEach(function (s) {
        if (s.el.offsetTop <= probe) current = s;
      });
      links.forEach(function (l) { l.classList.remove('is-active'); });
      current.link.classList.add('is-active');
    });

    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ---------- Reveal-on-scroll ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    function showAll() {
      Array.prototype.forEach.call(items, function (el) {
        el.classList.add('is-visible');
      });
    }

    if (!('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    Array.prototype.forEach.call(items, function (el) { observer.observe(el); });

    /* Safety net: never let content stay hidden if the observer misbehaves. */
    window.setTimeout(showAll, 6000);
  }

  /* ---------- Count-up metrics ---------- */
  function initCounters() {
    var nums = document.querySelectorAll('.metric-num[data-count]');
    if (!nums.length) return;

    function formatted(value) {
      return value.toLocaleString('es-MX');
    }

    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      if (isNaN(target)) return;

      var duration = 1300;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / duration);
        /* easeOutExpo */
        var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = formatted(Math.round(target * eased)) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) return; /* leave the static value */

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    Array.prototype.forEach.call(nums, function (el) { observer.observe(el); });
  }

  /* ---------- Hero specialty rotator ---------- */
  function initRotator() {
    var wrap = document.getElementById('rotator');
    if (!wrap) return;

    var items = wrap.querySelectorAll('.rotator-item');
    if (items.length < 2) return;

    var index = 0;
    window.setInterval(function () {
      var current = items[index];
      index = (index + 1) % items.length;
      var next = items[index];

      current.classList.remove('is-active');
      current.classList.add('is-leaving');
      next.classList.add('is-active');

      window.setTimeout(function () {
        current.classList.remove('is-leaving');
      }, 500);
    }, 2600);
  }

  /* ---------- Hero glow parallax (follows the cursor, subtly) ---------- */
  function initHeroParallax() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    if (window.matchMedia('(hover: none)').matches) return; /* skip on touch */

    var layers = hero.querySelectorAll('[data-parallax]');
    if (!layers.length) return;

    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      var dx = e.clientX - rect.width / 2;
      var dy = e.clientY - rect.height / 2;

      Array.prototype.forEach.call(layers, function (layer) {
        var depth = parseFloat(layer.getAttribute('data-parallax')) || 0;
        layer.style.marginLeft = (dx * depth) + 'px';
        layer.style.marginTop = (dy * depth) + 'px';
      });
    });
  }

  /* ---------- Timeline rail fills as you scroll ---------- */
  function initTimelineRail() {
    var timeline = document.getElementById('timeline');
    var fill = document.getElementById('timelineFill');
    if (!timeline || !fill) return;

    var update = onFrame(function () {
      var rect = timeline.getBoundingClientRect();
      var anchor = window.innerHeight * 0.55;
      var progress = (anchor - rect.top) / rect.height;
      fill.style.height = (Math.min(1, Math.max(0, progress)) * 100) + '%';
    });

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ---------- Cursor spotlight on cards ---------- */
  function initSpotlight() {
    var cards = document.querySelectorAll('[data-spotlight]');
    if (!cards.length) return;
    if (window.matchMedia('(hover: none)').matches) return;

    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    });
  }

  /* ---------- Marquee: duplicate the track so the loop is seamless ---------- */
  function initMarquee() {
    var track = document.getElementById('marqueeTrack');
    if (!track) return;
    if (track.getAttribute('data-cloned') === 'true') return; /* idempotent */

    track.innerHTML += track.innerHTML;
    track.setAttribute('data-cloned', 'true');
  }

  /* ---------- Footer year ---------- */
  function initFooterYear() {
    var el = document.getElementById('year');
    if (!el) return;
    el.textContent = String(new Date().getFullYear());
  }

  /* ---------- Smooth anchor scroll ---------- */
  function initAnchorScroll() {
    var links = document.querySelectorAll('a[href^="#"]');
    Array.prototype.forEach.call(links, function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (history.pushState) history.pushState(null, '', id);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    safe(initHeaderScroll, 'headerScroll');
    safe(initScrollProgress, 'scrollProgress');
    safe(initMobileNav, 'mobileNav');
    safe(initScrollSpy, 'scrollSpy');
    safe(initReveal, 'reveal');
    safe(initCounters, 'counters');
    safe(initRotator, 'rotator');
    safe(initHeroParallax, 'heroParallax');
    safe(initTimelineRail, 'timelineRail');
    safe(initSpotlight, 'spotlight');
    safe(initMarquee, 'marquee');
    safe(initFooterYear, 'footerYear');
    safe(initAnchorScroll, 'anchorScroll');
  });
})();
