// Real Estate Image Enhancer - Main JavaScript

// Global variables
let originalImage = null;
let mainCanvas, eraseCanvas, furnitureCanvas;
let mainCtx, eraseCtx, furnitureCtx;
let currentImageData = null;
let isEraseMode = false;
let isDragging = false;
let dragFurniture = null;
let furnitureItems = [];
let brushSize = 20;
let lastEraseX = null;
let lastEraseY = null;

// Maximum image dimensions for performance
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    setupEventListeners();
});

function initializeElements() {
    mainCanvas = document.getElementById('mainCanvas');
    eraseCanvas = document.getElementById('eraseCanvas');
    furnitureCanvas = document.getElementById('furnitureCanvas');
    mainCtx = mainCanvas.getContext('2d');
    eraseCtx = eraseCanvas.getContext('2d');
    furnitureCtx = furnitureCanvas.getContext('2d');
}

function setupEventListeners() {
    // File upload
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');

    fileInput.addEventListener('change', handleFileSelect);

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    });

    // Lighting controls
    document.getElementById('brightness').addEventListener('input', updateLighting);
    document.getElementById('contrast').addEventListener('input', updateLighting);
    document.getElementById('saturation').addEventListener('input', updateLighting);
    document.getElementById('resetLighting').addEventListener('click', resetLighting);

    // Erase controls
    document.getElementById('brushSize').addEventListener('input', updateBrushSize);
    document.getElementById('toggleEraseMode').addEventListener('click', toggleEraseMode);
    document.getElementById('clearErase').addEventListener('click', clearErasures);

    // Furniture controls
    document.querySelectorAll('.furniture-item').forEach(item => {
        item.addEventListener('click', () => addFurniture(item.dataset.furniture));
    });
    document.getElementById('clearFurniture').addEventListener('click', clearFurniture);

    // Canvas overlay interactions
    const overlay = document.getElementById('canvasOverlay');
    overlay.addEventListener('mousedown', handleCanvasMouseDown);
    overlay.addEventListener('mousemove', handleCanvasMouseMove);
    overlay.addEventListener('mouseup', handleCanvasMouseUp);
    overlay.addEventListener('mouseleave', handleCanvasMouseUp);

    // Touch support
    overlay.addEventListener('touchstart', handleTouchStart, { passive: false });
    overlay.addEventListener('touchmove', handleTouchMove, { passive: false });
    overlay.addEventListener('touchend', handleCanvasMouseUp);

    // Action buttons
    document.getElementById('downloadBtn').addEventListener('click', downloadImage);
    document.getElementById('newImageBtn').addEventListener('click', resetApp);
}

// File Handling
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            loadImage(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function loadImage(img) {
    originalImage = img;

    // Resize if needed
    let width = img.width;
    let height = img.height;

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
    }

    // Set canvas dimensions
    mainCanvas.width = width;
    mainCanvas.height = height;
    eraseCanvas.width = width;
    eraseCanvas.height = height;
    furnitureCanvas.width = width;
    furnitureCanvas.height = height;

    // Draw original image
    mainCtx.drawImage(img, 0, 0, width, height);
    currentImageData = mainCtx.getImageData(0, 0, width, height);

    // Update UI
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('editorSection').style.display = 'block';
    document.getElementById('imageDimensions').textContent = `${width} x ${height}px`;

    // Reset controls
    resetLighting();
    clearErasures();
    clearFurniture();
}

// Lighting Enhancement
function updateLighting() {
    if (!originalImage) return;

    const brightness = parseInt(document.getElementById('brightness').value);
    const contrast = parseInt(document.getElementById('contrast').value);
    const saturation = parseInt(document.getElementById('saturation').value);

    // Update value displays
    document.getElementById('brightnessValue').textContent = brightness + '%';
    document.getElementById('contrastValue').textContent = contrast + '%';
    document.getElementById('saturationValue').textContent = saturation + '%';

    // Apply filters
    mainCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    mainCtx.drawImage(originalImage, 0, 0, mainCanvas.width, mainCanvas.height);
    mainCtx.filter = 'none';
}

function resetLighting() {
    document.getElementById('brightness').value = 100;
    document.getElementById('contrast').value = 100;
    document.getElementById('saturation').value = 100;
    document.getElementById('brightnessValue').textContent = '100%';
    document.getElementById('contrastValue').textContent = '100%';
    document.getElementById('saturationValue').textContent = '100%';
    
    if (originalImage) {
        mainCtx.filter = 'none';
        mainCtx.drawImage(originalImage, 0, 0, mainCanvas.width, mainCanvas.height);
    }
}

// Erase Tool
function updateBrushSize() {
    brushSize = parseInt(document.getElementById('brushSize').value);
    document.getElementById('brushSizeValue').textContent = brushSize + 'px';
}

function toggleEraseMode() {
    isEraseMode = !isEraseMode;
    const btn = document.getElementById('toggleEraseMode');
    const overlay = document.getElementById('canvasOverlay');
    const modeIndicator = document.getElementById('modeIndicator');

    if (isEraseMode) {
        btn.textContent = 'Stop Erasing';
        btn.classList.add('active');
        overlay.classList.add('eraser-mode');
        modeIndicator.textContent = 'Eraser Mode';
    } else {
        btn.textContent = 'Start Erasing';
        btn.classList.remove('active');
        overlay.classList.remove('eraser-mode');
        modeIndicator.textContent = '';
    }
}

function clearErasures() {
    eraseCtx.clearRect(0, 0, eraseCanvas.width, eraseCanvas.height);
}

