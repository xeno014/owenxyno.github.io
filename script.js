/**
 * Portfolio — shared JavaScript
 * Handles: mobile nav, smooth scroll, scroll reveal,
 * sticky nav state, active links, back-to-top button, footer year
 */

(function () {
  "use strict";

  /* ========== Developer preloader ========== */
  var preloader = document.getElementById("preloader");
  var preloaderText = document.getElementById("preloader-text");
  var preloaderProgress = document.getElementById("preloader-progress");
  var LOADER_MESSAGES = [
    "Initializing Portfolio...",
    "Loading Assets...",
    "Launching Interface...",
  ];
  var MIN_LOADER_MS = 2500;

  function initPreloader() {
    if (!preloader) {
      document.body.classList.remove("preloader-active");
      document.body.classList.add("is-loaded");
      return;
    }

    var msgIndex = 0;
    var assetsLoaded = 0;
    var windowLoaded = false;
    var finished = false;
    var startTime = Date.now();

    if (preloaderText) {
      preloaderText.textContent = LOADER_MESSAGES[0];
    }

    var messageTimer = window.setInterval(function () {
      msgIndex = (msgIndex + 1) % LOADER_MESSAGES.length;
      if (preloaderText) {
        preloaderText.textContent = LOADER_MESSAGES[msgIndex];
      }
    }, 700);

    function setProgress(percent) {
      if (preloaderProgress) {
        preloaderProgress.style.width = Math.min(100, percent) + "%";
      }
    }

    function preloadImage(src) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = img.onerror = resolve;
        img.src = src;
      });
    }

    var assets = [];
    var profilePhoto = document.querySelector(".profile-photo");
    if (profilePhoto && profilePhoto.getAttribute("src")) {
      assets.push(profilePhoto.getAttribute("src"));
    }

    var totalAssets = assets.length || 1;

    Promise.all(
      assets.map(function (src) {
        return preloadImage(src);
      })
    ).then(function () {
      assetsLoaded = totalAssets;
      setProgress(assets.length ? 70 : 50);
    });

    window.addEventListener("load", function () {
      windowLoaded = true;
      setProgress(90);
      tryFinish();
    });

    function tryFinish() {
      if (finished) return;
      if (!windowLoaded) return;

      var elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADER_MS) {
        window.setTimeout(tryFinish, MIN_LOADER_MS - elapsed);
        return;
      }

      finished = true;
      window.clearInterval(messageTimer);
      setProgress(100);
      if (preloaderText) {
        preloaderText.textContent = "Launching Interface...";
      }

      preloader.classList.add("preloader--done");
      preloader.setAttribute("aria-busy", "false");
      document.body.classList.remove("preloader-active");
      document.body.classList.add("is-loaded");

      window.setTimeout(function () {
        preloader.setAttribute("aria-hidden", "true");
      }, 600);

      document.dispatchEvent(new CustomEvent("portfolio:loaded"));
    }

    window.setTimeout(tryFinish, MIN_LOADER_MS + 2500);
  }

  initPreloader();

  /* ========== Hero staged reveal + typewriter (home only) ========== */
  var HERO_INITIAL_DELAY_MS = 2500;
  var HERO_STAGGER_MS = 480;
  var HERO_TYPEWRITER_PHRASES = [
    "IT Systems & Automation needs? Message me.",
    "Infrastructure Support & Network Setup",
    "Want a Software-Hardware System Analysis? My specialty.",
    "Wanted a Workflow Optimization? Contact me.",
    "Want a Web-Based System Development? Connect with me.",
    "Need an IT Software & Hardware Consultation? Reach out to me.",
  ];

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function revealHeroStage(selector) {
    var el = document.querySelector(selector);
    if (el) {
      el.classList.add("is-revealed");
    }
  }

  function initHeroTypewriter() {
    var textEl = document.getElementById("hero-typewriter");
    if (!textEl) return null;

    var typeSpeed = 35;
    var deleteSpeed = 20;
    var phraseIndex = 0;
    var charIndex = 0;
    var isDeleting = false;
    var timerId = null;
    var stopped = false;

    function pauseMs() {
      return 1200 + Math.floor(Math.random() * 600);
    }

    function schedule(fn, delay) {
      timerId = window.setTimeout(fn, delay);
    }

    function tick() {
      if (stopped) return;

      var current = HERO_TYPEWRITER_PHRASES[phraseIndex];

      if (!isDeleting) {
        charIndex += 1;
        textEl.textContent = current.slice(0, charIndex);

        if (charIndex >= current.length) {
          schedule(function () {
            isDeleting = true;
            tick();
          }, pauseMs());
          return;
        }

        schedule(tick, typeSpeed);
        return;
      }

      charIndex -= 1;
      textEl.textContent = current.slice(0, charIndex);

      if (charIndex <= 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % HERO_TYPEWRITER_PHRASES.length;
        schedule(tick, pauseMs());
        return;
      }

      schedule(tick, deleteSpeed);
    }

    tick();

    return function destroy() {
      stopped = true;
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }

  function runHeroRevealSequence() {
    var heroInner = document.getElementById("hero-inner");
    if (!heroInner) return;

    if (prefersReducedMotion()) {
      heroInner.querySelectorAll(".hero__stage").forEach(function (stage) {
        stage.classList.add("is-revealed");
      });
      var reducedText = document.getElementById("hero-typewriter");
      if (reducedText) {
        reducedText.textContent = HERO_TYPEWRITER_PHRASES[0];
      }
      return;
    }

    var steps = [
      ".hero__stage--photo",
      ".hero__stage--greeting",
      ".hero__stage--name",
      ".hero__stage--role",
      ".hero__stage--terminal",
      ".hero__stage--subtitle",
      ".hero__stage--actions",
    ];

    var stepIndex = 0;

    function revealNext() {
      if (stepIndex >= steps.length) return;

      revealHeroStage(steps[stepIndex]);

      if (steps[stepIndex] === ".hero__stage--terminal") {
        window.setTimeout(initHeroTypewriter, 520);
      }

      stepIndex += 1;
      if (stepIndex < steps.length) {
        window.setTimeout(revealNext, HERO_STAGGER_MS);
      }
    }

    window.setTimeout(revealNext, HERO_INITIAL_DELAY_MS);
  }

  function initHeroExperience() {
    if (!document.getElementById("hero-inner")) return;

    if (document.body.classList.contains("is-loaded")) {
      runHeroRevealSequence();
    } else {
      document.addEventListener("portfolio:loaded", runHeroRevealSequence, { once: true });
    }
  }

  initHeroExperience();

  var SCROLL_TOP_THRESHOLD = 300;
  var NAVBAR = document.getElementById("navbar");
  var NAV_TOGGLE = document.getElementById("nav-toggle");
  var NAV_MENU = document.getElementById("nav-menu");
  var TOP_BTN = document.getElementById("top-btn");
  var YEAR_EL = document.getElementById("year");
  var IS_HOME = document.body.getAttribute("data-page") === "home";

  /* ========== Footer year ========== */
  if (YEAR_EL) {
    YEAR_EL.textContent = String(new Date().getFullYear());
  }

  /* ========== Mobile hamburger menu ========== */
  if (NAV_TOGGLE && NAV_MENU) {
    NAV_TOGGLE.addEventListener("click", function () {
      var isOpen = NAV_MENU.classList.toggle("is-open");
      NAV_TOGGLE.setAttribute("aria-expanded", String(isOpen));
      NAV_TOGGLE.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    /* Close menu when a link is clicked */
    NAV_MENU.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        NAV_MENU.classList.remove("is-open");
        NAV_TOGGLE.setAttribute("aria-expanded", "false");
        NAV_TOGGLE.setAttribute("aria-label", "Open menu");
      });
    });
  }

  /* ========== Smooth scroll for same-page anchor links ========== */
  function getCurrentPage() {
    var parts = window.location.pathname.split("/").filter(Boolean);
    var last = parts[parts.length - 1];
    if (!last || !/\.html$/i.test(last)) return "index.html";
    return last;
  }

  function normalizePage(path) {
    if (!path || path === "./") return "index.html";
    return path.replace(/^\.\//, "");
  }

  document.querySelectorAll('a[href*="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var href = link.getAttribute("href");
      if (!href || href === "#") return;

      var hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;

      var linkPage = normalizePage(href.slice(0, hashIndex));
      var hash = href.slice(hashIndex);
      var currentPage = getCurrentPage();

      /* Only smooth-scroll when the hash target is on this page */
      if (linkPage !== currentPage) return;

      var target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });

      if (history.replaceState) {
        history.replaceState(null, "", hash);
      }
    });
  });

  /* ========== Scroll reveal (Intersection Observer) ========== */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ========== Sticky navbar shadow + back-to-top visibility ========== */
  function onScroll() {
    var scrollY = window.scrollY || window.pageYOffset;

    if (NAVBAR) {
      NAVBAR.classList.toggle("navbar--scrolled", scrollY > 20);
    }

    if (TOP_BTN) {
      if (scrollY > SCROLL_TOP_THRESHOLD) {
        TOP_BTN.removeAttribute("hidden");
        TOP_BTN.classList.add("is-visible");
      } else {
        TOP_BTN.classList.remove("is-visible");
        /* Delay hiding attribute until fade-out completes */
        window.setTimeout(function () {
          if (!TOP_BTN.classList.contains("is-visible")) {
            TOP_BTN.setAttribute("hidden", "");
          }
        }, 350);
      }
    }

    if (IS_HOME) {
      updateActiveNavLink();
    }
  }

  /* ========== Active nav link on homepage (scroll spy) ========== */
  function updateActiveNavLink() {
    var sections = ["home", "projects", "skills", "contact"];
    var scrollPos = (window.scrollY || window.pageYOffset) + 120;
    var current = "home";

    sections.forEach(function (id) {
      var section = document.getElementById(id);
      if (section && section.offsetTop <= scrollPos) {
        current = id;
      }
    });

    document.querySelectorAll(".nav-link[data-section]").forEach(function (link) {
      var section = link.getAttribute("data-section");
      link.classList.toggle("nav-link--active", section === current);
      if (section === current) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  /* ========== Back to top — smooth scroll ========== */
  if (TOP_BTN) {
    TOP_BTN.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ========== Animate skill bars when skills section is visible ========== */
  var skillsSection = document.getElementById("skills");
  if (skillsSection && "IntersectionObserver" in window) {
    var skillObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            skillsSection.classList.add("skills--animated");
            skillsSection.querySelectorAll(".skill-bar span[data-width]").forEach(function (bar) {
              bar.style.width = bar.getAttribute("data-width") + "%";
            });
            observer.unobserve(skillsSection);
          }
        });
      },
      { threshold: 0.2 }
    );
    skillObserver.observe(skillsSection);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ========== Contact form — progressive unlock + mailto send ========== */
  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    var nameInput = document.getElementById("contact-name");
    var emailInput = document.getElementById("contact-email");
    var messageInput = document.getElementById("contact-message");
    var emailGroup = document.getElementById("email-group");
    var messageGroup = document.getElementById("message-group");
    var emailHint = document.getElementById("email-hint");
    var messageHint = document.getElementById("message-hint");
    var submitBtn = document.getElementById("contact-submit");
    var RECIPIENT = "owen.ravina14@gmail.com";

    function hasName() {
      return nameInput.value.trim().length > 0;
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    }

    function updateFormState() {
      var nameOk = hasName();
      var emailOk = isValidEmail(emailInput.value);

      if (nameOk) {
        emailGroup.classList.remove("form-group--locked");
        emailInput.disabled = false;
        if (emailHint) emailHint.classList.add("is-hidden");
      } else {
        emailGroup.classList.add("form-group--locked");
        emailInput.disabled = true;
        emailInput.value = "";
        if (emailHint) emailHint.classList.remove("is-hidden");
      }

      if (nameOk && emailOk) {
        messageGroup.classList.remove("form-group--locked");
        messageInput.disabled = false;
        if (messageHint) messageHint.classList.add("is-hidden");
      } else {
        messageGroup.classList.add("form-group--locked");
        messageInput.disabled = true;
        messageInput.value = "";
        if (messageHint) messageHint.classList.remove("is-hidden");
      }

      var messageOk = messageInput.value.trim().length > 0;
      submitBtn.disabled = !(nameOk && emailOk && messageOk);
    }

    nameInput.addEventListener("input", updateFormState);
    emailInput.addEventListener("input", updateFormState);
    messageInput.addEventListener("input", updateFormState);

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (submitBtn.disabled) return;

      var name = nameInput.value.trim();
      var email = emailInput.value.trim();
      var message = messageInput.value.trim();
      var subject = encodeURIComponent("Portfolio message from " + name);
      var body = encodeURIComponent(
        "Name: " + name + "\nReply-to: " + email + "\n\n" + message
      );

      window.location.href =
        "mailto:" + RECIPIENT + "?subject=" + subject + "&body=" + body;
    });

    updateFormState();
  }
})();
