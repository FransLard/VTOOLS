(function () {
  "use strict";
  var KEY = "velardErrLog";
  var MAX = 50;
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch (e) { return []; }
  }
  function write(v) {
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
  }
  function push(msg, src, line) {
    var log = read();
    log.push({ t: new Date().toISOString(), msg: String(msg).slice(0, 300), src: String(src || "").slice(-80), line: line || 0 });
    while (log.length > MAX) log.shift();
    write(log);
    showBadge();
  }
  function text() {
    return read().map(function (e) { return e.t + " | " + e.msg + " (" + e.src + ":" + e.line + ")"; }).join("\n");
  }
  function showBadge() {
    if (!read().length) return;
    if (document.getElementById("errBadge")) return;
    try {
      var css = "#errBadge{position:fixed;right:14px;bottom:76px;z-index:2147483645;width:38px;height:38px;border-radius:50%;border:none;background:#8e1e2e;color:#fff;font-weight:800;font-size:18px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}";
      var st = document.createElement("style");
      st.textContent = css;
      document.head.appendChild(st);
      var b = document.createElement("button");
      b.id = "errBadge";
      b.type = "button";
      b.textContent = "!";
      b.setAttribute("aria-label", "Salin info error");
      b.addEventListener("click", function () { api.copy(); });
      document.body.appendChild(b);
    } catch (e) {}
  }
  var api = {
    get: read,
    clear: function () {
      write([]);
      var b = document.getElementById("errBadge");
      if (b) b.remove();
    },
    copy: function () {
      var t = text();
      if (!t) return;
      function done(ok) {
        try {
          var langEn = window.i18n && window.i18n.getLang && window.i18n.getLang() === "en";
          var toast = document.getElementById("appToast");
          if (toast && ok) {
            var v = (window.i18n && window.i18n.t) ? window.i18n.t("errCopied") : "";
            toast.textContent = (v && v !== "errCopied") ? v : (langEn ? "Error info copied." : "Info error tersalin.");
            toast.classList.add("show");
            clearTimeout(api._t);
            api._t = setTimeout(function () { toast.classList.remove("show"); }, 2500);
          }
        } catch (e) {}
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(t).then(function () { done(true); }, function () { done(false); });
        } else { done(false); }
      } catch (e) { done(false); }
    }
  };
  window.velardErrorLog = api;
  try {
    var _old = read();
    var _kept = _old.filter(function (e) { return !isBenignMediaError(e && e.msg); });
    if (_kept.length !== _old.length) {
      write(_kept);
      if (!_kept.length) {
        var _b = document.getElementById("errBadge");
        if (_b) _b.remove();
      }
    }
  } catch (e2) {}
  window.addEventListener("error", function (e) {
    push(e.message || "Script error", e.filename || "", e.lineno || 0);
  });
  function isBenignMediaError(msg) {
    var s = String(msg || "");
    if (/play\(\) request was interrupted/i.test(s)) return true;
    if (/play\(\) failed because the user didn/i.test(s)) return true;
    if (/NotAllowedError.*play/i.test(s)) return true;
    if (/AbortError/i.test(s) && /play|pause|load/i.test(s)) return true;
    if (/goo\.gl\/LdLk22/i.test(s)) return true;
    return false;
  }
  window.addEventListener("unhandledrejection", function (e) {
    var m = e.reason && (e.reason.message || e.reason);
    if (isBenignMediaError(m)) {
      try { e.preventDefault(); } catch (err) {}
      return;
    }
    push("Unhandled rejection: " + m, "", 0);
  });
  if (read().length) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", showBadge);
    } else {
      showBadge();
    }
  }
})();
