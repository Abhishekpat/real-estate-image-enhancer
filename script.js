(function () {
    "use strict";

    const MAX_DIMENSION = 2000;

    const $ = (sel) => document.querySelector(sel);
    const uploadArea = $("#uploadArea");
    const fileInput = $("#fileInput");
    const uploadSection = $("#uploadSection");
    const editorSection = $("#editorSection");
    const canvas = $("#mainCanvas");
    const ctx = canvas.getContext("2d");
    const furnitureLayer = $("#furnitureLayer");

    const btnEnhance = $("#btnEnhance");
    const btnErase = $("#btnErase");
    const btnStage = $("#btnStage");
    const btnReset = $("#btnReset");
    const btnDownload = $("#btnDownload");

    const enhanceControls = $("#enhanceControls");
    const eraseControls = $("#eraseControls");
    const stagingControls = $("#stagingControls");

    const brightnessSlider = $("#brightness");
    const contrastSlider = $("#contrast");
    const saturationSlider = $("#saturation");
    const brightnessVal = $("#brightnessVal");
    const contrastVal = $("#contrastVal");
    const saturationVal = $("#saturationVal");
    const btnAutoEnhance = $("#btnAutoEnhance");

    const brushSizeSlider = $("#brushSize");
    const brushSizeVal = $("#brushSizeVal");
    const furniturePicker = $("#furniturePicker");

    let originalImage = null;
    let currentImageData = null;
    let activeMode = null; // "enhance" | "erase" | "stage"
    let isErasing = false;

    const furnitureAssets = [
        { name: "Sofa", src: "assets/sofa.svg", width: 180, height: 100 },
        { name: "Table", src: "assets/table.svg", width: 150, height: 100 },
        { name: "Plant", src: "assets/plant.svg", width: 80, height: 120 }
    ];

    // ── Upload Handling ──

    uploadArea.addEventListener("click", () => fileInput.click());

    uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) loadImage(file);
    });

    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (file) loadImage(file);
    });

    function loadImage(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                let w = img.width;
                let h = img.height;
                if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
                    const scale = MAX_DIMENSION / Math.max(w, h);
                    w = Math.round(w * scale);
                    h = Math.round(h * scale);
                }
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);
                originalImage = ctx.getImageData(0, 0, w, h);
                currentImageData = ctx.getImageData(0, 0, w, h);
                uploadSection.style.display = "none";
                editorSection.style.display = "block";
                resetControls();
                clearFurniture();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // ── Mode Switching ──

    function setMode(mode) {
        activeMode = activeMode === mode ? null : mode;

        btnEnhance.classList.toggle("active", activeMode === "enhance");
        btnErase.classList.toggle("active", activeMode === "erase");
        btnStage.classList.toggle("active", activeMode === "stage");

        enhanceControls.style.display = activeMode === "enhance" ? "flex" : "none";
        eraseControls.style.display = activeMode === "erase" ? "flex" : "none";
        stagingControls.style.display = activeMode === "stage" ? "flex" : "none";

        canvas.classList.toggle("erasing", activeMode === "erase");

        if (activeMode === "stage") {
            furnitureLayer.style.pointerEvents = "auto";
        } else {
            furnitureLayer.style.pointerEvents = "none";
        }
    }

    btnEnhance.addEventListener("click", () => setMode("enhance"));
    btnErase.addEventListener("click", () => setMode("erase"));
    btnStage.addEventListener("click", () => setMode("stage"));

    // ── Enhance Lighting ──

    function applyEnhancements() {
        if (!originalImage) return;
        const brightness = parseInt(brightnessSlider.value, 10);
        const contrast = parseInt(contrastSlider.value, 10);
        const saturation = parseInt(saturationSlider.value, 10);

        brightnessVal.textContent = brightness;
        contrastVal.textContent = contrast;
        saturationVal.textContent = saturation;

        const src = originalImage.data;
        const out = new ImageData(
            new Uint8ClampedArray(src),
            originalImage.width,
            originalImage.height
        );
        const data = out.data;

        const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const satFactor = 1 + saturation / 100;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i] + brightness;
            let g = data[i + 1] + brightness;
            let b = data[i + 2] + brightness;

            r = contrastFactor * (r - 128) + 128;
            g = contrastFactor * (g - 128) + 128;
            b = contrastFactor * (b - 128) + 128;

            const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            r = gray + satFactor * (r - gray);
            g = gray + satFactor * (g - gray);
            b = gray + satFactor * (b - gray);

            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }

        ctx.putImageData(out, 0, 0);
        currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    brightnessSlider.addEventListener("input", applyEnhancements);
    contrastSlider.addEventListener("input", applyEnhancements);
    saturationSlider.addEventListener("input", applyEnhancements);

    btnAutoEnhance.addEventListener("click", () => {
        brightnessSlider.value = 20;
        contrastSlider.value = 15;
        saturationSlider.value = 25;
        applyEnhancements();
    });

    // ── Erase Tool ──

    function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function eraseAt(x, y) {
        const size = parseInt(brushSizeSlider.value, 10);
        const halfSize = size / 2;

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const w = canvas.width;
        const h = canvas.height;

        const sx = Math.max(0, Math.floor(x - halfSize));
        const sy = Math.max(0, Math.floor(y - halfSize));
        const ex = Math.min(w - 1, Math.ceil(x + halfSize));
        const ey = Math.min(h - 1, Math.ceil(y + halfSize));

        for (let py = sy; py <= ey; py++) {
            for (let px = sx; px <= ex; px++) {
                const dx = px - x;
                const dy = py - y;
                if (dx * dx + dy * dy > halfSize * halfSize) continue;

                let totalR = 0, totalG = 0, totalB = 0, count = 0;
                const sampleRadius = Math.max(size, 15);
                for (let s = 0; s < 12; s++) {
                    const angle = (s / 12) * Math.PI * 2;
                    const sr = sampleRadius + Math.random() * 5;
                    const nx = Math.round(px + Math.cos(angle) * sr);
                    const ny = Math.round(py + Math.sin(angle) * sr);
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        const ni = (ny * w + nx) * 4;
                        totalR += data[ni];
                        totalG += data[ni + 1];
                        totalB += data[ni + 2];
                        count++;
                    }
                }
                if (count > 0) {
                    const idx = (py * w + px) * 4;
                    data[idx] = totalR / count;
                    data[idx + 1] = totalG / count;
                    data[idx + 2] = totalB / count;
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);
        currentImageData = ctx.getImageData(0, 0, w, h);
    }

    canvas.addEventListener("mousedown", (e) => {
        if (activeMode !== "erase") return;
        isErasing = true;
        const { x, y } = getCanvasCoords(e);
        eraseAt(x, y);
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!isErasing || activeMode !== "erase") return;
        const { x, y } = getCanvasCoords(e);
        eraseAt(x, y);
    });

    canvas.addEventListener("mouseup", () => { isErasing = false; });
    canvas.addEventListener("mouseleave", () => { isErasing = false; });

    canvas.addEventListener("touchstart", (e) => {
        if (activeMode !== "erase") return;
        e.preventDefault();
        isErasing = true;
        const { x, y } = getCanvasCoords(e);
        eraseAt(x, y);
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
        if (!isErasing || activeMode !== "erase") return;
        e.preventDefault();
        const { x, y } = getCanvasCoords(e);
        eraseAt(x, y);
    }, { passive: false });

    canvas.addEventListener("touchend", () => { isErasing = false; });

    brushSizeSlider.addEventListener("input", () => {
        brushSizeVal.textContent = brushSizeSlider.value;
    });

    // ── Virtual Staging ──

    function buildFurniturePicker() {
        furniturePicker.innerHTML = "";
        furnitureAssets.forEach((asset, idx) => {
            const div = document.createElement("div");
            div.className = "fp-option";
            div.title = "Add " + asset.name;
            const img = document.createElement("img");
            img.src = asset.src;
            img.alt = asset.name;
            div.appendChild(img);
            div.addEventListener("click", () => addFurniture(idx));
            furniturePicker.appendChild(div);
        });
    }

    function addFurniture(assetIndex) {
        const asset = furnitureAssets[assetIndex];
        const wrapper = document.createElement("div");
        wrapper.className = "furniture-item";

        const canvasRect = canvas.getBoundingClientRect();
        const scaleX = canvasRect.width / canvas.width;
        const displayW = asset.width * scaleX;
        const displayH = asset.height * scaleX;

        wrapper.style.width = displayW + "px";
        wrapper.style.height = displayH + "px";
        wrapper.style.left = (canvasRect.width / 2 - displayW / 2) + "px";
        wrapper.style.top = (canvasRect.height / 2 - displayH / 2) + "px";

        const img = document.createElement("img");
        img.src = asset.src;
        img.alt = asset.name;
        img.draggable = false;
        wrapper.appendChild(img);

        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-furniture";
        removeBtn.textContent = "\u00D7";
        removeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            wrapper.remove();
        });
        wrapper.appendChild(removeBtn);

        makeDraggable(wrapper);
        furnitureLayer.appendChild(wrapper);
    }

    function makeDraggable(el) {
        let offsetX = 0, offsetY = 0, startX = 0, startY = 0, dragging = false;

        function onStart(e) {
            if (e.target.classList.contains("remove-furniture")) return;
            dragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX;
            startY = clientY;
            offsetX = el.offsetLeft;
            offsetY = el.offsetTop;
            el.style.cursor = "grabbing";
            e.preventDefault();
        }

        function onMove(e) {
            if (!dragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            el.style.left = (offsetX + clientX - startX) + "px";
            el.style.top = (offsetY + clientY - startY) + "px";
        }

        function onEnd() {
            dragging = false;
            el.style.cursor = "grab";
        }

        el.addEventListener("mousedown", onStart);
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onEnd);
        el.addEventListener("touchstart", onStart, { passive: false });
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onEnd);
    }

    function clearFurniture() {
        furnitureLayer.innerHTML = "";
    }

    buildFurniturePicker();

    // ── Reset ──

    function resetControls() {
        brightnessSlider.value = 0;
        contrastSlider.value = 0;
        saturationSlider.value = 0;
        brightnessVal.textContent = "0";
        contrastVal.textContent = "0";
        saturationVal.textContent = "0";
        setMode(null);
        activeMode = null;
    }

    btnReset.addEventListener("click", () => {
        if (!originalImage) return;
        ctx.putImageData(originalImage, 0, 0);
        currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resetControls();
        clearFurniture();
    });

    // ── Download ──

    btnDownload.addEventListener("click", () => {
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const exportCtx = exportCanvas.getContext("2d");
        exportCtx.drawImage(canvas, 0, 0);

        const canvasRect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;

        const items = furnitureLayer.querySelectorAll(".furniture-item");
        let loaded = 0;
        const total = items.length;

        if (total === 0) {
            triggerDownload(exportCanvas);
            return;
        }

        items.forEach((item) => {
            const imgEl = item.querySelector("img");
            const img = new Image();
            img.onload = function () {
                const left = parseFloat(item.style.left) * scaleX;
                const top = parseFloat(item.style.top) * scaleY;
                const w = item.offsetWidth * scaleX;
                const h = item.offsetHeight * scaleY;
                exportCtx.drawImage(img, left, top, w, h);
                loaded++;
                if (loaded === total) triggerDownload(exportCanvas);
            };
            img.src = imgEl.src;
        });
    });

    function triggerDownload(cvs) {
        const link = document.createElement("a");
        link.download = "enhanced-property.png";
        link.href = cvs.toDataURL("image/png");
        link.click();
    }

})();
