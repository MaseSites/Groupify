/* Groupify landing — progressive enhancement */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==================================================================
     Cinematic intro — world map → Zürich → basketball → swish → hero
     ================================================================== */
  var intro = document.querySelector("[data-intro]");
  var INTRO_KEY = "gfy-intro-seen-craft-shot-v3";

  function introDone() {
    root.classList.add("intro-done");
    document.body.classList.remove("intro-lock");
  }

  function seenThisSession() {
    try { return sessionStorage.getItem(INTRO_KEY) === "1"; } catch (e) { return false; }
  }
  function markSeen() {
    try { sessionStorage.setItem(INTRO_KEY, "1"); } catch (e) { /* private mode */ }
  }

  if (!intro || reduced || seenThisSession()) {
    if (intro) intro.remove();
    introDone();
  } else {
    runIntro();
  }

  setupGsapScroll();

  function runIntro() {
    var timers = [];
    var timeline = null;
    var finished = false;
    document.body.classList.add("has-intro", "intro-lock");
    window.scrollTo(0, 0);

    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

    function finish() {
      if (finished) return;
      finished = true;
      if (timeline) timeline.kill();
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", aimZurich);
      markSeen();
      intro.classList.add("out");
      introDone();
      setTimeout(function () { intro.remove(); }, 1000);
    }

    var skip = intro.querySelector("[data-intro-skip]");
    if (skip) skip.addEventListener("click", finish);

    /* ---- real world map (assets/world.svg, amCharts Mercator) --------
       Injected at runtime so page CSS can style it and pins can be
       placed from real lat/lon via the map's calibration box. */
    var world = intro.querySelector("[data-intro-world]");
    var MAP = { url: "assets/world.svg", L: -169.6, R: 190.25, T: 83.68, B: -55.55 };
    var CITIES = [
      { n: "New York",  lat:  40.71, lon:  -74.01, c: "var(--orange)", d: ".05s" },
      { n: "London",    lat:  51.51, lon:   -0.13, c: "var(--green)",  d: ".2s" },
      { n: "Tokyo",     lat:  35.68, lon:  139.69, c: "var(--teal)",   d: ".35s" },
      { n: "São Paulo", lat: -23.55, lon:  -46.63, c: "var(--yellow)", d: ".5s" },
      { n: "Cape Town", lat: -33.92, lon:   18.42, c: "var(--purple)", d: ".65s" },
      { n: "Sydney",    lat: -33.87, lon:  151.21, c: "var(--red)",    d: ".8s" },
      { n: "Zürich",    lat:  47.37, lon:    8.54, c: "var(--primary)", d: "1s", zh: true }
    ];
    function mercY(lat) { return Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)); }

    var vb = null, zhPin = null;
    function aimZurich() {
      if (!world || !vb || !zhPin) return;
      var vw = window.innerWidth, vh = window.innerHeight;
      var s = Math.max(vw / vb.width, vh / vb.height);
      var ox = ((zhPin.x - vb.x) * s - (vb.width * s - vw) / 2) / vw * 100;
      var oy = ((zhPin.y - vb.y) * s - (vb.height * s - vh) / 2) / vh * 100;
      world.style.transformOrigin = ox.toFixed(2) + "% " + oy.toFixed(2) + "%";
    }
    window.addEventListener("resize", aimZurich);

    if (world && typeof fetch === "function") {
      fetch(MAP.url).then(function (r) { return r.text(); }).then(function (txt) {
        if (finished) return;
        world.insertAdjacentHTML("afterbegin", txt.slice(txt.indexOf("<svg")));
        var svg = world.querySelector("svg");
        var bb = svg.getBBox();
        vb = bb;
        svg.setAttribute("viewBox", bb.x + " " + bb.y + " " + bb.width + " " + bb.height);
        svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        var NS = "http://www.w3.org/2000/svg";

        /* torn-paper city tag — same craft language as the paper court:
           jagged cream scrap, ink outline, offset shadow, tape strip,
           hand-written name, colour dot pinned on the exact city */
        function tornPoints(w, h, seed, dx, dy) {
          dx = dx || 0; dy = dy || 0;
          var pts = [], i = 0, t;
          function jag(n) { return Math.sin(seed * 12.9898 + n * 78.233) * 2.6; }
          for (t = -w / 2; t <= w / 2; t += w / 6) pts.push([t + jag(i), -h + jag(++i)]);   // top
          for (t = -h; t <= 0; t += h / 3) pts.push([w / 2 + jag(++i), t + jag(++i)]);      // right
          for (t = w / 2; t >= -w / 2; t -= w / 6) pts.push([t + jag(++i), jag(++i)]);      // bottom
          for (t = 0; t >= -h; t -= h / 3) pts.push([-w / 2 + jag(++i), t + jag(++i)]);     // left
          return pts.map(function (p) { return (p[0] + dx).toFixed(1) + "," + (p[1] + dy).toFixed(1); }).join(" ");
        }
        function el(tag, cls, attrs) {
          var n = document.createElementNS(NS, tag);
          if (cls) n.setAttribute("class", cls);
          for (var k in attrs) n.setAttribute(k, attrs[k]);
          return n;
        }

        var layer = document.createElementNS(NS, "g");
        CITIES.forEach(function (ct, idx) {
          var x = bb.x + (ct.lon - MAP.L) / (MAP.R - MAP.L) * bb.width;
          var y = bb.y + (mercY(MAP.T) - mercY(ct.lat)) / (mercY(MAP.T) - mercY(MAP.B)) * bb.height;
          if (ct.zh) zhPin = { x: x, y: y };

          var w = ct.zh ? 96 : 80, h = ct.zh ? 30 : 24, lift = 14;
          var g = el("g", "mpin ppin" + (ct.zh ? " mpin--zh" : ""), {
            transform: "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")"
          });
          g.style.setProperty("--c", ct.c);
          g.style.setProperty("--d", ct.d);

          /* inner group carries the craft tilt as an SVG attribute and the
             pop animation: its local origin already sits on the city, so
             the CSS scale pops in place instead of sliding across the map */
          var tilt = el("g", "ppin__in", { transform: "rotate(" + ((idx % 2 ? 1 : -1) * (3 + idx % 3 * 2)) + ")" });

          tilt.appendChild(el("polygon", "ppin__shadow", { points: tornPoints(w, h, idx + 1, 3, 4 - lift) }));
          tilt.appendChild(el("polygon", "ppin__paper",  { points: tornPoints(w, h, idx + 1, 0, -lift) }));
          tilt.appendChild(el("rect", "ppin__tape", {
            x: -13, y: (-h - lift - 5), width: 26, height: 9,
            transform: "rotate(-7 0 " + (-h - lift) + ")"
          }));
          tilt.appendChild(el("line", "ppin__leader", { x1: 0, y1: -lift + 2, x2: 0, y2: -3 }));
          var name = el("text", "ppin__name", { y: (-lift - h / 2 + (ct.zh ? 7 : 6)) });
          name.textContent = ct.n;
          tilt.appendChild(name);

          g.appendChild(el("circle", "mpin__pulse", { r: ct.zh ? 14 : 10 }));
          g.appendChild(tilt);
          g.appendChild(el("circle", "mpin__dot", { r: ct.zh ? 6.5 : 5 }));
          layer.appendChild(g);
        });
        svg.appendChild(layer);
        aimZurich();
      }).catch(function () { /* map is decorative — intro still runs */ });
    }

    /* confetti burst in category colours, from the hoop area */
    function burst() {
      var box = intro.querySelector("[data-intro-confetti]");
      if (!box || typeof Element.prototype.animate !== "function") return;
      var colors = ["#e8641e", "#f2ce1b", "#2f8f5b", "#3a34d6", "#6a34d6", "#e23b34", "#1fa79f", "#f6f1e7"];
      for (var i = 0; i < 30; i++) {
        var p = document.createElement("i");
        p.style.setProperty("--c", colors[i % colors.length]);
        box.appendChild(p);
        var a = Math.random() * Math.PI * 2;
        var d = 90 + Math.random() * 260;
        var x = Math.cos(a) * d, y = Math.sin(a) * d - 60;
        p.animate([
          { opacity: 1, transform: "translate(0,0) rotate(0) scale(1)" },
          { opacity: 1, offset: 0.7 },
          { opacity: 0, transform: "translate(" + x + "px," + (y + 140) + "px) rotate(" + (Math.random() * 540 - 270) + "deg) scale(.6)" }
        ], { duration: 1100 + Math.random() * 500, easing: "cubic-bezier(.15,.6,.3,1)", fill: "forwards" });
      }
    }

    function playFallbackIntro() {
      at(150, function () { intro.classList.add("act"); });
      at(1900, function () { intro.classList.add("zoom"); });
      at(3000, function () { intro.classList.add("scene-on"); });
      at(4250, function () { intro.classList.add("swish"); burst(); });
      at(5350, function () { intro.classList.add("motto-on"); });
      at(7000, finish);
    }

    function getCenter(el) {
      var r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    function moveBallToHand(ball, hand) {
      if (!ball || !hand) return { x: 0, y: 0 };
      var b = getCenter(ball);
      var h = getCenter(hand);
      return { x: h.x - b.x, y: h.y - b.y };
    }

    function getShotVector(ball, rim) {
      if (!ball || !rim) return { x: window.innerWidth * 0.48, y: -window.innerHeight * 0.34 };
      var b = ball.getBoundingClientRect();
      var r = rim.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - (b.left + b.width / 2),
        y: r.top + r.height / 2 - (b.top + b.height / 2)
      };
    }

    function playGsapIntro() {
      if (!window.gsap) return false;
      var gsap = window.gsap;
      intro.classList.add("gsap-on");
      if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

      var q = gsap.utils.selector(intro);
      var worldEl = q("[data-intro-world]")[0];
      var copy = q(".intro__copy");
      var play = q(".intro__play");
      var court = q("[data-intro-court]");
      var player = q("[data-intro-player]");
      var arm = q("[data-intro-arm]");
      var releaseArm = q("[data-intro-release]");
      var releaseHand = q("[data-intro-release-hand]");
      var hand = releaseHand.length ? releaseHand : q("[data-intro-hand]");
      var hoop = q("[data-intro-hoop]");
      var ball = q("[data-intro-ball]");
      var trailDots = q("[data-intro-trail]");
      var rim = q("[data-intro-rim]")[0];
      var net = q("[data-intro-net]");
      var shotArc = q("[data-intro-arc]");
      var shotArcPaths = q("[data-intro-arc] path");
      var friends = q("[data-intro-friends]");
      var rimBurst = q("[data-intro-burst] span");
      var playKicker = q(".intro__play-kicker");
      var swish = q(".intro__swish");
      var motto = q("[data-intro-motto]");
      var tagline = q("[data-intro-tagline]");
      var title = q(".intro__title");

      function targets() {
        var out = [];
        Array.prototype.forEach.call(arguments, function (item) {
          if (!item) return;
          if (typeof item !== "string" && typeof item.length === "number" && !item.nodeType) {
            Array.prototype.forEach.call(item, function (el) { if (el) out.push(el); });
          } else {
            out.push(item);
          }
        });
        return out;
      }

      gsap.set(targets(copy, play, court, player, hoop, ball, trailDots, shotArc, friends, releaseArm, playKicker, swish, motto, tagline, title), { autoAlpha: 0 });
      gsap.set(worldEl, { autoAlpha: 0, scale: 1, filter: "blur(0px)" });
      gsap.set(court, { x: -22, y: 32, rotation: -9, scale: 0.9, transformOrigin: "52% 65%" });
      gsap.set(player, { y: 34, x: -12, rotation: -9, scale: 0.88, transformOrigin: "50% 100%" });
      gsap.set(arm, { rotation: -52, transformOrigin: "50% 90%" });
      gsap.set(releaseArm, { rotation: -10, transformOrigin: "50% 92%" });
      gsap.set(hoop, { y: 0, rotation: 0, transformOrigin: "50% 15%" });
      gsap.set(ball, { x: 0, y: 0, rotation: 0, scale: 1 });
      gsap.set(trailDots, { x: 0, y: 0, rotation: 0, scale: 0.2 });
      gsap.set(net, { scaleY: 1, transformOrigin: "50% 0%" });
      gsap.set(shotArcPaths, { strokeDashoffset: 1 });
      gsap.set(rimBurst, { autoAlpha: 0, scaleX: 0.1, scaleY: 0.7, transformOrigin: "left center" });

      gsap.set(player, { x: 0, y: 0, rotation: -2, scale: 1 });
      gsap.set(releaseArm, { autoAlpha: 1, rotation: -10 });
      var handOffset = moveBallToHand(ball[0], hand[0] || arm[0]);
      gsap.set(ball, { x: handOffset.x, y: handOffset.y, scale: 0.78 });
      gsap.set(trailDots, { x: handOffset.x, y: handOffset.y, scale: 0.2 });
      var shot = getShotVector(ball[0], rim);
      var ballStart = { x: handOffset.x, y: handOffset.y };
      var ballEnd = { x: ballStart.x + shot.x, y: ballStart.y + shot.y };
      gsap.set(player, { y: 34, x: -12, rotation: -9, scale: 0.88 });
      gsap.set(releaseArm, { autoAlpha: 0, rotation: -10 });
      gsap.set(hoop, { y: -24, rotation: -5 });
      timeline = gsap.timeline({
        defaults: { ease: "power3.out" }
      });

      timeline
        .add(function () { intro.classList.add("act"); }, 0.05)
        .to(worldEl, { autoAlpha: 1, duration: 0.85 }, 0)
        .fromTo(copy, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.75 }, 0.42)
        .to(copy, { autoAlpha: 0, y: -12, duration: 0.45, ease: "power2.inOut" }, 1.8)
        .add(function () { intro.classList.add("zoom"); }, 1.85)
        .to(worldEl, { scale: 6.6, duration: 1.35, ease: "expo.inOut" }, 1.85)
        .to(worldEl, { autoAlpha: 0.16, filter: "blur(5px)", duration: 0.68, ease: "power2.out" }, 3.0)
        .add(function () { intro.classList.add("scene-on"); }, 3.0)
        .set(play, { autoAlpha: 1 }, 3.2)
        .to(court, { autoAlpha: 1, x: 0, y: 0, rotation: -5, scale: 1, duration: 0.64, ease: "power3.out" }, 3.06)
        .to(hoop, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.62, ease: "back.out(1.08)" }, 3.25)
        .to(player, { autoAlpha: 1, x: 0, y: 0, rotation: -2, scale: 1, duration: 0.6, ease: "back.out(1.28)" }, 3.2)
        .fromTo(friends, { autoAlpha: 0, y: 16, rotation: -7, scale: 0.82 }, { autoAlpha: 1, y: 0, rotation: -2, scale: 1, duration: 0.48, ease: "back.out(1.35)" }, 3.34)
        .fromTo(playKicker, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45 }, 3.36)
        .to(releaseArm, { autoAlpha: 1, rotation: -10, duration: 0.16, ease: "power2.out" }, 3.74)
        .to(arm, { autoAlpha: 0.2, duration: 0.16, ease: "power2.out" }, 3.74)
        .to(ball, { autoAlpha: 1, scale: 0.9, duration: 0.26, ease: "back.out(1.3)" }, 3.82)
        .to(ball, { y: ballStart.y + 28, scale: 0.82, duration: 0.14, ease: "power2.in" }, 4.04)
        .to(ball, { y: ballStart.y, scale: 0.9, duration: 0.16, ease: "back.out(2.1)" }, 4.18)
        .to(player, { y: 12, x: -5, rotation: -9, duration: 0.2, ease: "power2.inOut" }, 4.12)
        .to(arm, { rotation: -28, duration: 0.2, ease: "power2.inOut" }, 4.12)
        .to(player, { y: -32, x: 16, rotation: 10, duration: 0.24, ease: "power4.out" }, 4.32)
        .to(arm, { rotation: -116, duration: 0.2, ease: "power4.out" }, 4.34)
        .to(releaseArm, { rotation: -24, duration: 0.18, ease: "power3.out" }, 4.34)
        .to(shotArc, { autoAlpha: 1, duration: 0.08 }, 4.35)
        .to(shotArcPaths, { strokeDashoffset: 0, duration: 0.86, ease: "power2.out", stagger: 0.04 }, 4.36)
        .to(player, { y: 0, x: 0, rotation: -1, duration: 0.48, ease: "elastic.out(1, 0.55)" }, 4.58)
        .to(arm, { rotation: -58, duration: 0.48, ease: "elastic.out(1, 0.55)" }, 4.54)
        .to(releaseArm, { autoAlpha: 0, duration: 0.26, ease: "power2.out" }, 4.82)
        .to(arm, { autoAlpha: 1, duration: 0.28, ease: "power2.out" }, 4.82)
        .to(ball, {
          keyframes: [
            { x: ballStart.x + shot.x * 0.16, y: ballStart.y + shot.y * 0.16 - 130, rotation: 250, scale: 1.08, duration: 0.2, ease: "power4.out" },
            { x: ballStart.x + shot.x * 0.46, y: ballStart.y + shot.y * 0.46 - 235, rotation: 610, scale: 1, duration: 0.3, ease: "power1.inOut" },
            { x: ballStart.x + shot.x * 0.78, y: ballStart.y + shot.y * 0.78 - 128, rotation: 980, scale: 0.82, duration: 0.26, ease: "power1.inOut" },
            { x: ballEnd.x, y: ballEnd.y - 4, rotation: 1280, scale: 0.66, duration: 0.2, ease: "power2.in" },
            { x: ballEnd.x + 4, y: ballEnd.y + 48, rotation: 1380, scale: 0.56, duration: 0.17, ease: "power2.in" }
          ]
        }, 4.38)
        .add(function () { intro.classList.add("swish"); burst(); }, 5.44)
        .to(hoop, { rotation: 5, y: 7, duration: 0.12, ease: "power2.out" }, 5.42)
        .to(hoop, { rotation: 0, y: 0, duration: 0.36, ease: "elastic.out(1, 0.45)" }, 5.54)
        .to(net, { scaleY: 1.26, duration: 0.14, ease: "power2.out" }, 5.4)
        .to(net, { scaleY: 1, duration: 0.42, ease: "elastic.out(1, 0.55)" }, 5.54)
        .to(rimBurst, { autoAlpha: 1, scaleX: 1, duration: 0.14, ease: "power2.out", stagger: 0.025 }, 5.4)
        .to(rimBurst, { autoAlpha: 0, scaleX: 0.25, duration: 0.32, ease: "power2.out", stagger: 0.02 }, 5.6)
        .to(swish, { autoAlpha: 1, scale: 1, rotation: -6, duration: 0.45, ease: "back.out(1.8)" }, 5.45)
        .to(targets(court, player, friends, hoop, ball, trailDots, shotArc, releaseArm, swish, playKicker), { autoAlpha: 0.12, filter: "blur(3px)", duration: 0.55, ease: "power2.out" }, 5.82)
        .fromTo(motto, { autoAlpha: 0, y: 22, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.72, ease: "power3.out" }, 5.82)
        .fromTo(tagline, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 6.16);

      trailDots.forEach(function (dot, idx) {
        var progress = 0.24 + idx * 0.13;
        var lift = Math.sin(progress * Math.PI) * 180;
        timeline
          .to(dot, {
            autoAlpha: Math.max(0.34, 0.72 - idx * 0.12),
            x: ballStart.x + shot.x * progress,
            y: ballStart.y + shot.y * progress - lift,
            scale: Math.max(0.4, 0.88 - idx * 0.1),
            duration: 0.15,
            ease: "power2.out"
          }, 4.48 + idx * 0.055)
          .to(dot, {
            autoAlpha: 0,
            scale: 0.16,
            duration: 0.62,
            ease: "power2.out"
          }, 4.82 + idx * 0.065);
      });

      /* dev helper: #introfreeze=SECONDS pauses the timeline there for
         tuning (no effect otherwise, safe in production) */
      var m = /introfreeze=([\d.]+)/.exec(location.hash);
      if (m) { timeline.seek(parseFloat(m[1]), false).pause(); return true; }

      at(7600, finish);

      return true;
    }

    if (!playGsapIntro()) playFallbackIntro();
  }

  function setupGsapScroll() {
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    var mm = gsap.matchMedia();
    mm.add("(min-width: 901px)", function () {
      gsap.to(".hero__visual", {
        y: 72,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 0.7
        }
      });

      gsap.utils.toArray(".feature__media").forEach(function (media) {
        gsap.fromTo(media,
          { y: 42 },
          {
            y: -24,
            ease: "none",
            scrollTrigger: {
              trigger: media,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.65
            }
          }
        );
      });

      gsap.utils.toArray(".polaroid[data-parallax]").forEach(function (photo) {
        gsap.to(photo, {
          y: -34,
          ease: "none",
          scrollTrigger: {
            trigger: photo,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8
          }
        });
      });

      var how = document.querySelector(".how");
      var howSteps = gsap.utils.toArray(".how .step");
      var howPhone = document.querySelector(".how__phone img");
      if (how && howSteps.length && howPhone) {
        gsap.set(howSteps, { willChange: "transform,opacity" });
        gsap.timeline({
          scrollTrigger: {
            trigger: how,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.8,
            invalidateOnRefresh: true
          }
        })
          .fromTo(howSteps, {
            y: function (i) { return 94 + i * 48; },
            opacity: function (i) { return i === 0 ? 0.92 : 0.58; },
            scale: function (i) { return 0.94 + i * 0.015; }
          }, {
            y: function (i) { return -46 - i * 28; },
            opacity: 1,
            scale: 1,
            stagger: 0.08,
            ease: "none"
          }, 0)
          .fromTo(howPhone, {
            rotation: 4,
            scale: 0.98
          }, {
            rotation: 0,
            scale: 1.045,
            ease: "none"
          }, 0);
      }
    });
  }

  /* ---- Sticky header state ------------------------------------------ */
  var header = document.querySelector("[data-header]");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 10);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile menu -------------------------------------------------- */
  var toggle = document.querySelector("[data-menu-toggle]");
  if (toggle && header) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    header.querySelectorAll(".main-nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        header.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- Hero word rotator -------------------------------------------- */
  var el = document.querySelector("[data-rotate]");
  if (el && !reduced) {
    var words = ["your people", "your events", "your clubs", "your crew"];
    var i = 0;
    setInterval(function () {
      i = (i + 1) % words.length;
      el.classList.add("swap");
      setTimeout(function () {
        el.textContent = words[i];
        el.classList.remove("swap");
      }, 350);
    }, 2400);
  }

  /* ---- Staggered children (chips, value cards, steps) ---------------- */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, idx) {
      child.style.transitionDelay = Math.min(idx * 55, 600) + "ms";
    });
  });

  /* ---- Reveal on scroll --------------------------------------------- */
  /* once a staggered group has played, drop the attribute + inline delays
     so hover transitions aren't delayed afterwards */
  function releaseStagger(group) {
    setTimeout(function () {
      Array.prototype.forEach.call(group.children, function (child) {
        child.style.transitionDelay = "";
      });
      group.removeAttribute("data-stagger");
    }, 1300);
  }
  var items = document.querySelectorAll("[data-reveal], [data-stagger]");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        /* also reveal anything already scrolled past (anchor jumps) */
        if (e.isIntersecting || e.boundingClientRect.top < 0) {
          e.target.classList.add("in");
          if (e.target.hasAttribute("data-stagger")) releaseStagger(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (it) { io.observe(it); });
  } else {
    items.forEach(function (it) {
      it.classList.add("in");
      if (it.hasAttribute("data-stagger")) releaseStagger(it);
    });
  }

  /* ---- Parallax drift for photo stickers ----------------------------- */
  var pEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  if (pEls.length && !reduced && window.innerWidth > 900) {
    var ticking = false;
    function drift() {
      var mid = window.innerHeight / 2;
      pEls.forEach(function (p) {
        var r = p.getBoundingClientRect();
        var f = parseFloat(p.getAttribute("data-parallax")) || 0.06;
        var d = (r.top + r.height / 2 - mid) * -f;
        p.style.setProperty("--py", d.toFixed(1) + "px");
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(drift); ticking = true; }
    }, { passive: true });
    drift();
  }

  /* ---- Footer year -------------------------------------------------- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
