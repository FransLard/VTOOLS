(function () {
  "use strict";
  var KEY = "mlSiteBg";

  function current() {
    var v = document.documentElement.getAttribute("data-site-bg");
    return v === "black" ? "black" : "white";
  }

  function apply(v, save) {
    if (v !== "black" && v !== "white") v = "white";
    document.documentElement.setAttribute("data-site-bg", v);
    var opts = document.querySelectorAll(".ml-bg-opt");
    Array.prototype.forEach.call(opts, function (b) {
      var on = b.getAttribute("data-setbg") === v;
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.classList.toggle("is-active", on);
    });
    if (save) {
      try { localStorage.setItem(KEY, v); } catch (e) {}
    }
  }

  function init() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    apply(saved === "black" ? "black" : "white", false);
    var opts = document.querySelectorAll(".ml-bg-opt");
    Array.prototype.forEach.call(opts, function (b) {
      b.addEventListener("click", function () {
        apply(b.getAttribute("data-setbg"), true);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
