/* ==========================================================================
   Groupify - real interactive app preview
   Rebuilds the Figma mobile screens as live DOM, not screenshot swaps.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-demo-screen-root]");
  if (!root) return;

  var phone = document.querySelector("[data-demo-phone]");
  var tryBtn = document.querySelector("[data-demo-try]");
  var reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (err) {}

  var P = "assets/photos/";

  var state = {
    screen: "welcomeEvents",
    onbStep: 0,
    homeTab: "attending",
    profileTab: "feed",
    chatFilter: "all",
    searchTab: "events",
    searchFrom: "discover",
    selectedPin: "hike",
    gender: "Female",
    interests: { Trips: true, Movement: true, Music: true },
    bioTags: { Rainbow: true, Blue: true, Green: true },
    permissions: { Notifications: false },
    searchFilters: { Party: true, Books: true, Art: true },
    invited: {},
    followed: { f0: true },
    joined: {},
    approved: {},
    activeEvent: "hike",
    createMenuOpen: false,
    assistantOpen: false,
    assistantExitOpen: false,
    liked: { p1: false, p2: true, p3: false },
    likes: { p1: 16, p2: 17, p3: 17 },
    toastTimer: null
  };

  var ICON = {
    apple: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.7 1.1 8.9.7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7 1.9-1.1 2.6-2.1c.8-1.2 1.2-2.4 1.2-2.4s-2.2-.9-2.2-3.4zM14.2 5.4c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z"/></svg>',
    google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M23 12.2c0-.8-.1-1.4-.2-2H12v3.8h6.2c-.3 1.5-1.1 2.8-2.3 3.6l3.6 2.8c2.1-2 3.5-4.9 3.5-8.2z"/><path fill="#34a853" d="M12 23c3.1 0 5.7-1 7.6-2.8L16 17.4c-1 .7-2.3 1.1-4 1.1-3 0-5.6-2-6.5-4.8l-3.7 2.9C3.6 20.3 7.5 23 12 23z"/><path fill="#fbbc04" d="M5.5 13.7c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2L1.8 6.4C1 7.9.6 9.6.6 11.5s.4 3.6 1.2 5.1z"/><path fill="#ea4335" d="M12 4.5c1.7 0 2.9.7 3.5 1.3l2.6-2.6C16.5 1.7 14.1.9 12 .9 7.5.9 3.6 3.6 1.8 6.4l3.7 2.9C6.4 6.5 9 4.5 12 4.5z"/></svg>',
    plus: svg("M12 5v14M5 12h14"),
    back: svg("M19 12H5M11 6l-6 6 6 6"),
    arrow: svg("M5 12h14M13 6l6 6-6 6"),
    search: svg("M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-3.5-3.5"),
    menu: svg("M4 7h16M4 12h16M4 17h16"),
    bell: svg("M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"),
    calendar: svg("M4 5h16v15H4zM4 10h16M8 3v4M16 3v4"),
    people: svg("M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 20c.5-3 2.5-4.7 5-4.7s4.5 1.7 5 4.7M16 8.5a3 3 0 0 1 0 5M17 15.4c2 .4 3.2 1.9 3.6 4.2"),
    pin: svg("M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 12.2a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8z"),
    home: svg("M4 11l8-7 8 7M6 10v9h12v-9"),
    compass: svg("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z"),
    star: svg("M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 16.9 7.2 19l.9-5.3-3.9-3.8 5.4-.8z"),
    chat: svg("M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"),
    heart: svg("M12 20s-7-4.4-9.5-8.5C1 8.5 2.5 5.5 5.5 5.5c2 0 3.2 1.3 4 2.4.8-1.1 2-2.4 4-2.4 3 0 4.5 3 3 6C19 15.6 12 20 12 20z"),
    share: svg("M12 15V3M8 7l4-4 4 4M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"),
    bookmark: svg("M6 4h12v17l-6-4-6 4z"),
    lock: svg("M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z"),
    send: svg("M4 12l16-8-6 16-3-6-7-2z"),
    x: svg("M6 6l12 12M18 6 6 18"),
    card: svg("M3 6h18v12H3zM3 10h18"),
    globe: svg("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.5 12h17M12 3c-2.3 2.5-3.5 5.5-3.5 9s1.2 6.5 3.5 9c2.3-2.5 3.5-5.5 3.5-9S14.3 5.5 12 3z")
  };

  var EVENTS = [
    { id: "hike", title: "Light sunset hike to mount Lema", mapTitle: "Sunset hike to mount Lema", img: "saturday-hike.jpg", date: "Mon 15 Sep, 09:30", mapDate: "Mon 15 Sep, 14:00", by: "Alice Johnson", color: "blue", mapColor: "green", count: "13" },
    { id: "board", title: "Board games at the library", img: "dinner-lights.jpg", date: "Mon 15 Sep, 11:00", by: "Emily White", color: "indigo", count: "12/14", flag: "Almost full" },
    { id: "cuisine", title: "Italian cuisine class", img: "cheese-tour.jpg", date: "Mon 15 Sep, 19:00", by: "Marco Rossi", color: "yellow", count: "8/15" },
    { id: "run", title: "Run and fun - easy pace park run", img: "park-run.jpg", date: "Mon 15 Sep, 09:30", by: "Keisha Blue", color: "blue", count: "25" },
    { id: "book", title: "Literary Cafe: Book discussion", img: "book-club.jpg", date: "Tue 16 Sep, 10:00", by: "Isabelle Weber", color: "lavender", count: "23/25", flag: "Almost full" },
    { id: "art", title: "Art & Wine evening", img: "friends-table.jpg", date: "Tue 16 Sep, 16:30", by: "Carlos Alvarez", color: "gold", count: "9/10", flag: "Almost full" },
    { id: "diy", title: "DIY home decor workshop", img: "cheers.jpg", date: "Tue 16 Sep, 15:00", by: "Alice Johnson", color: "pink", count: "4" },
    { id: "photo", title: "Photography walk", img: "zurich-lake.jpg", date: "Wed 17 Sep, 14:00", by: "Hans Baumgartner", color: "rose", count: "2/4", flag: "Almost full" },
    { id: "dance", title: "Evening Salsa Dance", img: "salsa-night.jpg", date: "Wed 17 Sep, 19:00", by: "Carlos Alvarez", color: "red", count: "41" },
    { id: "garden", title: "Botanical Garden Tour", img: "picnic-crew.jpg", date: "Wed 17 Sep, 10:00", by: "Isabelle Weber", color: "pink", count: "16/18", flag: "Almost full" }
  ];

  var HOSTED_EVENTS = [
    { id: "mountain", title: "MOUNTAIN RUNNING", img: "mountain-run.jpg", date: "Wed 01 Nov, 14:00", by: "Michaela Smith", color: "orange", count: "17", type: "Open event" },
    { id: "poetry", title: "Poetry slam night at the Town Hall", img: "book-club.jpg", date: "Fri 18 Dec, 19:00", by: "Michaela Smith", color: "green", count: "5/10", type: "Closed event", pending: 3 },
    { id: "cheese", title: "Tasting tour - Artisanal cheese", img: "cheese-tour.jpg", date: "Tue 22 Oct, 13:30", by: "Michaela Smith", color: "yellow", count: "10/18", type: "Open event", pending: 3 }
  ];

  var CLUBS = [
    { id: "athletics", title: "Sunday athletics", cat: "Sports", img: "park-run.jpg", text: "Explore new routes, improve your fitness, and connect with fellow runners.", tag: "Upcoming event", color: "green" },
    { id: "techno", title: "Melodic techno", cat: "Technology", img: "open-air-concert.jpg", text: "Explore cutting-edge tech, collaborate on exciting projects, and shape the future of music.", tag: "Your friends joined", color: "purple" },
    { id: "bookworms", title: "Bookworm's heaven", cat: "Literature", img: "book-club.jpg", text: "Dive into captivating stories, share literary insights, and connect with fellow book lovers.", tag: "Upcoming event", color: "blue" }
  ];

  var CONTACTS = ["Olivia White", "Marta Johanson", "John Jameson", "Lisa Johnson", "Anna Smith", "Michael Brown", "Emily Davis"];
  var FRIENDS = ["Naomi Verde", "Kira Hoshi", "Raj Patel", "Ingrid Neumann", "Bjorn Hansen", "Kenji Tanaka"];
  var INTERESTS = ["Trips", "Movement", "Food & Drinks", "Board games", "Crafts", "Art & Culture", "Literature", "Science", "Music", "Nature", "Sports", "Languages", "Technology", "Animals", "Wellness", "Other"];
  var BIO_COLORS = ["Rainbow", "Blue", "Green", "Yellow", "Purple", "Pink", "Orange", "Brown", "Beige", "White", "Gray", "Black", "Other"];
  var ONB = [
    ["2/11", 18],
    ["4/11", 36],
    ["5/11", 45],
    ["7/11", 63],
    ["8/11", 72],
    ["9/11", 81],
    ["10/11", 91],
    ["message", 91],
    ["11/11", 100]
  ];

  var CHATS = [
    ["Violet Bridgerton", "Violet: Did you hear Headmaster Bea...", "14:30", "dm", 2],
    ["Run and fun - easy pace park run", "Violet: Hey! Today is the day! Let's m...", "12:48", "event", 10],
    ["Bookworms' heaven", "Alex: Reminder - club sign-ups close...", "10:11", "club", 8],
    ["Hans Baumgartner", "You: Anyone know the homework for Lit...", "10 Jul", "dm", 0],
    ["Italian cuisine class", "You: Hey! I'm starting a study group at...", "9 Jul", "event", 2],
    ["Alice Johnson", "You: OMG, did you see what Imogen wor...", "9 Jul", "dm", 0],
    ["Melodic techno", "Sam: I can't believe they cancelled th...", "8 Jul", "club", 5]
  ];

  function svg(paths) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + paths + '"/></svg>';
  }

  function render() {
    root.setAttribute("data-current-screen", state.screen);
    root.innerHTML = screenHTML() + (state.createMenuOpen ? createMenuHTML() : "") + (state.assistantOpen ? assistantHTML() : "") + '<div class="gd-toast" data-toast role="status" aria-live="polite"></div>';
    if (!reduced) {
      root.querySelector(".gd-app")?.classList.add("is-entering");
    }
  }

  function keepPhoneUsable() {
    if (!phone) return;
    var rect = phone.getBoundingClientRect();
    var header = document.querySelector(".site-header, .main-header, header");
    var headerHeight = header ? header.getBoundingClientRect().height : 0;
    var topPad = Math.min(Math.max(headerHeight + 8, 24), 92);
    var bottomPad = 12;
    if (rect.top < topPad || rect.bottom > window.innerHeight - bottomPad) {
      var target = window.scrollY + rect.top - topPad;
      try {
        window.scrollTo({ top: target, behavior: "auto" });
      } catch (err) {
        window.scrollTo(window.scrollX, target);
      }
    }
  }

  function schedulePhoneUsable() {
    keepPhoneUsable();
    window.requestAnimationFrame(keepPhoneUsable);
    window.setTimeout(keepPhoneUsable, 140);
    window.setTimeout(keepPhoneUsable, 420);
    window.setTimeout(keepPhoneUsable, 900);
  }

  function screenHTML() {
    if (state.screen === "welcomeLogin") return welcomeHTML("events", true);
    if (state.screen === "welcomeEvents") return welcomeHTML("events");
    if (state.screen === "welcomeClubs") return welcomeHTML("clubs");
    if (state.screen === "welcomePeopleRed") return welcomeHTML("people-red");
    if (state.screen === "onboarding") return onboardingHTML();
    if (state.screen === "discoverWelcome") return discoverHTML(true);
    if (state.screen === "discover") return discoverHTML(false);
    if (state.screen === "eventDetail") return eventDetailHTML();
    if (state.screen === "home") return homeHTML();
    if (state.screen === "feed") return feedHTML();
    if (state.screen === "chat") return chatHTML();
    if (state.screen === "profile") return profileHTML();
    if (state.screen === "hosted") return hostedHTML();
    if (state.screen === "clubs") return clubsHTML();
    if (state.screen === "events") return eventsHTML();
    if (state.screen === "search") return searchHTML();
    if (state.screen === "settings") return settingsHTML();
    return welcomeHTML("people");
  }

  function status(light) {
    return '<div class="gd-status' + (light ? " gd-status--light" : "") + '"><b>9:41</b><span><i></i><i></i><i></i></span></div>';
  }

  function appbar(title, opts) {
    opts = opts || {};
    return '<div class="gd-appbar">' +
      (opts.back ? iconBtn("back", opts.back) : iconBtn("plus", opts.plus || "create-menu")) +
      '<strong>' + title + '</strong>' +
      '<span class="gd-spacer"></span>' +
      (opts.right || iconBtn("bell", "chat", '<em>10</em>')) +
    '</div>';
  }

  function iconBtn(icon, action, extra) {
    return '<button class="gd-iconbtn" data-action="' + action + '">' + ICON[icon] + (extra || "") + '</button>';
  }

  function welcomeHTML(kind, termsOpen) {
    var isClub = kind === "clubs";
    var isRed = kind === "people-red";
    var isEvents = kind === "events";
    var cls = isClub ? "gd-welcome--green" : isRed ? "gd-welcome--red" : isEvents ? "gd-welcome--events" : "gd-welcome--purple";
    var photo = isClub ? "friends-table.jpg" : isEvents ? "picnic-crew.jpg" : "book-club.jpg";
    var title = isClub ? "your clubs" : isEvents ? "your events" : "your people";
    var next = isEvents ? "welcomePeople" : isClub ? "welcomeEvents" : isRed ? "welcomeClubs" : "welcomePeopleRed";
    var pager = [
      ["welcomeEvents", isEvents],
      ["welcomePeople", !isClub && !isRed],
      ["welcomePeopleRed", isRed],
      ["welcomeClubs", isClub]
    ].map(function (item) {
      return '<button class="' + (item[1] ? "is-on" : "") + '" data-action="' + item[0] + '" aria-label="Welcome variant"></button>';
    }).join("");
    return '<div class="gd-app gd-welcome ' + cls + '">' +
      '<img class="gd-welcome__photo" src="' + P + photo + '" alt="">' +
        '<div class="gd-welcome__veil"></div><div class="gd-welcome__grain"></div>' + status(true) +
      '<div class="gd-welcome__brand"><img src="Logo/groupify-wordmark-white.png" alt="Groupify"></div>' +
      '<div class="gd-welcome__pager">' + pager + '</div>' +
      '<div class="gd-welcome__center"><span>Find</span><em>' + title + '</em><p>social app for finding and organizing<br>group events around shared interests</p></div>' +
      '<div class="gd-welcome__actions"><small>Continue with</small><div>' +
        '<button data-action="open-login">' + ICON.apple + 'Apple</button>' +
        '<button data-action="open-login">' + ICON.google + 'Google</button>' +
      '</div></div>' +
      '<button class="gd-welcome__switch" data-action="' + next + '" aria-label="Switch welcome"></button>' +
      (termsOpen ? termsModalHTML() : "") +
    '</div>';
  }

  function termsModalHTML() {
    return '<div class="gd-terms">' +
      '<div class="gd-terms__card" role="dialog" aria-label="Apple ID sign in">' +
        '<h2>Apple ID</h2>' +
        '<i class="gd-terms__mark"><img src="Logo/groupify-mark-teal.png" alt=""></i>' +
        '<p><b>Groupify</b> wants to use your Apple ID to sign in and create your account.</p>' +
        '<label><span>Name</span><strong>Michaela Smith</strong></label>' +
        '<label><span>Email</span><strong>michaela@icloud.com</strong></label>' +
        '<button class="gd-terms__agree" data-action="start-onboarding">Continue</button>' +
        '<button data-action="welcomeEvents">Cancel</button>' +
      '</div>' +
    '</div>';
  }

  function onboardingHTML() {
    var step = state.onbStep;
    if (step === 7) return imessageInviteHTML();
    var meta = ONB[step] || ONB[0];
    var cta = step === 3 ? "Finish questionnaire" : step === 8 ? "Follow 6 friends" : step === 4 ? "Looks good" : "Next";
    return '<div class="gd-app gd-onb">' + status(false) +
      '<div class="gd-onb__top">' + iconBtn("back", "onb-back") + '<b>' + meta[0] + '</b>' + (step >= 3 && step < 8 ? '<button data-action="skip-onb">Skip</button>' : '<span></span>') + '</div>' +
      '<div class="gd-progress"><span style="width:' + meta[1] + '%"></span></div>' +
      '<div class="gd-onb__body">' + onbStepHTML(step) + '</div>' +
      '<div class="gd-onb__foot"><button class="gd-primary" data-action="onb-next">' + cta + ' ' + ICON.arrow + '</button></div>' +
      (step === 0 ? keyboardHTML() : "") +
    '</div>';
  }

  function onbStepHTML(step) {
    if (step === 0) {
      return '<h2>Create<span class="gd-sticker gd-sticker--user"></span><span class="gd-sticker gd-sticker--heart"></span><em>your user name</em></h2>' +
        '<label class="gd-username">@michaela_smith<span></span></label>';
    }
    if (step === 1) {
      return '<h2><span class="gd-sticker gd-sticker--cal"></span>When\'s <em>your birthday?</em><span class="gd-sticker gd-sticker--planet"></span></h2>' +
        '<div class="gd-picker"><span></span>' +
          pickCol(["16", "17", "18", "19", "20"]) + pickCol(["April", "May", "June", "July", "August"]) + pickCol(["2011", "2012", "2013", "2014", "2015"]) +
        '</div><div class="gd-toggle"><b>Show it on my profile</b><button class="is-on" data-action="toast:birthday"></button></div>';
    }
    if (step === 2) {
      return '<h2><span class="gd-sticker gd-sticker--spark"></span>Add <em>your photo</em></h2><p class="gd-muted">It makes your profile feel more personal.<br>You can change it anytime.</p>' +
        '<section class="gd-photo-upload"><i>' + avatar("MS", 8) + '</i><button data-action="toast:Photo picker">Add photo +</button></section>';
    }
    if (step === 3) {
      return '<h2><span class="gd-sticker gd-sticker--arrow"></span>Tell people<br><em>more about you!</em></h2><p class="gd-muted">Let&apos;s embrace your personality and uniqueness</p>' +
        '<section class="gd-about-card"><small>1/6</small><h3>What&apos;s your<br>favorite color?</h3><p>Select one or many</p><div>' + BIO_COLORS.map(function (name) {
          return '<button class="' + (state.bioTags[name] ? "is-on" : "") + '" data-action="bio-tag" data-id="' + name + '">' + name + '</button>';
        }).join("") + '</div></section><div class="gd-dots"><i class="is-on"></i><i></i><i></i><i></i><i></i><i></i></div>';
    }
    if (step === 4) {
      return '<h2><span class="gd-sticker gd-sticker--heart"></span>This is how<br><em>your profile card will look</em></h2><p class="gd-muted">You can edit every detail later.</p>' +
        '<section class="gd-profile-preview">' + avatar("Michaela Smith", 8) + '<h3>Michaela<br>Smith</h3><small>@michaela_smith</small><p>Zurich based. Always up for a hike, a concert or coffee after work.</p><div>' + Object.keys(state.interests).map(function (x) { return '<span>' + x + '</span>'; }).join("") + '</div></section>';
    }
    if (step === 5) {
      return '<h2><span class="gd-sticker gd-sticker--star"></span>We need<br><em>some permissions</em><span class="gd-sticker gd-sticker--arrow"></span></h2><div class="gd-permission-row"><i>' + ICON.bell + '</i><span><b>Notifications</b><small>To keep you up to date</small></span><button class="' + (state.permissions.Notifications ? "is-on" : "") + '" data-action="permission" data-id="Notifications"></button></div>';
    }
    if (step === 6) {
      return '<h2><span class="gd-sticker gd-sticker--squad"></span>Bring <em>your squad!</em></h2><div class="gd-searchline">' + ICON.search + 'Search contact</div>' +
      '<div class="gd-contact-list">' + CONTACTS.map(function (name, i) {
        var id = "c" + i;
        return '<div class="gd-contact">' + avatar(name, i) + '<b>' + name + '</b><button class="' + (state.invited[id] ? "is-done" : "") + '" data-action="invite" data-id="' + id + '">' + (state.invited[id] ? "Invited" : "Invite +") + '</button></div>';
      }).join("") + '</div>';
    }
    return '<h2><span class="gd-sticker gd-sticker--arrow"></span>Follow<br><em>your friends!</em></h2><div class="gd-follow-list">' + FRIENDS.map(function (name, i) {
      var id = "f" + i;
      return '<div class="gd-follow-row">' + avatar(name, i + 4) + '<b>' + name + '</b><button class="' + (state.followed[id] ? "is-on" : "") + '" data-action="follow" data-id="' + id + '"></button></div>';
    }).join("") + '</div>';
  }

  function imessageInviteHTML() {
    return '<div class="gd-app gd-imsg">' + status(false) +
      '<header><button data-action="onb-back">' + ICON.back + '</button><b>New iMessage</b><button data-action="onb-next">' + ICON.x + '</button></header>' +
      '<div class="gd-imsg__to"><span>To: <b>Anna</b></span><i>+</i></div>' +
      '<main><div class="gd-share-card"><img src="Logo/groupify-wordmark-white.png" alt="Groupify"><p>find and organize events<br>around shared interests</p></div><div class="gd-message-line"><button>+</button><p>Hey! Join me on Groupify app!</p><button data-action="onb-next">' + ICON.arrow + '</button></div></main>' +
      keyboardHTML() +
    '</div>';
  }

  function pickCol(items) {
    return '<div>' + items.map(function (item, i) {
      return '<b class="' + (i === 2 ? "is-mid" : i === 1 || i === 3 ? "is-near" : "") + '">' + item + '</b>';
    }).join("") + '</div>';
  }

  function keyboardHTML() {
    var rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    return '<div class="gd-keyboard"><div class="gd-suggest"><span>"The"</span><span>the</span><span>to</span></div>' +
      rows.map(function (row) { return '<div>' + row.split("").map(function (k) { return '<i>' + k + '</i>'; }).join("") + '</div>'; }).join("") +
      '<div><i>ABC</i><i class="gd-space"></i><i class="gd-return"></i></div></div>';
  }

  function discoverHTML(welcome) {
    var selected = getEvent(state.selectedPin) || EVENTS[1];
    return '<div class="gd-app gd-mapapp ' + (welcome ? "gd-mapapp--intro" : "") + '">' + status(false) +
      '<div class="gd-map">' +
        '<div class="gd-map__base"><i></i><i></i><i></i></div><div class="gd-map__search">' + ICON.search + '<span>Search ' + (welcome ? "events" : "people") + '</span><b>in ' + ICON.pin + ' Zurich</b><button data-action="search">' + ICON.menu + '</button></div>' +
        mapPins() +
        (welcome ? discoverWelcomeCard() : discoverEventCard(selected)) +
      '</div>' + (welcome ? "" : bottomNav("discover")) +
    '</div>';
  }

  function mapPins() {
    var pins = [
      ["board", 26, 42, "Board games at<br>the library", "16"], ["hike", 52, 57, "Sunset hike to<br>mount Lema", "15"],
      ["art", 78, 42, "Art & Wine evening", "16"], ["cuisine", 40, 30, "Italian Cuisine class<br>+2 more", "17"], ["garden", 22, 66, "Botanical Garden<br>Tour<br>+3 more", "17"]
    ];
    return pins.map(function (p, i) {
      var event = getEvent(p[0]) || EVENTS[i % EVENTS.length];
      return '<button class="gd-mappin ' + (state.selectedPin === p[0] ? "is-on" : "") + '" style="--x:' + p[1] + '%;--y:' + p[2] + '%" data-action="pin" data-id="' + p[0] + '">' +
        '<span><img src="' + P + event.img + '" alt=""><b>' + p[4] + '</b></span><em>' + p[3] + '</em></button>';
    }).join("") + '<button class="gd-locate" data-action="toast:Location centered">' + ICON.arrow + '</button>';
  }

  function discoverWelcomeCard() {
    return '<section class="gd-mapwelcome"><h2>Welcome<br>to <em>Groupify!</em></h2><p>Everybody is waiting for you!<br>Are you in?</p><div></div><button data-action="discover-start">Discover events & clubs ' + ICON.search + '</button><button data-action="hosted">Create event +</button></section>';
  }

  function discoverEventCard(e) {
    var title = e.mapTitle || e.title;
    var date = e.mapDate || e.date;
    var color = e.mapColor || e.color;
    return '<section class="gd-mapcard gd-color-' + color + '">' +
      '<div class="gd-mapcard__in">' +
        '<div class="gd-mapcard__ph"><img src="' + P + e.img + '" alt=""></div>' +
        '<div class="gd-mapcard__body"><span class="gd-mapcard__meta">' + ICON.calendar + date + '</span><strong class="gd-mapcard__title">' + title + '</strong><span class="gd-mapcard__meta">' + ICON.lock + 'Open event</span><span class="gd-mapcard__att">' + ICON.people + e.count + '</span></div>' +
        '<span class="gd-mapcard__stub">Admit all</span>' +
      '</div>' +
      (e.flag ? '<em>' + e.flag + '</em>' : "") +
      '<button data-action="events">View on list</button></section>';
  }

  function homeHTML() {
    return '<div class="gd-app">' + status(false) + appbar("My festivities") +
      '<main class="gd-scroll gd-home"><h1><span class="gd-sticker gd-sticker--photo"></span>Ready<br><em>for an adventure?</em><span class="gd-sticker gd-sticker--date">SEP<br>12</span></h1>' +
      '<div class="gd-seg"><button class="' + (state.homeTab === "attending" ? "is-on" : "") + '" data-action="home-tab" data-id="attending">Attending</button><button class="' + (state.homeTab === "clubs" ? "is-on" : "") + '" data-action="home-tab" data-id="clubs">My clubs <b>3</b></button><button data-action="toast:bookmark">' + ICON.bookmark + '</button></div>' +
      (state.homeTab === "clubs" ? clubListHTML() : homeFeedHTML()) +
      '</main>' + bottomNav("home") + '</div>';
  }

  function homeFeedHTML() {
    return eventCard(EVENTS[0], "large") + '<section class="gd-dark-panel"><h2>Recommended <em>clubs</em></h2>' + clubCard(CLUBS[0]) + clubCard(CLUBS[1]) + '<button data-action="clubs">Discover more</button></section><h2 class="gd-list-title">Events <em>you may like</em></h2>' + eventCard(EVENTS[3]) + eventCard(EVENTS[2]);
  }

  function clubListHTML() {
    return '<section class="gd-stack">' + CLUBS.map(clubCard).join("") + '</section>';
  }

  function hostedHTML() {
    return '<div class="gd-app">' + status(false) + appbar("My festivities", { back: "home" }) +
      '<main class="gd-scroll gd-hosted"><h1>Your ho<span class="gd-sticker gd-sticker--photo"></span>sted<br><em>events</em><span class="gd-sticker gd-sticker--star"></span></h1>' +
      HOSTED_EVENTS.map(hostedCard).join("") +
      '</main>' + bottomNav("home") + '</div>';
  }

  function clubsHTML() {
    return '<div class="gd-app">' + status(false) + appbar("My festivities", { back: "home" }) +
      '<main class="gd-scroll gd-clubs"><section class="gd-dark-panel"><h1>Recommended<br><em>clubs</em></h1>' + CLUBS.map(clubCard).join("") + '<button data-action="events">Discover more</button></section><h2 class="gd-list-title">Events <em>you may like</em></h2>' + eventCard(EVENTS[4]) + '</main>' + bottomNav("home") + '</div>';
  }

  function eventsHTML() {
    return '<div class="gd-app">' + status(false) + appbar("My festivities", { back: "home" }) +
      '<main class="gd-scroll gd-events">' +
        dayTitle("Today", "Mon 15 Sep") + eventCard(EVENTS[3], "list") + eventCard(EVENTS[1], "list") + eventCard(EVENTS[2], "list") +
        dayTitle("Tomorrow", "Tue 16 Sep") + eventCard(EVENTS[4], "list") + eventCard(EVENTS[5], "list") + eventCard(EVENTS[6], "list") +
        dayTitle("Wednesday", "17 Sep") + '<section class="gd-hero-create"><p>Looks like a blank day...</p><h2>Time to fix it<br><em>with something fun!</em></h2><button data-action="hosted">+ Create your event</button></section>' +
        dayTitle("Thursday", "18 Sep") + eventCard(EVENTS[7], "list") + eventCard(EVENTS[8], "list") + eventCard(EVENTS[9], "list") +
        '<button class="gd-discover-more" data-action="discover">Discover more ' + ICON.arrow + '</button>' +
      '</main>' + bottomNav("home") + '</div>';
  }

  function dayTitle(day, date) {
    return '<h3 class="gd-day-title"><span></span><b>' + day + '</b> / ' + date + '<span></span></h3>';
  }

  function feedHTML() {
    return '<div class="gd-app">' + status(false) + appbar("Feed", { plus: "toast:post", right: iconBtn("search", "search") }) +
      '<main class="gd-scroll gd-feed">' + postHTML("p1", "music_john", "Host", "Melodic techno", "Concert dump. Finally got the club together - and it hit different.", "open-air-concert.jpg") +
      postHTML("p2", "mx_archeron", "", "Bookworms' heaven", "Beautiful presentation - thank you! Can't wait to start reading the book.", "book-club.jpg") +
      postHTML("p3", "michaela_smith", "Creator", "Easy pace society", "I'm hosting an event - join me!", null) + '</main>' + bottomNav("feed") + '</div>';
  }

  function postHTML(id, who, role, club, text, image) {
    var liked = state.liked[id];
    return '<article class="gd-post"><header>' + avatar(who, id.charCodeAt(1)) + '<div><b>' + who + '</b>' + (role ? '<em>' + role + '</em>' : "") + '<small>Apr 5 - in <span>' + club + '</span></small></div></header><p>' + text + '</p>' +
      (image ? '<div class="gd-post__image"><img src="' + P + image + '" alt=""></div><span class="gd-location">' + ICON.pin + 'Main Concert Hall, Zurich</span>' : eventCard(EVENTS[3], "embedded")) +
      '<footer><button class="' + (liked ? "is-on" : "") + '" data-action="like" data-id="' + id + '">' + ICON.heart + state.likes[id] + '</button><button data-action="chat">' + ICON.chat + '8</button><span></span><button data-action="toast:share">' + ICON.share + '</button><button data-action="toast:more">...</button></footer></article>';
  }

  function chatHTML() {
    var tabs = [["all", "All"], ["dm", "DMs"], ["event", "Events"], ["club", "Clubs"]];
    return '<div class="gd-app">' + status(false) +
      '<div class="gd-chat-tabs">' + tabs.map(function (tab) { return '<button class="' + (state.chatFilter === tab[0] ? "is-on" : "") + '" data-action="chat-tab" data-id="' + tab[0] + '">' + tab[1] + '</button>'; }).join("") + '<button data-action="search">' + ICON.search + '</button></div>' +
      '<main class="gd-scroll gd-chat-list">' + CHATS.filter(function (c) { return state.chatFilter === "all" || c[3] === state.chatFilter; }).map(chatRow).join("") + '</main>' + bottomNav("chat") + '</div>';
  }

  function chatRow(c, i) {
    return '<button class="gd-chat-row" data-action="toast:chat">' + avatar(c[0], i) + '<span><b>' + c[0] + '</b><small>' + c[1] + '</small></span><em>' + c[2] + '</em>' + (c[4] ? '<strong>' + c[4] + '</strong>' : "") + '</button>';
  }

  function profileHTML() {
    return '<div class="gd-app">' + status(false) + appbar("michaela_smith", { plus: "toast:share", right: iconBtn("menu", "settings") }) +
      '<main class="gd-scroll gd-profile"><section class="gd-profile__head"><div class="gd-polaroid">' + avatar("MS", 8) + '</div><h1>Michaela<br>Smith</h1></section><div class="gd-stats"><span><b>12</b>events</span><span><b>10</b>clubs</span></div><button class="gd-connections" data-action="toast:connections">Connections ' + ICON.arrow + '</button><div class="gd-seg"><button class="' + (state.profileTab === "feed" ? "is-on" : "") + '" data-action="profile-tab" data-id="feed">Feed</button><button class="' + (state.profileTab === "about" ? "is-on" : "") + '" data-action="profile-tab" data-id="about">About</button></div>' + profileContent() + '</main><button class="gd-addfeed" data-action="feed">Add feed +</button>' + bottomNav("profile") + '</div>';
  }

  function profileContent() {
    if (state.profileTab === "about") return '<section class="gd-profile-about"><p>Zurich based. Always up for a hike, a book club, a spontaneous concert or a good coffee after work.</p><div class="gd-interest-grid gd-interest-grid--small">' + Object.keys(state.interests).map(function (x) { return interestChip(x, true); }).join("") + '</div></section>';
    return postHTML("p2", "its_me_cally", "", "For Michaela", "Last evening was fun! Let's do it again!", "friends-table.jpg");
  }

  function searchHTML() {
    var tabs = [["events", "Events"], ["clubs", "Clubs"], ["people", "People"]];
    var filters = Object.keys(state.searchFilters).filter(function (key) { return state.searchFilters[key]; });
    return '<div class="gd-app gd-search-screen">' + status(false) +
      '<div class="gd-search-backdrop"></div><div class="gd-search-head">' + iconBtn("x", "close-search") + '<button data-action="toast:search">' + ICON.search + '</button></div>' +
      '<main class="gd-search-panel"><div class="gd-search-tabs">' + tabs.map(function (tab) {
        return '<button class="' + (state.searchTab === tab[0] ? "is-on" : "") + '" data-action="search-tab" data-id="' + tab[0] + '">' + tab[1] + '</button>';
      }).join("") + '</div><label>' + ICON.pin + 'Zurich</label><label>' + ICON.search + 'Search ' + state.searchTab + '...</label><ul>' + filters.map(function (name) {
        return '<li>' + ICON.arrow + '<span>' + name + '</span><button data-action="remove-filter" data-id="' + name + '">x</button></li>';
      }).join("") + '</ul><div class="gd-search-results">' + searchResultsHTML() + '</div></main>' + keyboardHTML() + '</div>';
  }

  function searchResultsHTML() {
    if (state.searchTab === "clubs") return CLUBS.slice(0, 2).map(function (club) { return '<button data-action="clubs">' + club.title + '<span>' + club.cat + '</span></button>'; }).join("");
    if (state.searchTab === "people") return CONTACTS.slice(0, 3).map(function (name, i) { return '<button data-action="profile">' + avatar(name, i) + name + '<span>View profile</span></button>'; }).join("");
    return EVENTS.slice(1, 4).map(function (event) { return '<button data-action="events">' + event.title + '<span>' + event.date + '</span></button>'; }).join("");
  }

  function settingsHTML() {
    var tiles = [["Privacy settings", "lock"], ["Notifications", "bell"], ["Payments", "card"], ["Payouts", "globe"]];
    return '<div class="gd-app gd-settings">' + status(false) + '<div class="gd-settings__top">' + iconBtn("back", "profile") + '</div><h1><span class="gd-sticker gd-sticker--gear"></span>Your<br><em>settings</em><span class="gd-sticker gd-sticker--star"></span></h1><div class="gd-settings__grid">' + tiles.map(function (t) { return '<button data-action="toast:' + t[0] + '">' + ICON[t[1]] + '<span>' + t[0] + '</span></button>'; }).join("") + '</div><div class="gd-settings__list"><button data-action="toast:login">Login methods ' + ICON.arrow + '</button><button data-action="toast:support">Support ' + ICON.arrow + '</button><button data-action="toast:terms">Terms & conditions ' + ICON.arrow + '</button><button data-action="toast:privacy">Privacy policy ' + ICON.arrow + '</button></div><button class="gd-signout" data-action="welcomePeople">Sign out</button></div>';
  }

  function createMenuHTML() {
    return '<div class="gd-create-layer" data-action="create-close">' +
      '<div class="gd-create-menu" role="menu">' +
        '<button data-action="assistant-open">' + ICON.calendar + '<span>Create event</span></button>' +
        '<button data-action="toast:Club creator coming soon">' + ICON.people + '<span>Create club</span></button>' +
      '</div>' +
    '</div>';
  }

  function assistantHTML() {
    return '<div class="gd-assistant" role="dialog" aria-label="Groupie AI assistant">' +
      status(true) +
      '<button class="gd-assistant__close" data-action="assistant-close" aria-label="Close assistant">' + ICON.x + '</button>' +
      '<p>Groupie: Tell me about you event!</p>' +
      '<button class="gd-assistant__mic" data-action="toast:Listening">' + svg("M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3M9 21h6") + '</button>' +
      (state.assistantExitOpen ? '<div class="gd-ai-exit"><section><i></i><h2>Exit AI assistant?</h2><p>Your event won&apos;t be saved if you leave now</p><div><button data-action="assistant-cancel">Cancel</button><button data-action="assistant-exit">Exit ' + ICON.share + '</button></div></section></div>' : "") +
    '</div>';
  }

  function eventCard(e, mode) {
    return '<article class="gd-event gd-event--' + (mode || "normal") + ' gd-color-' + e.color + '" data-action="events">' +
      '<img src="' + P + e.img + '" alt="">' +
      '<div><small>' + ICON.calendar + e.date + '</small><h3>' + e.title + '</h3><p>by ' + (mode === "large" ? "" : avatar(e.by, 3)) + e.by + '</p><b>' + ICON.people + e.count + '</b></div>' +
      (e.flag ? '<em>' + e.flag + '</em>' : "") +
      (mode === "hosted" ? '<button data-action="approve" data-id="' + e.id + '">' + (state.approved[e.id] ? "Approved" : "Approve 3") + '</button>' : "") + '</article>';
  }

  function hostedCard(e) {
    return '<article class="gd-event gd-event--hosted gd-color-' + e.color + '">' +
      '<img src="' + P + e.img + '" alt="">' +
      '<div><small>' + ICON.calendar + e.date + '</small><h3>' + e.title + '</h3><p>' + ICON.lock + e.type + '</p><b>' + ICON.people + e.count + '</b></div>' +
      (e.pending ? '<button data-action="approve" data-id="' + e.id + '">' + (state.approved[e.id] ? "Approved" : "Approve " + e.pending) + '</button>' : "") +
    '</article>';
  }

  function clubCard(club) {
    var done = state.joined[club.id];
    return '<article class="gd-club"><div><img src="' + P + club.img + '" alt=""><span><small>' + club.cat + '</small><b>' + club.title + '</b></span><em>' + club.tag + '</em></div><p>' + club.text + '</p><footer><span>' + avatar("A", 1) + avatar("B", 2) + avatar("C", 3) + '<small>+10</small></span><button class="' + (done ? "is-done" : "") + '" data-action="join" data-id="' + club.id + '">' + (done ? "Joined" : "Join") + '</button></footer></article>';
  }

  function bottomNav(active) {
    var items = [["home", "Home", "home"], ["discover", "Discover", "compass"], ["feed", "Feed", "star"], ["chat", "Chat", "chat"], ["profile", "You", ""]];
    return '<nav class="gd-nav">' + items.map(function (it) {
      return '<button class="' + (active === it[0] ? "is-on" : "") + '" data-action="' + it[0] + '">' + (it[0] === "profile" ? avatar("MS", 8) : ICON[it[2]]) + '<span>' + it[1] + '</span>' + (it[0] === "chat" ? '<em>10</em>' : "") + '</button>';
    }).join("") + '</nav>';
  }

  function avatar(name, seed) {
    var initials = String(name).split(/[_\s-]+/).map(function (p) { return p.charAt(0); }).join("").slice(0, 2).toUpperCase();
    return '<i class="gd-avatar gd-avatar--' + (seed % 8) + '">' + initials + '</i>';
  }

  function interestChip(name, forcedOn) {
    var palette = {
      Trips: ["#f2ce1b", "M18 8l-6 8-3-3-5 3 8-12 2 5z"],
      Movement: ["#d86cff", "M6 17l5-10 3 5 4-2"],
      "Food & Drinks": ["#e23b34", "M8 4v8M12 4v8M10 12v8M16 5v15"],
      "Board games": ["#d86cff", "M7 7h10v10H7zM9 4l2 3M15 4l-2 3M9 20l2-3M15 20l-2-3"],
      Crafts: ["#e8641e", "M8 8l8 8M16 8l-8 8"],
      "Art & Culture": ["#ec6cc9", "M5 14c5-8 10-8 14 0M8 14a2 2 0 1 0 0 .1"],
      Literature: ["#5a90ef", "M5 5h14v14H5zM9 5v14"],
      Science: ["#5a90ef", "M9 4h6M12 4v7l5 8H7l5-8"],
      Music: ["#8d70ff", "M9 18V6l9-2v12M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"],
      Nature: ["#56c96f", "M5 13c5-8 11-7 14-9-1 8-5 13-14 9z"],
      Sports: ["#f28a32", "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM4 12h16M12 3c2 3 2 15 0 18"],
      Languages: ["#6ecf7a", "M4 6h10M9 4v2M6 18l3-8 3 8M15 11h5M17 8v3c0 3-2 5-5 6"],
      Technology: ["#f2ce1b", "M9 18h6M10 22h4M12 2a6 6 0 0 0-3 11v2h6v-2a6 6 0 0 0-3-11z"],
      Animals: ["#8d70ff", "M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM16 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 15c3 0 5 2 5 4H7c0-2 2-4 5-4z"],
      Wellness: ["#61d4c9", "M12 20c-5-4-7-8-7-12 4 1 6 4 7 8 1-4 3-7 7-8 0 4-2 8-7 12z"],
      Other: ["#d9dce3", "M8 12h8M12 8v8"]
    };
    var item = palette[name] || ["#d9dce3", "M8 12h8M12 8v8"];
    var on = forcedOn || state.interests[name];
    return '<button class="' + (on ? "is-on" : "") + '" style="--chip:' + item[0] + '" data-action="interest" data-id="' + name + '"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + item[1] + '"/></svg></i><span>' + name + '</span></button>';
  }

  function getEvent(id) {
    for (var i = 0; i < EVENTS.length; i++) if (EVENTS[i].id === id) return EVENTS[i];
    return null;
  }

  function go(screen) {
    state.screen = screen;
    if (screen === "welcomePeople") state.screen = "welcomePeople";
    render();
  }

  function toast(msg) {
    var node = root.querySelector("[data-toast]");
    if (!node) return;
    node.textContent = msg || "Demo action";
    node.classList.add("is-show");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () { node.classList.remove("is-show"); }, 1400);
  }

  root.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action]");
    if (!button) return;
    event.preventDefault();
    var action = button.getAttribute("data-action");
    var id = button.getAttribute("data-id");
    if (action.indexOf("toast:") === 0) {
      var keepAssistant = !!button.closest(".gd-assistant");
      state.createMenuOpen = false;
      if (!keepAssistant) state.assistantOpen = false;
      render();
      return toast(action.split(":")[1]);
    }
    switch (action) {
      case "welcomeEvents": state.screen = "welcomeEvents"; break;
      case "welcomePeople": state.screen = "welcomePeople"; break;
      case "welcomePeopleRed": state.screen = "welcomePeopleRed"; break;
      case "welcomeClubs": state.screen = "welcomeClubs"; break;
      case "open-login": state.screen = "welcomeLogin"; break;
      case "start-onboarding": state.screen = "onboarding"; state.onbStep = 0; break;
      case "onb-next": state.onbStep < ONB.length - 1 ? state.onbStep++ : (state.screen = "discoverWelcome"); break;
      case "onb-back": state.onbStep > 0 ? state.onbStep-- : (state.screen = "welcomeEvents"); break;
      case "skip-onb": state.screen = "discoverWelcome"; break;
      case "gender": state.gender = id; break;
      case "bio-tag":
        if (state.bioTags[id]) delete state.bioTags[id];
        else state.bioTags[id] = true;
        break;
      case "permission": state.permissions[id] = !state.permissions[id]; break;
      case "interest":
        if (state.interests[id]) delete state.interests[id];
        else if (Object.keys(state.interests).length < 5) state.interests[id] = true;
        else toast("Up to 5 interests");
        break;
      case "invite": state.invited[id] = !state.invited[id]; break;
      case "follow": state.followed[id] = !state.followed[id]; break;
      case "discover-start": state.screen = "discover"; break;
      case "pin": state.selectedPin = id; state.screen = "discover"; break;
      case "create-menu": state.createMenuOpen = !state.createMenuOpen; break;
      case "create-close": state.createMenuOpen = false; break;
      case "assistant-open": state.createMenuOpen = false; state.assistantOpen = true; state.assistantExitOpen = false; break;
      case "assistant-close": state.assistantExitOpen = true; break;
      case "assistant-cancel": state.assistantExitOpen = false; break;
      case "assistant-exit": state.assistantOpen = false; state.assistantExitOpen = false; break;
      case "search": state.searchFrom = state.screen; state.screen = "search"; break;
      case "close-search": state.screen = state.searchFrom || "discover"; break;
      case "search-tab": state.searchTab = id; break;
      case "remove-filter": delete state.searchFilters[id]; break;
      case "home-tab": state.homeTab = id; break;
      case "profile-tab": state.profileTab = id; break;
      case "chat-tab": state.chatFilter = id; break;
      case "join": state.joined[id] = !state.joined[id]; break;
      case "approve": state.approved[id] = !state.approved[id]; break;
      case "like": state.liked[id] = !state.liked[id]; state.likes[id] += state.liked[id] ? 1 : -1; break;
      default: state.createMenuOpen = false; state.assistantOpen = false; state.screen = action;
    }
    render();
    schedulePhoneUsable();
  });

  if (tryBtn) {
    tryBtn.addEventListener("click", function () {
      state.screen = "welcomeEvents";
      state.onbStep = 0;
      state.createMenuOpen = false;
      state.assistantOpen = false;
      state.assistantExitOpen = false;
      render();
      schedulePhoneUsable();
      if (phone) {
        phone.classList.add("is-focus");
        window.setTimeout(function () { phone.classList.remove("is-focus"); }, 900);
      }
    });
  }

  render();
  if (window.location.hash === "#app-preview") {
    schedulePhoneUsable();
    window.setTimeout(schedulePhoneUsable, 700);
  }
})();
