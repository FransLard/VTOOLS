(function () {
  "use strict";
  function msg() {
    try {
      if (window.i18n && window.i18n.t) {
        var v = window.i18n.t("offMsg");
        if (v && v !== "offMsg") return v;
      }
    } catch (e) {}
    return "Kamu offline. Tools butuh koneksi saat pertama memuat mesin.";
  }
  function bar() { return document.getElementById("offlineBar"); }
  function paint() {
    var b = bar();
    if (!b) return;
    var t = b.querySelector("[data-i18n]") || b;
    t.textContent = msg();
  }
  function sync() {
    var b = bar();
    if (!b) return;
    var off = false;
    try { off = navigator.onLine === false; } catch (e) {}
    b.hidden = !off;
  }
  function init() {
    var css = "#offlineBar{position:fixed;top:0;left:0;right:0;z-index:2147483646;background:#8e1e2e;color:#fff;text-align:center;font-size:13px;font-weight:600;padding:8px 12px}#offlineBar[hidden]{display:none}";
    try {
      var st = document.createElement("style");
      st.textContent = css;
      document.head.appendChild(st);
    } catch (e) {}
    paint();
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    window.addEventListener("qm:langchange", paint);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { paint(); sync(); });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
