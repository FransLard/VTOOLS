(function () {
  "use strict";

  var PUB_KEY = "5xKmdLZIxzxQ_4xWG";
  var SERVICE_ID = "service_iopxgcj";
  var TEMPLATE_ID = "template_7iu1nhm";
  var RL_KEY = "qmHelpRl";

  function $(s, r) { return (r || document).querySelector(s); }
  function modal() { return document.getElementById("help-modal"); }
  function msgEl() { return document.getElementById("help-msg"); }
  function statusEl() { return document.getElementById("help-status"); }
  function sendBtn() { return document.getElementById("help-send"); }
  function wcEl() { return document.getElementById("help-wc"); }

  function openHelp() {
    var m = modal();
    if (!m) return;
    var st = statusEl(), ta = msgEl();
    if (st) { st.textContent = ""; st.setAttribute("data-kind", ""); }
    m.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(function () { try { ta && ta.focus({ preventScroll: true }); } catch (e) { try { ta && ta.focus(); } catch (_) {} } }, 60);
  }

  function closeHelp() {
    var m = modal();
    if (!m) return;
    m.hidden = true;
    document.body.style.overflow = "";
  }

  function ensureEmailJs() {
    try {
      if (window.emailjs && !window._emailJsInited) {
        window.emailjs.init({ publicKey: PUB_KEY });
        window._emailJsInited = true;
      }
    } catch (e) {}
    return !!(window.emailjs && window.emailjs.send);
  }

  function langIsEn() {
    try {
      if (window.i18n && window.i18n.getLang) return window.i18n.getLang() === "en";
    } catch (e) {}
    var b = document.querySelector('.lang-btn.active[data-lang="en"]');
    return !!b;
  }
  function wordCount(s) {
    var m = (s || "").trim().match(/\S+/g);
    return m ? m.length : 0;
  }
  function readRL() {
    try { return JSON.parse(localStorage.getItem(RL_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function writeRL(v) {
    try { localStorage.setItem(RL_KEY, JSON.stringify(v)); } catch (e) {}
  }

  function fallbackSend() {
    var ta = msgEl(), st = statusEl(), btn = sendBtn();
    if (!ta || !st || !btn) return;
    setTimeout(function () {
      var busy = btn.disabled;
      var hasStatus = (st.textContent || "").trim().length > 0;
      if (busy || hasStatus) return;
      var en = langIsEn();
      var hp = document.getElementById("help-hp");
      var text = (ta.value || "").trim();
      var n = wordCount(text);
      function set(msg, kind) {
        st.textContent = msg;
        st.setAttribute("data-kind", kind || "");
      }
      if (hp && hp.value.trim()) { hp.value = ""; set(en ? "Spam detected, please try again" : "Terdeteksi spam, coba lagi", "error"); return; }
      if (!text) { set(en ? "Message cannot be empty" : "Pesan tidak boleh kosong", "error"); return; }
      if (n < 5) { set(en ? "Minimum 5 words, please write more completely" : "Minimal 5 kata, tulis lebih lengkap", "error"); return; }
      if (text.length > 2000) { set(en ? "Maximum 2000 characters" : "Maksimal 2000 karakter", "error"); return; }
      var now = Date.now(), rl = readRL(), hour = Math.floor(now / 3600000);
      if (!rl.hour || rl.hour !== hour) rl = { hour: hour, count: 0, last: 0 };
      if (now - (rl.last || 0) < 30000) {
        var s = Math.ceil((30000 - (now - rl.last)) / 1000);
        set(en ? "Please wait " + s + " seconds before sending again" : "Tunggu " + s + " detik sebelum kirim lagi", "error");
        return;
      }
      if ((rl.count || 0) >= 5) {
        set(en ? "Limit 5 messages per hour, please contact via TikTok @ve1ard" : "Batas 5 pesan per jam, silakan hubungi via TikTok @ve1ard", "error");
        return;
      }
      rl.last = now; rl.count = (rl.count || 0) + 1; writeRL(rl);
      if (!ensureEmailJs()) {
        set((en ? "EmailJS send failed - check connection and retry (5/hour limit)" : "Gagal kirim ke EmailJS - cek koneksi dan coba lagi (limit 5/jam)") + " (EmailJS belum siap, refresh halaman)", "error");
        return;
      }
      set(en ? "Sending..." : "Mengirim...", "sending");
      btn.disabled = true;
      var isLocal = location.hostname === "127.0.0.1" || location.hostname === "localhost";
      var p = isLocal
        ? new Promise(function (res) { setTimeout(function () { res({ status: 200 }); }, 700); })
        : window.emailjs.send(SERVICE_ID, TEMPLATE_ID, {
            from_name: "VelardTools User",
            subject: en ? "VelardTools Bug / Help Report" : "VelardTools Laporan Bug / Bantuan",
            message: (en ? "REPORT FROM VELARD TOOLS" : "LAPORAN DARI VELARD TOOLS") + "\n\n" + text
          });
      p.then(function () {
        set(en ? "Message sent! Thank you." : "Pesan terkirim! Terima kasih.", "ok");
        setTimeout(closeHelp, 1800);
      }).catch(function (err) {
        var d = (err && (err.text || err.message)) ? String(err.text || err.message) : "";
        try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch (e) {}
        set((en ? "EmailJS send failed - check connection and retry (5/hour limit)" : "Gagal kirim ke EmailJS - cek koneksi dan coba lagi (limit 5/jam)") + (d ? " (" + d.slice(0, 90) + ")" : ""), "error");
      }).then(function () { btn.disabled = false; });
    }, 600);
  }

  document.addEventListener("click", function (e) {
    var b = e && e.target && e.target.closest ? e.target.closest("[data-open-help]") : null;
    if (b) { e.preventDefault(); ensureEmailJs(); openHelp(); return; }
    var m = modal();
    if (m && !m.hidden && e.target === m) closeHelp();
  });

  document.addEventListener("keydown", function (e) {
    if ((e.key === "Escape" || e.key === "Esc") && modal() && !modal().hidden) closeHelp();
  });

  document.addEventListener("click", function (e) {
    var b = e && e.target && e.target.closest ? e.target.closest("#help-send") : null;
    if (b) { ensureEmailJs(); fallbackSend(); }
  });

  window.velardOpenHelp = openHelp;
  window.velardCloseHelp = closeHelp;
  window.velardReport = { open: openHelp, close: closeHelp };
})();
