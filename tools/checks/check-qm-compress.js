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
const res = () => d.getElementById("qmInfoRes").textContent;
const desc = () => d.getElementById("methodDesc").textContent;

// awal: binary 1080p
ok("awal binary 1080p", res() === "1080p");
// skenario bug: pilih 720 di BINARY ...
seg("compressToggle", "720p");
ok("binary 720 -> label 720p", res() === "720p");
// ... beralih ke FPS ala web sumber: opsi kompresi hilang, selalu Original
seg("versionToggle", "fps");
ok("fps: compressRow disembunyikan", d.getElementById("compressRow").hidden === true);
ok("fps: label Original (tidak kebawa 720p)", res() === "Original");
ok("fps: deskripsi fps-off", desc().includes("tanpa mengubah resolusi"));
// kembali ke BINARY: setting 720p utuh (tidak tersentuh kunjungan ke FPS)
seg("versionToggle", "binary");
ok("binary: tetap 720p", res() === "720p");
ok("binary: deskripsi binary-720p", desc().includes("720p"));
// OFF di binary lalu FPS tetap Original
seg("compressToggle", "off");
seg("versionToggle", "fps");
ok("fps setelah binary-off: Original", res() === "Original");
console.log(fails.length ? "GAGAL: " + fails.join(", ") : "SEMUA TES LOLOS");
process.exit(fails.length ? 1 : 0);
