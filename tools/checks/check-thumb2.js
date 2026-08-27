const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { JSDOM } = require("jsdom");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const panel = html.match(/<div class="tool-panel fraigo-panel" id="toolPanel-thumbnail"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
if (!panel) { console.log("FAIL: panel tidak ketemu"); process.exit(1); }
const p = panel[0];
const legacy = ["#6200ee", "#c49dff", "mdc-button", "Material Icons", "Roboto"];
const found = legacy.filter((s) => p.includes(s));
console.log("LEGACY: " + (found.length ? "FAIL masih ada " + found.join(",") : "OK bersih"));

const js = fs.readFileSync(path.join(ROOT, "assets/js/thumbnail.js"), "utf8");
const ids = [...new Set([...js.matchAll(/#([A-Za-z][\w-]*)/g)].map((m) => m[1]))].filter(
  (id) => id !== "toolPanel-thumbnail"
);
let bad = [];
for (const id of ids) {
  const n = (html.match(new RegExp('id="' + id + '"', "g")) || []).length;
  if (n !== 1) bad.push(id + "(" + n + ")");
}
console.log("IDS: " + (bad.length ? "FAIL " + bad.join(",") : "OK semua 1x"));

const handlers = ["loadVideoFile", "fraigoLoadVideoURL", "fraigoGoToTime", "fraigoVideo"];
const hbad = handlers.filter((h) => !p.includes(h));
console.log("HANDLER: " + (hbad.length ? "FAIL kurang " + hbad.join(",") : "OK"));

const dom = new JSDOM("<!DOCTYPE html><html><body>" + p + "</body></html>", {
  runScripts: "outside-only", pretendToBeVisual: true,
});
const { window } = dom;
window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function () {};
window.HTMLMediaElement.prototype.load = function () {};
try {
  window.eval(js);
  console.log("OK: thumbnail.js jalan tanpa error");
} catch (e) { console.log("FAIL: " + e.message); process.exit(1); }
const snap = window.document.querySelector("#toolPanel-thumbnail #snap");
console.log("SNAP disabled awal: " + (snap && snap.disabled ? "OK" : "FAIL"));
window.document.getElementById("fraigo_url_radio").click();
const urlBox = window.document.getElementById("select-url");
console.log("TOGGLE URL: " + (urlBox.style.display !== "none" ? "OK" : "FAIL"));

const pp = window.document.querySelectorAll("#toolPanel-thumbnail .play-control, #toolPanel-thumbnail .pause-control");
console.log("PLAY/PAUSE toggle: " + (pp.length === 2 ? "OK" : "FAIL (" + pp.length + ")"));

console.log("CLOSE btn: " + (p.includes("velardToolModal") ? "OK" : "FAIL"));
if (found.length || bad.length || hbad.length) process.exit(1);
console.log("SEMUA TES LOLOS");
