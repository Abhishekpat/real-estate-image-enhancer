# Real Estate Image Enhancer

A fully client-side web application for enhancing property images instantly in the browser. No backend, no API keys, no external AI services required.

## Features

- **Image Upload** — Upload any property image via drag-and-drop or file picker.
- **Enhance Lighting** — Adjust brightness, contrast, and saturation using Canvas API, with an auto-enhance preset.
- **Remove Object** — Click and drag a brush tool to erase unwanted objects from the image.
- **Virtual Staging** — Place and drag transparent furniture overlays onto the image.
- **Download** — Export the enhanced image as a PNG file.
- **Large Image Handling** — Automatically resizes images over 2000px to prevent performance issues.

## How to Run Locally

1. Clone or download this repository.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
3. That's it — no build step, no server needed.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Canvas API for image processing

## Demo

[Live Demo](https://real-estate-image-enhancer.netlify.app)

## Project Structure

```
real-estate/
├── index.html          # Main HTML page
├── style.css           # Styles
├── script.js           # Application logic
├── assets/             # Furniture overlay SVGs
│   ├── sofa.svg
│   ├── table.svg
│   └── plant.svg
└── README.md           # This file
```

## License

MIT
