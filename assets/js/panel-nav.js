(function () {
  "use strict";
  var SHOW_AFTER = 600;

  function smoothOk() {
    try { return !window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch (e) { return true; }
  }

  function initToTop() {
    var btn = document.getElementById("toTopBtn");
    if (!btn) return;
    function onScroll() {
      var show = false;
      try {
        show = window.scrollY > SHOW_AFTER &&
          !document.body.classList.contains("tool-modal-open");
      } catch (e) {}
      btn.classList.toggle("is-show", show);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    btn.addEventListener("click", function () {
      try { window.scrollTo({ top: 0, behavior: smoothOk() ? "smooth" : "auto" }); }
      catch (e) { window.scrollTo(0, 0); }
    });
    onScroll();
  }

  function initSpy() {
    var nav = document.querySelector("#panel-others .others-stack-nav");
    var stack = document.getElementById("othersStack");
    if (!nav || !stack || !("IntersectionObserver" in window)) return;
    var btns = nav.querySelectorAll("button[data-target]");
    if (!btns.length) return;
    function setActive(id) {
      Array.prototype.forEach.call(btns, function (b) {
        b.classList.toggle("active", b.getAttribute("data-target") === id);
      });
    }
    var obs = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) {
        if (entries[k].isIntersecting) setActive(entries[k].target.id);
      }
    }, { root: null, rootMargin: "-40% 0px -55% 0px", threshold: 0 });
    function watch() {
      var secs = stack.querySelectorAll(".others-section[id]");
      Array.prototype.forEach.call(secs, function (s) { obs.observe(s); });
    }
    watch();
    var n = 0;
    var t = setInterval(function () { watch(); if (++n >= 5) clearInterval(t); }, 800);
  }

  function init() { initToTop(); initSpy(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
