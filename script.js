(async () => {
'use strict';
    // Import map with fallbacks
    let animate, inView, lenis;

    async function loadLibraries() {
      try {
        const motionModule = await import('https://cdn.jsdelivr.net/npm/motion@11/+esm');
        animate = motionModule.animate;
        inView = motionModule.inView;
      } catch (e) {
        console.warn('Motion library failed to load, using WAAPI fallback');
      }

      try {
        const lenisModule = await import('https://cdn.jsdelivr.net/npm/lenis@1/+esm');
        lenis = lenisModule.default || lenisModule.Lenis;
      } catch (e) {
        console.warn('Lenis library failed to load, using native scroll');
      }
    }

    // WAAPI fallback for animate
    function waapiAnimate(element, keyframes, options) {
      return element.animate(keyframes, options);
    }

    // WAAPI fallback for inView
    function waapiInView(element, callback, options = {}) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback(entry.target);
            if (options.once) observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0
      });
      observer.observe(element);
      return () => observer.disconnect();
    }

    // Lenis fallback - no-op smooth scroll
    function createLenisFallback() {
      return {
        on: () => {},
        off: () => {},
        destroy: () => {},
        scrollTo: (target, options) => {
          const el = typeof target === 'string' ? document.querySelector(target) : target;
          if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + (options?.offset || 0), behavior: options?.immediate ? 'auto' : 'smooth' });
        }
      };
    }

    // Initialize
    await loadLibraries();

    // Use fallbacks if libraries failed
    const $animate = animate || waapiAnimate;
    const $inView = inView || waapiInView;
    const $lenis = lenis ? new lenis({ lerp: 0.1, smoothWheel: true }) : createLenisFallback();
    if ($lenis.raf) {
      const raf = t => { $lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }

    // Reduced motion check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mobile menu toggle
    function setScrollLock(locked) {
      document.documentElement.style.overflow = locked ? 'hidden' : '';
      if (locked) $lenis.stop?.(); else $lenis.start?.();
    }
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobilePanel = document.querySelector('.mobile-panel');

    mobileMenuBtn?.addEventListener('click', () => {
      const expanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', !expanded);
      mobilePanel.classList.toggle('open');
      setScrollLock(!expanded);
    });

    // Close mobile panel on link click
    mobilePanel?.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobilePanel.classList.remove('open');
        setScrollLock(false);
      });
    });

    // In-page anchor links: smooth scroll below the fixed bar
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        $lenis.scrollTo(target, { offset: -90, immediate: prefersReducedMotion });
      });
    });

    // Booking dialog: opens from any [data-book] button, sends via the visitor's mail app
    const BOOKING_EMAIL = 'hello@reflow.example'; // TODO: set your real address
    const bookDialog = document.getElementById('book-dialog');
    const bookForm = document.getElementById('book-form');
    document.querySelectorAll('[data-book]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.book) bookForm.plan.value = btn.dataset.book;
        bookDialog.showModal();
        $lenis.stop?.();
      });
    });
    bookDialog.addEventListener('close', () => $lenis.start?.());
    bookDialog.querySelector('[data-close]').addEventListener('click', () => bookDialog.close());
    bookDialog.addEventListener('click', e => { if (e.target === bookDialog) bookDialog.close(); });
    bookForm.addEventListener('submit', () => {
      const f = bookForm.elements;
      const body = `Name: ${f.name.value}
Email: ${f.email.value}
Package: ${f.plan.value}

${f.msg.value}`;
      location.href = `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent('Booking: ' + f.plan.value)}&body=${encodeURIComponent(body)}`;
    });

    // Active nav link on scroll
    const sections = ['crew', 'boards', 'rates'].map(id => document.getElementById(id)).filter(Boolean);
    const navLinks = document.querySelectorAll('.nav-link[data-section]');

    function updateActiveLink() {
      let current = '';
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          current = section.id;
        }
      });
      navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.section === current);
      });
    }

    // Throttled scroll listener for active link
    let scrollThrottle = false;
    window.addEventListener('scroll', () => {
      if (!scrollThrottle) {
        requestAnimationFrame(() => {
          updateActiveLink();
          scrollThrottle = false;
        });
        scrollThrottle = true;
      }
    }, { passive: true });

    // Ink fill animation
    const inkFillText = document.getElementById('ink-fill-text');
    const inkFillContent = "You will not need a status call to know where a revision stands. The bench posts what it did, the boards arrive tested, and by the second week the distance stops being a thing you manage. What is left is a team that keeps your date.";

    function splitInkFillText() {
      const words = inkFillContent.split(' ');
      let html = '';
      let letterIndex = 0;
      const totalLetters = inkFillContent.replace(/\s/g, '').length;

      words.forEach((word, wordIndex) => {
        html += `<span class="ink-fill-word">`;
        [...word].forEach((char, charIndex) => {
          const delay = (letterIndex / totalLetters) * 1500;
          html += `<span class="ink-fill-letter" style="--delay: ${delay}ms"><span class="layout-copy">${char}</span><span class="anim-copy" style="animation-delay: ${delay}ms">${char}</span></span>`;
          letterIndex++;
        });
        html += `</span>`;
        if (wordIndex < words.length - 1) {
          html += `<span class="ink-fill-word" aria-hidden="true">\u00a0</span>`;
        }
      });

      inkFillText.innerHTML = html;
    }

    function initInkFill() {
      if (prefersReducedMotion) {
        inkFillText.textContent = inkFillContent;
        return;
      }

      splitInkFillText();

      const letters = inkFillText.querySelectorAll('.ink-fill-letter');
      $inView(inkFillText, () => {
        letters.forEach((letter, i) => {
          const delay = parseFloat(letter.style.getPropertyValue('--delay')) || 0;
          setTimeout(() => {
            letter.classList.add('animate');
          }, delay);
        });
      }, { once: true, rootMargin: '-20%' });
    }

    // Initialize ink fill
    initInkFill();

    // Ensure video plays (handle autoplay policy)
    const emblemVideo = document.querySelector('.emblem-video');
    if (emblemVideo) {
      emblemVideo.play().catch(() => {
        // Autoplay prevented, user interaction needed
        document.addEventListener('click', () => emblemVideo.play(), { once: true });
      });
    }

    // Handle reduced motion for emblem
    if (prefersReducedMotion && emblemVideo) {
      emblemVideo.removeAttribute('autoplay');
      emblemVideo.pause();
    }

    // Listen for reduced motion changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      if (e.matches && emblemVideo) {
        emblemVideo.removeAttribute('autoplay');
        emblemVideo.pause();
      } else if (!e.matches && emblemVideo) {
        emblemVideo.setAttribute('autoplay', '');
        emblemVideo.play().catch(() => {});
      }
    });

    // Initial active link check
    updateActiveLink();
})();
