/* VelardTools — hero rotating word: efficient > youtuber > tiktoker > editor > everything */
(function () {
  "use strict";
  var WORDS = ["efficient", "youtuber", "tiktoker", "editor", "everything"];
  var INTERVAL = 2300;
  var OUT_MS = 320;

  function init() {
    var el = document.getElementById("mlRotateWord");
    if (!el) return;
    if (WORDS.indexOf(el.textContent.trim().toLowerCase()) === -1) {
      // biarkan kata awal dari HTML apa adanya sebagai kata pertama
      WORDS = [el.textContent.trim()].concat(WORDS.filter(function (w) {
        return w !== el.textContent.trim();
      }));
    }
  function fitSize() {
    // font disamakan semua — tidak ada pengecilan otomatis
    el.classList.remove("is-long");
    el.classList.remove("is-mid");
  }
    var i = WORDS.indexOf(el.textContent.trim());
    if (i < 0) i = 0;
    fitSize();
    var reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    if (reduce) return;
    var timer = null;
    function next() {
      el.classList.add("is-out");
      setTimeout(function () {
        i = (i + 1) % WORDS.length;
        el.textContent = WORDS[i];
        fitSize();
        el.classList.remove("is-out");
        el.classList.add("is-in");
        // paksa reflow agar transisi masuk jalan
        void el.offsetWidth;
        requestAnimationFrame(function () {
          el.classList.remove("is-in");
        });
      }, OUT_MS);
    }
    timer = setInterval(function () {
      // jeda saat tab tidak terlihat / hero tidak aktif
      if (document.hidden) return;
      var panel = document.getElementById("panel-beranda");
      if (panel && !panel.classList.contains("active-panel")) return;
      next();
    }, INTERVAL);
    // bersihkan saat unload (aman, tidak wajib)
    window.addEventListener("beforeunload", function () { if (timer) clearInterval(timer); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
