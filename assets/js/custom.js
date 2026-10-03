// Theme toggle, light motion, post reading aids (TOC, code blocks, images) and search.
// Loaded through `site-js` in _config.yml, after beautifuljekyll.js.

(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      ".posts-list .post-preview, .pagination, .about-card, .series-step, .tag-group"
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

  /* --- Hero: typing ------------------------------------------------------- */

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

    // In-page buttons (e.g. on the 404 page) that open the palette
    document.querySelectorAll("[data-open-search]").forEach(function (btn) {
      btn.addEventListener("click", function () { if (openLink) openLink.click(); });
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

  /* --- Code blocks: language label + copy button -------------------------- */

  function initCodeBlocks() {
    document.querySelectorAll(".blog-post div.highlighter-rouge").forEach(function (block) {
      const pre = block.querySelector("pre.highlight");
      if (!pre) return;
      const m = block.className.match(/language-([\w+#-]+)/);
      const lang = m && m[1] !== "plaintext" ? m[1] : "text";

      const bar = document.createElement("div");
      bar.className = "code-bar";
      const label = document.createElement("span");
      label.className = "code-lang";
      label.textContent = lang;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy";
      btn.setAttribute("aria-label", "코드 복사");
      btn.innerHTML = '<i class="far fa-copy" aria-hidden="true"></i><span>복사</span>';
      bar.appendChild(label);
      bar.appendChild(btn);
      block.insertBefore(bar, block.firstChild);

      let timer = null;
      btn.addEventListener("click", function () {
        const code = pre.querySelector("code") || pre;
        const done = function (ok) {
          btn.classList.toggle("is-copied", ok);
          btn.innerHTML = ok
            ? '<i class="fas fa-check" aria-hidden="true"></i><span>복사됨</span>'
            : '<i class="fas fa-xmark" aria-hidden="true"></i><span>실패</span>';
          clearTimeout(timer);
          timer = setTimeout(function () {
            btn.classList.remove("is-copied");
            btn.innerHTML = '<i class="far fa-copy" aria-hidden="true"></i><span>복사</span>';
          }, 1600);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(code.innerText).then(function () { done(true); }, function () { done(false); });
        } else {
          done(false);
        }
      });
    });
  }

  /* --- Tables: scroll sideways inside a wrapper so the table can stay full width */

  function initTables() {
    document.querySelectorAll(".blog-post table").forEach(function (table) {
      if (table.parentElement.classList.contains("table-scroll")) return;
      const wrap = document.createElement("div");
      wrap.className = "table-scroll";
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  /* --- Images: ![alt](src "caption") becomes a captioned figure ------------ */

  function initFigures() {
    document.querySelectorAll(".blog-post img[title]").forEach(function (img) {
      const caption = img.getAttribute("title").trim();
      if (!caption) return;
      const p = img.parentElement;
      const figure = document.createElement("figure");
      figure.className = "post-figure";
      // A lone image in its own paragraph: replace the paragraph itself
      const target = p && p.tagName === "P" && p.childNodes.length === 1 ? p : img;
      target.parentNode.insertBefore(figure, target);
      figure.appendChild(img);
      if (target !== img) target.remove();
      const fc = document.createElement("figcaption");
      fc.textContent = caption;
      figure.appendChild(fc);
      img.removeAttribute("title");
    });
  }

  /* --- Images: click to enlarge ------------------------------------------- */

  function initLightbox() {
    const imgs = document.querySelectorAll(".blog-post img");
    if (!imgs.length) return;

    const box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "이미지 크게 보기");
    box.hidden = true;
    box.innerHTML = '<button type="button" class="lightbox-close" aria-label="닫기"><i class="fas fa-xmark" aria-hidden="true"></i></button><img alt="">';
    document.body.appendChild(box);
    const big = box.querySelector("img");
    const closeBtn = box.querySelector(".lightbox-close");
    let opener = null;

    function close() {
      box.classList.remove("is-open");
      document.documentElement.classList.remove("lightbox-lock");
      setTimeout(function () { box.hidden = true; big.removeAttribute("src"); }, reduceMotion ? 0 : 200);
      if (opener) opener.focus();
    }

    imgs.forEach(function (img) {
      // Linked images keep their link; tiny images (icons, badges) are not worth enlarging
      if (img.closest("a")) return;
      img.classList.add("zoomable");
      img.tabIndex = 0;
      function open() {
        if (img.naturalWidth && img.naturalWidth < 200) return;
        opener = img;
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        box.hidden = false;
        document.documentElement.classList.add("lightbox-lock");
        requestAnimationFrame(function () { box.classList.add("is-open"); });
        closeBtn.focus();
      }
      img.addEventListener("click", open);
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });

    box.addEventListener("click", function (e) { if (e.target !== big) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden) close();
    });
  }

  function init() {
    initThemeToggle();
    initReveal();
    initTyping();
    initHeroScroll();
    initSearchPalette();
    initReadProgress();
    initToc();
    initCodeBlocks();
    initTables();
    initFigures();
    initLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
