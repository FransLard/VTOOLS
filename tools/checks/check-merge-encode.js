const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { JSDOM } = require("jsdom");

async function main() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const dom = new JSDOM(html, {
    url: "http://127.0.0.1:8000/", runScripts: "outside-only", pretendToBeVisual: true,
  });
  const window = dom.window;
  window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  window.HTMLMediaElement.prototype.pause = function () {};
  window.HTMLMediaElement.prototype.load = function () {};
  window.HTMLAnchorElement.prototype.click = function () {};
  let blobN = 0;
  window.URL.createObjectURL = function () { return "blob:mock" + (++blobN); };
  window.URL.revokeObjectURL = function () {};

  window.eval(fs.readFileSync(path.join(ROOT, "assets/js/app.js"), "utf8"));
  window.eval(fs.readFileSync(path.join(ROOT, "assets/js/merge.js"), "utf8"));
  const d = window.document;

  // mock elemen video: metadata instan (durasi + dimensi) agar targetSize teruji
  const meta = [
    { duration: 10, w: 1920, h: 1080 },
    { duration: 15, w: 1280, h: 720 },
  ];
  let mi = 0;
  const origCreate = window.document.createElement.bind(window.document);
  window.document.createElement = function (tag) {
    if (String(tag).toLowerCase() === "video") {
      const el = origCreate(tag);
      const m = meta[Math.min(mi++, meta.length - 1)];
      try { Object.defineProperty(el, "duration", { value: m.duration, configurable: true }); } catch (e) {}
      try { Object.defineProperty(el, "videoWidth", { value: m.w, configurable: true }); } catch (e) {}
      try { Object.defineProperty(el, "videoHeight", { value: m.h, configurable: true }); } catch (e) {}
      Object.defineProperty(el, "src", {
        configurable: true,
        get: function () { return this._s || ""; },
        set: function (v) {
          this._s = v;
          const self = this;
          setTimeout(function () { if (self.onloadedmetadata) self.onloadedmetadata(); }, 5);
        },
      });
      return el;
    }
    return origCreate(tag);
  };

  // --- FFmpeg palsu: input #1 ada audio, input #2 tanpa audio ---
  const execLog = [];
  const written = {};
  const order = []; // urutan exec/delete untuk cek pembebasan RAM
  let probeN = 0;
  let logCb = null;
  const subs = [];
  const fake = {
    on: function (ev, cb) { subs.push(ev); if (ev === "log") logCb = cb; },
    writeFile: async function (n, data) {
      try { written[n] = Buffer.from(data).toString("utf8").slice(0, 500); }
      catch (e) { written[n] = ""; }
    },
    exec: async function (args) {
      execLog.push(args.slice());
      order.push("exec:" + (args.includes("concat") ? "concat" : args[0] === "-hide_banner" ? "probe" : "norm"));
      if (args[0] === "-hide_banner" && args[1] === "-i") {
        probeN++;
        const L = [
          "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from '" + args[2] + "':",
          "  Stream #0:0: Video: h264, yuv420p, 1920x1080, 30 fps",
        ];
        if (probeN % 2 === 1) L.push("  Stream #0:1: Audio: aac, 44100 Hz, stereo");
        L.forEach(function (m) { if (logCb) logCb({ message: m }); });
        return;
      }
    },
    readFile: async function () { return new Uint8Array([0, 0, 0, 1]); },
    deleteFile: function (n) { order.push("del:" + n); },
  };
  window.velardFFmpeg = { load: async function () { return fake; } };

  window.velardMergeAdd([
    new window.File([new Uint8Array(10)], "a.mp4", { type: "video/mp4" }),
    new window.File([new Uint8Array(10)], "b.mp4", { type: "video/mp4" }),
  ]);
  await new Promise(function (r) { setTimeout(r, 150); }); // tunggu metadata mock
  await window.velardMergeRun();

  const fails = [];
  function ok(name, cond) {
    console.log((cond ? "OK " : "FAIL ") + name);
    if (!cond) fails.push(name);
  }
  const normCalls = execLog.filter(function (a) { return a.includes("-c:v") && a.includes("libx264"); });
  const concatCalls = execLog.filter(function (a) { return a.includes("concat"); });
  ok("2x normalisasi (satu per input)", normCalls.length === 2);
  ok("vf reset PTS + CFR", normCalls.every(function (a) {
    const i = a.indexOf("-vf");
    return i !== -1 && a[i + 1].includes("setpts=PTS-STARTPTS") && a[i + 1].includes("fps=30");
  }));
  ok("input ber-audio pakai -af", normCalls[0].includes("-af"));
  ok("input tanpa audio disuntik anullsrc+shortest",
    normCalls[1].includes("anullsrc=r=44100:cl=stereo") && normCalls[1].includes("-shortest"));
  ok("concat pakai +genpts", concatCalls.length === 1 && concatCalls[0].includes("+genpts"));
  const listName = Object.keys(written).filter(function (k) { return k.startsWith("merge_list_"); })[0];
  ok("concat hanya makan file normalisasi",
    !!listName && written[listName].includes("merge_norm0_") && written[listName].includes("merge_norm1_")
    && !written[listName].includes("merge_in"));
  ok("tidak ada -c copy file mentah",
    !execLog.some(function (a) { return a.includes("-c") && a.includes("copy") && !a.includes("+genpts"); }));
  ok("progress FFmpeg dilanggan", subs.includes("progress"));
  ok("threads diset", normCalls.every(function (a) { return a.includes("-threads"); }));
  const concatIdx = order.indexOf("exec:concat");
  const delIn0 = order.findIndex(function (o) { return o.startsWith("del:merge_in0_"); });
  const delIn1 = order.findIndex(function (o) { return o.startsWith("del:merge_in1_"); });
  ok("RAM input dibebaskan sebelum concat", delIn0 !== -1 && delIn1 !== -1 && delIn0 < concatIdx && delIn1 < concatIdx);
  ok("status selesai", (d.getElementById("toolMergeStatus").textContent || "").includes("siap diunduh"));
  ok("resolusi ikut input terbesar (1920x1080, bukan 720p paksa)",
    normCalls.every(function (a) {
      const i = a.indexOf("-vf");
      return i !== -1 && a[i + 1].includes("scale=1920:1080");
    }));
  ok("CRF tajam (20)", normCalls.every(function (a) { return a.includes("20"); }));

  // --- skenario mute klip: bisukan klip 1 lalu gabung lagi ---
  const muteBtn = d.querySelector("#toolMergeList .merge-clip-mute");
  muteBtn.click();
  const muteBtnNew = d.querySelector("#toolMergeList .merge-clip-mute");
  ok("ikon mute berubah", (muteBtnNew.textContent || "").includes("volume_off"));
  ok("pratinjau ikut bisu", d.getElementById("toolMergePreview").muted === true);
  const e0 = execLog.length;
  await window.velardMergeRun();
  const newNorms = execLog.slice(e0).filter(function (a) { return a.includes("-c:v") && a.includes("libx264"); });
  ok("klip dibisukan -> sunyi walau ada audio", newNorms[0].includes("anullsrc=r=44100:cl=stereo"));

  // --- skenario batas 3: tambah 2 lagi, hanya 1 diterima ---
  window.velardMergeAdd([
    new window.File([new Uint8Array(10)], "c.mp4", { type: "video/mp4" }),
    new window.File([new Uint8Array(10)], "d.mp4", { type: "video/mp4" }),
  ]);
  await new Promise(function (r) { setTimeout(r, 150); });
  ok("maks 3 klip", d.querySelectorAll("#toolMergeList .merge-clip").length === 3);
  ok("peringatan batas 3", (d.getElementById("toolMergeWarn").textContent || "").includes("batas 3"));
  console.log(fails.length ? "GAGAL: " + fails.join(", ") : "SEMUA TES LOLOS");
  process.exit(fails.length ? 1 : 0);
}

main().catch(function (e) { console.log("FAIL: " + (e && e.message)); process.exit(1); });
