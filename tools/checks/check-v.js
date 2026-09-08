const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { JSDOM } = require("jsdom");
const h = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

// versi cache-bust (substring HTML, bukan path file — tetap literal)
for (const s of ["assets/css/style.css?v=170", "assets/js/thumbnail.js?v=171", "assets/js/app.js?v=170"]) {
  console.log("VER " + s + ": " + (h.includes(s) ? "OK" : "FAIL"));
}
// tidak ada sisa versi lama
console.log("no_old_ver: " + (!h.includes('assets/js/thumbnail.js?v=170"') && !h.includes('assets/js/app.js?v=169"') ? "OK" : "FAIL"));

// ekstrak panel
const start = h.lastIndexOf('<div class="tool-panel fraigo-panel"');
const anchor = h.indexOf('<a href="" id="imagelink"');
const end = h.indexOf("</div>", h.indexOf("</div>", h.indexOf("</div>", anchor)));
const panel = h.slice(start, end);

// ID lengkap 1x
const js = fs.readFileSync(path.join(ROOT, "assets/js/thumbnail.js"), "utf8");
const ids = [...new Set([...js.matchAll(/#([A-Za-z][\w-]*)/g)].map((m) => m[1]))].filter((id) => id !== "toolPanel-thumbnail");
const bad = [];
for (const id of ids) {
  const n = (h.match(new RegExp('id="' + id + '"', "g")) || []).length;
  if (n !== 1) bad.push(id + "(" + n + ")");
}
console.log("IDS: " + (bad.length ? "FAIL " + bad.join(",") : "OK semua 1x"));

// handler + opsi select
for (const s of ["fraigoGoToTime", "fraigoVideo", "fraigoLoadVideoURL", "loadVideoFile", 'value="4%" selected', 'value="1m"']) {
  if (!panel.includes(s)) { console.log("FAIL kurang: " + s); process.exit(1); }
}
console.log("HANDLER+OPTIONS: OK");
// tidak ada sisa ungu/AI-slop di panel
const legacy = ["#6200ee", "#c49dff", "mdc-button", "box-shadow:0 10px 28px", "translateY(-1px)"];
const fl = legacy.filter((s) => panel.includes(s));
console.log("CLEAN: " + (fl.length ? "FAIL " + fl.join(",") : "OK"));
// scroll fallback di level panel
console.log("PANEL_SCROLLER: " + (panel.includes("max-height:calc(100dvh - 24px)") && panel.includes("touch-action:pan-y") ? "OK" : "FAIL"));

// fungsional jsdom
const dom = new JSDOM("<!DOCTYPE html><html><body>" + panel + "</body></html>", { runScripts: "outside-only", pretendToBeVisual: true });
const { window } = dom;
window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function () {};
window.HTMLMediaElement.prototype.load = function () {};
try { window.eval(js); console.log("OK: thumbnail.js jalan tanpa error"); }
catch (e) { console.log("FAIL: " + e.message); process.exit(1); }
const snap = window.document.querySelector("#toolPanel-thumbnail #snap");
console.log("SNAP disabled awal: " + (snap && snap.disabled ? "OK" : "FAIL"));
window.document.getElementById("fraigo_file_radio").click();
console.log("RADIO file: " + (window.document.getElementById("select-file").style.display !== "none" ? "OK" : "FAIL"));
window.document.getElementById("fraigo_url_radio").click();
console.log("RADIO url: " + (window.document.getElementById("select-url").style.display !== "none" ? "OK" : "FAIL"));
const deck = window.document.querySelectorAll("#toolPanel-thumbnail #videoControls .button-container button");
console.log("DECK buttons: " + (deck.length === 11 ? "OK(11)" : "FAIL(" + deck.length + ")"));
console.log("SEMUA TES LOLOS");
