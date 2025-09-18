# ios-pwa-splash-screen

Add iOS PWA splash screens to your Progressive Web App with zero configuration.

## Installation

```bash
npm install ios-pwa-splash-screen
# or
yarn add ios-pwa-splash-screen
```

## Demo
[Live Demo (add this to your home screen)](https://vastbla.st/ios-pwa-splash-screen)

## Features

* Automatically detects iOS/iPadOS devices
* Generates and injects `<link rel="apple-touch-startup-image">` for both portrait and landscape
* Supports light & dark mode icons
* Cleans up old tags on each run
* Optional debug logging

## Quick Start (local)

Import and run as early as possible (e.g. in your main entry script):

```ts
import { generateIosPwaSplash } from 'ios-pwa-splash-screen';

window.addEventListener('load', () => {
  generateIosPwaSplash({
    icon: {
      url: '/assets/icon-light.png',
      backgroundColor: '#ffffff',
      margin: 20,
    },
    iconDark: {
      url: '/assets/icon-dark.png',
      backgroundColor: '#000000',
      margin: 20,
    },
    crossOrigin: 'anonymous',
    ensureMetaTags: true,
    debug: false,
  }).catch(err => {
    console.error('Splash generation failed:', err);
  });
});
```

## CDN Usage

You can load the library directly from unpkg or jsDelivr without installing:

### ES Module (modern browsers)

```html
<script type="module">
  import { generateIosPwaSplash } from 'https://unpkg.com/ios-pwa-splash-screen/dist/index.js';
  // import { generateIosPwaSplash } from 'https://cdn.jsdelivr.net/npm/ios-pwa-splash-screen/dist/index.js';

  window.addEventListener('load', () => {
    generateIosPwaSplash({
      icon: { url: '/icon-light.png', backgroundColor: '#fff', margin: 20 },
      iconDark: { url: '/icon-dark.png', backgroundColor: '#000', margin: 20 },
    });
  });
</script>
```

### UMD (classic `<script>` tag)

```html
<!-- unpkg -->
<script src="https://unpkg.com/ios-pwa-splash-screen/dist/index.umd.js"></script>
<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/ios-pwa-splash-screen/dist/index.umd.js"></script>

<script>
  // `generateIosPwaSplash` is exposed on window.IosPwaSplashScreen
  window.IosPwaSplashScreen.generateIosPwaSplash({
    icon: { url: '/icon-light.png', backgroundColor: '#fff', margin: 20 },
    iconDark: { url: '/icon-dark.png', backgroundColor: '#000', margin: 20 },
  });
</script>
```

## Options

| Option             | Type                               | Default                       | Description                                                            |
| ------------------ | ---------------------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| `icon`             | `IconConfig`                       | **required**                  | Light-mode icon config (URL, bg color, margin)                         |
| `iconDark`         | `IconConfig \| undefined`          | *none*                        | Dark-mode icon config; omit to disable dark-mode splash                |
| `ensureIos`        | `boolean`                          | `true`                        | Only run on iOS/iPadOS devices                                         |
| `ensureMetaTags`   | `boolean`                          | `true`                        | Auto-inject `<meta name="apple-mobile-web-app-capable" content="yes">` |
| `crossOrigin`      | `'anonymous' \| 'use-credentials'` | *none*                        | Sets `img.crossOrigin` on the icon image                               |
| `imageType`        | `'image/png' \| 'image/jpeg'`      | `'image/png'`                 | Output format                                                          |
| `quality`          | `number (0–1)`                     | `1`                           | JPEG quality (if `imageType === 'image/jpeg'`)                         |
| `fetchPriority`    | `'low' \| 'medium' \| 'high'`      | `'high'`                      | Sets `img.fetchPriority`                                               |
| `cleanup`          | `boolean`                          | `true`                        | Remove previously generated `<link>` tags before injecting new ones    |
| `customAttribute`  | `string`                           | `'data-pwa-splash-generated'` | Attribute to flag generated tags                                       |

### `IconConfig`

| Property          | Type     | Default | Description                                   |
| ----------------- | -------- | ------- | --------------------------------------------- |
| `url`             | `string` | —       | URL of the square icon image (e.g. 512×512)   |
| `backgroundColor` | `string` | —       | Any valid CSS color for the splash background |
| `margin`          | `number` | `25`    | Margin % around the icon on the splash        |

## License

MIT © [VastBlast](https://github.com/VastBlast/ios-pwa-splash-screen)
