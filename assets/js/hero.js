// Home hero (markup in _includes/hero.html): a wall of the site's latest headlines, with a
// code editor's "show invisibles" as the way to look at it. Wherever the pointer is, a lens brings
// the words to full ink and draws each space as ␣. On load every space on the wall shows for a
// moment and they ripple away from the wordmark's own ␣; the space bar (or a click on that ␣) does it
// again. Scrolling pulls "Generic" and "Space" apart. Clicking a headline opens the post it is from.
//
// The wall is three copies of the same text laid out identically, so they line up to the pixel:
//   base   dim words; the only layer that takes the pointer
//   marks  nothing but the ␣ and ¶ marks (the opening ripple masks it away)
//   ink    full-colour words and marks, seen through the lens: a round window that moves while the
//          ink inside moves the other way, so the lens costs two transforms a frame and no repaint
// Motion is off with prefers-reduced-motion and in 가벼운 모드 (data-perf="lite"), except the lens
// following the pointer, which only ever moves when the reader does.

(function () {
  "use strict";

  const hero = document.getElementById("hero");
  const wall = hero && hero.querySelector(".hero-wall");
  const title = hero && hero.querySelector(".hero-title");
  const dataEl = document.getElementById("hero-corpus");
  if (!hero || !wall || !title || !dataEl) return;

  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  function calm() { return reduce.matches || root.getAttribute("data-perf") === "lite"; }

  let corpus;
  try { corpus = JSON.parse(dataEl.textContent); } catch (e) { return; }
  if (!corpus.length) return;

  // headlines come from rendered HTML, so they may hold entities (&amp;, &#8217;)
  const decoder = document.createElement("textarea");
  function decode(s) { decoder.innerHTML = s; return decoder.value; }
  corpus.forEach(function (post) { post.h = post.h.map(decode); });

  /* --- Build the three layers ------------------------------------------------ */

  // a space: plain text on the base layer, an <i> that draws ␣ on the others (same width either way)
  function space(marked) {
    if (!marked) return document.createTextNode(" ");
    const i = document.createElement("i");
    i.textContent = " ";
    return i;
  }
  function words(parent, text, marked) {
    text.split(/\s+/).filter(Boolean).forEach(function (w, n) {
      if (n) parent.appendChild(space(marked));
      parent.appendChild(document.createTextNode(w));
    });
  }
  // `count` posts in order, each its date, then each headline followed by a pilcrow (as an editor
  // marks line ends); past the end of the corpus it starts again from the newest
  function buildText(marked, count) {
    const text = document.createElement("div");
    text.className = "wall-text";
    for (let k = 0; k < count; k++) {
      const idx = k % corpus.length, post = corpus[idx];
      const g = document.createElement("span");
      g.className = "w-group k-" + post.k;
      g.dataset.i = idx;
      g.dataset.k = k;
      const d = document.createElement("b");
      d.className = "w-date";
      d.textContent = post.d;
      g.appendChild(d);
      post.h.forEach(function (h) {
        g.appendChild(space(marked));
        const run = document.createElement("span");
        run.className = "w-run";
        words(run, h, marked);
        g.appendChild(run);
        g.appendChild(space(marked));
        const pil = document.createElement("span");
        pil.className = "w-pil";
        pil.textContent = "¶";
        g.appendChild(pil);
      });
      text.appendChild(g);
      text.appendChild(space(marked));
    }
    return text;
  }

  const layers = {};
  let lens = null, inkGroups = [], count = 0, eolFlags = [];
  function layer(name, count) {
    const el = document.createElement("div");
    el.className = "wall-layer wall-" + name;
    el.appendChild(buildText(name !== "base", count));
    layers[name] = el;
    return el;
  }
  // The base layer first, with every post; once it is laid out, keep only what fills about two
  // screens (the drift never shows more) and build the marks to match. Less text is less to lay out
  // and paint, which matters most on a phone, where the corpus runs to 4-5 screens. The lens's ink
  // comes a moment later (ensureInk), so the first paint has two layers rather than three.
  function build() {
    wall.textContent = "";
    wall.appendChild(layer("base", corpus.length));
  }
  function fit() {
    const text = layers.base.firstChild, want = wall.clientHeight * 1.9;
    count = corpus.length;
    if (text.scrollHeight < want) {
      count = Math.min(Math.ceil(corpus.length * want / Math.max(text.scrollHeight, 1)), corpus.length * 4);
    } else {
      const groups = text.children;
      for (let k = 0; k < groups.length; k++) {
        if (groups[k].offsetTop > want) { count = k; break; }
      }
    }
    if (count !== corpus.length) { const old = layers.base; wall.replaceChild(layer("base", count), old); }
    wall.appendChild(layer("marks", count));
    lens = document.createElement("div");
    lens.className = "wall-lens";
    wall.appendChild(lens);
  }
  function ensureInk() {
    if (layers.ink) return;
    lens.appendChild(layer("ink", count));
    inkGroups = layers.ink.querySelectorAll(".w-group");
    sizeInk();
    applyEol(layers.ink);
  }
  // the ink inside the lens is laid out at the wall's size, like the other layers
  function sizeInk() {
    if (!layers.ink) return;
    layers.ink.style.width = W + "px";
    layers.ink.style.height = H + "px";
  }

  /* --- Size: enough text to drift through, the lens, the slow drift ---------- */

  let W = 0, H = 0, R = 120;
  function measure() {
    W = wall.clientWidth;
    H = wall.clientHeight;
    R = Math.round(Math.min(Math.max(W * 0.105, 84), 168));
    lens.style.width = lens.style.height = 2 * R + "px";
    sizeInk();
    const overflow = layers.base.firstChild.scrollHeight - H;
    wall.style.setProperty("--drift", -Math.max(overflow, 0) + "px");
    // about 9px a second, so it reads as a slow feed rather than a scroll
    wall.style.setProperty("--drift-dur", Math.max(overflow / 9, 30).toFixed(0) + "s");
    wall.classList.toggle("is-drifting", overflow > 40);
  }

  // a space that ends a line collapses to nothing, and its mark would hang in the margin
  // (the ink is laid out exactly like the marks, so it takes the same flags)
  function hideLineEnds() {
    const ms = layers.marks.querySelectorAll("i");
    // read every box first, then write: toggling as we go would re-lay out the wall each time
    eolFlags = [];
    for (let n = 0; n < ms.length; n++) {
      const rects = ms[n].getClientRects();
      eolFlags.push(rects.length !== 1 || rects[0].width < 1);
    }
    applyEol(layers.marks);
    if (layers.ink) applyEol(layers.ink);
  }
  function applyEol(el) {
    const is = el.querySelectorAll("i");
    for (let n = 0; n < is.length; n++) is[n].classList.toggle("eol", !!eolFlags[n]);
  }

  /* --- The lens --------------------------------------------------------------- */

  let lx = 0, ly = 0, tx = 0, ty = 0;
  let mouseIn = false;      // a mouse over the hero keeps the lens where it is
  let touchAt = -1e9;       // a finger: the lens stays a while after it lifts
  let shown = false;
  let raf = 0, inView = true;
  const IDLE_MS = 3500;

  function placeLens(x, y) {
    const ox = Math.round(x - R), oy = Math.round(y - R);
    lens.style.transform = "translate(" + ox + "px," + oy + "px)";
    if (layers.ink) layers.ink.style.transform = "translate(" + -ox + "px," + -oy + "px)";
  }
  function showLens(on) {
    if (on === shown) return;
    if (on) ensureInk();
    shown = on;
    wall.classList.toggle("has-lens", on);
  }
  // with nobody pointing, the lens wanders the upper part of the wall on a slow Lissajous path
  function wander(now) {
    const t = now / 1000;
    return [W * (0.5 + 0.4 * Math.sin(t * 0.21)), H * (0.33 + 0.24 * Math.sin(t * 0.33 + 1.3))];
  }
  function frame(now) {
    raf = 0;
    if (!inView || document.hidden) return;
    if (rippling) return;
    const idle = !mouseIn && now - touchAt > IDLE_MS;
    if (idle) {
      if (calm()) { showLens(false); return; }
      const p = wander(now);
      tx = p[0]; ty = p[1];
    }
    const k = idle ? 0.035 : 0.22;
    lx += (tx - lx) * k;
    ly += (ty - ly) * k;
    placeLens(lx, ly);
    showLens(true);
    if (idle || Math.abs(tx - lx) > 0.4 || Math.abs(ty - ly) > 0.4) kick();
    // after a touch, start wandering again once the finger has been gone a while
    else if (!mouseIn) wakeAt(touchAt + IDLE_MS - now + 30);
  }
  let wakeT = 0;
  function wakeAt(ms) { clearTimeout(wakeT); wakeT = setTimeout(kick, Math.max(ms, 0)); }
  function kick() { if (!raf && lens) raf = requestAnimationFrame(frame); }

  function pointTo(clientX, clientY) {
    const r = wall.getBoundingClientRect();
    tx = clientX - r.left;
    ty = clientY - r.top;
    if (!shown) { lx = tx; ly = ty; }
    kick();
  }

  // the post under the pointer: underline its headlines inside the lens
  let hot = null;
  function setHot(el) {
    const g = el && el.closest ? el.closest(".wall-base .w-group") : null;
    const next = g ? inkGroups[+g.dataset.k] || null : null;
    if (next === hot) return;
    if (hot) hot.classList.remove("is-hot");
    hot = next;
    if (hot) hot.classList.add("is-hot");
  }

  /* --- The ripple: every space shows, then they go, from the wordmark's ␣ out ---- */

  function origin() {
    const sp = title.querySelector(".wordmark-space");
    const a = sp.getBoundingClientRect(), b = wall.getBoundingClientRect();
    return [a.left + a.width / 2 - b.left, a.bottom - b.top];
  }
  let rippleRaf = 0, rippling = false;
  function ripple(hold) {
    const marks = layers.marks;
    if (calm() || !inView) { marks.style.display = "none"; return; }
    cancelAnimationFrame(rippleRaf);
    const o = origin();
    const far = Math.hypot(Math.max(o[0], W - o[0]), Math.max(o[1], H - o[1])) + 220;
    const t0 = performance.now() + (hold || 0), dur = 1600;
    marks.style.display = "";
    rippling = true;
    showLens(false);
    function step(now) {
      const p = Math.min(Math.max((now - t0) / dur, 0), 1);
      // ease in-out: the wipe gathers speed, then settles at the edges
      const r = (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2) * far;
      const m = "radial-gradient(circle at " + o[0].toFixed(0) + "px " + o[1].toFixed(0) + "px, transparent " +
        r.toFixed(0) + "px, #000 " + (r + 200).toFixed(0) + "px)";
      marks.style.webkitMaskImage = m;
      marks.style.maskImage = m;
      if (p < 1) rippleRaf = requestAnimationFrame(step);
      else { marks.style.display = "none"; rippling = false; kick(); }
    }
    step(performance.now());
  }

  // the space bar does what it always does (scroll on), and the ␣ goes down like a key
  let pressT = 0;
  function press() {
    hero.classList.remove("is-pressed");
    void hero.offsetWidth;
    hero.classList.add("is-pressed");
    clearTimeout(pressT);
    pressT = setTimeout(function () { hero.classList.remove("is-pressed"); }, 400);
    ripple();
  }

  /* --- Scroll: the two words move apart as the hero leaves -------------------- */

  let scrollRaf = 0;
  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(function () {
      scrollRaf = 0;
      const p = calm() ? 0 : Math.min(Math.max(window.scrollY / (hero.offsetHeight * 0.7), 0), 1);
      title.style.setProperty("--split", p.toFixed(4));
      if (wall.classList.contains("is-ready")) wall.style.opacity = String(1 - p * 0.75);
    });
  }

  /* --- Start ------------------------------------------------------------------- */

  function start() {
    build();
    // force layout so the font subsets the wall needs start loading, then wait for them
    void wall.offsetHeight;
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fonts.then(function () {
      fit();
      measure();
      hideLineEnds();
      wall.classList.add("is-ready");
      onScroll();
      if (calm()) layers.marks.style.display = "none";
      else ripple(900);
      // the ink, once the wall has painted: the hold before the ripple is still, so it costs nothing seen
      requestAnimationFrame(function () { setTimeout(ensureInk, 60); });
      lx = wander(performance.now())[0];
      ly = wander(performance.now())[1];
      kick();
    });

    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      mouseIn = true;
      pointTo(e.clientX, e.clientY);
      setHot(e.target);
    });
    hero.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "touch") return;
      mouseIn = false;
      setHot(null);
      kick();
    });
    // touch: the lens follows the finger, without getting in the way of scrolling
    function onTouch(e) {
      const t = e.touches[0];
      if (!t) return;
      touchAt = performance.now();
      pointTo(t.clientX, t.clientY);
    }
    hero.addEventListener("touchstart", onTouch, { passive: true });
    hero.addEventListener("touchmove", onTouch, { passive: true });
    hero.addEventListener("touchend", function () { touchAt = performance.now(); kick(); }, { passive: true });

    wall.addEventListener("click", function (e) {
      const g = e.target.closest(".w-group");
      if (!g) return;
      const url = corpus[+g.dataset.i].u;
      if (e.metaKey || e.ctrlKey || e.shiftKey) window.open(url, "_blank", "noopener");
      else window.location.href = url;
    });

    title.querySelector(".wordmark-space").addEventListener("click", press);
    document.addEventListener("keydown", function (e) {
      if (e.key !== " " || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !inView) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A|SUMMARY|LABEL)$/.test(t.tagName))) return;
      press();
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    let resizeT = 0;
    window.addEventListener("resize", function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () {
        if (!wall.classList.contains("is-ready")) return;
        measure();
        hideLineEnds();
        onScroll();
      }, 150);
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        wall.classList.toggle("is-paused", !inView);
        if (inView) kick();
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) kick(); });
    // 가벼운 모드 switched on or off in the settings panel
    new MutationObserver(function () { onScroll(); kick(); }).observe(root, { attributes: true, attributeFilter: ["data-perf"] });
  }

  start();
})();
