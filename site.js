
document.addEventListener("DOMContentLoaded", function() {
  var navToggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-nav]");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function() {
      var open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  document.querySelectorAll(".quote-form,.application-form").forEach(function(form) {
    form.addEventListener("submit", function(event) {
      event.preventDefault();
      var button = form.querySelector("button");
      if (!button) return;
      var old = button.textContent;
      button.textContent = "Ready to send";
      setTimeout(function() { button.textContent = old; }, 2200);
    });
  });

  function formatOdometer(value, suffix, format, decimals) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) return String(value || "0") + (suffix || "");
    var text = numeric.toFixed(decimals || 0);
    if (format === "comma") text = Number(text).toLocaleString("en-US", { maximumFractionDigits: decimals || 0, minimumFractionDigits: decimals || 0 });
    return text + (suffix || "");
  }

  document.querySelectorAll(".odometer").forEach(function(el) {
    var value = el.dataset.value || "0";
    var suffix = el.dataset.suffix || "";
    var format = el.dataset.format || "";
    var decimals = value.includes(".") ? 1 : 0;
    el.textContent = formatOdometer(value, suffix, format, decimals);
  });

  function normalizeService(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function initQuoteServicePrefill() {
    var select = document.querySelector('.quote-form select[name="service"]');
    if (!select) return;
    var requested = new URLSearchParams(window.location.search).get("service");
    if (!requested) return;
    var normalized = normalizeService(requested);
    var match = Array.prototype.find.call(select.options, function(option) {
      return option.value === requested || option.textContent === requested || normalizeService(option.value || option.textContent) === normalized;
    });
    if (!match) return;
    select.value = match.value || match.textContent;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  initQuoteServicePrefill();

  function initHeroScrollVideo() {
    var hero = document.querySelector(".home-hero");
    var video = document.querySelector(".home-hero-video");
    if (!hero || !video) return;

    var duration = 0;
    var progress = 0;
    var raf = 0;
    var touchY = null;
    var scrubPixels = 1800;
    var releaseStart = 0.6;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function applyProgress() {
      raf = 0;
      if (!duration || !Number.isFinite(duration)) return;
      var targetTime = progress * Math.max(duration - 0.025, 0);
      if (Math.abs(video.currentTime - targetTime) > 0.018) {
        video.currentTime = targetTime;
      }
      if (!video.paused) video.pause();
      video.dataset.scrollProgress = progress.toFixed(4);
    }

    function requestApply() {
      if (!raf) raf = requestAnimationFrame(applyProgress);
    }

    function atPageTop() {
      return window.scrollY <= 2;
    }

    function shouldScrub(delta) {
      if (delta > 0 && progress < 1) return true;
      return delta < 0 && progress > 0 && atPageTop();
    }

    function scrubBy(delta) {
      progress = clamp(progress + delta / scrubPixels, 0, 1);
      requestApply();
    }

    function releaseFactor() {
      var t = clamp((progress - releaseStart) / (1 - releaseStart), 0, 1);
      return Math.pow(t, 2.15);
    }

    function releasePage(delta) {
      if (delta <= 0 || progress <= releaseStart) return;
      window.scrollBy(0, delta * releaseFactor() * 1.15);
    }

    function handleScrubInput(delta, scrollDelta) {
      if (!duration || !shouldScrub(delta)) return false;
      scrubBy(delta);
      releasePage(scrollDelta);
      return true;
    }

    function onWheel(event) {
      if (!handleScrubInput(event.deltaY, event.deltaY)) return;
      event.preventDefault();
    }

    function onTouchStart(event) {
      if (!event.touches || !event.touches.length) return;
      touchY = event.touches[0].clientY;
    }

    function onTouchMove(event) {
      if (touchY === null || !event.touches || !event.touches.length) return;
      var nextY = event.touches[0].clientY;
      var delta = touchY - nextY;
      touchY = nextY;
      if (!handleScrubInput(delta * 2.2, delta)) return;
      event.preventDefault();
    }

    function onKeyDown(event) {
      var downKeys = ["ArrowDown", "PageDown", " ", "Spacebar"];
      var upKeys = ["ArrowUp", "PageUp"];
      var delta = 0;
      if (downKeys.indexOf(event.key) !== -1) delta = 180;
      if (upKeys.indexOf(event.key) !== -1) delta = -180;
      if (!delta || !handleScrubInput(delta, delta)) return;
      event.preventDefault();
    }

    function keepPageLocked() {
      if (atPageTop() || progress >= releaseStart) return;
      window.scrollTo(0, 0);
    }

    function primeVideo() {
      duration = video.duration || 0;
      progress = 0;
      video.pause();
      video.currentTime = 0;
      video.dataset.scrollProgress = "0.0000";
      requestApply();
    }

    video.addEventListener("loadedmetadata", primeVideo);
    video.addEventListener("play", function() { video.pause(); });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", keepPageLocked, { passive: true });
    window.addEventListener("resize", requestApply);

    if (video.readyState >= 1) primeVideo();
    else video.load();
    requestApply();
  }

  function initKineticMarquee() {
    var rows = document.querySelectorAll(".marquee-row");
    if (!rows.length) return;
    rows.forEach(function(row) {
      var content = row.querySelector(".marquee-content");
      if (!content || row.dataset.cloned === "true") return;
      var originalWidth = content.offsetWidth || row.scrollWidth || 1;
      row.appendChild(content.cloneNode(true));
      var targetWidth = Math.max(window.innerWidth * 3, row.offsetWidth * 3, originalWidth * 2, 1200);
      while (row.scrollWidth < targetWidth) {
        row.appendChild(content.cloneNode(true));
      }
      row.dataset.cloned = "true";
    });

    var baseSpeed = 42;
    var scrollVelocity = 0;
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.create({
        onUpdate: function(self) {
          scrollVelocity = Math.abs(self.getVelocity());
        }
      });
    }

    rows.forEach(function(row) {
      var content = row.querySelector(".marquee-content");
      if (!content) return;
      var direction = row.dataset.direction === "right" ? 1 : -1;
      var speedMult = parseFloat(row.dataset.speed) || 1;
      var contentWidth = content.offsetWidth || row.scrollWidth / 2 || 1;
      var x = direction === -1 ? 0 : -contentWidth;

      function animate() {
        var speed = (baseSpeed + scrollVelocity * 0.035) * speedMult;
        if (direction === -1) x -= speed / 60;
        else x += speed / 60;
        if (direction === -1 && x <= -contentWidth) x += contentWidth;
        if (direction === 1 && x >= 0) x -= contentWidth;
        row.style.transform = "translateX(" + x + "px)";
        requestAnimationFrame(animate);
      }
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) animate();
    });
  }

  function spawnParticles(cx, cy, color) {
    for (var i = 0; i < 20; i++) {
      var p = document.createElement("div");
      p.className = "particle";
      p.style.background = color;
      p.style.left = cx + "px";
      p.style.top = cy + "px";
      document.body.appendChild(p);
      var angle = Math.random() * Math.PI * 2;
      var dist = 40 + Math.random() * 80;
      var dx = Math.cos(angle) * dist;
      var dy = Math.sin(angle) * dist - 40;
      p.style.transition = "all .6s cubic-bezier(.16,1,.3,1)";
      p.offsetHeight;
      p.style.transform = "translate(" + dx + "px," + dy + "px) scale(0)";
      p.style.opacity = "0";
      setTimeout(function(el) { el.remove(); }, 700, p);
    }
  }

  function spawnRing(cx, cy, color) {
    var r = document.createElement("div");
    r.className = "ring";
    r.style.borderColor = color;
    r.style.left = cx + "px";
    r.style.top = cy + "px";
    r.style.width = "10px";
    r.style.height = "10px";
    r.style.marginLeft = "-5px";
    r.style.marginTop = "-5px";
    document.body.appendChild(r);
    r.style.transition = "all .5s cubic-bezier(.16,1,.3,1)";
    r.offsetHeight;
    r.style.width = "120px";
    r.style.height = "120px";
    r.style.marginLeft = "-60px";
    r.style.marginTop = "-60px";
    r.style.opacity = "1";
    setTimeout(function() { r.style.opacity = "0"; }, 200);
    setTimeout(function() { r.remove(); }, 600);
  }

  function initParticleButtons() {
    document.querySelectorAll(".btn,.header-quote,.header-phone").forEach(function(btn) {
      btn.addEventListener("click", function() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        var rect = btn.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var color = btn.classList.contains("secondary") ? "#f7f7f4" : "#e53039";
        spawnParticles(cx, cy, color);
        spawnRing(cx, cy, color);
      });
    });
  }

  initHeroScrollVideo();
  initKineticMarquee();
  initParticleButtons();

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll(".service-card,.wide-card,.stack-cards article,.stat,.trust-stat-card,.quote-section,.framed-media,.support-media,.proof-card,.marquee-section,.mini-grid article,.planning-grid article").forEach(function(el) {
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function() {
          gsap.fromTo(el, { opacity: .28, y: 18 }, { opacity: 1, y: 0, duration: .55, ease: "power2.out" });
        }
      });
    });
    document.querySelectorAll(".odometer").forEach(function(el) {
      var value = el.dataset.value || "0";
      var suffix = el.dataset.suffix || "";
      var format = el.dataset.format || "";
      var target = parseFloat(value);
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function() {
          gsap.to(obj, {
            v: target,
            duration: 1.5,
            ease: "power3.out",
            onUpdate: function() {
              var decimals = value.includes(".") ? 1 : 0;
              el.textContent = formatOdometer(obj.v, suffix, format, decimals);
            }
          });
        }
      });
    });
  }
});
