// Theme toggle, palette panel, glass interactions, post reading aids (TOC, code blocks, images) and search.
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
    });
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

  /* --- Palette panel ------------------------------------------------------ */

  const PALETTES = [
    { id: "aurora", name: "오로라", c: ["#7C3AED", "#3B82F6", "#06B6D4", "#EC4899"] },
    { id: "sunset", name: "선셋",   c: ["#F97316", "#EC4899", "#8B5CF6", "#FACC15"] },
    { id: "ocean",  name: "오션",   c: ["#2563EB", "#0EA5E9", "#14B8A6", "#6366F1"] },
    { id: "forest", name: "포레스트", c: ["#059669", "#84CC16", "#0EA5E9", "#14B8A6"] },
    { id: "sakura", name: "벚꽃",   c: ["#DB2777", "#F472B6", "#A855F7", "#FB7185"] },
    { id: "lava",   name: "라바",   c: ["#DC2626", "#F97316", "#DB2777", "#F59E0B"] },
    { id: "mono",   name: "모노",   c: ["#475569", "#94A3B8", "#64748B", "#CBD5E1"] }
  ];

  function store(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) {}
  }
  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  // One picked colour -> four related accents by rotating the hue
  function hexToHsl(hex) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s * 100, l * 100];
  }
  function hsl(h, s, l) {
    return "hsl(" + Math.round((h + 360) % 360) + " " + Math.round(s) + "% " + Math.round(l) + "%)";
  }
  function deriveAccents(hex) {
    const [h, s, l] = hexToHsl(hex);
    const sat = Math.max(s, 55);
    return [hex, hsl(h + 35, sat, Math.min(l + 6, 62)), hsl(h - 40, sat, Math.min(l + 4, 58)), hsl(h + 150, sat * .9, Math.min(l + 10, 66))];
  }

  function applyPalette(id, colors) {
    for (let i = 1; i <= 4; i++) root.style.removeProperty("--accent-" + i);
    if (id === "custom" && colors) {
      colors.forEach(function (col, i) { root.style.setProperty("--accent-" + (i + 1), col); });
    }
    if (id === "aurora") root.removeAttribute("data-palette");
    else root.setAttribute("data-palette", id);
  }

  function initPalette() {
    const btn = document.getElementById("palette-toggle");
    if (!btn) return;

    const swatches = PALETTES.map(function (p) {
      return '<button type="button" class="palette-swatch" data-palette-id="' + p.id + '" aria-pressed="false">' +
        '<span class="palette-dot" style="--c1:' + p.c[0] + ';--c2:' + p.c[1] + ';--c3:' + p.c[2] + ';--c4:' + p.c[3] + '"></span>' +
        p.name + "</button>";
    }).join("");

    const panel = document.createElement("div");
    panel.className = "palette-panel";
    panel.id = "palette-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "색 팔레트");
    panel.innerHTML =
      '<div class="palette-head"><p class="palette-title">Palette</p>' +
      '<button type="button" class="palette-close" aria-label="닫기"><i class="fas fa-xmark" aria-hidden="true"></i></button></div>' +
      '<div class="palette-grid">' + swatches +
        '<label class="palette-swatch" data-palette-id="custom" aria-pressed="false">' +
          '<span class="palette-dot palette-dot-custom" style="--c1:#FF6B6B;--c2:#FFD93D;--c3:#6BCB77;--c4:#4D96FF">' +
          '<input type="color" value="#7C3AED" aria-label="직접 고르기"></span>직접</label>' +
      "</div>" +
      '<div class="palette-row"><label for="palette-frost">유리 블러</label>' +
        '<input id="palette-frost" type="range" min="4" max="48" step="1"><span class="palette-value"></span></div>' +
      '<div class="palette-row"><label for="palette-motion">배경 움직임</label>' +
        '<input id="palette-motion" class="palette-switch" type="checkbox"></div>' +
      '<button type="button" class="palette-reset">기본값으로</button>';
    document.body.appendChild(panel);

    const frost = panel.querySelector("#palette-frost");
    const frostVal = panel.querySelector(".palette-value");
    const motion = panel.querySelector("#palette-motion");
    const picker = panel.querySelector('input[type="color"]');
    const customDot = panel.querySelector(".palette-dot-custom");

    function sync() {
      const current = read("palette") || "aurora";
      panel.querySelectorAll(".palette-swatch").forEach(function (s) {
        s.setAttribute("aria-pressed", String(s.dataset.paletteId === current));
      });
      const custom = (read("paletteCustom") || "").split(",");
      if (custom.length === 4) {
        picker.value = custom[0];
        custom.forEach(function (col, i) { customDot.style.setProperty("--c" + (i + 1), col); });
      }
      const f = getComputedStyle(root).getPropertyValue("--frost").trim() || "22";
      frost.value = f;
      frostVal.textContent = f;
      motion.checked = root.getAttribute("data-motion") !== "off";
    }

    function open() {
      sync();
      panel.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
    }
    function close() {
      panel.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      panel.classList.contains("is-open") ? close() : open();
    });
    panel.querySelector(".palette-close").addEventListener("click", close);
    document.addEventListener("click", function (e) {
      if (panel.classList.contains("is-open") && !panel.contains(e.target) && e.target !== btn) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    panel.querySelectorAll("button.palette-swatch").forEach(function (s) {
      s.addEventListener("click", function () {
        const id = s.dataset.paletteId;
        applyPalette(id);
        store("palette", id === "aurora" ? null : id);
        sync();
      });
    });

    picker.addEventListener("input", function () {
      const colors = deriveAccents(picker.value);
      applyPalette("custom", colors);
      store("palette", "custom");
      store("paletteCustom", colors.join(","));
      sync();
    });

    frost.addEventListener("input", function () {
      root.style.setProperty("--frost", frost.value);
      frostVal.textContent = frost.value;
      store("frost", frost.value);
    });

    motion.addEventListener("change", function () {
      if (motion.checked) root.removeAttribute("data-motion");
      else root.setAttribute("data-motion", "off");
      store("motion", motion.checked ? null : "off");
    });

    panel.querySelector(".palette-reset").addEventListener("click", function () {
      applyPalette("aurora");
      root.style.removeProperty("--frost");
      root.removeAttribute("data-motion");
      ["palette", "paletteCustom", "frost", "motion"].forEach(function (k) { store(k, null); });
      sync();
    });
  }

  /* --- Ambient orbs: follow the pointer and the scroll -------------------- */

  function initAmbient() {
    const amb = document.querySelector(".ambient");
    if (!amb) return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let tx = -9999, ty = -9999, cx = tx, cy = ty, raf = 0;

    function onScroll() {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      amb.style.setProperty("--sy", (window.scrollY / max).toFixed(3));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (!finePointer || reduceMotion) return;

    // The cursor orb trails the pointer, so glass shows a moving glow under it
    function tick() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      amb.style.setProperty("--cx", cx.toFixed(1) + "px");
      amb.style.setProperty("--cy", cy.toFixed(1) + "px");
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(tick) : 0;
    }

    window.addEventListener("pointermove", function (e) {
      if (root.getAttribute("data-motion") === "off") return;
      if (cx < -9000) { cx = e.clientX; cy = e.clientY; }
      tx = e.clientX;
      ty = e.clientY;
      amb.classList.add("has-cursor");
      amb.style.setProperty("--px", (e.clientX / window.innerWidth * 2 - 1).toFixed(3));
      amb.style.setProperty("--py", (e.clientY / window.innerHeight * 2 - 1).toFixed(3));
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    document.addEventListener("pointerleave", function () { amb.classList.remove("has-cursor"); });
  }

  /* --- Glass: pointer highlight, tilt, magnetic buttons, ripple ----------- */

  const GLASS = ".posts-list .post-preview, .post-nav-link, .series-step, .series-box, .tag-pill, .tag-group, " +
    ".toc-inline, .profile, .about-card, .related-posts, .btn-ghost, .hero-pill, .section-more, .blog-post, " +
    ".palette-panel, .page-link";
  const TILT = ".posts-list .post-preview, .series-step, .post-nav-link, .about-card";
  const MAGNETIC = ".hero-pill, .section-more, .btn-solid, .btn-ghost, .tag-pill, .profile-btn";
  const RIPPLE = ".hero-pill, .section-more, .btn-solid, .btn-ghost, .tag-pill, .post-preview, .series-step, .post-nav-link, .palette-swatch, .page-link";

  function initGlassPointer() {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (finePointer) {
      let tilted = null, magnet = null;

      document.addEventListener("pointermove", function (e) {
        const glass = e.target.closest && e.target.closest(GLASS);
        if (glass) {
          const r = glass.getBoundingClientRect();
          glass.style.setProperty("--mx", (e.clientX - r.left) + "px");
          glass.style.setProperty("--my", (e.clientY - r.top) + "px");
        }
        if (reduceMotion || root.getAttribute("data-motion") === "off") return;

        const card = e.target.closest && e.target.closest(TILT);
        if (tilted && tilted !== card) untilt(tilted);
        if (card) {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          card.classList.add("is-tilting");
          card.style.transform = "perspective(900px) rotateX(" + (-y * 7).toFixed(2) + "deg) rotateY(" +
            (x * 9).toFixed(2) + "deg) translateY(-4px)";
          tilted = card;
        }

        const m = e.target.closest && e.target.closest(MAGNETIC);
        if (magnet && magnet !== m) magnet.style.translate = "";
        if (m) {
          const r = m.getBoundingClientRect();
          m.classList.add("is-magnetic");
          m.style.translate = ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + "px " +
            ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + "px";
          magnet = m;
        }
      }, { passive: true });

      function untilt(card) {
        card.style.transform = "";
        card.classList.remove("is-tilting");
        tilted = null;
      }
      document.addEventListener("pointerleave", function () {
        if (tilted) untilt(tilted);
        if (magnet) magnet.style.translate = "";
      });
    }

    if (reduceMotion) return;
    document.addEventListener("pointerdown", function (e) {
      const host = e.target.closest && e.target.closest(RIPPLE);
      if (!host) return;
      const r = host.getBoundingClientRect();
      const dot = document.createElement("span");
      dot.className = "ripple";
      dot.style.left = (e.clientX - r.left) + "px";
      dot.style.top = (e.clientY - r.top) + "px";
      host.classList.add("ripple-host");
      host.appendChild(dot);
      dot.addEventListener("animationend", function () { dot.remove(); });
    });
  }

  function init() {
    initThemeToggle();
    initPalette();
    initAmbient();
    initGlassPointer();
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
