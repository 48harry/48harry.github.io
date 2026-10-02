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
      syncGiscusTheme();
    });
  }

  function syncGiscusTheme() {
    const frame = document.querySelector("iframe.giscus-frame");
    if (!frame) return;
    const theme = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    frame.contentWindow.postMessage({ giscus: { setConfig: { theme: theme } } }, "https://giscus.app");
  }

  /* --- Scroll reveal ------------------------------------------------------ */

  function initReveal() {
    const targets = document.querySelectorAll(
      ".posts-list .post-preview, .blog-post > h2, .blog-post > h3, .blog-post > p > img, " +
      ".blog-post > .highlighter-rouge, .blog-post > table, .blog-post > blockquote, " +
      ".pagination, #social-share-section, .post-nav, .about-card, .series-step, .tag-group, .series-box"
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
      if ((el.classList.contains("post-preview") || el.classList.contains("about-card")) &&
          el.getBoundingClientRect().top < window.innerHeight) {
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

  /* --- Search palette: shortcuts, keyboard nav, backdrop close ------------ */

  function initSearchPalette() {
    const overlay = document.getElementById("beautifuljekyll-search-overlay");
    const input = document.getElementById("nav-search-input");
    const results = document.getElementById("search-results-container");
    const openLink = document.getElementById("nav-search-link");
    const exit = document.getElementById("nav-search-exit");
    if (!overlay || !input || !results) return;
    let active = -1;

    function isOpen() { return overlay.style.display === "block"; }
    function links() { return Array.prototype.slice.call(results.querySelectorAll("a")); }
    function setActive(i) {
      const all = links();
      if (!all.length) { active = -1; return; }
      active = (i + all.length) % all.length;
      all.forEach(function (a, n) { a.classList.toggle("is-active", n === active); });
      all[active].scrollIntoView({ block: "nearest" });
    }

    // Ctrl/Cmd+K or "/" opens search from anywhere
    document.addEventListener("keydown", function (e) {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        if (!openLink || isOpen()) return;
        e.preventDefault();
        openLink.click();
      }
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
      else if (e.key === "Enter") {
        const all = links();
        const target = all[active] || all[0];
        if (target) { e.preventDefault(); target.click(); }
      }
    });
    // New results: start with the first one highlighted
    new MutationObserver(function () { active = -1; if (links().length) setActive(0); })
      .observe(results, { childList: true });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay && exit) exit.click();
    });
  }

  /* --- Reading progress (posts only) -------------------------------------- */

  function initReadProgress() {
    const post = document.querySelector(".blog-post");
    if (!post) return;
    const bar = document.createElement("div");
    bar.className = "read-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    let frame = null;
    function update() {
      frame = null;
      const r = post.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const p = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 1;
      bar.style.setProperty("--p", p.toFixed(4));
    }
    window.addEventListener("scroll", function () { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* --- Table of contents (posts with 3+ headings) ------------------------ */

  function initToc() {
    const post = document.querySelector(".blog-post");
    if (!post) return;
    const heads = Array.prototype.slice.call(post.querySelectorAll("h1, h2, h3"));
    if (heads.length < 3) return;

    function buildList() {
      const ol = document.createElement("ol");
      heads.forEach(function (h, i) {
        if (!h.id) h.id = "section-" + (i + 1);
        const li = document.createElement("li");
        li.className = h.tagName === "H3" ? "toc-h3" : "toc-h2";
        const a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent.trim();
        li.appendChild(a);
        ol.appendChild(li);
      });
      return ol;
    }

    // Side panel for wide screens, collapsible box above the post otherwise
    const side = document.createElement("nav");
    side.className = "toc toc-side";
    side.setAttribute("aria-label", "목차");
    side.innerHTML = '<p class="toc-title">On this page</p>';
    side.appendChild(buildList());
    document.body.appendChild(side);

    const inline = document.createElement("details");
    inline.className = "toc toc-inline";
    inline.innerHTML = "<summary>목차</summary>";
    inline.appendChild(buildList());
    post.parentNode.insertBefore(inline, post);

    const links = document.querySelectorAll(".toc a");
    function setActive(id) {
      links.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + id); });
    }

    // Scrollspy: the last heading above ~30% of the viewport is current
    let frame = null;
    function update() {
      frame = null;
      const line = window.innerHeight * 0.3;
      let current = heads[0];
      for (let i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top <= line) current = heads[i]; else break;
      }
      setActive(current.id);
      // Only show the side panel once the reader is inside the post
      const r = post.getBoundingClientRect();
      side.classList.toggle("is-shown", r.top < line && r.bottom > 0);
    }
    window.addEventListener("scroll", function () { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
    update();

    document.querySelectorAll(".toc a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        const target = document.getElementById(a.getAttribute("href").slice(1));
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
        history.replaceState(null, "", a.getAttribute("href"));
      });
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
    initSearchPalette();
    initReadProgress();
    initToc();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
