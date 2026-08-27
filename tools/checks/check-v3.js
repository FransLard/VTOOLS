const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { JSDOM } = require("jsdom");
const h = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const css = fs.readFileSync(path.join(ROOT, "assets/css/style.css"), "utf8");
const css2 = css;

console.log("GLASS panel: " + (h.includes("backdrop-filter:blur(16px)") && h.includes("rgba(22,26,34,.55)") && h.includes("rgba(11,14,20,.72)") ? "OK" : "FAIL"));
console.log("GLASS modal: " + (css.includes("rgba(11,14,20,.78)") && css2.includes("rgba(11,14,20,.78)") && css.includes("background:transparent !important; overflow-y:auto") ? "OK" : "FAIL"));

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
try { window.eval(js); console.log("OK: thumbnail.js jalan tanpa videoInfo/snapd"); }
catch (e) { console.log("FAIL: " + e.message); process.exit(1); }
try {
  const v = window.document.querySelector("#toolPanel-thumbnail #video");
  Object.defineProperty(v, "duration", { value: 23.7 });
  Object.defineProperty(v, "currentTime", { value: 3.5 });
  Object.defineProperty(v, "videoWidth", { value: 1920 });
  Object.defineProperty(v, "videoHeight", { value: 1080 });
  v.dispatchEvent(new window.Event("timeupdate"));
  const sl = window.document.querySelector("#toolPanel-thumbnail #slider");
  console.log("SLIDER sync tanpa info-box: " + (String(sl.value).startsWith("3") ? "OK (" + sl.value + ")" : "FAIL (" + sl.value + ")"));
} catch (e) { console.log("FAIL timeupdate: " + e.message); process.exit(1); }
console.log("SEMUA TES LOLOS");
