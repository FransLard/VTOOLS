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

const closeIdx = js.indexOf('close.addEventListener("click"');
const bindIdx = js.indexOf('cacheBtn.addEventListener("click", thumbClearCache)');
const snapIdx = js.indexOf("function snapPicture()");
console.log("bind-after-close-handler: " + (bindIdx > js.indexOf("cont.appendChild(close);") ? "OK" : "FAIL"));
console.log("bind-top-level: " + (bindIdx > snapIdx + 2000 || bindIdx < snapIdx ? "OK?" : "cek"));
const dom = new JSDOM("<!DOCTYPE html><html><body>" + panel + '<div id="appToast"></div></body></html>', { runScripts: "outside-only", pretendToBeVisual: true });
const { window } = dom;
window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function () {};
window.HTMLMediaElement.prototype.load = function () {};
window.i18n = { getLang: () => "id", t: (k) => k };
window.eval(js);

const cb = window.document.getElementById("thumbCacheClear");
let clicks = 0;
const orig = window.HTMLElement.prototype.click;
try { cb.click(); clicks++; } catch (e) { console.log("FAIL click: " + e.message); process.exit(1); }
const toast = window.document.getElementById("appToast");
console.log("CACHE langsung jalan: OK");
console.log("TOAST tampil: " + (toast.classList.contains("show") && toast.textContent.includes("Cache") ? "OK (" + toast.textContent + ")" : "FAIL (" + toast.textContent + ")"));

cb.click();
console.log("DOUBLE-CLICK aman: OK");

const closeBlock = js.slice(closeIdx, js.indexOf("cont.appendChild(close);"));
console.log("close-handler bersih: " + (!closeBlock.includes("addEventListener(\"click\", thumbClearCache") && !closeBlock.includes("qm:langchange") ? "OK" : "FAIL"));
console.log("SEMUA TES LOLOS");
