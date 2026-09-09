(function() {
    if (window.__vtThumbInit) return;
    window.__vtThumbInit = true;
    function q(sel) {
        return document.querySelector("#toolPanel-thumbnail " + sel) || document.querySelector(sel);
    }
    var video = q("#video");
    var canvas = q("#canvas");
    var file = q("#videofile");
    var videoControls = q("#videoControls");
    var videow = q("#videow");
    var snapd = q("#snapd");
    var snap = q("#snap");
    var snap2 = q("#snap2");
    var save = q("#save");
    var saveall = q("#saveall");
    var clear = q("#clear");
    var videoInfo = q("#videoInfo");
    var snapSize = q("#snapsize");
    var context = canvas ? canvas.getContext("2d") : null;
    var slider = q("#slider");
    var w, h, ratio;
    var snapProc = null;
    var SUPPORTED_EXT = [ "mp4", "m4v", "mov", "webm", "mkv", "avi" ];
    function thumbLang() {
        try {
            return (window.i18n && window.i18n.getLang ? window.i18n.getLang() : null) || localStorage.getItem("lang") || "id";
        } catch (e) {
            return "id";
        }
    }
    function thumbT(key, fb) {
        try {
            if (window.i18n && window.i18n.t) {
                var v = window.i18n.t(key);
                if (v && v !== key) return v;
            }
        } catch (e) {}
        return fb;
    }
    function thumbNotify(msg) {
        try {
            var toast = document.getElementById("appToast");
            if (toast) {
                toast.textContent = msg;
                toast.style.zIndex = "2147483647";
                toast.classList.add("show");
                clearTimeout(thumbNotify._t);
                thumbNotify._t = setTimeout(function() {
                    toast.classList.remove("show");
                }, 3500);
                return;
            }
        } catch (e) {}
        try {
            alert(msg);
        } catch (e) {}
    }
    function showWarn(msg) {
        var el = q("#thumbFileWarn");
        if (!el) return;
        el.textContent = msg;
        el.hidden = false;
    }
    function hideWarn() {
        var el = q("#thumbFileWarn");
        if (!el) return;
        el.textContent = "";
        el.hidden = true;
    }
    window.vtVideo = video || null;
    function timeUpdate() {
        if (!video) return;
        if (slider) {
            slider.setAttribute("max", Math.ceil(video.duration));
            slider.value = video.currentTime;
        }
        if (!videoInfo) return;
        videoInfo.style.display = "block";
        videoInfo.innerHTML = [ "Video size: " + video.videoWidth + "x" + video.videoHeight, "Video length: " + Math.round(video.duration * 10) / 10 + "sec", "Playback position: " + Math.round(video.currentTime * 10) / 10 + "sec" ].join("<br>");
    }
    function goToTime(v, time) {
        var vv = v || video;
        if (!vv || !isFinite(vv.duration)) return;
        vv.currentTime = Math.min(vv.duration, Math.max(0, time));
        timeUpdate();
    }
    window.vtGoToTime = function(t) {
        goToTime(video, t);
    };
    if (video) {
        video.addEventListener("timeupdate", timeUpdate);
        setInterval(function() {
            if (!video) return;
            var play = document.querySelector("#toolPanel-thumbnail .play-control");
            var pause = document.querySelector("#toolPanel-thumbnail .pause-control");
            if (!play || !pause) return;
            if (video.paused) {
                play.style.display = "block";
                pause.style.display = "none";
            } else {
                play.style.display = "none";
                pause.style.display = "block";
            }
        }, 1e3);
        video.addEventListener("loadedmetadata", function() {
            if (videow) videow.value = video.videoWidth;
            if (videoInfo) {
                videoInfo.innerHTML = [ "Video size: " + video.videoWidth + "x" + video.videoHeight, "Video length: " + Math.round(video.duration * 10) / 10 + "sec" ].join("<br>");
            }
            video.objectURL = false;
            try {
                video.play();
                video.pause();
            } catch (e) {}
            resize();
        }, false);
    }
    function resize() {
        if (!video || !video.videoWidth || !videow) return;
        ratio = video.videoWidth / video.videoHeight;
        w = videow.value;
        h = parseInt(w / ratio, 10);
        canvas.width = w;
        canvas.height = h;
    }
    window.vtResize = resize;
    if (videow) videow.addEventListener("change", resize);
    if (slider && video) {
        slider.addEventListener("input", function() {
            goToTime(video, parseFloat(slider.value) || 0);
        });
        slider.addEventListener("mouseover", function() {
            this.title = this.value + "sec";
        });
    }
    function snapPicture() {
        if (!video || !video.videoWidth || !canvas) return;
        resize();
        context.fillRect(0, 0, w, h);
        context.drawImage(video, 0, 0, w, h);
        var time = video.currentTime;
        var container = q("#outputs");
        var img = document.createElement("img");
        img.src = canvas.toDataURL();
        img.className = "output";
        img.addEventListener("click", function() {
            selectImage(img);
        });
        img.title = "t" + ("000" + time.toFixed(2)).slice(-7) + "seg";
        img.onclick = function() {
            goToTime(video, time);
        };
        var cont = document.createElement("div");
        cont.className = "output-container";
        cont.style.display = "inline-block";
        cont.appendChild(img);
        var label = document.createElement("label");
        label.innerHTML = time.toFixed(2) + "s " + w + "x" + h;
        cont.appendChild(label);
        var close = document.createElement("a");
        close.className = "output-remove";
        close.innerHTML = "x";
        close.href = "javascript:void(0)";
        close.addEventListener("click", function() {
            container.removeChild(cont);
            if (container.children.length == 0) {
                if (save) save.disabled = true;
                if (saveall) saveall.disabled = true;
                if (clear) clear.disabled = true;
            }
            refreshResultLabel();
        });
        cont.appendChild(close);
        container.appendChild(cont);
        img.setAttribute("size", w + "x" + h);
        selectImage(img);
        refreshResultLabel();
    }
    window.snapPicture = snapPicture;
    function autoSnapPictureAfterSelection() {
        var sel = q("#snap_each");
        if (!sel) return;
        var value = 0;
        if (sel.value.indexOf("%") > 0) {
            value = sel.value.replace("%", "") * 1 / 100;
            autoSnapPictureAfterPercent(value);
        }
        if (sel.value.indexOf("m") > 0) {
            value = sel.value.replace("m", "") * 1;
            autoSnapPictureAfterMin(value);
        }
    }
    window.autoSnapPictureAfterSelection = autoSnapPictureAfterSelection;
    function zipAllImages() {
        if (typeof JSZip === "undefined") {
            alert("JSZip belum termuat. Muat ulang halaman.");
            return;
        }
        var zip = new JSZip;
        var container = q("#outputs");
        var images = container.querySelectorAll("img");
        var imgFolder = zip.folder("images");
        images.forEach(function(img) {
            var imgData = img.src.replace(/^data:image\/(png|jpg);base64,/, "");
            imgFolder.file(img.title + ".png", imgData, {
                base64: true
            });
        });
        zip.generateAsync({
            type: "blob"
        }).then(function(content) {
            if (typeof saveAs !== "undefined") saveAs(content, "images.zip"); else {
                var url = URL.createObjectURL(content);
                var a = document.createElement("a");
                a.href = url;
                a.download = "images.zip";
                a.click();
                setTimeout(function() {
                    URL.revokeObjectURL(url);
                }, 2e3);
            }
        });
    }
    window.zipAllImages = zipAllImages;
    function autoSnapPictureAfterPercent(percentage) {
        if (!video || !video.duration) {
            thumbNotify(thumbT("thumbNeedVideo", "Muat video terlebih dahulu."));
            return;
        }
        clearInterval(snapProc);
        var duration = video.duration;
        var interval = percentage * duration;
        var time = .1;
        snapProc = setInterval(function() {
            goToTime(video, time);
            setTimeout(snapPicture, (snapd ? snapd.value * 1 : 400) || 400);
            time += interval;
            if (time >= duration) {
                clearInterval(snapProc);
            }
        }, ((snapd ? snapd.value * 1 : 400) || 400) + 100);
    }
    function autoSnapPictureAfterMin(minutes) {
        if (!video || !video.duration) {
            thumbNotify(thumbT("thumbNeedVideo", "Muat video terlebih dahulu."));
            return;
        }
        clearInterval(snapProc);
        var duration = video.duration;
        var interval = 60 * minutes;
        var time = .1;
        snapProc = setInterval(function() {
            goToTime(video, time);
            setTimeout(snapPicture, (snapd ? snapd.value * 1 : 400) || 400);
            time += interval;
            if (time >= duration) {
                clearInterval(snapProc);
            }
        }, ((snapd ? snapd.value * 1 : 400) || 400) + 100);
    }
    function clearSnaps() {
        var container = q("#outputs");
        if (container) container.innerHTML = "";
        if (save) save.disabled = true;
        if (saveall) saveall.disabled = true;
        if (clear) clear.disabled = true;
        var prev = q("#preview");
        if (prev) prev.style.display = "none";
        refreshResultLabel();
    }
    function refreshResultLabel() {
        var label = q("#thumbResultLabel");
        var container = q("#outputs");
        if (!label || !container) return;
        label.textContent = container.children.length ? thumbT("thumbResultDone", "Hasil") : thumbT("thumbResultEmpty", "Belum ada tangkapan layar");
    }
    window.refreshResultLabel = refreshResultLabel;
    window.clearSnaps = clearSnaps;
    window.__vtStop = function() {
        clearInterval(snapProc);
    };
    function selectImage(img) {
        var parent = img.parentElement.parentElement;
        var images = parent.querySelectorAll(".output-container > img");
        for (var index = 0; index < images.length; index++) {
            var element = images[index];
            if (element != img) {
                element.classList.remove("selected");
            }
        }
        img.classList.add("selected");
        var preview = q("#preview");
        if (preview) {
            preview.src = img.src;
            preview.style.display = "";
            preview.title = img.title;
        }
        if (save) save.disabled = false;
        if (saveall) saveall.disabled = false;
        if (clear) clear.disabled = false;
    }
    function selectVideo() {
        if (file) file.click();
    }
    window.selectVideo = selectVideo;
    function loadVideoFile() {
        var fileInput = file && file.files ? file.files[0] : null;
        if (!fileInput) return;
        var fName = fileInput.name || "";
        var fExt = (fName.split(".").pop() || "").toLowerCase();
        var fTypeOk = !!(fileInput.type && fileInput.type.indexOf("video/") === 0);
        if (SUPPORTED_EXT.indexOf(fExt) === -1 && !fTypeOk) {
            var msg = thumbT("thumbUnsupported", "Format ." + fExt + " tidak didukung. Gunakan MP4, MOV, WebM, MKV, atau AVI.").replace("{ext}", fExt);
            showWarn(msg);
            thumbNotify(msg);
            try {
                file.value = "";
            } catch (e) {}
            return;
        }
        hideWarn();
        if (fileInput) {
            if (video.objectURL && video.src) {
                try {
                    URL.revokeObjectURL(video.src);
                } catch (e) {}
            }
            video.removeAttribute("crossorigin");
            video.preload = "metadata";
            video.objectURL = true;
            video.src = URL.createObjectURL(fileInput);
            if (videow) videow.removeAttribute("readonly");
            if (snap) snap.disabled = false;
            if (snap2) snap2.disabled = false;
            if (videoControls) videoControls.style.display = "";
            try {
                video.load();
            } catch (e) {}
        }
    }
    window.loadVideoFile = loadVideoFile;
    function loadVideoURL(url) {
        if (!video || !url) return;
        video.preload = "metadata";
        video.src = url;
        if (videow) videow.removeAttribute("readonly");
        if (snap) snap.disabled = false;
        if (snap2) snap2.disabled = false;
        if (videoControls) videoControls.style.display = "";
        try {
            video.load();
        } catch (e) {}
    }
    window.loadVideoURL = loadVideoURL;
    window.vtLoadVideoURL = loadVideoURL;
    function showInput(id) {
        var a = document.getElementById("select-file");
        var b = document.getElementById("select-url");
        var panel = document.getElementById("toolPanel-thumbnail");
        var ta = panel ? panel.querySelector("#select-file") : null;
        var tb = panel ? panel.querySelector("#select-url") : null;
        if (ta || a) (ta || a).style.display = "none";
        if (tb || b) (tb || b).style.display = "none";
        var el = panel ? panel.querySelector("#" + id) : null;
        el = el || document.getElementById(id);
        if (el) el.style.display = "";
    }
    window.showInput = showInput;
    function savePicture(btn) {
        var selected = function() {
            var panel = document.getElementById("toolPanel-thumbnail");
            return (panel ? panel.querySelector(".selected") : null) || document.querySelector(".selected");
        }();
        if (selected) {
            var dataURL = selected.src;
            var link = document.getElementById("imagelink");
            if (!link) return;
            link.style.display = "";
            link.style.opacity = 0;
            link.href = dataURL;
            var rnd = Math.round(Math.random() * 1e4);
            link.setAttribute("download", "video-capture-" + selected.title + "-" + rnd + ".png");
            link.click();
            setTimeout(function() {
                link.style.display = "none";
            }, 100);
        }
    }
    window.savePicture = savePicture;
    if (file) file.addEventListener("change", loadVideoFile);
    if (snap) snap.addEventListener("click", snapPicture);
    if (snap2) snap2.addEventListener("click", autoSnapPictureAfterSelection);
    if (save) save.addEventListener("click", function() {
        savePicture(save);
    });
    if (saveall) saveall.addEventListener("click", zipAllImages);
    if (clear) clear.addEventListener("click", function() {
        clearInterval(snapProc);
        clearSnaps();
    });
    function thumbClearCache() {
        clearInterval(snapProc);
        try {
            if (video) video.pause();
        } catch (e) {}
        try {
            if (video && video.objectURL && video.src) URL.revokeObjectURL(video.src);
        } catch (e) {}
        if (video) {
            video.objectURL = false;
            try {
                video.removeAttribute("src");
                video.load();
            } catch (e) {}
        }
        try {
            if (file) file.value = "";
        } catch (e) {}
        if (slider) {
            slider.value = "0";
            slider.setAttribute("max", "100");
        }
        if (videoControls) videoControls.style.display = "none";
        if (snap) snap.disabled = true;
        if (snap2) snap2.disabled = true;
        var cPrev = q("#preview");
        if (cPrev) cPrev.style.display = "none";
        clearSnaps();
        hideWarn();
        thumbNotify(thumbT("thumbCacheDone", "Cache thumbnail dibersihkan."));
    }
    window.addEventListener("qm:langchange", function() {
        hideWarn();
        refreshResultLabel();
    });
    var cacheBtn = document.getElementById("thumbCacheClear");
    if (cacheBtn) cacheBtn.addEventListener("click", thumbClearCache);
    refreshResultLabel();
    var urlRadio = document.getElementById("vt_url_radio") || document.getElementById("video_url");
    var fileRadio = document.getElementById("vt_file_radio") || document.getElementById("video_file");
    if (fileRadio) fileRadio.addEventListener("click", function() {
        showInput("select-file");
    });
    if (urlRadio) urlRadio.addEventListener("click", function() {
        showInput("select-url");
    });
    window.addEventListener("load", function() {
        try {
            var buttons = document.querySelectorAll("#toolPanel-thumbnail button");
            for (var index = 0; index < buttons.length; index++) {
                (function(element) {
                    element.addEventListener("click", function() {
                        if (typeof gtag === "undefined") return;
                        var name = element.innerText.trim();
                        var category = "button";
                        if (element.getAttribute("category") == "controls") {
                            name = "Video Controls";
                            category = "controls";
                        }
                        var id = name.toLowerCase().replace(" ", "_");
                        try {
                            gtag("event", category + "-" + id, {});
                        } catch (e) {}
                    });
                })(buttons[index]);
            }
        } catch (e) {}
    });
})();