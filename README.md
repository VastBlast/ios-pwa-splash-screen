# ios-pwa-splash-screen

Add iOS and iPadOS PWA splash screens generated from your app icons.

[Demo](https://vastbla.st/ios-pwa-splash-screen)

## Features

- Creates portrait and landscape `<link rel="apple-touch-startup-image">` tags
- Supports separate light and dark mode icons
- Detects iOS and iPadOS by default
- Replaces previously generated tags when run again
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
| `cleanup` | `boolean` | `true` | Remove previously generated startup-image tags |
| `customAttribute` | `string` | `'data-pwa-splash-generated'` | Attribute used to identify generated tags |

### `IconConfig`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | **required** | Square icon URL |
| `backgroundColor` | `string` | **required** | Splash screen background color |
| `margin` | `number` | `25` | Icon margin as a percentage of the shorter screen edge |

## License

MIT © [VastBlast](https://github.com/VastBlast/ios-pwa-splash-screen)