function erase(x, y) {
    eraseCtx.globalCompositeOperation = 'destination-out';
    eraseCtx.beginPath();
    
    if (lastEraseX !== null && lastEraseY !== null) {
        eraseCtx.moveTo(lastEraseX, lastEraseY);
        eraseCtx.lineTo(x, y);
        eraseCtx.lineWidth = brushSize;
        eraseCtx.lineCap = 'round';
        eraseCtx.lineJoin = 'round';
        eraseCtx.stroke();
    }
    
    eraseCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    eraseCtx.fill();
    
    lastEraseX = x;
    lastEraseY = y;
}

// Virtual Staging - Furniture
function addFurniture(type) {
    if (!originalImage) return;

    const furnitureImg = new Image();
    furnitureImg.crossOrigin = 'anonymous';
    
    furnitureImg.onload = () => {
        // Scale furniture to reasonable size (20-30% of canvas width)
        const scale = Math.min(0.25, 300 / furnitureImg.width);
        const width = furnitureImg.width * scale;
        const height = furnitureImg.height * scale;
        
        // Place in center
        const x = (furnitureCanvas.width - width) / 2;
        const y = (furnitureCanvas.height - height) / 2;
        
        const item = {
            img: furnitureImg,
            x: x,
            y: y,
            width: width,
            height: height,
            dragging: false
        };
        
        furnitureItems.push(item);
        renderFurniture();
    };
    
    furnitureImg.src = `assets/${type}.png`;
}

function renderFurniture() {
    furnitureCtx.clearRect(0, 0, furnitureCanvas.width, furnitureCanvas.height);
    
    furnitureItems.forEach(item => {
        furnitureCtx.drawImage(item.img, item.x, item.y, item.width, item.height);
    });
}

function clearFurniture() {
    furnitureItems = [];
    furnitureCtx.clearRect(0, 0, furnitureCanvas.width, furnitureCanvas.height);
}

// Canvas Mouse/Touch Handlers
function getCanvasCoordinates(e) {
    const rect = mainCanvas.getBoundingClientRect();
    const scaleX = mainCanvas.width / rect.width;
    const scaleY = mainCanvas.height / rect.height;
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function handleCanvasMouseDown(e) {
    if (!originalImage) return;
    
    const coords = getCanvasCoordinates(e);
    
    if (isEraseMode) {
        lastEraseX = coords.x;
        lastEraseY = coords.y;
        erase(coords.x, coords.y);
    } else {
        // Check if clicking on furniture
        for (let i = furnitureItems.length - 1; i >= 0; i--) {
            const item = furnitureItems[i];
            if (coords.x >= item.x && coords.x <= item.x + item.width &&
                coords.y >= item.y && coords.y <= item.y + item.height) {
                item.dragging = true;
                item.dragOffsetX = coords.x - item.x;
                item.dragOffsetY = coords.y - item.y;
                isDragging = true;
                dragFurniture = item;
                document.getElementById('canvasOverlay').classList.add('drag-mode');
                break;
            }
        }
    }
}

function handleCanvasMouseMove(e) {
    if (!originalImage) return;
    
    const coords = getCanvasCoordinates(e);
    
    if (isEraseMode && lastEraseX !== null) {
        erase(coords.x, coords.y);
    } else if (isDragging && dragFurniture) {
        dragFurniture.x = coords.x - dragFurniture.dragOffsetX;
        dragFurniture.y = coords.y - dragFurniture.dragOffsetY;
        renderFurniture();
    }
}

function handleCanvasMouseUp() {
    lastEraseX = null;
    lastEraseY = null;
    
    if (dragFurniture) {
        dragFurniture.dragging = false;
        dragFurniture = null;
    }
    
    isDragging = false;
    document.getElementById('canvasOverlay').classList.remove('drag-mode');
}

// Touch handlers
function handleTouchStart(e) {
    if (!originalImage) return;
    e.preventDefault();
    handleCanvasMouseDown(e);
}

function handleTouchMove(e) {
    if (!originalImage) return;
    e.preventDefault();
    handleCanvasMouseMove(e);
}

// Download
function downloadImage() {
    if (!originalImage) return;

    // Create a temporary canvas to combine all layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = mainCanvas.width;
    tempCanvas.height = mainCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw main image
    tempCtx.drawImage(mainCanvas, 0, 0);

    // Apply erasures (draw erase canvas with destination-out effect on a copy)
    const eraseData = eraseCtx.getImageData(0, 0, eraseCanvas.width, eraseCanvas.height);
    const mainData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    
    for (let i = 0; i < eraseData.data.length; i += 4) {
        if (eraseData.data[i + 3] > 0) {
            mainData.data[i + 3] = 0; // Set alpha to 0
        }
    }
    
    tempCtx.putImageData(mainData, 0, 0);

    // Draw furniture
    tempCtx.drawImage(furnitureCanvas, 0, 0);

    // Download
    const link = document.createElement('a');
    link.download = 'enhanced-property-image.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}

// Reset
function resetApp() {
    originalImage = null;
    furnitureItems = [];
    isEraseMode = false;
    isDragging = false;
    dragFurniture = null;
    
    document.getElementById('uploadSection').style.display = 'block';
    document.getElementById('editorSection').style.display = 'none';
    document.getElementById('fileInput').value = '';
    
    // Clear canvases
    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    eraseCtx.clearRect(0, 0, eraseCanvas.width, eraseCanvas.height);
    furnitureCtx.clearRect(0, 0, furnitureCanvas.width, furnitureCanvas.height);
    
    // Reset controls
    resetLighting();
    document.getElementById('toggleEraseMode').textContent = 'Start Erasing';
    document.getElementById('toggleEraseMode').classList.remove('active');
    document.getElementById('canvasOverlay').classList.remove('eraser-mode');
    document.getElementById('modeIndicator').textContent = '';
}
