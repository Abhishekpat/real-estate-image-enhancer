# Real Estate Image Enhancer

A fully functional web application for enhancing real estate property photos directly in the browser. No backend, no API keys, no external services - just pure HTML, CSS, and JavaScript.

## Features

### 1. Image Upload
- Drag & drop or click to upload property images
- Automatic resizing for large images (max 1920x1080) to ensure smooth performance
- Supports all common image formats (JPG, PNG, WebP, etc.)

### 2. Enhance Lighting
- **Brightness Control**: Adjust image brightness from 0% to 200%
- **Contrast Control**: Fine-tune contrast for better definition
- **Saturation Control**: Enhance or reduce color vibrancy
- Real-time preview using Canvas API filter effects
- Reset button to restore original lighting

### 3. Remove Object (Erase Tool)
- Interactive brush tool to erase unwanted objects from images
- Adjustable brush size (5px to 50px)
- Click and drag to erase
- Clear all erasures with one click
- Simulates object removal using canvas compositing

### 4. Virtual Staging
- Add furniture overlays to empty rooms
- **Included Furniture**:
  - Modern Gray Sofa (3-seater)
  - Wooden Coffee Table
  - Decorative Potted Plant
- Click to add furniture to the center of the image
- Drag to position furniture anywhere on the image
- Clear all furniture with one click

### 5. Download
- Save the enhanced image as PNG
- Combines all edits (lighting, erasures, furniture) into final image
- One-click download

## How to Run Locally

### Option 1: Direct File Open
1. Download or clone this repository
2. Open `index.html` directly in your web browser
3. Start enhancing images!

### Option 2: Local Server (Recommended)
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```
Then open `http://localhost:8000` in your browser.

## Tech Stack

- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with flexbox and grid
- **Vanilla JavaScript** - No frameworks, pure ES6+
- **Canvas API** - Image processing and manipulation
  - `drawImage()` for rendering
  - `filter` for lighting adjustments
  - `globalCompositeOperation` for erasing
  - `getImageData()`/`putImageData()` for pixel manipulation

## Project Structure

```
real-estate-enhancer/
├── index.html          # Main HTML file
├── style.css           # Stylesheet
├── script.js           # Application logic
├── README.md           # Documentation
└── assets/             # Furniture images
    ├── sofa.png        # Gray sofa
    ├── table.png       # Wooden table
    └── plant.png       # Potted plant
```

## Browser Compatibility

Works in all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Demo

[Live Demo Placeholder - Deploy to GitHub Pages or Netlify]

## Performance Notes

- Large images are automatically resized to max 1920x1080 for smooth performance
- All processing happens client-side - no server delays
- Optimized for images up to 5MB

## License

MIT License - Free for personal and commercial use.

## Credits

Furniture images generated with AI for demonstration purposes.
