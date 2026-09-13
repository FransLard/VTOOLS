/* VelardTools — panel Lainnya satu scroll: gabungkan semua template inline,
   tanpa klik kartu. Urutan: Tutorial Upload -> ... -> Riwayat Pembaruan. */
(function () {
  "use strict";
  var ORDER = ["tut-upload", "tut-qm", "spec", "faq", "social", "report", "changelog"];

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

  /* Ubah 4 info spesifikasi pertama jadi kartu statistik ala referensi:
     label sebagai kicker, nilai singkat sebagai angka besar. */
  var SPEC_VALS = ["FFmpeg WASM + Patch JavaScript", "1500 MB", "MP4 · H.264", "360p–1080p FULL HD"];

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

  build();
  specStats();
  nav();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { build(); specStats(); });
  }
})();
