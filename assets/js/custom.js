// Theme toggle, palette panel, glass interactions, post reading aids (TOC, callouts, heading links,
// Mermaid, code blocks, images), search, the archive heatmap and the newsletter calendar.
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
      '<div class="palette-row"><label for="palette-lite">가벼운 모드</label><span class="palette-value palette-auto"></span>' +
        '<input id="palette-lite" class="palette-switch" type="checkbox"></div>' +
      '<button type="button" class="palette-reset">기본값으로</button>';
    document.body.appendChild(panel);

    const frost = panel.querySelector("#palette-frost");
    const frostVal = panel.querySelector(".palette-value");
    const motion = panel.querySelector("#palette-motion");
    const lite = panel.querySelector("#palette-lite");
    const liteAuto = panel.querySelector(".palette-auto");
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
      lite.checked = root.getAttribute("data-perf") === "lite";
      liteAuto.textContent = lite.checked && !read("perf") ? "자동" : "";
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

    lite.addEventListener("change", function () {
      setLite(lite.checked);
      store("perf", lite.checked ? "lite" : "full");
      sync();
    });

    panel.querySelector(".palette-reset").addEventListener("click", function () {
      applyPalette("aurora");
      root.style.removeProperty("--frost");
      root.removeAttribute("data-motion");
      ["palette", "paletteCustom", "frost", "motion", "perf"].forEach(function (k) { store(k, null); });
      setLite(read("perfAuto") === "lite");
      sync();
    });
  }

  /* --- Lite mode: lighter glass on slow devices --------------------------- */

  function setLite(on) {
    if (on) root.setAttribute("data-perf", "lite");
    else root.removeAttribute("data-perf");
  }
  function isLite() { return root.getAttribute("data-perf") === "lite"; }

  // head.html already applies a stored choice or obvious low-end hints; here we
  // time real frames once, and switch to lite if the page can't keep up.
  function initPerfProbe() {
    if (read("perf") || read("perfAuto") || isLite() || reduceMotion) return;
    if (!("requestAnimationFrame" in window)) return;
    setTimeout(function () {
      if (document.visibilityState !== "visible") return;
      const deltas = [];
      let last = performance.now(), aborted = false;
      const stop = last + 2000;
      function onHide() { aborted = true; }
      document.addEventListener("visibilitychange", onHide, { once: true });
      function frame(now) {
        deltas.push(now - last);
        last = now;
        if (now < stop && !aborted) return requestAnimationFrame(frame);
        document.removeEventListener("visibilitychange", onHide);
        if (aborted || deltas.length < 10) return;
        deltas.sort(function (a, b) { return a - b; });
        const median = deltas[Math.floor(deltas.length / 2)];
        const slow = deltas.filter(function (d) { return d > 50; }).length / deltas.length;
        // under ~35fps typical, or one frame in four badly late
        if (median > 28 || slow > 0.25) {
          store("perfAuto", "lite");
          setLite(true);
          toast("기기가 버거워 보여서 가벼운 모드로 바꿨어요");
        } else {
          store("perfAuto", "full");
        }
      }
      requestAnimationFrame(frame);
    }, 1500);
  }

  /* --- Resume reading: offer to jump back to where the reader left off ---- */

  function initResume() {
    const post = document.querySelector(".blog-post");
    if (!post) return;
    const key = location.pathname;
    let all = {};
    try { all = JSON.parse(read("readpos") || "{}") || {}; } catch (e) {}
    const saved = all[key];

    function postTop() { return post.getBoundingClientRect().top + window.pageYOffset; }
    function progress() {
      const total = post.offsetHeight - window.innerHeight * 0.6;
      return total > 0 ? Math.min(Math.max((window.pageYOffset - postTop()) / total, 0), 1) : 1;
    }
    function save() {
      const p = progress();
      if (p >= 0.95) delete all[key];
      else if (p > 0.05) all[key] = { y: Math.round(window.pageYOffset - postTop()), p: Math.round(p * 100), t: Date.now() };
      else return;
      // keep the 40 most recent posts
      const keys = Object.keys(all).sort(function (a, b) { return all[b].t - all[a].t; });
      keys.slice(40).forEach(function (k) { delete all[k]; });
      store("readpos", JSON.stringify(all));
    }
    let timer = null;
    window.addEventListener("scroll", function () { clearTimeout(timer); timer = setTimeout(save, 400); }, { passive: true });
    window.addEventListener("pagehide", save);

    if (!saved || location.hash) return;
    // Let the browser restore scroll first (back/forward); only offer when we're still near the top
    setTimeout(function () {
      if (window.pageYOffset > 200) return;
      const pill = document.createElement("div");
      pill.className = "resume";
      pill.setAttribute("role", "region");
      pill.setAttribute("aria-label", "이어 읽기");
      pill.style.setProperty("--p", saved.p / 100);
      pill.innerHTML =
        '<button type="button" class="resume-go"><i class="fas fa-bookmark" aria-hidden="true"></i>' +
        "<span>이어 읽기</span><span class=\"resume-pct\">" + saved.p + "%</span></button>" +
        '<button type="button" class="resume-close" aria-label="닫기"><i class="fas fa-xmark" aria-hidden="true"></i></button>';
      document.body.appendChild(pill);
      requestAnimationFrame(function () { pill.classList.add("is-shown"); });

      let hideTimer = setTimeout(hide, 12000);
      const startY = window.pageYOffset;
      function hide() {
        clearTimeout(hideTimer);
        window.removeEventListener("scroll", onScroll);
        pill.classList.remove("is-shown");
        setTimeout(function () { pill.remove(); }, 400);
      }
      function onScroll() { if (Math.abs(window.pageYOffset - startY) > 600) hide(); }
      window.addEventListener("scroll", onScroll, { passive: true });

      pill.querySelector(".resume-go").addEventListener("click", function () {
        hide();
        window.scrollTo({ top: postTop() + saved.y, behavior: reduceMotion ? "auto" : "smooth" });
      });
      pill.querySelector(".resume-close").addEventListener("click", hide);
    }, 600);
  }

  /* --- Ambient orbs: follow the pointer and the scroll -------------------- */

  function initAmbient() {
    const amb = document.querySelector(".ambient");
    if (!amb) return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // Targets (t*) are set by events; current values ease toward them each frame,
    // so the orbs glide instead of snapping with every scroll tick.
    const cur = { sy: 0, px: 0, py: 0, cx: -9999, cy: -9999 };
    const tgt = { sy: 0, px: 0, py: 0, cx: -9999, cy: -9999 };
    let raf = 0;

    function scrollRatio() {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      return window.scrollY / max;
    }
    cur.sy = tgt.sy = scrollRatio();
    amb.style.setProperty("--sy", cur.sy.toFixed(4));

    function tick() {
      let moving = false;
      ["sy", "px", "py"].forEach(function (k) {
        cur[k] += (tgt[k] - cur[k]) * 0.06;
        if (Math.abs(tgt[k] - cur[k]) > 0.0005) moving = true;
      });
      cur.cx += (tgt.cx - cur.cx) * 0.08;
      cur.cy += (tgt.cy - cur.cy) * 0.08;
      if (Math.abs(tgt.cx - cur.cx) + Math.abs(tgt.cy - cur.cy) > 0.5) moving = true;

      amb.style.setProperty("--sy", cur.sy.toFixed(4));
      amb.style.setProperty("--px", cur.px.toFixed(4));
      amb.style.setProperty("--py", cur.py.toFixed(4));
      amb.style.setProperty("--cx", cur.cx.toFixed(1) + "px");
      amb.style.setProperty("--cy", cur.cy.toFixed(1) + "px");
      raf = moving ? requestAnimationFrame(tick) : 0;
    }
    function kick() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    if (reduceMotion) return;

    window.addEventListener("scroll", function () {
      tgt.sy = scrollRatio();
      kick();
    }, { passive: true });

    if (!finePointer) return;

    window.addEventListener("pointermove", function (e) {
      if (root.getAttribute("data-motion") === "off" || isLite()) return;
      if (cur.cx < -9000) { cur.cx = e.clientX; cur.cy = e.clientY; }
      tgt.cx = e.clientX;
      tgt.cy = e.clientY;
      tgt.px = e.clientX / window.innerWidth * 2 - 1;
      tgt.py = e.clientY / window.innerHeight * 2 - 1;
      amb.classList.add("has-cursor");
      kick();
    }, { passive: true });
    document.addEventListener("pointerleave", function () { amb.classList.remove("has-cursor"); });
  }

  /* --- Glass: pointer highlight, tilt, magnetic buttons, ripple ----------- */

  const GLASS = ".posts-list .post-preview, .post-nav-link, .series-step, .series-box, .tag-pill, .tag-group, " +
    ".toc-inline, .profile, .about-card, .related-posts, .btn-ghost, .hero-pill, .section-more, .blog-post, " +
    ".palette-panel, .page-link, .heat, .heat-stat, .cal, .cal-preview-card, .nl-switch, .archive-month, .callout";
  const TILT = ".posts-list .post-preview, .series-step, .post-nav-link, .about-card";
  const MAGNETIC = ".hero-pill, .section-more, .btn-solid, .btn-ghost, .tag-pill, .profile-btn";
  const RIPPLE = ".hero-pill, .section-more, .btn-solid, .btn-ghost, .tag-pill, .post-preview, .series-step, .post-nav-link, .palette-swatch, .page-link, " +
    ".cal-day.has-post, .cal-nav, .cal-today, .nl-switch-btn, .heat-range";

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
        if (reduceMotion || isLite() || root.getAttribute("data-motion") === "off") return;

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

  /* --- Toast --------------------------------------------------------------- */

  let toastTimer = null;
  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> ';
    t.appendChild(document.createTextNode(msg));
    requestAnimationFrame(function () { t.classList.add("is-shown"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-shown"); }, 1800);
  }

  /* --- Obsidian callouts: > [!type]± Title ----------------------------------- */

  const CALLOUT_TYPES = {
    note: "fa-pen", abstract: "fa-clipboard-list", info: "fa-circle-info", todo: "fa-circle-check",
    tip: "fa-fire-flame-curved", success: "fa-check", question: "fa-circle-question",
    warning: "fa-triangle-exclamation", failure: "fa-xmark", danger: "fa-bolt", bug: "fa-bug",
    example: "fa-list", quote: "fa-quote-left"
  };
  const CALLOUT_ALIASES = {
    summary: "abstract", tldr: "abstract", hint: "tip", important: "tip", check: "success", done: "success",
    help: "question", faq: "question", caution: "warning", attention: "warning", fail: "failure",
    missing: "failure", error: "danger", cite: "quote"
  };

  function initCallouts() {
    // kramdown (GFM, hard_wrap) renders the marker line and the next lines as one <p> split by <br />
    const marker = /^\s*\[!([\w-]+)\]([+-]?)[ \t]*((?:(?!<br)[^\n])*?)\s*(?:<br\s*\/?>\s*|\n|$)/i;
    document.querySelectorAll(".blog-post blockquote").forEach(function (bq) {
      const first = bq.firstElementChild;
      if (!first || first.tagName !== "P") return;
      const m = first.innerHTML.match(marker);
      if (!m) return;

      const name = m[1].toLowerCase();
      const type = CALLOUT_TYPES[name] ? name : CALLOUT_ALIASES[name] || "note";
      const fold = m[2];
      first.innerHTML = first.innerHTML.slice(m[0].length);
      if (!first.innerHTML.trim()) first.remove();

      const box = document.createElement(fold ? "details" : "div");
      box.className = "callout callout-" + type;
      if (fold === "+") box.open = true;
      const head = document.createElement(fold ? "summary" : "div");
      head.className = "callout-title";
      head.innerHTML = '<i class="fas ' + CALLOUT_TYPES[type] + ' callout-icon" aria-hidden="true"></i><span>' +
        (m[3] || name.charAt(0).toUpperCase() + name.slice(1)) + "</span>" +
        (fold ? '<i class="fas fa-chevron-down callout-fold" aria-hidden="true"></i>' : "");
      box.appendChild(head);

      if (bq.childNodes.length && bq.textContent.trim() || bq.querySelector("img")) {
        const body = document.createElement("div");
        body.className = "callout-body";
        while (bq.firstChild) body.appendChild(bq.firstChild);
        box.appendChild(body);
      }
      bq.replaceWith(box);
    });
  }

  /* --- Heading anchors: hover a heading, click the link to copy it -------- */

  function initHeadingAnchors() {
    const post = document.querySelector(".blog-post");
    if (!post) return;
    post.querySelectorAll("h1, h2, h3, h4").forEach(function (h, i) {
      if (h.closest(".callout")) return;
      if (!h.id) h.id = "h-" + (i + 1);
      const a = document.createElement("a");
      a.className = "heading-anchor";
      a.href = "#" + h.id;
      a.setAttribute("aria-label", "이 섹션 링크 복사");
      a.innerHTML = '<i class="fas fa-link" aria-hidden="true"></i>';
      h.appendChild(a);
      a.addEventListener("click", function (e) {
        e.preventDefault();
        const url = new URL("#" + h.id, location.href).href;
        history.replaceState(null, "", "#" + h.id);
        const top = h.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(url).then(function () { toast("섹션 링크를 복사했어요"); }, function () {});
        }
      });
    });
  }

  /* --- Mermaid: ```mermaid blocks become diagrams in the current palette -- */

  const MERMAID_URL = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

  function initMermaid() {
    // Rouge wraps fenced code in div.language-x; unknown languages can come out as a bare pre > code
    const blocks = document.querySelectorAll(".blog-post div.language-mermaid, .blog-post pre > code.language-mermaid");
    if (!blocks.length) return;

    const items = [];
    blocks.forEach(function (node) {
      const b = node.tagName === "CODE" ? node.parentElement : node;
      const src = (b.querySelector("code") || b).textContent;
      const fig = document.createElement("figure");
      fig.className = "mermaid-figure is-loading";
      const pre = document.createElement("pre");
      pre.textContent = src;
      fig.appendChild(pre);
      b.replaceWith(fig);
      items.push({ el: fig, src: src });
    });

    // Any CSS colour (hex, hsl(), color-mix() result) -> [r, g, b]
    const ctx = document.createElement("canvas").getContext("2d");
    function rgb(css) {
      ctx.fillStyle = "#000";
      ctx.fillStyle = css.trim() || "#000";
      ctx.fillRect(0, 0, 1, 1);
      return Array.prototype.slice.call(ctx.getImageData(0, 0, 1, 1).data, 0, 3);
    }
    function mix(a, b, t) {
      return "#" + a.map(function (v, i) {
        return Math.round(v * (1 - t) + b[i] * t).toString(16).padStart(2, "0");
      }).join("");
    }
    function themeVars() {
      const cs = getComputedStyle(root);
      const dark = root.getAttribute("data-theme") === "dark";
      const base = dark ? [21, 26, 43] : [255, 255, 255];
      const ink = dark ? [229, 231, 239] : [31, 35, 48];
      const a = [1, 2, 3, 4].map(function (n) { return rgb(cs.getPropertyValue("--accent-" + n)); });
      const t = dark ? 0.72 : 0.84;
      return {
        darkMode: dark,
        background: "transparent",
        fontFamily: cs.getPropertyValue("--body-font").trim(),
        fontSize: "15px",
        primaryColor: mix(a[0], base, t),
        primaryBorderColor: mix(a[0], base, 0.15),
        primaryTextColor: mix(ink, ink, 0),
        secondaryColor: mix(a[1], base, t),
        secondaryBorderColor: mix(a[1], base, 0.15),
        tertiaryColor: mix(a[2], base, t + 0.04),
        tertiaryBorderColor: mix(a[2], base, 0.15),
        lineColor: mix(a[0], ink, 0.45),
        textColor: mix(ink, ink, 0),
        noteBkgColor: mix(a[3], base, t),
        noteBorderColor: mix(a[3], base, 0.2),
        clusterBkg: mix(a[1], base, 0.92),
        clusterBorder: mix(a[1], base, 0.4),
        edgeLabelBackground: mix(base, base, 0)
      };
    }

    let mermaid = null, seq = 0, last = "";
    async function render() {
      const vars = themeVars();
      const sig = JSON.stringify(vars);
      if (sig === last) return;
      last = sig;
      mermaid.initialize({ startOnLoad: false, theme: "base", securityLevel: "strict", themeVariables: vars });
      for (const it of items) {
        try {
          const out = await mermaid.render("mermaid-" + (++seq), it.src);
          it.el.innerHTML = out.svg;
          it.el.classList.remove("is-error");
        } catch (e) {
          it.el.classList.add("is-error");
        }
        it.el.classList.remove("is-loading");
      }
    }

    import(MERMAID_URL).then(function (mod) {
      mermaid = mod.default;
      render();
      // Re-draw when the theme or palette changes
      let timer = null;
      new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(render, 250);
      }).observe(root, { attributes: true, attributeFilter: ["data-theme", "data-palette", "style"] });
    }, function () {
      items.forEach(function (it) { it.el.classList.remove("is-loading"); it.el.classList.add("is-error"); });
    });
  }

  /* --- Hero: title letters rise around the pointer ------------------------- */

  function initHeroLift() {
    const hero = document.querySelector(".hero");
    if (!hero || reduceMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const chars = Array.prototype.slice.call(hero.querySelectorAll(".hero-char:not(.hero-space)"));
    const cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
    let centers = [], raf = 0, fresh = true;

    function measure() {
      const h = hero.getBoundingClientRect();
      centers = chars.map(function (c) {
        const r = c.getBoundingClientRect();
        return [r.left - h.left + r.width / 2, r.top - h.top + r.height / 2];
      });
    }
    function tick() {
      cur.x += (tgt.x - cur.x) * 0.16;
      cur.y += (tgt.y - cur.y) * 0.16;
      chars.forEach(function (c, i) {
        const dx = centers[i][0] - cur.x, dy = centers[i][1] - cur.y;
        const f = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 170);
        c.style.setProperty("--lift", (f * f * (3 - 2 * f)).toFixed(3));
      });
      raf = Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > 0.3 ? requestAnimationFrame(tick) : 0;
    }
    function reset() {
      chars.forEach(function (c) { c.style.setProperty("--lift", "0"); });
    }

    hero.addEventListener("pointerenter", function () {
      measure();
      fresh = true;
    });
    hero.addEventListener("pointermove", function (e) {
      if (root.getAttribute("data-motion") === "off") { reset(); return; }
      const h = hero.getBoundingClientRect();
      tgt.x = e.clientX - h.left;
      tgt.y = e.clientY - h.top;
      if (fresh) { cur.x = tgt.x; cur.y = tgt.y; fresh = false; if (!centers.length) measure(); }
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener("pointerleave", reset);
    window.addEventListener("resize", function () { centers = []; });
  }

  /* --- Dates (local, so a post on the 2nd stays on the 2nd) ---------------- */

  const DAY = 86400000;
  function dayKey(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function parseDay(s) {
    const p = s.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function addDays(d, n) {
    // via setDate so DST shifts never skip or repeat a day
    const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    r.setDate(r.getDate() + n);
    return r;
  }
  function readJson(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function groupByDay(posts) {
    const map = {};
    posts.forEach(function (p) { (map[p.d] = map[p.d] || []).push(p); });
    return map;
  }

  /* --- Archive: activity heatmap ------------------------------------------ */

  function initHeatmap() {
    const box = document.querySelector(".heat");
    const posts = readJson("archive-data");
    if (!box || !posts || !posts.length) return;

    const byDay = groupByDay(posts);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const grid = box.querySelector(".heat-grid");
    const monthsRow = box.querySelector(".heat-months");
    const stats = box.querySelector(".heat-stats");
    const rangesEl = box.querySelector(".heat-ranges");
    const scroller = box.querySelector(".heat-scroll");

    const years = Object.keys(posts.reduce(function (o, p) { o[p.d.slice(0, 4)] = 1; return o; }, {}))
      .sort().reverse();
    const ranges = [{ id: "recent", label: "최근 1년", start: addDays(today, -364), end: today }]
      .concat(years.map(function (y) {
        return { id: y, label: y, start: new Date(+y, 0, 1), end: new Date(+y, 11, 31) };
      }));

    rangesEl.innerHTML = ranges.map(function (r) {
      return '<button type="button" class="heat-range" data-range="' + r.id + '" aria-pressed="false">' + r.label + "</button>";
    }).join("");

    function streaks(start, end) {
      let best = 0, run = 0, active = 0, count = 0;
      for (let d = start; d <= end; d = addDays(d, 1)) {
        const n = (byDay[dayKey(d)] || []).length;
        count += n;
        if (n) { active++; run++; best = Math.max(best, run); } else run = 0;
      }
      // Current streak: a run ending today, or yesterday if today has nothing yet
      let cur = 0;
      let d = byDay[dayKey(today)] ? today : addDays(today, -1);
      while (byDay[dayKey(d)]) { cur++; d = addDays(d, -1); }
      return { count: count, active: active, best: best, cur: cur };
    }

    function render(range) {
      rangesEl.querySelectorAll(".heat-range").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.range === range.id));
      });

      const gridStart = addDays(range.start, -range.start.getDay());
      const gridEnd = addDays(range.end, 6 - range.end.getDay());
      let html = "", week = 0, months = "";
      for (let d = gridStart, i = 0; d <= gridEnd; d = addDays(d, 1), i++) {
        week = Math.floor(i / 7);
        if (d < range.start || d > range.end) { html += '<span class="cell is-out"></span>'; continue; }
        // Label each month at its first week; label the starting month too unless the next label is too close
        if (d.getDate() === 1 || (+d === +range.start && d.getDate() < 20)) {
          months += '<span style="grid-column:' + (week + 1) + '">' + (d.getMonth() + 1) + "월</span>";
        }
        const key = dayKey(d);
        const list = byDay[key];
        const future = d > today ? " is-future" : "";
        const isToday = +d === +today ? " is-today" : "";
        if (!list) {
          html += '<span class="cell lv-0' + future + isToday + '" data-key="' + key + '" style="--w:' + week + '"></span>';
          continue;
        }
        const level = Math.min(list.length, 4);
        const href = list.length === 1 ? list[0].u : "#m-" + key.slice(0, 7);
        html += '<a class="cell lv-' + level + ' kind-' + list[0].k + isToday + '" href="' + href + '" data-key="' + key +
          '" style="--w:' + week + '" aria-label="' + key + " 글 " + list.length + "개: " +
          escapeHtml(list.map(function (p) { return p.t; }).join(", ")) + '"></a>';
      }
      grid.style.setProperty("--weeks", week + 1);
      monthsRow.style.setProperty("--weeks", week + 1);
      grid.innerHTML = html;
      monthsRow.innerHTML = months;
      grid.classList.remove("is-in");
      void grid.offsetWidth;
      grid.classList.add("is-in");

      const s = streaks(range.start, range.end < today ? range.end : today);
      stats.innerHTML = [
        ["글", s.count, "fa-pen-nib"],
        ["활동한 날", s.active, "fa-calendar-check"],
        ["최장 연속", s.best + "일", "fa-fire"],
        ["현재 연속", s.cur + "일", "fa-bolt"]
      ].map(function (x) {
        return '<div class="heat-stat"><i class="fas ' + x[2] + '" aria-hidden="true"></i><strong>' + x[1] +
          "</strong><span>" + x[0] + "</span></div>";
      }).join("");

      fit();
      scroller.scrollLeft = scroller.scrollWidth;
    }

    // Size cells so the whole range fits the card; narrow screens scroll instead
    function fit() {
      const weeks = +grid.style.getPropertyValue("--weeks") || 53;
      const gap = 3;
      const avail = scroller.clientWidth - 8 - box.querySelector(".heat-weekdays").offsetWidth - gap;
      const cell = Math.max(9, Math.min(16, Math.floor(avail / weeks) - gap));
      box.style.setProperty("--gap", gap + "px");
      box.style.setProperty("--cell", cell + "px");
    }
    let resizeTimer = null;
    window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(fit, 150); });

    rangesEl.addEventListener("click", function (e) {
      const b = e.target.closest(".heat-range");
      if (!b) return;
      render(ranges.filter(function (r) { return r.id === b.dataset.range; })[0]);
    });

    // Tooltip
    const tip = document.createElement("div");
    tip.className = "heat-tip";
    tip.setAttribute("aria-hidden", "true");
    document.body.appendChild(tip);
    function showTip(cell) {
      const key = cell.dataset.key;
      if (!key) return;
      const list = byDay[key] || [];
      const d = parseDay(key);
      tip.innerHTML = '<p class="heat-tip-date">' + d.getFullYear() + ". " + (d.getMonth() + 1) + ". " + d.getDate() +
        " (" + "일월화수목금토"[d.getDay()] + ")</p>" +
        (list.length
          ? "<ul>" + list.slice(0, 4).map(function (p) {
              return '<li><i class="kind-dot kind-' + p.k + '"></i>' + escapeHtml(p.t) + "</li>";
            }).join("") + (list.length > 4 ? "<li>+" + (list.length - 4) + "</li>" : "") + "</ul>"
          : '<p class="heat-tip-empty">글 없음</p>');
      const r = cell.getBoundingClientRect();
      tip.classList.add("is-shown");
      const w = tip.offsetWidth, h = tip.offsetHeight;
      const x = Math.min(Math.max(r.left + r.width / 2 - w / 2, 8), window.innerWidth - w - 8);
      const y = r.top - h - 10 < 8 ? r.bottom + 10 : r.top - h - 10;
      tip.style.transform = "translate(" + x + "px," + y + "px)";
    }
    function hideTip() { tip.classList.remove("is-shown"); }
    grid.addEventListener("pointerover", function (e) {
      const c = e.target.closest(".cell[data-key]");
      if (c) showTip(c);
    });
    grid.addEventListener("pointerleave", hideTip);
    grid.addEventListener("focusin", function (e) {
      const c = e.target.closest(".cell[data-key]");
      if (c) showTip(c);
    });
    grid.addEventListener("focusout", hideTip);
    window.addEventListener("scroll", hideTip, { passive: true });
    scroller.addEventListener("scroll", hideTip, { passive: true });

    render(ranges[0]);
  }

  /* --- Newsletters: month calendar ---------------------------------------- */

  function initNewsCalendar() {
    const view = document.querySelector(".nl-view");
    const posts = readJson("news-data");
    if (!view || !posts || !posts.length) return;

    const byDay = groupByDay(posts);
    const cal = view.querySelector(".cal");
    const sw = view.querySelector(".nl-switch");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    function ym(d) { return d.getFullYear() * 12 + d.getMonth(); }
    const dates = posts.map(function (p) { return parseDay(p.d); });
    const min = Math.min.apply(null, dates.map(ym));
    const latest = Math.max.apply(null, dates.map(ym));
    const max = Math.max(latest, ym(today));
    let month = latest;
    const fromHash = location.hash.match(/^#(\d{4})-(\d{2})$/);
    if (fromHash) {
      const h = +fromHash[1] * 12 + +fromHash[2] - 1;
      if (h >= min && h <= max) month = h;
    }

    cal.innerHTML =
      '<div class="cal-head">' +
        '<button type="button" class="cal-nav" data-step="-1" aria-label="이전 달"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>' +
        '<h2 class="cal-title" aria-live="polite"></h2>' +
        '<button type="button" class="cal-nav" data-step="1" aria-label="다음 달"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>' +
        '<button type="button" class="cal-today">최신</button>' +
      "</div>" +
      '<div class="cal-week" aria-hidden="true"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>' +
      '<div class="cal-grid"></div>' +
      '<div class="cal-preview" aria-live="polite"></div>';
    const title = cal.querySelector(".cal-title");
    const grid = cal.querySelector(".cal-grid");
    const preview = cal.querySelector(".cal-preview");
    const prev = cal.querySelector('[data-step="-1"]');
    const next = cal.querySelector('[data-step="1"]');

    function showPreview(list) {
      if (!list || !list.length) {
        preview.innerHTML = '<p class="cal-preview-empty">이 달에는 뉴스레터가 없어요.</p>';
        return;
      }
      const p = list[0];
      const d = parseDay(p.d);
      preview.innerHTML =
        '<a class="cal-preview-card" href="' + p.u + '">' +
          '<span class="cal-preview-date">' + (d.getMonth() + 1) + "월 " + d.getDate() + "일 " +
            "일월화수목금토"[d.getDay()] + "요일" + (list.length > 1 ? " · " + list.length + "개" : "") + "</span>" +
          '<strong class="cal-preview-title">' + escapeHtml(p.t) + "</strong>" +
          '<span class="cal-preview-text">' + escapeHtml(p.e) + "</span>" +
          '<span class="cal-preview-more">읽기 <i class="fas fa-arrow-right" aria-hidden="true"></i></span>' +
        "</a>";
    }

    function render(dir) {
      const y = Math.floor(month / 12), m = month % 12;
      const first = new Date(y, m, 1);
      const days = new Date(y, m + 1, 0).getDate();
      const lead = first.getDay();
      const cells = Math.ceil((lead + days) / 7) * 7;
      let html = "", monthPosts = [];
      for (let i = 0; i < cells; i++) {
        const day = i - lead + 1;
        if (day < 1 || day > days) { html += '<span class="cal-day is-out" aria-hidden="true"></span>'; continue; }
        const d = new Date(y, m, day);
        const key = dayKey(d);
        const list = byDay[key];
        const cls = "cal-day" + (d.getDay() === 0 ? " is-sun" : d.getDay() === 6 ? " is-sat" : "") +
          (+d === +today ? " is-today" : "") + (d > today ? " is-future" : "");
        const num = '<span class="cal-num">' + day + "</span>";
        if (!list) { html += '<span class="' + cls + '">' + num + "</span>"; continue; }
        monthPosts = list.concat(monthPosts);
        html += '<a class="' + cls + ' has-post" href="' + list[0].u + '" data-key="' + key + '" style="--n:' + i + '" ' +
          'aria-label="' + (m + 1) + "월 " + day + "일: " + escapeHtml(list[0].t) + '">' + num +
          '<span class="cal-post">' + escapeHtml(list[0].t) + "</span>" +
          (list.length > 1 ? '<span class="cal-more">+' + (list.length - 1) + "</span>" : "") + "</a>";
      }
      grid.innerHTML = html;
      title.innerHTML = y + "년 " + (m + 1) + '월 <span class="cal-count">' + monthPosts.length + "개</span>";
      prev.disabled = month <= min;
      next.disabled = month >= max;
      showPreview(monthPosts.length ? [monthPosts[0]] : null);

      grid.classList.remove("slide-left", "slide-right", "is-in");
      void grid.offsetWidth;
      grid.classList.add(dir > 0 ? "slide-left" : dir < 0 ? "slide-right" : "is-in");
    }

    function go(step) {
      const to = Math.min(Math.max(month + step, min), max);
      if (to === month) return;
      month = to;
      render(step);
      history.replaceState(null, "", "#" + Math.floor(month / 12) + "-" + String(month % 12 + 1).padStart(2, "0"));
    }

    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    cal.querySelector(".cal-today").addEventListener("click", function () { go(latest - month); });

    grid.addEventListener("pointerover", function (e) {
      const c = e.target.closest(".has-post");
      if (c) showPreview(byDay[c.dataset.key]);
    });
    grid.addEventListener("focusin", function (e) {
      const c = e.target.closest(".has-post");
      if (c) showPreview(byDay[c.dataset.key]);
    });
    cal.addEventListener("keydown", function (e) {
      if (e.key === "PageUp") { e.preventDefault(); go(-1); }
      else if (e.key === "PageDown") { e.preventDefault(); go(1); }
    });

    // Swipe between months on touch screens
    let sx = null, sy = null;
    grid.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    grid.addEventListener("touchend", function (e) {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    }, { passive: true });

    function setView(v) {
      view.dataset.view = v;
      sw.querySelectorAll(".nl-switch-btn").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.view === v));
      });
      store("newsView", v === "calendar" ? null : v);
    }
    sw.addEventListener("click", function (e) {
      const b = e.target.closest(".nl-switch-btn");
      if (b) setView(b.dataset.view);
    });

    sw.hidden = false;
    cal.hidden = false;
    setView(read("newsView") === "list" ? "list" : "calendar");
    render(0);
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
    initHeroLift();
    initReadProgress();
    initResume();
    initCallouts();
    initToc();
    initHeadingAnchors();
    initMermaid();
    initCodeBlocks();
    initTables();
    initFigures();
    initLightbox();
    initPerfProbe();
    initHeatmap();
    initNewsCalendar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
