(function () {
  "use strict";

  var PANELS = ["beranda", "tools", "donate", "others"];

  function activePanel() {
    return document.querySelector(".slide-panel.active-panel");
  }

  function activeName() {
    var p = activePanel();
    if (p && p.id && p.id.indexOf("panel-") === 0) return p.id.slice(6);
    var v = null;
    try { v = document.body.getAttribute("data-view"); } catch (e) {}
    return PANELS.indexOf(v) !== -1 ? v : "beranda";
  }

  // Pastikan body[data-view] selalu terisi (slide controller lama melewatkannya
  // saat index tujuan == index aktif, mis. fresh load beranda -> null).
  function ensureBodyView() {
    var v = null;
    try { v = document.body.getAttribute("data-view"); } catch (e) {}
    if (v) return v;
    var name = activeName();
    try { document.body.setAttribute("data-view", name); } catch (e) {}
    syncNav(name);
    return name;
  }

  function syncNav(name) {
    try {
      Array.prototype.forEach.call(document.querySelectorAll(".nav-item"), function (b) {
        var on = b.getAttribute("data-panel") === name;
        b.classList.toggle("active", on);
        if (on) b.setAttribute("aria-current", "page");
        else b.removeAttribute("aria-current");
      });
      Array.prototype.forEach.call(document.querySelectorAll(".floating-nav-item"), function (b) {
        var on = b.getAttribute("data-panel") === name;
        b.classList.toggle("active", on);
        if (on) b.setAttribute("aria-current", "page");
        else b.removeAttribute("aria-current");
      });
    } catch (e) {}
  }

  function measurePanel(panel) {
    try {
      var h = Math.ceil(panel.scrollHeight);
      if (h >= 20) return h;
      // Fallback: ukur via clone saat panel hidden (mis. non-aktif)
      var vp = document.querySelector(".cube-viewport");
      var w = vp ? vp.offsetWidth : 560;
      var c = panel.cloneNode(true);
      c.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;left:-9999px;top:0;height:auto;max-height:none;opacity:1;display:block;box-sizing:border-box;padding:0 16px;width:" + w + "px;";
      document.body.appendChild(c);
      h = Math.ceil(c.scrollHeight);
      document.body.removeChild(c);
      return h;
    } catch (e) { return 0; }
  }

  // Samakan tinggi viewport dengan panel aktif. Tanpa ini, teks ID/EN yang
  // panjang-pendek bikin konten kepotong (overflow hidden) atau blank.
  function syncViewportHeight() {
    var vp = document.querySelector(".cube-viewport");
    var panel = activePanel();
    if (!vp || !panel) return;
    var h = measurePanel(panel);
    if (h < 20) return;
    try {
      var cur = parseInt(vp.style.minHeight || "0", 10) || 0;
      if (Math.abs(h - cur) > 2) vp.style.minHeight = h + "px";
    } catch (e) {}
  }

  // Lebar kata rotate dihitung via JS (px inline). Hitung ulang setelah font /
  // bahasa berubah agar underline + centering mobile tetap pas.
  function syncRotateWidth() {
    try {
      var el = document.getElementById("mlRotateWord");
      if (!el) return;
      var box = el.parentElement;
      if (!box) return;
      var cs = window.getComputedStyle(el);
      var m = document.createElement("span");
      m.style.cssText = "position:absolute;top:0;left:0;visibility:hidden;white-space:nowrap;pointer-events:none;";
      m.style.fontFamily = cs.fontFamily;
      m.style.fontWeight = cs.fontWeight;
      m.style.fontSize = cs.fontSize;
      m.style.letterSpacing = cs.letterSpacing;
      m.textContent = el.textContent.trim();
      document.body.appendChild(m);
      var w = m.offsetWidth;
      document.body.removeChild(m);
      if (w > 0) box.style.width = Math.ceil(w + 1) + "px";
    } catch (e) {}
  }

  // Kembalikan track ke posisi panel aktif (jaga-jaga layout shift).
  function pinTrack() {
    try {
      var name = activeName();
      var i = PANELS.indexOf(name);
      var track = document.getElementById("velardSlideTrack");
      if (track && i >= 0) track.style.transform = "translateX(" + 100 * -i + "%)";
    } catch (e) {}
  }

  function refresh() {
    ensureBodyView();
    pinTrack();
    syncViewportHeight();
    syncRotateWidth();
  }

  function refreshDeferred() {
    refresh();
    setTimeout(refresh, 60);
    setTimeout(refresh, 350);
  }

  window.addEventListener("qm:langchange", refreshDeferred);
  window.addEventListener("resize", function () { ensureBodyView(); syncViewportHeight(); syncRotateWidth(); });
  window.addEventListener("orientationchange", function () { setTimeout(refreshDeferred, 120); });
  if (document.fonts && document.fonts.ready) {
    try { document.fonts.ready.then(function () { syncViewportHeight(); syncRotateWidth(); }); } catch (e) {}
  }

  function init() { ensureBodyView(); syncViewportHeight(); syncRotateWidth(); setTimeout(refresh, 300); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  window.addEventListener("load", function () { ensureBodyView(); setTimeout(refresh, 100); });
})();
