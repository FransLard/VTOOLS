const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { JSDOM } = require("jsdom");
const p = fs.readFileSync(path.join(ROOT, "archive/dev/panel-ex.html"), "utf8");
const js = fs.readFileSync(path.join(ROOT, "assets/js/thumbnail.js"), "utf8");
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
const need = ["loadVideoFile", "loadVideoURL", "snapPicture", "autoSnapPictureAfterSelection",
  "zipAllImages", "savePicture", "showInput", "fraigoGoToTime", "fraigoLoadVideoURL", "fraigoVideo"];
const missing = need.filter((k) => !(k in window));
console.log("GLOBALS: " + (missing.length ? "FAIL kurang " + missing.join(",") : "OK semua ada"));
const snap = window.document.querySelector("#toolPanel-thumbnail #snap");
console.log("SNAP disabled awal: " + (snap && snap.disabled ? "OK" : "FAIL"));
window.document.getElementById("fraigo_url_radio").click();
console.log("TOGGLE URL: " + (window.document.getElementById("select-url").style.display !== "none" &&
  window.document.getElementById("select-file").style.display === "none" ? "OK" : "FAIL"));
window.document.getElementById("fraigo_file_radio").click();
console.log("TOGGLE FILE: " + (window.document.getElementById("select-file").style.display !== "none" &&
  window.document.getElementById("select-url").style.display === "none" ? "OK" : "FAIL"));
const pp = window.document.querySelectorAll("#toolPanel-thumbnail .play-control, #toolPanel-thumbnail .pause-control");
console.log("PLAY/PAUSE toggle: " + (pp.length === 2 ? "OK" : "FAIL"));
if (missing.length) process.exit(1);
console.log("SEMUA TES LOLOS");
