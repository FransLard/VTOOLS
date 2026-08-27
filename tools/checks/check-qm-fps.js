const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { JSDOM } = require("jsdom");

const fails = [];
function ok(name, cond) {
  console.log((cond ? "OK " : "FAIL ") + name);
  if (!cond) fails.push(name);
}

function box(type, payload) {
  const b = new Uint8Array(8 + payload.length);
  new DataView(b.buffer).setUint32(0, b.length, false);
  for (let i = 0; i < 4; i++) b[4 + i] = type.charCodeAt(i);
  b.set(payload, 8);
  return b;
}
function u32(v) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, v >>> 0, false);
  return b;
}
function concat(parts) {
  let n = 0;
  parts.forEach((p) => (n += p.length));
  const o = new Uint8Array(n);
  let off = 0;
  parts.forEach((p) => { o.set(p, off); off += p.length; });
  return o;
}
function mvhd(ts, dur) {
  const p = new Uint8Array(100);
  new DataView(p.buffer).setUint32(12, ts, false);
  new DataView(p.buffer).setUint32(16, dur, false);
  return box("mvhd", p);
}
function tkhd(dur) {
  const p = new Uint8Array(40);
  new DataView(p.buffer).setUint32(20, dur, false);
  return box("tkhd", p);
}
function mdhd(ts, dur) {
  const p = new Uint8Array(32);
  new DataView(p.buffer).setUint32(12, ts, false);
  new DataView(p.buffer).setUint32(16, dur, false);
  return box("mdhd", p);
}
function hdlr(kind) {
  const p = new Uint8Array(12);
  for (let i = 0; i < 4; i++) p[8 + i] = kind.charCodeAt(i);
  return box("hdlr", p);
}
function stts(entries) {
  const p = [new Uint8Array(4), u32(entries.length)];
  entries.forEach(([c, d]) => p.push(u32(c), u32(d)));
  return box("stts", concat(p));
}
function stsz(sizes) {
  const p = [new Uint8Array(4), u32(0), u32(sizes.length)];
  sizes.forEach((s) => p.push(u32(s)));
  return box("stsz", concat(p));
}
function stco(offsets) {
  const p = [new Uint8Array(4), u32(offsets.length)];
  offsets.forEach((o) => p.push(u32(o)));
  return box("stco", concat(p));
}
function trak(kind, ts, dur, sizes, deltas, chunkOff) {
  return box("trak", concat([
    tkhd(dur),
    box("mdia", concat([
      mdhd(ts, dur),
      hdlr(kind),
      box("minf", concat([
        box("stbl", concat([stts(deltas), stsz(sizes), stco([chunkOff])])),
      ])),
    ])),
  ]));
}
function mp4File(withAudio) {
  const payload = new Uint8Array(450);
  const ftyp = box("ftyp", new Uint8Array(16));

  const v = trak("vide", 1000, 3000, [100, 200, 150], [[3, 1000]], 0);
  const parts = [ftyp];
  let moov;
  if (withAudio) {
    const a = trak("soun", 44100, 88200, [50, 60], [[2, 1024]], 0);
    moov = box("moov", concat([mvhd(1000, 3000), v, a]));
  } else {
    moov = box("moov", concat([mvhd(1000, 3000), v]));
  }
  const mdatStart = ftyp.length + moov.length + 8;
  const v2 = trak("vide", 1000, 3000, [100, 200, 150], [[3, 1000]], mdatStart);
  if (withAudio) {
    const a2 = trak("soun", 44100, 88200, [50, 60], [[2, 1024]], mdatStart);
    moov = box("moov", concat([mvhd(1000, 3000), v2, a2]));
  } else {
    moov = box("moov", concat([mvhd(1000, 3000), v2]));
  }
  return concat([ftyp, moov, box("mdat", payload)]);
}
function getU32(buf, off) { return new DataView(buf.buffer, buf.byteOffset).getUint32(off, false); }
function findBox(buf, start, end, type) {
  let o = start;
  while (o + 8 <= end) {
    const sz = getU32(buf, o);
    let t = "";
    for (let i = 0; i < 4; i++) t += String.fromCharCode(buf[o + 4 + i]);
    if (t === type) return { off: o, size: sz };
    if (!(sz >= 8) || o + sz > end) break;
    o += sz;
  }
  return null;
}
function sttsEntries(patched, trakKind) {
  const moov = findBox(patched, 0, patched.length, "moov");
  let o = moov.off + 8;
  const mend = moov.off + moov.size;
  while (o + 8 <= mend) {
    const sz = getU32(patched, o);
    let t = "";
    for (let i = 0; i < 4; i++) t += String.fromCharCode(patched[o + 4 + i]);
    if (t === "trak") {

      const hdlrB = findBox(patched, o + 8, o + sz, "mdia");
      void hdlrB;

      let found = null;
      (function walk(s, e) {
        let p = s;
        while (p + 8 <= e) {
          const s2 = getU32(patched, p);
          let t2 = "";
          for (let i = 0; i < 4; i++) t2 += String.fromCharCode(patched[p + 4 + i]);
          if (t2 === "hdlr") {
            let h = "";
            for (let i = 0; i < 4; i++) h += String.fromCharCode(patched[p + 8 + 8 + i]);
            if (h === trakKind) found = { off: p, size: s2 };
          }
          if (t2 === "mdia" || t2 === "minf" || t2 === "stbl" || t2 === "trak") walk(p + 8, p + s2);
          if (!(s2 >= 8) || p + s2 > e) break;
          p += s2;
        }
      })(o + 8, o + sz);
      if (found) {

        let st = null;
        (function walk2(s, e) {
          let p = s;
          while (p + 8 <= e) {
            const s2 = getU32(patched, p);
            let t2 = "";
            for (let i = 0; i < 4; i++) t2 += String.fromCharCode(patched[p + 4 + i]);
            if (t2 === "stts") { st = { off: p, size: s2 }; return; }
            if (["mdia", "minf", "stbl", "trak"].includes(t2)) walk2(p + 8, p + s2);
            if (!(s2 >= 8) || p + s2 > e) break;
            p += s2;
          }
        })(o + 8, o + sz);
        const n = getU32(patched, st.off + 12);
        const out = [];
        for (let i = 0; i < n; i++) out.push([getU32(patched, st.off + 16 + i * 8), getU32(patched, st.off + 20 + i * 8)]);
        return out;
      }
    }
    if (!(sz >= 8) || o + sz > mend) break;
    o += sz;
  }
  return null;
}

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const dom = new JSDOM(html, { url: "http://127.0.0.1:8000/", runScripts: "outside-only", pretendToBeVisual: true });
const window = dom.window;
window.eval(fs.readFileSync(path.join(ROOT, "assets/js/app.js"), "utf8"));
ok("patchMp4FPSMethod terekspos", typeof window.patchMp4FPSMethod === "function");

