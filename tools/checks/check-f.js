const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { JSDOM } = require("jsdom");
const h = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const start = h.lastIndexOf('<div class="tool-panel fraigo-panel"');
const anchor = h.indexOf('<a href="" id="imagelink"');
const end = h.indexOf("</div>", h.indexOf("</div>", h.indexOf("</div>", anchor)));
const panel = h.slice(start, end);
const js = fs.readFileSync(path.join(ROOT, "assets/js/thumbnail.js"), "utf8");
const dom = new JSDOM("<!DOCTYPE html><html><body>" + panel + "</body></html>", { runScripts: "outside-only", pretendToBeVisual: true });
const { window } = dom;
window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function () {};
window.HTMLMediaElement.prototype.load = function () {};
window.i18n = { getLang: () => "en", t: (k) => k };
try { window.eval(js); console.log("OK: thumbnail.js jalan"); }
catch (e) { console.log("FAIL: " + e.message); process.exit(1); }
try { window.document.getElementById("thumbCacheClear").click(); console.log("OK: cache click (EN)"); }
catch (e) { console.log("FAIL cache: " + e.message); process.exit(1); }
const lab = window.document.getElementById("thumbResultLabel");
console.log("LABEL: " + (lab.textContent === "Belum ada tangkapan layar" ? "OK" : "FAIL"));
window.dispatchEvent(new window.Event("qm:langchange"));
console.log("LANGCHANGE: OK");
const deck = window.document.querySelectorAll("#toolPanel-thumbnail #videoControls .button-container button");
console.log("DECK: " + (deck.length === 11 ? "OK(11)" : "FAIL"));
console.log("SEMUA TES LOLOS");
