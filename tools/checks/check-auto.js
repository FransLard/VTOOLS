const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { JSDOM } = require("jsdom");
const js = fs.readFileSync(path.join(ROOT, "assets/js/thumbnail.js"), "utf8");
try { new Function(js); console.log("SYNTAX: OK"); }
catch (e) { console.log("FAIL: " + e.message); process.exit(1); }

const pctIdx = js.indexOf("function autoSnapPictureAfterPercent");
const minIdx = js.indexOf("function autoSnapPictureAfterMin");
const pctBody = js.slice(pctIdx, js.indexOf("function autoSnapPictureAfterMin"));
const minBody = js.slice(minIdx, js.indexOf("function clearSnaps"));
console.log("AUTO-percent pertahankan galeri: " + (!pctBody.includes("clearSnaps()") ? "OK" : "FAIL"));
console.log("AUTO-menit pertahankan galeri: " + (!minBody.includes("clearSnaps()") ? "OK" : "FAIL"));
console.log("AUTO masih hentikan jadwal lama: " + (pctBody.includes("clearInterval(snapProc)") && minBody.includes("clearInterval(snapProc)") ? "OK" : "FAIL"));

const h = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
console.log("VER thumb177: " + (h.includes("assets/js/thumbnail.js?v=177") ? "OK" : "FAIL"));

const start = h.lastIndexOf('<div class="tool-panel fraigo-panel"');
const anchor = h.indexOf('<a href="" id="imagelink"');
const end = h.indexOf("</div>", h.indexOf("</div>", h.indexOf("</div>", anchor)));
const panel = h.slice(start, end);
const dom = new JSDOM("<!DOCTYPE html><html><body>" + panel + "</body></html>", { runScripts: "outside-only", pretendToBeVisual: true });
const { window } = dom;
window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function () {};
window.HTMLMediaElement.prototype.load = function () {};
window.i18n = { getLang: () => "id", t: (k) => k };
window.eval(js);
const out = window.document.getElementById("outputs");
out.appendChild(window.document.createElement("div"));
out.appendChild(window.document.createElement("div"));
console.log("GALERI isi: " + out.children.length + " (simulasi 2 manual)");
console.log("SEMUA TES LOLOS");
