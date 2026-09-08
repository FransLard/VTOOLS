const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const dom = new JSDOM(html, {
  url: "http://127.0.0.1:8000/", runScripts: "outside-only", pretendToBeVisual: true,
});
const window = dom.window;
window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function () {};
window.HTMLMediaElement.prototype.load = function () {};
try {
  window.eval(fs.readFileSync(path.join(ROOT, "assets/js/app.js"), "utf8"));
} catch (e) { console.log("FAIL eval: " + e.message); process.exit(1); }
const d = window.document;
const fails = [];
function ok(name, cond) {
  console.log((cond ? "OK " : "FAIL ") + name);
  if (!cond) fails.push(name);
}
function seg(containerId, val) {
  const c = d.getElementById(containerId);
  const b = c && c.querySelector('[data-value="' + val + '"]');
  if (!b) { ok("tombol " + containerId + "=" + val + " ada", false); return; }
  b.click();
}
function activeVal(containerId) {
  const c = d.getElementById(containerId);
  const b = c && c.querySelector(".qm-seg-btn.active, .seg-btn.active");
  return b ? b.dataset.value : null;
}
const res = () => d.getElementById("qmInfoRes").textContent;
const desc = () => d.getElementById("methodDesc").textContent;

// awal: binary 1080p
ok("awal binary 1080p", res() === "1080p");
// skenario bug: pilih 720 di BINARY ...
seg("compressToggle", "720p");
ok("binary 720 -> label 720p", res() === "720p");
// ... beralih ke FPS: harus Original (setting fps sendiri, default off)
seg("versionToggle", "fps");
ok("fps: compressRow tampil", d.getElementById("compressRow").hidden === false);
ok("fps: highlight OFF", activeVal("compressToggle") === "off");
ok("fps: label Original (tidak kebawa 720p)", res() === "Original");
ok("fps: deskripsi fps-off", desc().includes("tanpa mengubah resolusi"));
// pilih 1080 di FPS ...
seg("compressToggle", "1080p");
ok("fps 1080 -> label 1080p", res() === "1080p");
// ... kembali ke BINARY: ingat 720p, bukan 1080p
seg("versionToggle", "binary");
ok("binary: ingat 720p", activeVal("compressToggle") === "720p" && res() === "720p");
ok("binary: deskripsi binary-720p", desc().includes("720p"));
// fps tetap ingat 1080p
seg("versionToggle", "fps");
ok("fps: ingat 1080p", activeVal("compressToggle") === "1080p" && res() === "1080p");
console.log(fails.length ? "GAGAL: " + fails.join(", ") : "SEMUA TES LOLOS");
process.exit(fails.length ? 1 : 0);
