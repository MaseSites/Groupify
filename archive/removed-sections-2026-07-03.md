# Removed Sections Archive - 2026-07-03

Saved before removing the two visual blocks from the live Groupify landing page.
Source commit before removal: `d18a259` (`Fix intro map animation layout`).

## 1. Value Card Strip

Original location: `index.html`, between the hero and features.

```html
<!-- ===================== VALUE STRIP ===================== -->
<div class="tear tear--navy-on-white" aria-hidden="true"></div>
<section class="value" id="value">
  <div class="container value__grid" data-stagger>
    <article class="value__item value__item--map reveal" data-reveal>
      <span class="value__stamp">01</span>
      <div class="value__artifact value__artifact--map" aria-hidden="true">
        <span class="value__street value__street--one"></span>
        <span class="value__street value__street--two"></span>
        <span class="value__street value__street--three"></span>
        <span class="value__pin value__pin--one"></span>
        <span class="value__pin value__pin--two"></span>
      </div>
      <h3>Follow the warm windows</h3>
      <p>A pin is not just a pin. It is a kitchen table, a half-lit court, a spare seat, a plan around the corner.</p>
    </article>
    <article class="value__item value__item--ticket reveal" data-reveal>
      <span class="value__stamp">02</span>
      <div class="value__artifact value__artifact--ticket" aria-hidden="true">
        <span>saved spot</span>
        <b>19:30</b>
        <i></i>
      </div>
      <h3>Arrive as a maybe</h3>
      <p>Join without performing online. The host sees your name, the group saves you a chair, and the chat stays useful.</p>
    </article>
    <article class="value__item value__item--note reveal" data-reveal>
      <span class="value__stamp">03</span>
      <div class="value__artifact value__artifact--note" aria-hidden="true">
        <span>keep saturday free</span>
      </div>
      <h3>Leave with a story</h3>
      <p>You meet for the thing you like and walk home with names, jokes, and a reason to do it again next week.</p>
    </article>
  </div>
</section>
```

Related styles were the `Value strip` block in `styles/main.css`:
`.value`, `.value__grid`, `.value__item`, `.value__artifact`, `.value__street`, `.value__pin`,
`.value__artifact--ticket`, `.value__artifact--note`, `.value__stamp`.

Restore note: the hero scroll hint originally pointed at `#value`; after removal it points at `#features`.

## 2. Memory Pinboard

Original location: `index.html`, between the value strip and features.

```html
<!-- ===================== MEMORY PINBOARD ===================== -->
<section class="memory-board" id="memories" aria-label="Offline memories">
  <div class="memory-board__pin" data-memory-board>
    <div class="memory-board__surface">
      <span class="memory-board__grain" aria-hidden="true"></span>

      <header class="memory-board__copy">
        <span class="eyebrow">No phones on the table</span>
        <h2>Proof the night happened.</h2>
        <p>Blurry corners, flash burns, somebody's thumb in the frame. The kind of memories you keep because you were actually there.</p>
      </header>

      <figure class="memory-photo memory-photo--main" data-memory-photo>
        <span class="memory-photo__pin" aria-hidden="true"></span>
        <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=720&q=72" alt="Friends laughing together at golden hour" loading="lazy" decoding="async">
        <figcaption>forgot the time</figcaption>
      </figure>

      <figure class="memory-photo memory-photo--concert" data-memory-photo>
        <span class="memory-photo__pin" aria-hidden="true"></span>
        <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=620&q=72" alt="Crowd under confetti at a live music night" loading="lazy" decoding="async">
        <figcaption>somebody knew</figcaption>
      </figure>

      <figure class="memory-photo memory-photo--table" data-memory-photo>
        <span class="memory-photo__pin" aria-hidden="true"></span>
        <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=620&q=72" alt="Friends at a long dinner table under string lights" loading="lazy" decoding="async">
        <figcaption>everybody brought something</figcaption>
      </figure>

      <p class="memory-board__scribble">the best nights never make it to the feed.</p>
    </div>
  </div>
</section>
```

Related styles were the `MEMORY PINBOARD` block in `styles/cinema.css`:
`.memory-board`, `.memory-board__pin`, `.memory-board__surface`, `.memory-board__grain`,
`.memory-board__copy`, `.memory-photo`, `.memory-photo__pin`, `.memory-photo--main`,
`.memory-photo--concert`, `.memory-photo--table`, `.memory-board__scribble`, plus the mobile
`@media (max-width:760px)` rules for these selectors.

Related script was the `memory pinboard` GSAP block in `scripts/main.js`, inside the desktop
scroll setup, starting with:

```js
var boardWrap = document.querySelector(".memory-board");
var boardCopy = document.querySelector(".memory-board__copy");
var boardPhotos = gsap.utils.toArray("[data-memory-photo]");
```

