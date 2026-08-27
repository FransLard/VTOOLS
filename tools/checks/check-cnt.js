const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const h = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
for (const s of ["fraigoGoToTime", "fraigoVideo", "play-control", "pause-control", 'id="snap"', 'id="outputs"']) {
  console.log(s + ": " + (h.split(s).length - 1));
}

const i = h.indexOf('id="toolPanel-thumbnail"');
const j = h.indexOf("floating-nav-bar");
console.log("seg_len:", j - i);

const start = h.lastIndexOf('<div class="tool-panel fraigo-panel"', i);
const anchor = h.indexOf('<a href="" id="imagelink"');
const end = h.indexOf("</div>", h.indexOf("</div>", h.indexOf("</div>", anchor)));
const panel = h.slice(start, end);
console.log("panel_ex_len:", panel.length);
for (const s of ["fraigoGoToTime", "fraigoVideo", "play-control", 'id="snap"', 'id="outputs"', "velardToolModal"]) {
  console.log("panel/" + s + ": " + (panel.split(s).length - 1));
}
fs.writeFileSync(path.join(ROOT, "archive/dev/panel-ex.html"), panel);
