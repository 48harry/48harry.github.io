// Motion, card interactions and dark-mode toggle.
// Loaded through `site-js` in _config.yml, after beautifuljekyll.js.

(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* --- Theme toggle ------------------------------------------------------- */

  function syncNavbarClass() {
    const nav = document.querySelector(".navbar");
    if (!nav) return;
    const dark = root.getAttribute("data-theme") === "dark";
    nav.classList.toggle("navbar-dark", dark);
    nav.classList.toggle("navbar-light", !dark);
  }

  function initThemeToggle() {
    const btn = document.getElementById("theme-toggle");
    // beautifuljekyll.js sets the navbar class after a 10ms timeout; run after it
    setTimeout(syncNavbarClass, 20);
    if (!btn) return;
    btn.addEventListener("click", function () {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncNavbarClass();
    });
  }

  /* --- Scroll reveal ------------------------------------------------------ */

  function initReveal() {
    const targets = document.querySelectorAll(
      ".posts-list .post-preview, .blog-post > h2, .blog-post > h3, .blog-post > p > img, " +
      ".blog-post > .highlighter-rouge, .blog-post > table, .blog-post > blockquote, " +
      ".pagination, #social-share-section"
    );
    if (!targets.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    let batch = 0;
    targets.forEach(function (el) {
      // Stagger cards that start inside the first viewport
      if (el.classList.contains("post-preview") && el.getBoundingClientRect().top < window.innerHeight) {
        el.style.setProperty("--reveal-delay", (batch++ * 90) + "ms");
      }
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  /* --- Card spotlight + tilt --------------------------------------------- */

  function initCards() {
    if (!canHover) return;
    document.querySelectorAll(".posts-list .post-preview").forEach(function (card) {
      let frame = null;
      card.addEventListener("pointermove", function (e) {
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = null;
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          card.style.setProperty("--mx", (x * 100) + "%");
          card.style.setProperty("--my", (y * 100) + "%");
          if (!reduceMotion) {
            card.style.setProperty("--rx", ((0.5 - y) * 4).toFixed(2) + "deg");
            card.style.setProperty("--ry", ((x - 0.5) * 4).toFixed(2) + "deg");
          }
        });
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* --- Hero: typing, parallax, magnetic pills ---------------------------- */

  function initTyping() {
    const el = document.querySelector(".hero-typed");
    if (!el) return;
    const words = (el.getAttribute("data-words") || "").split("|").filter(Boolean);
    if (words.length < 2 || reduceMotion) return;

    let w = 0, i = words[0].length, deleting = true;
    function tick() {
      const word = words[w];
      if (deleting) {
        i--;
        el.textContent = word.slice(0, i);
        if (i === 0) {
          deleting = false;
          w = (w + 1) % words.length;
          return setTimeout(tick, 350);
        }
        return setTimeout(tick, 45);
      }
      const next = words[w];
      i++;
      el.textContent = next.slice(0, i);
      if (i === next.length) {
        deleting = true;
        return setTimeout(tick, 2200);
      }
      setTimeout(tick, 95);
    }
    setTimeout(tick, 2600);
  }

  function initHeroParallax() {
    const hero = document.getElementById("hero");
    const bg = hero && hero.querySelector(".hero-bg");
    if (!bg || !canHover || reduceMotion) return;
    let frame = null;
    hero.addEventListener("pointermove", function (e) {
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = null;
        const r = hero.getBoundingClientRect();
        bg.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        bg.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    });
  }

  function initMagnetic() {
    if (!canHover || reduceMotion) return;
    document.querySelectorAll(".magnetic").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + dx * 0.25 + "px," + dy * 0.35 + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  }

  function initHeroScroll() {
    const link = document.querySelector(".hero-scroll");
    const main = document.querySelector("body > main, main");
    if (!link || !main) return;
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const top = main.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* --- Page leave fade ---------------------------------------------------- */

  function initPageTransitions() {
    if (reduceMotion) return;
    document.addEventListener("click", function (e) {
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download") || a.getAttribute("href").charAt(0) === "#") return;
      if (a.getAttribute("data-toggle")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      document.body.classList.add("page-leaving");
      setTimeout(function () { location.href = a.href; }, 180);
    });
    // Restore the page when it comes back from the back/forward cache
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) document.body.classList.remove("page-leaving");
    });
  }

  function init() {
    initThemeToggle();
    initReveal();
    initCards();
    initTyping();
    initHeroParallax();
    initMagnetic();
    initHeroScroll();
    initPageTransitions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
