(function () {
  "use strict";
  var ORDER = ["privacy", "tut-upload", "tut-qm", "spec", "faq", "social", "report", "changelog"];

  function build() {
    var stack = document.getElementById("othersStack");
    if (!stack || stack.getAttribute("data-built")) return;
    var out = "";
    for (var i = 0; i < ORDER.length; i++) {
      var tpl = document.getElementById("tpl-" + ORDER[i]);
      if (!tpl) continue;
      out += '<section class="others-section" id="others-' + ORDER[i] + '">' + tpl.innerHTML + "</section>";
    }
    if (!out) return;
    stack.innerHTML = out;
    stack.setAttribute("data-built", "1");
  }

  var SPEC_VALS = ["FFmpeg WASM + Patch JavaScript", "1500 MB", "MP4 · MKV · MP3", "360p–1080p FULL HD"];

  function specStats() {
    var grid = document.querySelector("#others-spec .spec-grid");
    if (!grid || grid.getAttribute("data-stats")) return;
    var cells = grid.children;
    for (var i = 0; i < 4 && i < cells.length; i++) {
      cells[i].classList.add("spec-stat");
      var st = cells[i].querySelector("strong");
      if (st) st.textContent = st.textContent.replace(/:\s*$/, "");
      var sp = cells[i].querySelector("span");
      if (sp) {
        sp.removeAttribute("data-i18n");
        sp.removeAttribute("data-i18n-html");
        sp.textContent = SPEC_VALS[i];
      }
    }
    if (cells.length > 4) cells[cells.length - 1].classList.add("spec-note");
    grid.setAttribute("data-stats", "1");
  }

  function nav() {
    document.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest(".others-stack-nav button[data-target]") : null;
      if (!b) return;
      var s = document.getElementById(b.getAttribute("data-target"));
      if (s && s.scrollIntoView) {
        e.preventDefault();
        try { s.scrollIntoView({ behavior: "smooth", block: "start" }); }
        catch (err) { s.scrollIntoView(); }
      }
    });
  }

  function privacyCount() {
    var el = document.getElementById("privacyUsersNum");
    if (!el || el.getAttribute("data-done")) return;
    function fmt(n) { return n >= 1000 ? "1K+" : String(n); }
    function run() {
      el.setAttribute("data-done", "1");
      var target = parseInt(el.getAttribute("data-count") || "1000", 10) || 1000;
      var reduce = false;
      try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
      if (reduce) { el.textContent = fmt(target); return; }
      var t0 = null, dur = 1000;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(eased * target));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ("IntersectionObserver" in window) {
      var o = new IntersectionObserver(function (es) {
        for (var i = 0; i < es.length; i++) {
          if (es[i].isIntersecting) { try { o.disconnect(); } catch (e) {} run(); }
        }
      }, { threshold: 0.3 });
      o.observe(el);
    } else { run(); }
  }

  build();
  specStats();
  nav();
  privacyCount();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { build(); specStats(); privacyCount(); });
  }
})();
