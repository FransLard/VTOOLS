(function() {
    if (window.__velardMergeInit) return;
    window.__velardMergeInit = true;
    function q(sel) {
        return document.querySelector("#toolPanel-merge " + sel) || document.querySelector(sel);
    }
    function mergeLang() {
        try {
            return (window.i18n && window.i18n.getLang ? window.i18n.getLang() : null) || localStorage.getItem("lang") || "id";
        } catch (e) {
            return "id";
        }
    }
    function mergeT(key, fb) {
        try {
            if (window.i18n && window.i18n.t) {
                var v = window.i18n.t(key);
                if (v && v !== key) return v;
            }
        } catch (e) {}
        return fb;
    }
    function mergeNotify(msg) {
        try {
            var toast = document.getElementById("appToast");
            if (toast) {
                toast.textContent = msg;
                toast.style.zIndex = "2147483647";
                toast.classList.add("show");
                clearTimeout(mergeNotify._t);
                mergeNotify._t = setTimeout(function() {
                    toast.classList.remove("show");
                }, 3500);
                return;
            }
        } catch (e) {}
        try {
            alert(msg);
        } catch (e) {}
    }
    var SUPPORTED_EXT = [ "mp4", "m4v", "mov", "webm", "mkv", "avi" ];
    var MAX_FILES = 3;
    var MAX_BYTES = 1500 * 1024 * 1024;
    var files = [];
    var uid = 0;
    var busy = false;
    window.__mergeBusy = false;
    function setBusy(v) {
        busy = v;
        window.__mergeBusy = v;
        // PERF-OPT aman: tandai body agar background pause saat encode (tidak ubah logika)
        try { document.body.classList.toggle("is-encoding", !!v); } catch (e) {}
    }
    var fileInput = q("#toolMergeFile");
    var drop = q("#toolMergeDrop");
    var warnEl = q("#toolMergeWarn");
    var timelineEl = q("#toolMergeTimeline");
    var rulerEl = q("#toolMergeRuler");
    var listEl = q("#toolMergeList");
    var emptyEl = q("#toolMergeEmpty");
    var preview = q("#toolMergePreview");
    var previewName = q("#toolMergePreviewName");
    var prevBtn = q("#toolMergePrev");
    var playBtn = q("#toolMergePlay");
    var playIco = q("#toolMergePlayIco");
    var nextBtn = q("#toolMergeNext");
    var timeEl = q("#toolMergeTime");
    var totalEl = q("#toolMergeTotal");
    var runBtn = q("#toolMergeRun");
    var clearBtn = q("#toolMergeClear");
    var statusEl = q("#toolMergeStatus");
    var progSec = q("#toolMergeProgress");
    var progFill = q("#toolMergeProgressFill");
    var progPct = q("#toolMergeProgressPct");
    var selectedId = null;
    var dragId = null;
    function showWarn(msg) {
        if (!warnEl) {
            if (msg) mergeNotify(msg);
            return;
        }
        if (!msg) {
            warnEl.textContent = "";
            warnEl.hidden = true;
            return;
        }
        warnEl.textContent = msg;
        warnEl.hidden = false;
    }
    function objUrl(f) {
        try {
            return URL.createObjectURL(f);
        } catch (e) {
            return "";
        }
    }
    function targetSize() {
        var bw = 0, bh = 0;
        files.forEach(function(f) {
            if (f.width > 0 && f.height > 0 && f.width * f.height > bw * bh) {
                bw = f.width;
                bh = f.height;
            }
        });
        if (!(bw > 0 && bh > 0)) {
            bw = 1280;
            bh = 720;
        }
        var sc = Math.min(1, 1920 / Math.max(bw, bh));
        var W = Math.round(bw * sc / 2) * 2, H = Math.round(bh * sc / 2) * 2;
        return {
            w: Math.max(2, W),
            h: Math.max(2, H)
        };
    }
    function fmtBytes(n) {
        if (!isFinite(n) || n < 0) return "-";
        if (n < 1024) return n + " B";
        var u = [ "KB", "MB", "GB" ];
        var v = n / 1024, i = 0;
        while (v >= 1024 && i < u.length - 1) {
            v /= 1024;
            i++;
        }
        return Math.round(v * 10) / 10 + " " + u[i];
    }
    function fmtDur(s) {
        if (!isFinite(s) || s < 0) s = 0;
        s = Math.round(s);
        var m = Math.floor(s / 60), r = s % 60;
        return (m < 10 ? "0" + m : "" + m) + ":" + (r < 10 ? "0" + r : "" + r);
    }
    function extOf(name) {
        var p = String(name || "").split(".").pop() || "";
        return p.toLowerCase();
    }
    function setStatus(msg, cls) {
        if (!statusEl) return;
        statusEl.textContent = msg || "";
        statusEl.className = "tool-status" + (cls ? " " + cls : "");
    }
    function setProgress(pct, label) {
        var p = Math.max(0, Math.min(100, Math.round(pct || 0)));
        if (progSec) progSec.hidden = false;
        if (progFill) progFill.style.width = p + "%";
        if (progPct) progPct.textContent = p + "%";
        if (label) setStatus(label);
    }
    function hideProgress() {
        if (progSec) progSec.hidden = true;
        if (progFill) progFill.style.width = "0%";
        if (progPct) progPct.textContent = "0%";
    }
    function refreshState() {
        var n = files.length;
        if (emptyEl) emptyEl.hidden = n !== 0;
        if (timelineEl) timelineEl.hidden = n === 0;
        var total = 0, ok = true;
        files.forEach(function(f) {
            total += f.duration || 0;
            if (!f.duration) ok = false;
        });
        if (totalEl) {
            totalEl.textContent = n ? mergeT("toolMergeCount", "{n} video").replace("{n}", String(n)) + " • " + fmtDur(total) + (ok ? "" : " • " + mergeT("toolMergeReading", "membaca…")) : "";
        }
        if (runBtn) {
            runBtn.disabled = busy || n < 2;
            runBtn.hidden = n < 2 && !busy;
        }
        if (clearBtn) clearBtn.disabled = busy || n === 0;
        refreshTransport();
    }
    function previewFile(f) {
        if (!preview || !f) return;
        selectedId = f.id;
        preview.src = f.url;
        try {
            preview.load();
        } catch (e) {}
        try {
            preview.muted = !!f.muted;
        } catch (e) {}
        if (previewName) previewName.textContent = f.name;
        setPlayIco(false);
        updateTime();
        if (listEl) {
            Array.prototype.forEach.call(listEl.querySelectorAll(".merge-clip"), function(row) {
                row.classList.toggle("active", row.getAttribute("data-id") === String(f.id));
            });
        }
    }
    function setPlayIco(playing) {
        if (playIco) playIco.textContent = playing ? "pause" : "play_arrow";
    }
    function totalDuration() {
        var t = 0;
        files.forEach(function(f) {
            t += f.duration || 0;
        });
        return t;
    }
    function offsetOf(id) {
        var off = 0;
        for (var k = 0; k < files.length; k++) {
            if (files[k].id === id) break;
            off += files[k].duration || 0;
        }
        return off;
    }
    function updateTime() {
        if (!timeEl) return;
        var cur = 0, dur = totalDuration();
        try {
            if (preview) {
                cur = offsetOf(selectedId) + (isFinite(preview.currentTime) ? preview.currentTime : 0);
                if (!(dur > 0)) dur = isFinite(preview.duration) && preview.duration > 0 ? preview.duration : 0;
            }
        } catch (e) {}
        timeEl.textContent = fmtDur(cur) + " / " + fmtDur(dur);
        updatePlayhead();
    }
    function currentFile() {
        for (var k = 0; k < files.length; k++) {
            if (files[k].id === selectedId) return files[k];
        }
        return files[0] || null;
    }
    function stepClip(dir) {
        if (!files.length || busy) return;
        var i = 0;
        for (var k = 0; k < files.length; k++) {
            if (files[k].id === selectedId) {
                i = k;
                break;
            }
        }
        var j = Math.max(0, Math.min(files.length - 1, i + dir));
        previewFile(files[j]);
        try {
            var el = listEl ? listEl.querySelector('.merge-clip[data-id="' + files[j].id + '"]') : null;
            if (el && el.scrollIntoView) el.scrollIntoView({
                block: "nearest",
                inline: "nearest"
            });
        } catch (e) {}
    }
    function detectMeta(f) {
        return new Promise(function(resolve) {
            var done = false;
            function fin() {
                if (!done) {
                    done = true;
                    resolve();
                }
            }
            try {
                var v = document.createElement("video");
                v.preload = "metadata";
                v.muted = true;
                var timer = setTimeout(function() {
                    cleanup();
                    fin();
                }, 8e3);
                function cleanup() {
                    clearTimeout(timer);
                    v.removeAttribute("src");
                    try {
                        v.load();
                    } catch (e) {}
                }
                v.onloadedmetadata = function() {
                    f.duration = isFinite(v.duration) ? v.duration : 0;
                    f.width = v.videoWidth || 0;
                    f.height = v.videoHeight || 0;
                    cleanup();
                    fin();
                    render();
                    refreshState();
                };
                v.onerror = function() {
                    cleanup();
                    fin();
                    render();
                    refreshState();
                };
                v.src = f.url;
            } catch (e) {
                fin();
            }
        });
    }
    function addFiles(list) {
        showWarn(null);
        var arr = Array.prototype.slice.call(list || []);
        if (!arr.length) return;
        var skipped = 0;
        for (var i = 0; i < arr.length; i++) {
            var file = arr[i];
            if (files.length >= MAX_FILES) {
                skipped++;
                continue;
            }
            var ext = extOf(file.name);
            var typeOk = !!(file.type && file.type.indexOf("video/") === 0);
            if (SUPPORTED_EXT.indexOf(ext) === -1 && !typeOk) {
                skipped++;
                continue;
            }
            if (file.size > MAX_BYTES) {
                skipped++;
                continue;
            }
            var item = {
                id: ++uid,
                file: file,
                name: file.name || "video-" + uid + ".mp4",
                size: file.size || 0,
                duration: 0,
                width: 0,
                height: 0,
                url: objUrl(file)
            };
            files.push(item);
            detectMeta(item);
        }
        if (skipped > 0) {
            var msg = mergeT("toolMergeSkipped", "{n} file dilewati (format/ukuran/batas 3).").replace("{n}", String(skipped));
            showWarn(msg);
        }
        if (files.length && preview && !preview.src) previewFile(files[0]); else if (files.length && preview && preview.src === "") previewFile(files[0]);
        render();
        refreshState();
    }
    window.velardMergeAdd = addFiles;
    function makeStrip(f) {
        if (!f || f.strips || f._stripBusy) return;
        f._stripBusy = true;
        try {
            var v = document.createElement("video");
            v.muted = true;
            v.preload = "auto";
            var N = 4;
            var shots = [];
            var timer = setTimeout(function() {
                cleanup();
                f._stripBusy = false;
            }, 12e3);
            function cleanup() {
                clearTimeout(timer);
                try {
                    v.removeAttribute("src");
                    v.load();
                } catch (e) {}
            }
            v.onloadedmetadata = function() {
                var dur = isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
                if (!dur) {
                    cleanup();
                    f._stripBusy = false;
                    return;
                }
                var idx = 0;
                v.onseeked = function() {
                    try {
                        var c = document.createElement("canvas");
                        c.width = 96;
                        c.height = 54;
                        var ctx = c.getContext("2d");
                        if (ctx && v.videoWidth) {
                            ctx.drawImage(v, 0, 0, 96, 54);
                            shots.push(c.toDataURL("image/jpeg", .6));
                        }
                    } catch (e) {}
                    idx++;
                    if (idx < N) {
                        try {
                            v.currentTime = Math.min(dur - .1, dur * (.12 + .76 * idx / (N - 1)));
                        } catch (e) {
                            next();
                        }
                    } else {
                        next();
                    }
                };
                function next() {
                    cleanup();
                    f.strips = shots;
                    f._stripBusy = false;
                    render();
                }
                v.onerror = next;
                try {
                    v.currentTime = Math.min(dur - .1, dur * .12);
                } catch (e) {
                    next();
                }
            };
            v.onerror = function() {
                cleanup();
                f._stripBusy = false;
            };
            v.src = f.url;
        } catch (e) {
            f._stripBusy = false;
        }
    }
    function renderRuler(total) {
        if (!rulerEl) return;
        rulerEl.innerHTML = "";
        if (!(total > 0)) {
            rulerEl.style.background = "rgba(255,255,255,.02)";
            rulerEl.setAttribute("aria-valuemax", "0");
            return;
        }
        var w = 0;
        try {
            w = rulerEl.clientWidth || rulerEl.parentElement.clientWidth || 300;
        } catch (e) {
            w = 300;
        }
        var px = Math.max(2, w / total);
        rulerEl.style.background = "repeating-linear-gradient(90deg, rgba(255,255,255,.30) 0 1px, transparent 1px " + px + "px)," + "repeating-linear-gradient(90deg, rgba(255,255,255,.55) 0 1px, transparent 1px " + px * 5 + "px)," + "rgba(255,255,255,.02)";
        var steps = [ 1, 2, 5, 10, 15, 30, 60, 120 ];
        var step = steps[steps.length - 1];
        for (var s = 0; s < steps.length; s++) {
            if (total / steps[s] <= 40) {
                step = steps[s];
                break;
            }
        }
        for (var t = 0; t <= total + .001; t += step) {
            var tick = document.createElement("div");
            tick.className = "merge-tick";
            tick.style.left = t / total * 100 + "%";
            tick.textContent = fmtDur(t);
            rulerEl.appendChild(tick);
        }
        rulerEl.setAttribute("aria-valuemax", String(Math.round(total)));
    }
    function virtualNow() {
        var off = offsetOf(selectedId), cur = 0;
        try {
            if (preview) cur = isFinite(preview.currentTime) ? preview.currentTime : 0;
        } catch (e) {}
        return off + cur;
    }
    function updatePlayhead() {
        var ph = q("#toolMergePlayhead");
        if (!ph) return;
        var total = totalDuration();
        if (!(total > 0) || !files.length) {
            ph.hidden = true;
            return;
        }
        var p = Math.max(0, Math.min(1, virtualNow() / total));
        ph.hidden = false;
        // PERF-OPT aman: tulis DOM hanya jika berubah >=0.2% (hasil visual sama)
        var key = Math.round(p * 500);
        if (ph._vk !== key) {
            ph._vk = key;
            ph.style.left = "calc(10px + (100% - 20px) * " + p.toFixed(4) + ")";
        }
        // PERF-OPT aman: aria hanya update per detik (tidak ubah logika)
        var secNow = Math.round(virtualNow());
        if (rulerEl && rulerEl._vs !== secNow) {
            rulerEl._vs = secNow;
            rulerEl.setAttribute("aria-valuenow", String(secNow));
        }
    }
    var rafId = null;
    var _lastTick = 0;
    function tickLoop() {
        rafId = null;
        try {
            if (!preview || preview.paused) { try { document.body.classList.remove("is-preview"); } catch (e) {} return; }
            // PERF-OPT aman: batasi ~15fps, cukup untuk playhead halus (logika sama)
            var _nt = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
            if (_nt - _lastTick >= 66) {
                _lastTick = _nt;
                updateTime();
                updatePlayhead();
            }
            rafId = requestAnimationFrame(tickLoop);
        } catch (e) {}
    }
    function startLoop() {
        try {
            try { document.body.classList.add("is-preview"); } catch (e) {}
            if (rafId === null && preview && !preview.paused && typeof requestAnimationFrame === "function") rafId = requestAnimationFrame(tickLoop);
        } catch (e) {}
    }
    function stopLoop() {
        try {
            try { document.body.classList.remove("is-preview"); } catch (e) {}
            if (rafId !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(rafId);
        } catch (e) {}
        rafId = null;
    }
    function seekVirtual(sec) {
        if (!files.length || busy) return;
        var total = totalDuration();
        if (!(total > 0)) return;
        sec = Math.max(0, Math.min(total, sec));
        var acc = 0, target = files[files.length - 1], off = 0;
        for (var k = 0; k < files.length; k++) {
            var d = files[k].duration || 0;
            if (sec < acc + d || k === files.length - 1) {
                target = files[k];
                off = acc;
                break;
            }
            acc += d;
        }
        if (target.id !== selectedId) previewFile(target);
        try {
            var local = sec - off;
            var cap = target.duration || local;
            preview.currentTime = Math.max(0, Math.min(cap, local));
        } catch (e) {}
        updateTime();
        updatePlayhead();
    }
    function render() {
        if (!listEl) return;
        listEl.innerHTML = "";
        var total = totalDuration();
        if (!total) total = files.length || 1;
        renderRuler(files.length ? files.reduce(function(a, f) {
            return a + (f.duration || 0);
        }, 0) : 0);
        files.forEach(function(f, idx) {
            var pct = Math.max(9, (f.duration || total / files.length) / total * 100);
            var clip = document.createElement("div");
            clip.className = "merge-clip" + (f.id === selectedId ? " active" : "") + (f.muted ? " muted" : "");
            clip.setAttribute("data-id", String(f.id));
            clip.style.width = "calc(" + pct.toFixed(1) + "% - 6px)";
            clip.draggable = !busy;
            var strip = document.createElement("div");
            strip.className = "merge-strip";
            if (f.strips && f.strips.length) {
                f.strips.forEach(function(src) {
                    var im = document.createElement("img");
                    im.src = src;
                    im.alt = "";
                    strip.appendChild(im);
                });
            } else {
                for (var p = 0; p < 4; p++) {
                    var ph = document.createElement("div");
                    ph.className = "merge-strip-ph";
                    strip.appendChild(ph);
                }
                makeStrip(f);
            }
            clip.appendChild(strip);
            var dur = document.createElement("div");
            dur.className = "merge-clip-dur";
            dur.textContent = f.duration ? fmtDur(f.duration) : "…";
            clip.appendChild(dur);
            var label = document.createElement("div");
            label.className = "merge-clip-label";
            var ico = document.createElement("span");
            ico.className = "material-symbols-rounded";
            ico.setAttribute("aria-hidden", "true");
            ico.textContent = "movie";
            var nm = document.createElement("span");
            nm.textContent = idx + 1 + ". " + f.name;
            label.appendChild(ico);
            label.appendChild(nm);
            clip.appendChild(label);
            var x = document.createElement("button");
            x.type = "button";
            x.className = "merge-clip-x";
            x.textContent = "×";
            x.title = "Hapus";
            x.setAttribute("aria-label", "Hapus " + f.name);
            x.disabled = busy;
            x.addEventListener("click", function(e) {
                e.stopPropagation();
                removeFile(f.id);
            });
            clip.appendChild(x);
            var mb = document.createElement("button");
            mb.type = "button";
            mb.className = "merge-clip-mute";
            mb.disabled = busy;
            mb.title = f.muted ? mergeT("toolMergeUnmuteClip", "Suarakan klip") : mergeT("toolMergeMuteClip", "Bisukan klip");
            mb.setAttribute("aria-label", mb.title + " " + f.name);
            mb.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">' + (f.muted ? "volume_off" : "volume_up") + "</span>";
            mb.addEventListener("click", function(e) {
                e.stopPropagation();
                if (busy) return;
                f.muted = !f.muted;
                try {
                    if (preview && f.id === selectedId) preview.muted = !!f.muted;
                } catch (err) {}
                mergeNotify(f.muted ? mergeT("toolMergeMutedToast", "Klip dibisukan. Berlaku di hasil gabungan.") : mergeT("toolMergeUnmutedToast", "Klip disuarakan kembali."));
                render();
                refreshState();
            });
            clip.appendChild(mb);
            clip.addEventListener("click", function() {
                previewFile(f);
            });
            clip.addEventListener("dragstart", function(e) {
                if (busy) {
                    e.preventDefault();
                    return;
                }
                dragId = f.id;
                clip.classList.add("dragging");
                try {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(f.id));
                } catch (err) {}
            });
            clip.addEventListener("dragend", function() {
                dragId = null;
                clip.classList.remove("dragging");
            });
            clip.addEventListener("dragover", function(e) {
                if (busy || dragId === null || dragId === f.id) return;
                e.preventDefault();
                clip.classList.add("dragover");
            });
            clip.addEventListener("dragleave", function() {
                clip.classList.remove("dragover");
            });
            clip.addEventListener("drop", function(e) {
                e.preventDefault();
                clip.classList.remove("dragover");
                reorderTo(dragId, f.id);
            });
            listEl.appendChild(clip);
        });
        listEl.ondragover = function(e) {
            if (!busy && dragId !== null) e.preventDefault();
        };
        listEl.ondrop = function(e) {
            e.preventDefault();
            if (busy || dragId === null || !files.length) return;
            reorderTo(dragId, files[files.length - 1].id, true);
        };
        if (files.length && selectedId === null) previewFile(files[0]); else if (files.length && preview && previewName) {
            var cur = currentFile();
            if (!cur) previewFile(files[0]);
        }
        refreshTransport();
    }
    function reorderTo(fromId, toId, toEnd) {
        if (busy || fromId === null || fromId === toId) return;
        var from = -1, to = -1;
        for (var k = 0; k < files.length; k++) {
            if (files[k].id === fromId) from = k;
            if (files[k].id === toId) to = k;
        }
        if (from < 0 || to < 0) return;
        var item = files.splice(from, 1)[0];
        if (toEnd) files.push(item); else files.splice(to, 0, item);
        render();
        refreshState();
    }
    function removeFile(id) {
        if (busy) return;
        for (var k = 0; k < files.length; k++) {
            if (files[k].id === id) {
                try {
                    URL.revokeObjectURL(files[k].url);
                } catch (e) {}
                files.splice(k, 1);
                break;
            }
        }
        if (selectedId === id) {
            selectedId = null;
            try {
                if (preview) {
                    preview.removeAttribute("src");
                    preview.load();
                }
            } catch (e) {}
            if (previewName) previewName.textContent = "";
            setPlayIco(false);
            updateTime();
        }
        render();
        refreshState();
    }
    function refreshTransport() {
        var dis = busy || !files.length;
        if (prevBtn) prevBtn.disabled = dis;
        if (playBtn) playBtn.disabled = dis;
        if (nextBtn) nextBtn.disabled = dis;
        updateTime();
    }
    function clearAll() {
        if (busy) return;
        try {
            if (preview) preview.pause();
        } catch (e) {}
        files.forEach(function(f) {
            try {
                URL.revokeObjectURL(f.url);
            } catch (e) {}
        });
        files = [];
        selectedId = null;
        try {
            if (fileInput) fileInput.value = "";
        } catch (e) {}
        if (preview) {
            try {
                preview.removeAttribute("src");
                preview.load();
            } catch (e) {}
        }
        if (previewName) previewName.textContent = "";
        showWarn(null);
        setStatus("");
        hideProgress();
        render();
        refreshState();
    }
    function getBridge() {
        if (window.velardFFmpeg && typeof window.velardFFmpeg.load === "function") return window.velardFFmpeg;
        return null;
    }
    function safeUnlink(ffmpeg, names) {
        (names || []).forEach(function(n) {
            try {
                if (ffmpeg.deleteFile) ffmpeg.deleteFile(n);
            } catch (e) {}
        });
    }
    async function runMerge() {
        if (busy || files.length < 2) return;
        try { window.__velardCancelRequested = false; } catch (e) {}
        var bridge = getBridge();
        if (!bridge) {
            var msg = mergeT("toolMergeNoEng", "Mesin belum siap. Tutup lalu buka lagi menunya.");
            setStatus(msg, "err");
            mergeNotify(msg);
            return;
        }
        setBusy(true);
        refreshState();
        setProgress(2, mergeT("toolMergeStep1", "Memuat mesin…"));
        var created = [];
        try {
            var ffmpeg = await bridge.load();
            if (window.__velardCancelRequested) { try { window.__velardCancelRequested = false; } catch (e) {} throw new Error("Dibatalkan pengguna."); }
            try {
                if (ffmpeg.on) ffmpeg.on("progress", function() {});
            } catch (e) {}
            var stamp = Date.now();
            var inputs = [];
            for (var i = 0; i < files.length; i++) {
                var ext = extOf(files[i].name);
                if (SUPPORTED_EXT.indexOf(ext) === -1) ext = "mp4";
                var inName = "merge_in" + i + "_" + stamp + "." + ext;
                await ffmpeg.writeFile(inName, new Uint8Array(await files[i].file.arrayBuffer()));
                created.push(inName);
                inputs.push(inName);
                setProgress(2 + Math.round(28 * (i + 1) / files.length), mergeT("toolMergeStep2", "Menulis file {i}/{n}…").replace("{i}", String(i + 1)).replace("{n}", String(files.length)));
            }
            var outName = "merged-" + stamp + ".mp4";
            var THREADS = "2";
            try {
                THREADS = String(Math.min(4, navigator.hardwareConcurrency || 2));
            } catch (e) {}
            var logBuf = null;
            var progBase = 0, progSpan = 0;
            try {
                if (ffmpeg.on) {
                    ffmpeg.on("log", function(ev) {
                        if (logBuf && ev && ev.message) logBuf.push(ev.message);
                    });
                    ffmpeg.on("progress", function(ev) {
                        try {
                            var p = ev && ev.progress;
                            if (isFinite(p)) setProgress(progBase + progSpan * Math.max(0, Math.min(1, p)));
                        } catch (e) {}
                    });
                }
            } catch (e) {}
            async function hasAudioStream(inName) {
                logBuf = [];
                try {
                    await ffmpeg.exec([ "-hide_banner", "-i", inName ]);
                } catch (e) {}
                var out = logBuf || [];
                logBuf = null;
                return out.some(function(m) {
                    return /Stream #\d+:\d+[^:]*: Audio/.test(m);
                });
            }
            var TS = targetSize();
            var VF = "scale=" + TS.w + ":" + TS.h + ":force_original_aspect_ratio=decrease,pad=" + TS.w + ":" + TS.h + ":(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30,setpts=PTS-STARTPTS";
            var AF = "aformat=sample_fmts=fltp:channel_layouts=stereo,aresample=44100,asetpts=PTS-STARTPTS";
            var norms = [];
            for (var j = 0; j < inputs.length; j++) {
                var nName = "merge_norm" + j + "_" + stamp + ".mp4";
                var withAudio = !files[j].muted && await hasAudioStream(inputs[j]);
                var args;
                var base = 30 + 55 * j / inputs.length, span = 55 / inputs.length;
                progBase = base;
                progSpan = 0;
                if (withAudio) {
                    args = [ "-y", "-i", inputs[j], "-threads", THREADS, "-vf", VF, "-af", AF, "-r", "30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-ar", "44100", "-ac", "2", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", nName ];
                } else {
                    args = [ "-y", "-i", inputs[j], "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-threads", THREADS, "-map", "0:v", "-map", "1:a", "-vf", VF, "-r", "30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-ar", "44100", "-ac", "2", "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", nName ];
                }
                progSpan = span;
                await ffmpeg.exec(args);
                progBase = 0;
                progSpan = 0;
                safeUnlink(ffmpeg, [ inputs[j] ]);
                created.push(nName);
                norms.push(nName);
                setProgress(30 + Math.round(55 * (j + 1) / inputs.length), mergeT("toolMergeStep3", "Menormalisasi…") + " " + (j + 1) + "/" + inputs.length);
            }
            var list2 = "merge_list_" + stamp + ".txt";
            await ffmpeg.writeFile(list2, (new TextEncoder).encode(norms.map(function(n) {
                return "file '" + n + "'";
            }).join("\n")));
            created.push(list2);
            setProgress(88, mergeT("toolMergeStep4", "Menggabungkan…"));
            progBase = 88;
            progSpan = 6;
            await ffmpeg.exec([ "-y", "-fflags", "+genpts", "-f", "concat", "-safe", "0", "-i", list2, "-c", "copy", "-movflags", "+faststart", outName ]);
            progBase = 0;
            progSpan = 0;
            setProgress(94, mergeT("toolMergeStep5", "Menyimpan…"));
            var data = await ffmpeg.readFile(outName);
            created.push(outName);
            var blob = data instanceof Blob ? data : new Blob([ data ], {
                type: "video/mp4"
            });
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = outName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function() {
                URL.revokeObjectURL(url);
            }, 5e3);
            safeUnlink(ffmpeg, created);
            setProgress(100, mergeT("toolMergeDone", "Video gabungan siap diunduh."));
            mergeNotify(mergeT("toolMergeDone", "Video gabungan siap diunduh."));
        } catch (e) {
            var rawMsg = String((e && e.message ? e.message : e) || "");
            var isCancel = false;
            try { isCancel = !!window.__velardCancelRequested || /terminate|dibatalkan|cancelled/i.test(rawMsg); } catch (err) {}
            try { if (isCancel) window.__velardCancelRequested = false; } catch (err) {}
            var emsg = isCancel ? (mergeLang() === "en" ? "Process cancelled." : "Proses dibatalkan.") : mergeT("toolMergeFail", "Gagal menggabungkan: ") + rawMsg;
            setStatus(emsg, "err");
            mergeNotify(emsg);
            hideProgress();
        }
        setBusy(false);
        refreshState();
    }
    window.velardMergeRun = runMerge;
    window.__mergeClock = {
        total: totalDuration,
        offset: offsetOf,
        seek: seekVirtual
    };
    function mergeClearCache() {
        clearAll();
        mergeNotify(mergeT("toolMergeCacheDone", "Cache merge dibersihkan."));
    }
    if (fileInput) fileInput.addEventListener("change", function() {
        addFiles(fileInput.files);
        try {
            fileInput.value = "";
        } catch (e) {}
    });
    if (drop) {
        drop.addEventListener("click", function() {
            if (fileInput) fileInput.click();
        });
        drop.addEventListener("keydown", function(e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (fileInput) fileInput.click();
            }
        });
        [ "dragenter", "dragover" ].forEach(function(ev) {
            drop.addEventListener(ev, function(e) {
                e.preventDefault();
                drop.classList.add("dragover");
            });
        });
        [ "dragleave", "drop" ].forEach(function(ev) {
            drop.addEventListener(ev, function(e) {
                e.preventDefault();
                drop.classList.remove("dragover");
            });
        });
        drop.addEventListener("drop", function(e) {
            var dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length) addFiles(dt.files);
        });
    }
    if (runBtn) runBtn.addEventListener("click", runMerge);
    if (clearBtn) clearBtn.addEventListener("click", clearAll);
    if (prevBtn) prevBtn.addEventListener("click", function() {
        stepClip(-1);
    });
    if (nextBtn) nextBtn.addEventListener("click", function() {
        stepClip(1);
    });
    if (playBtn) playBtn.addEventListener("click", function() {
        if (!preview || busy) return;
        try {
            if (preview.paused) {
                preview.play();
            } else {
                preview.pause();
            }
        } catch (e) {}
    });
    if (preview) {
        preview.addEventListener("click", function() {
            if (busy) return;
            try {
                if (preview.paused) {
                    preview.play();
                } else {
                    preview.pause();
                }
            } catch (e) {}
        });
        preview.addEventListener("play", function() {
            setPlayIco(true);
            startLoop();
        });
        preview.addEventListener("pause", function() {
            setPlayIco(false);
            stopLoop();
            updateTime();
        });
        preview.addEventListener("timeupdate", updateTime);
        preview.addEventListener("loadedmetadata", updateTime);
        preview.addEventListener("ended", function() {
            var i = -1;
            for (var k = 0; k < files.length; k++) {
                if (files[k].id === selectedId) {
                    i = k;
                    break;
                }
            }
            if (i >= 0 && i < files.length - 1) {
                previewFile(files[i + 1]);
                try {
                    preview.play();
                } catch (e) {}
            } else {
                setPlayIco(false);
            }
        });
    }
    var fullBtn = q("#toolMergeFull");
    var fullIco = q("#toolMergeFullIco");
    function syncFullIco() {
        if (!fullIco) return;
        var fs = false;
        try {
            fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        } catch (e) {}
        fullIco.textContent = fs ? "fullscreen_exit" : "fullscreen";
    }
    if (fullBtn) fullBtn.addEventListener("click", function() {
        try {
            var wrap = preview ? preview.parentElement : null;
            var fs = document.fullscreenElement || document.webkitFullscreenElement;
            if (fs) {
                if (document.exitFullscreen) document.exitFullscreen(); else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            } else if (wrap) {
                if (wrap.requestFullscreen) wrap.requestFullscreen(); else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
            }
        } catch (e) {}
    });
    try {
        document.addEventListener("fullscreenchange", syncFullIco);
    } catch (e) {}
    try {
        document.addEventListener("webkitfullscreenchange", syncFullIco);
    } catch (e) {}
    var trashBtn = null;
    function ensureTrash() {
        var panel = document.getElementById("toolPanel-merge");
        var card = document.getElementById("toolModalCard");
        var hero = document.getElementById("toolModalHero");
        var mergeOpen = !!(panel && hero && !panel.hidden && card && !card.hidden);
        var attached = !!(trashBtn && trashBtn.isConnected);
        if (mergeOpen && !attached) {
            trashBtn = document.createElement("button");
            trashBtn.type = "button";
            trashBtn.id = "toolMergeCacheClear";
            trashBtn.className = "merge-trash-top";
            var tip = mergeT("toolMergeCacheTip", "Bersihkan cache merge");
            trashBtn.title = tip;
            trashBtn.setAttribute("aria-label", tip);
            trashBtn.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">delete</span>';
            trashBtn.addEventListener("click", function() {
                if (!busy) mergeClearCache();
            });
            hero.appendChild(trashBtn);
        } else if (!mergeOpen && trashBtn) {
            try {
                trashBtn.remove();
            } catch (e) {}
            trashBtn = null;
        } else if (trashBtn) {
            var tip2 = mergeT("toolMergeCacheTip", "Bersihkan cache merge");
            trashBtn.title = tip2;
            trashBtn.setAttribute("aria-label", tip2);
        }
    }
    try {
        var modalCard = document.getElementById("toolModalCard");
        if (modalCard && typeof MutationObserver !== "undefined") {
            new MutationObserver(ensureTrash).observe(modalCard, {
                attributes: true,
                attributeFilter: [ "hidden" ],
                childList: true,
                subtree: true
            });
        }
    } catch (e) {}
    ensureTrash();
    try {
        var modalCard = document.getElementById("toolModalCard");
        if (modalCard && typeof MutationObserver !== "undefined") {
            new MutationObserver(function() {
                if (modalCard.hidden) {
                    try {
                        if (preview && !preview.paused) preview.pause();
                    } catch (e) {}
                    stopLoop();
                }
            }).observe(modalCard, {
                attributes: true,
                attributeFilter: [ "hidden" ]
            });
        }
    } catch (e) {}
    if (rulerEl) {
        rulerEl.addEventListener("click", function(e) {
            var total = totalDuration();
            if (!(total > 0) || busy) return;
            var rect = rulerEl.getBoundingClientRect();
            var x = (e.clientX - rect.left) / Math.max(1, rect.width);
            seekVirtual(x * total);
        });
        rulerEl.addEventListener("keydown", function(e) {
            var total = totalDuration();
            if (!(total > 0) || busy) return;
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                seekVirtual(virtualNow() + (e.key === "ArrowRight" ? 1 : -1));
            }
            if (e.key === "Home") {
                e.preventDefault();
                seekVirtual(0);
            }
            if (e.key === "End") {
                e.preventDefault();
                seekVirtual(total);
            }
        });
    }
    window.addEventListener("resize", function() {
        renderRuler(totalDuration());
        updatePlayhead();
    });
    window.addEventListener("qm:langchange", function() {
        showWarn(null);
        render();
        refreshState();
    });
    render();
    refreshState();
})();