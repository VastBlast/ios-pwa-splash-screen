# ios-pwa-splash-screen

Add iOS and iPadOS PWA splash screens generated from your app icons.

[Demo](https://vastbla.st/ios-pwa-splash-screen)

## Features

- Creates portrait and landscape `<link rel="apple-touch-startup-image">` tags
- Supports separate light and dark mode icons
- Detects iOS and iPadOS by default
- Encodes the images in a Web Worker, so the page stays responsive
- Replaces previously generated tags when run again, reusing images it has already made
- Includes ESM, CommonJS, UMD, and TypeScript declarations

## Install

```bash
npm install ios-pwa-splash-screen
```

## Basic usage

Define a setup function:

```ts
// src/pwa-splash.ts
import { generateIosPwaSplash } from 'ios-pwa-splash-screen';

export function setupIosSplashScreen() {
  generateIosPwaSplash({
    icon: { url: '/icons/icon-light.png', backgroundColor: '#fff' },
    iconDark: { url: '/icons/icon-dark.png', backgroundColor: '#000' },
  }).catch(console.error);
}
```

Run it from a browser entry point:

```ts
import { setupIosSplashScreen } from './pwa-splash';

setupIosSplashScreen();
```

Local icon URLs need no extra configuration. For an icon hosted on another origin, that server must allow CORS and `crossOrigin: 'anonymous'` must be set. Set `ensureIos: false` when testing on a non-iOS device.

## Running it again

Call `generateIosPwaSplash` again whenever the splash screens should change, for example when the user picks a different appearance in your app. Each call replaces the tags from the previous one.

- Images are reused while their inputs stay the same: icon URL and `crossOrigin`, background color, margin, image format and quality, and screen size. The images for the two most recently used icon configurations are kept, which covers switching between a light and a dark appearance. If the icon file changes, give it a new URL.
- When calls overlap, the most recent one decides the tags. Once a newer call has started, earlier calls resolve without changing them.
- If a call fails, the existing tags stay in place.

## Framework examples

These examples use `setupIosSplashScreen` from above.

### React and Next.js

```tsx
'use client'; // Required by the Next.js App Router.

import { useEffect } from 'react';
import { setupIosSplashScreen } from './pwa-splash';

export function PwaSplashSetup() {
  useEffect(() => setupIosSplashScreen(), []);

  return null;
}
```

Render `<PwaSplashSetup />` in the root component or layout.

### Vue and Nuxt

Call it from the root `App.vue` or layout:

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { setupIosSplashScreen } from './pwa-splash';

onMounted(setupIosSplashScreen);
</script>
```

### Svelte and SvelteKit

Call it from the root component or `+layout.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { setupIosSplashScreen } from './pwa-splash';

  onMount(setupIosSplashScreen);
</script>
```

### Angular

```ts
import { afterNextRender, Component } from '@angular/core';
import { setupIosSplashScreen } from './pwa-splash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor() {
    afterNextRender(setupIosSplashScreen);
  }
}
```

### Astro

Call it from a `<script>` in the root layout:

```astro
<script>
  import { setupIosSplashScreen } from './pwa-splash';

  setupIosSplashScreen();
</script>
```

## CDN usage

The examples use unpkg. For jsDelivr, replace `https://unpkg.com/` with `https://cdn.jsdelivr.net/npm/`.

### ES module

```html
<script type="module">
  import { generateIosPwaSplash } from 'https://unpkg.com/ios-pwa-splash-screen/dist/index.js';

  generateIosPwaSplash({
    icon: { url: '/icon-light.png', backgroundColor: '#fff' },
    iconDark: { url: '/icon-dark.png', backgroundColor: '#000' },
  }).catch(console.error);
</script>
```

### UMD

```html
<script src="https://unpkg.com/ios-pwa-splash-screen/dist/index.umd.js"></script>

<script>
  window.IosPwaSplashScreen.generateIosPwaSplash({
    icon: { url: '/icon-light.png', backgroundColor: '#fff' },
    iconDark: { url: '/icon-dark.png', backgroundColor: '#000' },
  }).catch(console.error);
</script>
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` | `IconConfig` | **required** | Light-mode icon configuration |
| `iconDark` | `IconConfig` | None | Dark-mode icon configuration |
| `ensureIos` | `boolean` | `true` | Only run on iOS and iPadOS |
| `ensureMetaTags` | `boolean` | `true` | Ensure the Apple web-app-capable meta tag exists |
| `crossOrigin` | `'anonymous' \| 'use-credentials'` | None | Set `img.crossOrigin` when loading icons |
| `imageType` | `'image/png' \| 'image/jpeg'` | `'image/png'` | Generated image format |
| `quality` | `number` | `1` | JPEG quality from `0` to `1` |
| `fetchPriority` | `'low' \| 'high' \| 'auto'` | `'high'` | Icon image fetch priority |
| `customAttribute` | `string` | `'data-pwa-splash-generated'` | Attribute that marks the generated tags. A later call replaces the tags with the same attribute |

### `IconConfig`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | **required** | Square icon URL |
| `backgroundColor` | `string` | **required** | Splash screen background color |
| `margin` | `number` | `25` | Icon margin as a percentage of the shorter screen edge |

## Browser support

Splash screens are generated on iOS and iPadOS, or in any browser with `ensureIos: false`. On iOS and iPadOS 16.4 and later, and in other current browsers, the full-screen images are painted and encoded in a Web Worker using `OffscreenCanvas`. Where that is not available, they are encoded on the main thread, one image per task.

### Content Security Policy

The worker is started from a `blob:` URL. If your page sets a Content Security Policy, allow `blob:` in `worker-src`, or in the directive it falls back to (`child-src`, then `script-src`, then `default-src`):

```
worker-src 'self' blob:
```

Without it, the browser blocks the worker and logs a CSP violation, and the images are encoded on the main thread instead. Pages that enforce Trusted Types also use the main thread.

## License

MIT © [VastBlast](https://github.com/VastBlast/ios-pwa-splash-screen)
