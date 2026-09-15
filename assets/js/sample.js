(function () {
  "use strict";
  function t(key, fb) {
    try {
      if (window.i18n && window.i18n.t) {
        var v = window.i18n.t(key);
        if (v && v !== key) return v;
      }
    } catch (e) {}
    return fb;
  }
  function notify(msg) {
    try {
      var toast = document.getElementById("appToast");
      if (toast) {
        toast.textContent = msg;
        toast.classList.add("show");
        clearTimeout(notify._t);
        notify._t = setTimeout(function () { toast.classList.remove("show"); }, 3500);
        return;
      }
    } catch (e) {}
    try { alert(msg); } catch (e2) {}
  }
  function makeSample() {
    return new Promise(function (resolve, reject) {
      try {
        if (typeof MediaRecorder === "undefined") { reject(new Error("norec")); return; }
        var W = 640, H = 360;
        var cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        var ctx = cv.getContext("2d");
        var stream = cv.captureStream(30);
        var mime = "";
        try {
          if (window.MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) mime = "video/webm;codecs=vp9";
          else if (window.MediaRecorder.isTypeSupported("video/webm")) mime = "video/webm";
        } catch (e) {}
        var rec = mime ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000 }) : new MediaRecorder(stream);
        var chunks = [];
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = function () { resolve(new Blob(chunks, { type: "video/webm" })); };
        rec.onerror = function () { reject(new Error("rec")); };
        var t0 = performance.now();
        function draw() {
          var p = (performance.now() - t0) / 3000;
          if (p >= 1) p = 1;
          var g = ctx.createLinearGradient(0, 0, W, H);
          g.addColorStop(0, "#8e1e2e");
          g.addColorStop(1, "#f2557a");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = "rgba(255,255,255,.9)";
          var bw = Math.round(W * p);
          ctx.fillRect(0, H - 26, bw, 26);
          ctx.fillStyle = "#fff";
          ctx.font = "700 44px system-ui,sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("VelardTools", W / 2, H / 2 - 8);
          ctx.font = "400 22px system-ui,sans-serif";
          ctx.fillText("video contoh", W / 2, H / 2 + 30);
          if (p < 1) requestAnimationFrame(draw);
        }
        draw();
        rec.start(250);
        setTimeout(function () { try { rec.stop(); } catch (e) { reject(e); } }, 3200);
      } catch (e) { reject(e); }
    });
  }
  function openQuality() {
    try {
      if (window.velardActivatePanel) window.velardActivatePanel("tools", true);
    } catch (e) {}
    setTimeout(function () {
      try {
        if (window.velardToolModal && window.velardToolModal.open) window.velardToolModal.open("quality");
      } catch (e) {}
    }, 450);
  }
  function init() {
    var btn = document.getElementById("qmSampleBtn");
    if (!btn || btn.getAttribute("data-sample")) return;
    btn.setAttribute("data-sample", "1");
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (document.body.classList.contains("is-tool-processing")) {
          notify(t("processing", "Memproses..."));
          return;
        }
      } catch (err) {}
      var input = document.getElementById("fileInput");
      if (!input) return;
      var old = btn.disabled;
      btn.disabled = true;
      notify(t("sampleBusy", "Membuat video contoh..."));
      makeSample().then(function (blob) {
        var file = new File([blob], "velard-sample.webm", { type: "video/webm" });
        try {
          var dt = new DataTransfer();
          dt.items.add(file);
          input.files = dt.files;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (err) {
          notify(t("sampleFail", "Browser ini tidak mendukung perekam video."));
          btn.disabled = old;
          return;
        }
        btn.disabled = old;
        notify(t("sampleReady", "Video contoh siap. Silakan tekan Proses Video."));
        openQuality();
      }).catch(function () {
        btn.disabled = old;
        notify(t("sampleFail", "Browser ini tidak mendukung perekam video."));
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
