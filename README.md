# Sentinel QA Toolbox

A lightweight "manual QA companion" that adds on-page inspection overlays and one-click diagnostics export (layout spacing, typography audits, element picker, and evidence capture) to speed up exploratory testing and bug reporting.

## Features

### MVP (v1.0)
- **Ruler + Spacing Inspector**: Hover over elements to see bounding boxes, margins, padding, and distances to sibling elements
- **Typography Outlier Highlighter**: Automatically detects and highlights elements with non-standard typography
- **Element Picker**: Click any element to copy diagnostic information (selector, styles, position) to clipboard

## Getting Started

### Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `sentinel-qa-toolbox` folder

### Usage

1. Click the Sentinel QA Toolbox icon in your Chrome toolbar
2. Toggle "Ruler" to enable element inspection on hover
3. Toggle "Audit Typography" to highlight typography outliers
4. Click any element while the ruler is enabled to copy diagnostic info to clipboard

### Icon Setup

The extension uses a dark green QA drawer icon. To generate the PNG icon:

1. Open `icons/convert-svg-to-png.html` in your browser
2. Click "Convert & Download icon128.png"
3. Save the downloaded file as `icons/icon128.png` in the project folder

The icon is based on the "Drawer Qa" SVG from [SVG Repo](https://www.svgrepo.com/svg/440726/drawer-qa), modified to use a dark green color (#03592a). See [Attributions](#attributions) below.

## Project Structure

```
sentinel-qa-toolbox/
├── manifest.json              # Extension manifest (MV3)
├── icons/
│   └── icon128.png           # Extension icon (you need to create this)
├── src/
│   ├── background/
│   │   └── service-worker.js # Background service worker
│   ├── content/
│   │   ├── overlay.js        # Content script with ruler/typography features
│   │   └── styles.css        # Styles for overlay UI
│   └── popup/
│       ├── popup.html        # Extension popup UI
│       └── popup.js         # Popup logic
└── README.md
```

## Development

### Architecture

- **Content Script** (`overlay.js`): Injects Shadow DOM overlay for ruler and typography features
- **Service Worker** (`service-worker.js`): Handles extension state and messaging
- **Popup** (`popup.html/js`): User interface for toggling features

### Permissions

- `activeTab`: Access to the active tab when extension is used
- `storage`: Save user preferences
- `scripting`: Inject content scripts programmatically

## Roadmap

### v1.1-v1.3 (Planned)
- Console log capture
- Failed requests summary (DevTools panel integration)
- Viewport/zoom presets

## Attributions

### Icon
The extension icon is based on the "Drawer Qa" SVG from [SVG Repo](https://www.svgrepo.com/svg/440726/drawer-qa), modified to use a dark green color (#03592a).

- **Source**: [Drawer Qa SVG Vector](https://www.svgrepo.com/svg/440726/drawer-qa)
- **Collection**: Classjob Ff Game Icons
- **License**: MIT License
- **Author**: xivapi
- **Repository**: [SVG Repo](https://www.svgrepo.com)

## License

MIT License - see LICENSE file for details
