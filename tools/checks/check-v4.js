const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { JSDOM } = require("jsdom");
const h = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
console.log("VER css172: " + (h.includes("assets/css/style.css?v=172") ? "OK" : "FAIL"));
console.log("VER thumb173: " + (h.includes("assets/js/thumbnail.js?v=173") ? "OK" : "FAIL"));
const start = h.lastIndexOf('<div class="tool-panel fraigo-panel"');
const anchor = h.indexOf('<a href="" id="imagelink"');
const end = h.indexOf("</div>", h.indexOf("</div>", h.indexOf("</div>", anchor)));
const panel = h.slice(start, end);

for (const s of ['id="videourl"', 'id="select-url"', 'fraigo_url_radio', 'fraigo_file_radio', "thumb-cap", "thumb-seg", "Geser slider"]) {
  if (panel.includes(s)) { console.log("FAIL masih ada: " + s); process.exit(1); }
}
console.log("REMOVED: OK (URL, radio, panduan slider hilang)");

const css = fs.readFileSync(path.join(ROOT, "assets/css/style.css"), "utf8");
const limePanel = (panel.match(/e0f28c|224,242,140/g) || []).length;
const limeCss = (css.match(/e0f28c|224,242,140/g) || []).length;
console.log("LIME panel: " + (limePanel === 0 ? "OK nol" : "FAIL " + limePanel));
console.log("LIME css: " + (limeCss === 0 ? "OK nol" : "FAIL " + limeCss));

console.log("LABEL awal: " + (panel.includes('id="thumbResultLabel">Belum ada tangkapan layar<') ? "OK" : "FAIL"));

for (const id of ["videofile", "video", "slider", "snap", "snap2", "snap_each", "videow", "outputs", "save", "saveall", "clear", "preview", "canvas", "thumbResultLabel"]) {
  const n = (h.match(new RegExp('id="' + id + '"', "g")) || []).length;
  if (n !== 1) { console.log("FAIL id " + id + " x" + n); process.exit(1); }
}
console.log("IDS: OK");

const js = fs.readFileSync(path.join(ROOT, "assets/js/thumbnail.js"), "utf8");
const dom = new JSDOM("<!DOCTYPE html><html><body>" + panel + "</body></html>", { runScripts: "outside-only", pretendToBeVisual: true });
const { window } = dom;
window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function () {};
window.HTMLMediaElement.prototype.load = function () {};
try { window.eval(js); console.log("OK: thumbnail.js jalan"); }
catch (e) { console.log("FAIL: " + e.message); process.exit(1); }
const lab = window.document.getElementById("thumbResultLabel");
console.log("LABEL kosong: " + (lab.textContent === "Belum ada tangkapan layar" ? "OK" : "FAIL (" + lab.textContent + ")"));
const out = window.document.getElementById("outputs");
const d = window.document.createElement("div"); out.appendChild(d);
window.refreshResultLabel();
console.log("LABEL isi: " + (lab.textContent === "Hasil" ? "OK" : "FAIL (" + lab.textContent + ")"));
window.clearSnaps();
console.log("LABEL sesudah clear: " + (lab.textContent === "Belum ada tangkapan layar" ? "OK" : "FAIL (" + lab.textContent + ")"));
const deck = window.document.querySelectorAll("#toolPanel-thumbnail #videoControls .button-container button");
console.log("DECK: " + (deck.length === 11 ? "OK(11)" : "FAIL(" + deck.length + ")"));
console.log("SEMUA TES LOLOS");
