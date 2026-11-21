// Home hero (markup in _includes/hero.html): the newsletter's keywords, day by day, fill the screen
// as a wall, with the site's own posts among them by title. Wherever the pointer is, a lens brings
// the words to full ink and lights the one under it in the accent; every keyword is a link to the item
// it came from. On load a ring of ink goes out from the wordmark's ␣ across the wall, and the space
// bar (or a click on that ␣) sends another. Scrolling pulls "Generic" and "Space" apart.
//
// The wall is three copies of the same text laid out identically, so they line up to the pixel:
//   base  dim words, the links; the only layer that takes the pointer
//   ring  the words in full ink, seen only inside the ring as it goes out
//   ink   the words in full ink and colour, seen through the lens: a round window that moves while
//         the ink inside moves the other way, so the lens costs two transforms a frame and no repaint
// Motion is off with prefers-reduced-motion and in 가벼운 모드 (data-perf="lite"), except the lens
// following the pointer, which only ever moves when the reader does.

(function () {
  "use strict";

  // The navbar's wordmark waits until the hero's has gone (custom.css hides it on the home page
  // until .hero-passed); "gone" counts from the bottom of the floating bar, so the two swap as the big
  // one slides under it. First, before anything below can bail out, so it always comes back. (If this
  // file can't load at all, the script tag's onerror sets .hero-passed.) A batch of entries is read
  // from its last one, which is where the title is now.
  const heroTitle = document.querySelector("#hero .hero-title");
  if (heroTitle && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      document.documentElement.classList.toggle("hero-passed", !entries[entries.length - 1].isIntersecting);
    }, { rootMargin: "-72px 0px 0px 0px" }).observe(heroTitle);
  } else {
    document.documentElement.classList.add("hero-passed");
  }

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

  // titles come from rendered HTML, so they may hold entities (&amp;, &#8217;)
  const decoder = document.createElement("textarea");
  function decode(s) { decoder.innerHTML = s; return decoder.value; }
  corpus.forEach(function (post) {
    post.h = post.h.map(decode);
    post.a = post.a || [];
  });

  /* --- Build the three layers ------------------------------------------------ */

  // On the base layer each keyword is a link (kept out of the tab order: the wall is a picture for the
  // eye, and the lists below the hero hold the same posts); on the other two, spans.
  // Every one carries its place (data-r), so the lens can find the twin of the one under the pointer.
  function piece(links, cls, text, href, r) {
    const el = document.createElement(links ? "a" : "span");
    el.className = cls;
    el.textContent = text;
    el.dataset.r = r;
    if (links) {
      el.href = href;
      el.tabIndex = -1;
    }
    return el;
  }
  // `count` posts in order, their keywords one comma-separated run (no dates: the words are the
  // picture); past the end of the corpus it starts again from the newest
  function buildText(links, count) {
    const text = document.createElement("div");
    text.className = "wall-text";
    let r = 0;
    for (let k = 0; k < count; k++) {
      const post = corpus[k % corpus.length];
      const g = document.createElement("span");
      g.className = "w-group k-" + post.k;
      post.h.forEach(function (h, n) {
        if (n) g.appendChild(document.createTextNode(" "));
        const id = post.a[n];
        g.appendChild(piece(links, "w-run", h, post.u + (id ? "#" + encodeURIComponent(id) : ""), r++));
        const sep = document.createElement("span");
        sep.className = "w-sep";
        sep.textContent = ",";
        g.appendChild(sep);
      });
      text.appendChild(g);
      text.appendChild(document.createTextNode(" "));
    }
    return text;
  }

  const layers = {};
  let lens = null, inkPieces = [], count = 0;
  function layer(name, count) {
    const el = document.createElement("div");
    el.className = "wall-layer wall-" + name;
    el.appendChild(buildText(name === "base", count));
    layers[name] = el;
    return el;
  }
  // The base layer first, with every post; once it is laid out, keep only what fills about two
  // screens (the drift never shows more), or repeat the corpus if it is short of one, and build the
  // ring to match. The lens's ink comes a moment later (ensureInk), so the first paint has two layers.
  function build() {
    wall.textContent = "";
    wall.appendChild(layer("base", corpus.length));
  }
  function fit() {
    const text = layers.base.firstChild, H0 = wall.clientHeight, want = H0 * 1.9;
    count = corpus.length;
    if (text.scrollHeight < H0 * 1.2) {
      count = Math.min(Math.ceil(corpus.length * H0 * 1.2 / Math.max(text.scrollHeight, 1)), corpus.length * 4);
    } else {
      const groups = text.children;
      for (let k = 0; k < groups.length; k++) {
        if (groups[k].offsetTop > want) { count = k; break; }
      }
    }
    if (count !== corpus.length) { const old = layers.base; wall.replaceChild(layer("base", count), old); }
    wall.appendChild(layer("ring", count));
    lens = document.createElement("div");
    lens.className = "wall-lens";
    wall.appendChild(lens);
  }
  function ensureInk() {
    if (layers.ink) return;
    lens.appendChild(layer("ink", count));
    inkPieces = layers.ink.querySelectorAll("[data-r]");
    sizeInk();
    if (hotR !== null) setHot(hotR);
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
    R = Math.round(Math.min(Math.max(W * 0.11, 88), 180));
    lens.style.width = lens.style.height = 2 * R + "px";
    sizeInk();
    const overflow = layers.base.firstChild.scrollHeight - H;
    wall.style.setProperty("--drift", -Math.max(overflow, 0) + "px");
    // about 9px a second, so it reads as a slow feed rather than a scroll
    wall.style.setProperty("--drift-dur", Math.max(overflow / 9, 30).toFixed(0) + "s");
    wall.classList.toggle("is-drifting", overflow > 40);
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
    if (ringing) return;
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

  // the keyword (or title) under the pointer: its twin inside the lens takes the accent
  let hot = null, hotR = null;
  function setHot(r) {
    hotR = r;
    const next = r !== null ? inkPieces[r] || null : null;
    if (next === hot) return;
    if (hot) hot.classList.remove("is-hot");
    hot = next;
    if (hot) hot.classList.add("is-hot");
  }
  function hotFrom(target) {
    const el = target && target.closest ? target.closest(".wall-base [data-r]") : null;
    setHot(el ? +el.dataset.r : null);
  }

  /* --- The ring: ink goes out from the wordmark's ␣ across the wall -------------- */

  function origin() {
    const sp = title.querySelector(".wordmark-space");
    const a = sp.getBoundingClientRect(), b = wall.getBoundingClientRect();
    return [a.left + a.width / 2 - b.left, a.bottom - b.top];
  }
  let ringRaf = 0, ringing = false;
  const BAND = 150;
  function ring(hold) {
    const el = layers.ring;
    if (calm() || !inView) return;
    cancelAnimationFrame(ringRaf);
    const o = origin();
    const far = Math.hypot(Math.max(o[0], W - o[0]), Math.max(o[1], H - o[1])) + BAND;
    const t0 = performance.now() + (hold || 0), dur = 1900;
    const at = o[0].toFixed(0) + "px " + o[1].toFixed(0) + "px";
    ringing = true;
    showLens(false);
    function step(now) {
      const p = Math.min(Math.max((now - t0) / dur, 0), 1);
      // spreads at a nearly even pace (a wave, not a flash), easing off at the far corners and fading
      const r = (1 - Math.pow(1 - p, 1.7)) * far;
      const m = "radial-gradient(circle at " + at + ", transparent " + (r - BAND).toFixed(0) + "px, #000 " +
        r.toFixed(0) + "px, transparent " + (r + BAND * 0.45).toFixed(0) + "px)";
      el.style.webkitMaskImage = m;
      el.style.maskImage = m;
      el.style.opacity = (1 - p * p).toFixed(3);
      el.style.visibility = p < 1 ? "visible" : "";
      if (p < 1) ringRaf = requestAnimationFrame(step);
      else { ringing = false; kick(); }
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
    ring();
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
      wall.classList.add("is-ready");
      onScroll();
      ring(500);
      // the ink, once the wall has painted: the hold before the ring is still, so it costs nothing seen
      requestAnimationFrame(function () { setTimeout(ensureInk, 60); });
      lx = wander(performance.now())[0];
      ly = wander(performance.now())[1];
      kick();
    });

    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      mouseIn = true;
      pointTo(e.clientX, e.clientY);
      hotFrom(e.target);
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
        onScroll();
      }, 150);
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[entries.length - 1].isIntersecting;
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
