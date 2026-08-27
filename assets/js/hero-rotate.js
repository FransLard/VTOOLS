(function () {
  "use strict";
  var WORDS = ["creator", "video", "viral", "reels", "shorts"];
  var INTERVAL = 2300;
  var OUT_MS = 320;

  function init() {
    var el = document.getElementById("mlRotateWord");
    if (!el) return;
    if (WORDS.indexOf(el.textContent.trim().toLowerCase()) === -1) {
      WORDS = [el.textContent.trim()].concat(WORDS.filter(function (w) {
        return w !== el.textContent.trim();
      }));
    }
  function fitSize() {
    el.classList.remove("is-long");
    el.classList.remove("is-mid");
  }
  var box = el.parentElement;
  var meas = null;
  function measure(text) {
    try {
      if (!meas) {
        meas = document.createElement("span");
        meas.style.cssText = "position:absolute;top:0;left:0;visibility:hidden;white-space:nowrap;pointer-events:none;";
        document.body.appendChild(meas);
      }
      var cs = window.getComputedStyle(el);
      meas.style.fontFamily = cs.fontFamily;
      meas.style.fontWeight = cs.fontWeight;
      meas.style.fontSize = cs.fontSize;
      meas.style.letterSpacing = cs.letterSpacing;
      meas.textContent = text;
      return meas.offsetWidth;
    } catch (e) { return 0; }
  }
  function syncWidth(text) {
    if (!box) return;
    var w = measure(text);
    if (w > 0) box.style.width = Math.ceil(w + 1) + "px";
  }
    var i = WORDS.indexOf(el.textContent.trim());
    if (i < 0) i = 0;
    fitSize();
    syncWidth(el.textContent.trim());
    try {
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { syncWidth(el.textContent.trim()); });
    } catch (e) {}
    window.addEventListener("resize", function () { syncWidth(el.textContent.trim()); });
    window.addEventListener("qm:langchange", function () { setTimeout(function () { syncWidth(el.textContent.trim()); }, 60); });
    var reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    if (reduce) return;
    var timer = null;
    function next() {
      try { if (box) box.style.width = el.offsetWidth + "px"; } catch (e) {}
      void el.offsetWidth;
      el.classList.add("is-out");
      setTimeout(function () {
        i = (i + 1) % WORDS.length;
        el.textContent = WORDS[i];
        fitSize();
        syncWidth(WORDS[i]);
        el.classList.remove("is-out");
        el.classList.add("is-in");
        void el.offsetWidth;
        requestAnimationFrame(function () {
          el.classList.remove("is-in");
        });
      }, OUT_MS);
    }
    timer = setInterval(function () {
      if (document.hidden) return;
      var panel = document.getElementById("panel-beranda");
      if (panel && !panel.classList.contains("active-panel")) return;
      next();
    }, INTERVAL);
    window.addEventListener("beforeunload", function () { if (timer) clearInterval(timer); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
