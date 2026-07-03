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
  var INTRO_KEY = "gfy-intro-seen-craft-shot-v6";

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
    /* if the intro bootstrap itself throws (a browser quirk, a missing
       API), don't leave the page stuck behind the curtain — drop the
       overlay and hand straight off to the site */
    try { runIntro(); } catch (e) { if (intro) intro.remove(); introDone(); }
  }

  /* scroll polish is a nice-to-have; a ScrollTrigger hiccup on some
     browser must never take the rest of the page down with it */
  try { setupGsapScroll(); } catch (e) { /* no parallax, page still fine */ }

  function runIntro() {
    var timers = [];
    var timeline = null;
    var finished = false;
    document.body.classList.add("has-intro", "intro-lock");
    window.scrollTo(0, 0);

    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

    /* hard safety net: older Safari, in-app webviews (Instagram/LinkedIn)
       or a GSAP/SVG hiccup can throw or stall inside the timeline below.
       Never leave the curtain covering the page — force the handoff after
       a max runtime no matter what. (Skipped for the #introfreeze dev tool
       and cleared by finish() on the normal path.) */
    if (!/introfreeze=/.test(location.hash)) at(12500, finish);

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
      { n: "New York",  id: "new-york",  lat:  40.71, lon:  -74.01, c: "var(--orange)", d: ".05s" },
      /* London's paper tag is shifted up-left (ox/oy) so it doesn't sit
         under Zürich's bigger tag — the dot stays on the exact city */
      { n: "London",    id: "london",    lat:  51.51, lon:   -0.13, c: "var(--green)",  d: ".2s", ox: -24, oy: -34 },
      { n: "Tokyo",     id: "tokyo",     lat:  35.68, lon:  139.69, c: "var(--teal)",   d: ".35s" },
      { n: "São Paulo", id: "sao-paulo", lat: -23.55, lon:  -46.63, c: "var(--yellow)", d: ".5s" },
      { n: "Cape Town", id: "cape-town", lat: -33.92, lon:   18.42, c: "var(--purple)", d: ".65s" },
      { n: "Sydney",    id: "sydney",    lat: -33.87, lon:  151.21, c: "var(--red)",    d: ".8s" },
      { n: "Zürich",    id: "zurich",    lat:  47.37, lon:    8.54, c: "var(--primary)", d: "1s", zh: true, ox: 30, oy: -16 }
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

        /* comic look: gather the countries into one group and run it through
           a hand-drawn wobble (turbulence displacement); the hard offset
           shadow + fat ink outline come from cinema.css */
        /* the sketch filter now also draws the comic water dressing that
           hugs the coastlines: a hard offset sticker shadow plus two light
           "shallow water" halo rings (dilated silhouettes) */
        var defs = document.createElementNS(NS, "defs");
        defs.innerHTML = '<filter id="gfy-sketch" x="-6%" y="-8%" width="112%" height="116%">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.008 0.011" numOctaves="3" seed="7" result="n"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="n" scale="16" result="disp"/>' +
          '<feMorphology in="disp" operator="dilate" radius="7" result="d1"/>' +
          '<feFlood flood-color="rgba(139,148,255,0.30)" result="f1"/>' +
          '<feComposite in="f1" in2="d1" operator="in" result="ring1"/>' +
          '<feMorphology in="disp" operator="dilate" radius="16" result="d2"/>' +
          '<feFlood flood-color="rgba(139,148,255,0.14)" result="f2"/>' +
          '<feComposite in="f2" in2="d2" operator="in" result="ring2"/>' +
          '<feOffset in="disp" dx="8" dy="10" result="off"/>' +
          '<feFlood flood-color="rgba(12,14,41,0.55)" result="sc"/>' +
          '<feComposite in="sc" in2="off" operator="in" result="shadow"/>' +
          '<feMerge><feMergeNode in="ring2"/><feMergeNode in="ring1"/><feMergeNode in="shadow"/><feMergeNode in="disp"/></feMerge>' +
          '</filter>' +
          '<pattern id="gfy-dots" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">' +
          '<circle cx="2.5" cy="2.5" r="1.15" fill="rgba(125,135,230,0.20)"/>' +
          '<circle cx="9.5" cy="9.5" r="1.15" fill="rgba(125,135,230,0.12)"/>' +
          '</pattern>';
        var landG = document.createElementNS(NS, "g");
        landG.setAttribute("class", "gfy-lands");
        Array.prototype.slice.call(svg.children).forEach(function (k) {
          var t = k.tagName.toLowerCase();
          if (t !== "style" && t !== "defs") landG.appendChild(k);
        });
        svg.appendChild(defs);

        /* comic ocean: halftone dot water + hand-drawn scallop waves in
           two blues, some with a shorter echo line underneath. Painted
           behind the land cutouts so they only show on water. */
        function frac(n) { n = Math.sin(n * 43758.5453) * 10000; return n - Math.floor(n); }
        var ocean = el("rect", "gfy-ocean", {
          x: bb.x, y: bb.y, width: bb.width, height: bb.height, fill: "url(#gfy-dots)"
        });
        svg.appendChild(ocean);

        var wdA = "", wdB = "";
        for (var wi = 0; wi < 30; wi++) {
          var wx = bb.x + frac(wi * 0.618 + 0.07) * bb.width;
          var wy = bb.y + frac(wi * 0.377 + 0.19) * bb.height;
          var ws = 13 + frac(wi * 0.83 + 0.31) * 14;
          var humps = 2 + (wi % 2);
          var d = "M" + wx.toFixed(1) + " " + wy.toFixed(1);
          for (var hj = 0; hj < humps; hj++) {
            d += "q" + (ws / 2).toFixed(1) + " -" + (ws / 2.4).toFixed(1) + " " + ws.toFixed(1) + " 0";
          }
          if (wi % 3 === 0) {
            d += "M" + (wx + ws * 0.55).toFixed(1) + " " + (wy + 6.5).toFixed(1) +
              "q" + (ws / 2).toFixed(1) + " -" + (ws / 2.4).toFixed(1) + " " + ws.toFixed(1) + " 0";
          }
          if (wi % 2) { wdA += d; } else { wdB += d; }
        }
        var waves = document.createElementNS(NS, "g");
        waves.setAttribute("class", "gfy-waves");
        waves.appendChild(el("path", "gfy-wave gfy-wave--a", { d: wdA }));
        waves.appendChild(el("path", "gfy-wave gfy-wave--b", { d: wdB }));
        svg.appendChild(waves);
        svg.appendChild(landG);

        /* Switzerland = home turf: just paint it red so it reads instantly
           as the place the camera is diving toward. (The old white cross,
           city dots and "all of Switzerland" note only cluttered the zoom
           and are gone.) */
        var chPath = landG.querySelector("#CH");
        if (chPath) chPath.setAttribute("class", "land gfy-ch");

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
        function mapPoint(lat, lon) {
          return {
            x: bb.x + (lon - MAP.L) / (MAP.R - MAP.L) * bb.width,
            y: bb.y + (mercY(MAP.T) - mercY(lat)) / (mercY(MAP.T) - mercY(MAP.B)) * bb.height
          };
        }

        var layer = document.createElementNS(NS, "g");
        CITIES.forEach(function (ct, idx) {
          var pos = mapPoint(ct.lat, ct.lon);
          var x = pos.x, y = pos.y;
          if (ct.zh) zhPin = { x: x, y: y };

          var w = ct.zh ? 128 : 92, h = ct.zh ? 38 : 28, lift = 14;
          var g = el("g", "mpin ppin mpin--" + ct.id + (ct.zh ? " mpin--zh" : ""), {
            transform: "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")"
          });
          g.style.setProperty("--c", ct.c);
          g.style.setProperty("--d", ct.d);

          /* inner group carries the craft tilt as an SVG attribute and the
             pop animation: its local origin already sits on the city, so
             the CSS scale pops in place instead of sliding across the map.
             Optional ox/oy shifts the whole tag away from crowded spots. */
          var ox = ct.ox || 0, oy = ct.oy || 0;
          var tilt = el("g", "ppin__in", {
            transform: "translate(" + ox + "," + oy + ") rotate(" + ((idx % 2 ? 1 : -1) * (3 + idx % 3 * 2)) + ")"
          });

          tilt.appendChild(el("polygon", "ppin__shadow", { points: tornPoints(w, h, idx + 1, 3, 4 - lift) }));
          tilt.appendChild(el("polygon", "ppin__paper",  { points: tornPoints(w, h, idx + 1, 0, -lift) }));
          /* small pushpin holding the tag to the map (comic look: ink
             outline + hard offset shadow, head in the city colour) */
          var pinY = -h - lift + 2;
          tilt.appendChild(el("circle", "ppin__needle-shadow", { cx: 2.5, cy: pinY + 3, r: ct.zh ? 7 : 6 }));
          tilt.appendChild(el("circle", "ppin__needle", { cx: 0, cy: pinY, r: ct.zh ? 7 : 6 }));
          tilt.appendChild(el("circle", "ppin__needle-shine", { cx: -2, cy: pinY - 2, r: 1.9 }));
          var name = el("text", "ppin__name", { y: (-lift - h / 2 + (ct.zh ? 9 : 8)) });
          name.textContent = ct.n;
          tilt.appendChild(name);

          /* leader lives on the outer group so it always connects the
             (possibly offset) tag to the exact city dot */
          g.appendChild(el("line", "ppin__leader", { x1: ox, y1: oy - lift + 4, x2: 0, y2: -3 }));
          g.appendChild(el("circle", "mpin__pulse", { r: ct.zh ? 9 : 10 }));
          g.appendChild(tilt);
          g.appendChild(el("circle", "mpin__dot", { r: ct.zh ? 4.2 : 5 }));
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
      var swish = q(".intro__swish");
      var motto = q("[data-intro-motto]");
      var tagline = q("[data-intro-tagline]");
      var title = q(".intro__title");
      var plane = q("[data-intro-plane]");

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

      gsap.set(targets(play, court, player, hoop, ball, trailDots, shotArc, friends, releaseArm, swish, motto, tagline, title), { autoAlpha: 0 });
      gsap.set(worldEl, { autoAlpha: 0, scale: 1, filter: "blur(0px)" });
      gsap.set(plane, { autoAlpha: 0, x: 0, y: 0 });
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
        /* prop plane tows the Groupify banner across the map, then clears
           before the camera dives into Zürich so it never clips or covers
           the zoom target */
        .set(plane, { autoAlpha: 1 }, 0.18)
        .to(plane, { x: function () { return window.innerWidth + (window.innerWidth < 760 ? 340 : 760); }, duration: 3.15, ease: "none" }, 0.18)
        .to(plane, { y: 12, duration: 0.72, ease: "sine.inOut", yoyo: true, repeat: 4 }, 0.18)
        .to(plane, { autoAlpha: 0, duration: 0.32, ease: "power2.out" }, 1.78)
        .add(function () { intro.classList.add("zoom"); }, 2.12)
        .to(worldEl, { scale: 6.25, duration: 1.55, ease: "power3.inOut" }, 2.12)
        .to(worldEl, { autoAlpha: 0.16, filter: "blur(5px)", duration: 0.74, ease: "power2.out" }, 3.18)
        .add(function () { intro.classList.add("scene-on"); }, 3.0)
        .set(play, { autoAlpha: 1 }, 3.2)
        .to(court, { autoAlpha: 1, x: 0, y: 0, rotation: -5, scale: 1, duration: 0.64, ease: "power3.out" }, 3.06)
        .to(hoop, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.62, ease: "back.out(1.08)" }, 3.25)
        .to(player, { autoAlpha: 1, x: 0, y: 0, rotation: -2, scale: 1, duration: 0.6, ease: "back.out(1.28)" }, 3.2)
        .fromTo(friends, { autoAlpha: 0, y: 16, rotation: -7, scale: 0.82 }, { autoAlpha: 1, y: 0, rotation: -2, scale: 1, duration: 0.48, ease: "back.out(1.35)" }, 3.34)
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
        .to(targets(court, player, friends, hoop, ball, trailDots, shotArc, releaseArm, swish), { autoAlpha: 0.12, filter: "blur(3px)", duration: 0.55, ease: "power2.out" }, 5.82)
        .fromTo(motto, { autoAlpha: 0, y: 22, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.72, ease: "power3.out" }, 5.82)
        .fromTo(tagline, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 6.16)
        /* clean handoff: the motto lifts out first, then the stage curtain
           slides up (finish) while the header drops in over the hero */
        .to(targets(motto, tagline), { autoAlpha: 0, y: -30, duration: 0.5, ease: "power2.in" }, 7.15);

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

      at(7700, finish);

      return true;
    }

    /* ---- cold-open: a self-aware wink before the world map ----
       three big serif beats fade through on their own, then the hook
       dissolves as the cinematic map intro takes over. Pure auto-play,
       no clicks. If GSAP or the markup is missing it just hands straight
       to `next` so the map intro still runs. */
    function playColdOpen(next) {
      var g = window.gsap;
      var hook = intro.querySelector("[data-intro-hook]");
      if (!g || !hook) { next(); return; }
      intro.classList.add("gsap-on");
      var lines = hook.querySelectorAll(".intro__hook-line");
      var l1 = lines[0], l2 = lines[1], l3 = lines[2];
      g.set(hook, { autoAlpha: 1 });
      g.set([l1, l2, l3], { autoAlpha: 0, y: 22 });
      timeline = g.timeline({ defaults: { ease: "power3.out" }, onComplete: next });
      timeline
        .to(l1, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.2)
        .to(l1, { autoAlpha: 0, y: -18, duration: 0.3, ease: "power2.in" }, 1.15)
        .fromTo(l2, { autoAlpha: 0, y: 22, scale: 0.94 },
                    { autoAlpha: 1, y: 0, scale: 1, duration: 0.46, ease: "back.out(1.7)" }, 1.3)
        .to(l2, { autoAlpha: 0, y: -18, duration: 0.3, ease: "power2.in" }, 2.05)
        .fromTo(l3, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.52 }, 2.2)
        .to(hook, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" }, 3.2);
    }

    /* run order: cold-open hook → cinematic map intro. A throw anywhere
       still lands on finish(); #introfreeze skips the hook so the dev tool
       keeps targeting the map timeline as before. */
    var freezing = /introfreeze=/.test(location.hash);
    try {
      if (window.gsap && !freezing) {
        playColdOpen(function () {
          if (finished) return;
          if (!playGsapIntro()) playFallbackIntro();
        });
      } else if (!playGsapIntro()) {
        playFallbackIntro();
      }
    } catch (e) {
      finish();
    }
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

      /* memory pinboard: no scroll-scrubbing — once the board is in view
         the photos slap onto the cork one after another (play once). Each
         photo drops from "camera height" (big → 1) with a squash on impact,
         then its pushpin pops in. */
      var boardWrap = document.querySelector(".memory-board");
      var boardCopy = document.querySelector(".memory-board__copy");
      var boardPhotos = gsap.utils.toArray("[data-memory-photo]");
      if (boardWrap && boardPhotos.length) {
        gsap.set(boardCopy, { autoAlpha: 0, y: 26 });
        gsap.set(boardPhotos, { autoAlpha: 0 });
        gsap.set(".memory-photo__pin", { autoAlpha: 0, scale: 0.2 });
        gsap.set(".memory-board__scribble", { autoAlpha: 0 });

        var slapTl = gsap.timeline({
          scrollTrigger: {
            trigger: boardWrap,
            start: "top 58%",
            once: true
          }
        });
        slapTl.to(boardCopy, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" }, 0);
        boardPhotos.forEach(function (photo, idx) {
          var t = 0.35 + idx * 0.34;
          slapTl
            .fromTo(photo,
              { scale: 1.6, rotation: idx % 2 ? 10 : -9, transformOrigin: "50% 42%" },
              { scale: 1, rotation: 0, duration: 0.26, ease: "power3.in" }, t)
            .fromTo(photo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14, ease: "power1.out" }, t)
            /* impact: tiny squash, then settle back */
            .to(photo, { scale: 0.985, duration: 0.07, ease: "power1.out" }, t + 0.26)
            .to(photo, { scale: 1, duration: 0.2, ease: "back.out(3.2)" }, t + 0.33);
          var pin = photo.querySelector(".memory-photo__pin");
          if (pin) {
            slapTl.to(pin, { autoAlpha: 1, scale: 1, duration: 0.2, ease: "back.out(2.6)" }, t + 0.3);
          }
        });
        slapTl.fromTo(".memory-board__scribble", { y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
          0.35 + boardPhotos.length * 0.34);
      }

      /* "how it works": the phone scrolls along WITH the cards (no sticky,
         no scroll-jacking) — just a gentle parallax drift for life */
      var how = document.querySelector(".how");
      var howPhone = document.querySelector(".how__phone");
      if (how && howPhone) {
        gsap.fromTo(howPhone, { y: 46 }, {
          y: -34,
          ease: "none",
          scrollTrigger: {
            trigger: how,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.7,
            invalidateOnRefresh: true
          }
        });
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
