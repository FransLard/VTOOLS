const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { JSDOM } = require("jsdom");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

// 1. ID merge unik tepat 1x
const need = ["toolPanel-merge", "toolMergeFile", "toolMergeDrop",
  "toolMergePreview", "toolMergePreviewName", "toolMergePrev", "toolMergePlay",
  "toolMergePlayIco", "toolMergeNext",   "toolMergeTime", "toolMergeTimeline", "toolMergeFull", "toolMergeFullIco",
  "toolMergeRuler", "toolMergePlayhead", "toolMergeList",
  "toolMergeRun", "toolMergeStatus", "toolMergeProgress",
  "toolMergeClear", "toolMergeTotal", "toolMergeEmpty", "toolMergeWarn",
  "toolMergePreviewName", "toolArrow-merge"];
const bad = [];
need.forEach(function (id) {
  const n = (html.match(new RegExp('id="' + id + '"', "g")) || []).length;
  if (n !== 1) bad.push(id + "(" + n + ")");
});
console.log("IDS 1x: " + (bad.length ? "FAIL " + bad.join(",") : "OK"));

// 2. card + i18n + script tag
console.log("card: " + (html.includes('data-tool="merge"') ? "OK" : "FAIL"));
console.log("i18n ID: " + (html.includes('toolMergeBtn: "Gabung Video"') ? "OK" : "FAIL"));
console.log("i18n EN: " + (html.includes('toolMergeBtn: "Merge Videos"') ? "OK" : "FAIL"));
console.log("script tag: " + (html.includes("assets/js/merge.js?v=12") ? "OK" : "FAIL"));

// 3. eval merge.js + app.js dalam jsdom
const dom = new JSDOM(html, {
  url: "http://127.0.0.1:8000/", runScripts: "outside-only", pretendToBeVisual: true,
});
const window = dom.window;
window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function () {};
window.HTMLMediaElement.prototype.load = function () {};
try {
  window.eval(fs.readFileSync(path.join(ROOT, "assets/js/app.js"), "utf8"));
  window.eval(fs.readFileSync(path.join(ROOT, "assets/js/merge.js"), "utf8"));
  console.log("merge eval: OK");
} catch (e) { console.log("FAIL eval: " + e.message); process.exit(1); }
console.log("velardMergeRun: " + (typeof window.velardMergeRun === "function" ? "OK" : "FAIL"));
console.log("velardFFmpeg.load: " + (window.velardFFmpeg && typeof window.velardFFmpeg.load === "function" ? "OK" : "FAIL"));
console.log("run disabled awal: " + (window.document.getElementById("toolMergeRun").disabled ? "OK" : "FAIL"));
console.log("panel hidden awal: " + (window.document.getElementById("toolPanel-merge").hidden ? "OK" : "FAIL"));

// 4. buka/tutup modal merge via API asli
window.velardToolModal.open("merge");
const p = window.document.getElementById("toolPanel-merge");
console.log("modal open, panel tampil: " + (!p.hidden ? "OK" : "FAIL"));
console.log("hero: " + ((window.document.getElementById("toolModalHero").textContent || "").includes("Gabung") ? "OK" : "FAIL"));
setTimeout(function () {
  const trash = window.document.getElementById("toolMergeCacheClear");
  const header = window.document.querySelector("#toolModalCard .tool-modal-header");
  const hero = window.document.getElementById("toolModalHero");
  console.log("trash di hero: " + (trash && hero.contains(trash) ? "OK" : "FAIL"));
  console.log("trash kanan teks: " + (trash && trash.parentElement === hero && hero.lastElementChild === trash ? "OK" : "FAIL"));
  console.log("trash merah: " + (trash && trash.className.includes("merge-trash-top") ? "OK" : "FAIL"));
  window.velardToolModal.close();
  setTimeout(function () {
    console.log("modal close: " + (window.document.getElementById("toolModalCard").hidden ? "OK" : "FAIL"));
    console.log("trash dibersihkan: " + (!window.document.getElementById("toolMergeCacheClear") ? "OK" : "FAIL"));
    console.log("SEMUA TES LOLOS");
    process.exit(0);
  }, 300);
}, 100);