const out = window.patchMp4FPSMethod(mp4File(false));
ok("output ada", out && out.byteLength > 0);
ok("ftyp utuh", String.fromCharCode(out[4], out[5], out[6], out[7]) === "ftyp");
const ve = sttsEntries(out, "vide");
ok("stts video digandakan", JSON.stringify(ve) === JSON.stringify([[2, 2000], [1, 1000]]));

const outA = window.patchMp4FPSMethod(mp4File(true));
const ae = sttsEntries(outA, "soun");
ok("stts audio digandakan", JSON.stringify(ae) === JSON.stringify([[1, 2048], [1, 992]]));

let threw = false;
try { window.patchMp4FPSMethod(new Uint8Array([1, 2, 3])); } catch (e) { threw = /Missing required MP4/.test(e.message); }
ok("input rusak ditolak", threw);

const src = fs.readFileSync(path.join(ROOT, "src/script.js"), "utf8");
ok("wiring fps->FPS patch",
  src.includes("isBinary ? patchMp4HDMethod(arrayBuffer) : _fps_patchMp4FPSMethod(arrayBuffer)"));
ok("wiring fallback fps->FPS patch",
  src.includes("isBinary ? patchMp4HDMethod(remuxed) : _fps_patchMp4FPSMethod(remuxed)"));
ok("output fps pakai _fps.mp4", src.includes('"_fps.mp4"'));

console.log(fails.length ? "GAGAL: " + fails.join(", ") : "SEMUA TES LOLOS");
process.exit(fails.length ? 1 : 0);
