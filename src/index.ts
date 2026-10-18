import { isIOS, loadImage, replaceLinkTags } from "./helpers";
import { renderSplashes, type SplashSpec } from "./render";
import type { IconConfig, PwaSplashOptions } from "./types";
export type { IconConfig, PwaSplashOptions } from "./types";

/**
 * Generated images per icon, keyed by everything that decides their pixels, most recently used last.
 * It holds a light and a dark set, so switching appearance back and forth renders each set once,
 * and overlapping calls with the same inputs share the work in progress.
 */
const imageCache = new Map<string, Promise<string[]>>();
const imageCacheSize = 2;

/** The newest call per tag attribute. Once a newer call starts, older ones leave the tags alone. */
const latestCalls = new Map<string, object>();

function cached(key: string, render: () => Promise<string[]>): Promise<string[]> {
    let hrefs = imageCache.get(key);
    if (!hrefs) {
        const rendering = render();
        // Forget failures so the next call tries again.
        rendering.catch(() => imageCache.get(key) === rendering && imageCache.delete(key));
        hrefs = rendering;
    }
    // Re-insert as the most recently used.
    imageCache.delete(key);
    imageCache.set(key, hrefs);
    return hrefs;
}

/**
 * Generates and injects iOS PWA splash screens for light and dark modes.
 * Images are encoded off the main thread where the browser allows it and reused while the inputs stay the same.
 * When calls overlap, the most recent one decides the tags.
 * @param {PwaSplashOptions} userOptions - The configuration options for the splash screens.
 * @returns {Promise<void>} A promise that resolves once the tags are in place, or once a newer call has taken over, and rejects on critical errors.
 */
export async function generateIosPwaSplash(userOptions: PwaSplashOptions): Promise<void> {
    const opts = {
        ...userOptions,
        ensureIos: userOptions.ensureIos ?? true,
        ensureMetaTags: userOptions.ensureMetaTags ?? true,
        imageType: userOptions.imageType ?? 'image/png',
        quality: userOptions.quality ?? 1,
        customAttribute: userOptions.customAttribute ?? 'data-pwa-splash-generated',
        fetchPriority: userOptions.fetchPriority ?? 'high',
    };

    // Abort if not in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Abort if not an iOS device
    if (opts.ensureIos && !isIOS()) return;

    // Add 'apple-mobile-web-app-capable' meta tag.
    if (opts.ensureMetaTags) {
        if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
            const meta = document.createElement('meta');
            meta.name = 'apple-mobile-web-app-capable';
            meta.content = 'yes';
            document.head.appendChild(meta);
        }
    }

    const call = {};
    latestCalls.set(opts.customAttribute, call);

    let deviceWidth = screen.width;
    let deviceHeight = screen.height;
    const pixelRatio = window.devicePixelRatio || 1;

    if (window.visualViewport?.width) {
        const viewportWidth = Math.round(window.visualViewport.width * window.visualViewport.scale);
        // detect private mode.
        if (deviceWidth > viewportWidth && viewportWidth > 0) {
            deviceWidth = viewportWidth;
            // This ratio (284 / 131 = 2.167) is a hardcoded value based on observations
            // of modern iPhone screen dimensions. Yes, its not a perfect solution, but its the only way I currently know of to handle this.
            // It should not negatively affect any device however.
            deviceHeight = Math.round(deviceWidth * (284 / 131));
        }
    }

    // Whole pixels, as a canvas truncates its size, so the icon is placed for the size actually drawn.
    const portraitWidth = Math.floor(Math.min(deviceWidth, deviceHeight) * pixelRatio);
    const portraitHeight = Math.floor(Math.max(deviceWidth, deviceHeight) * pixelRatio);

    // Portrait and landscape images for an icon. The icon is only loaded when they are not cached.
    const splashImages = (icon: IconConfig) => {
        const url = new URL(icon.url, document.baseURI).href;
        const spec: SplashSpec = {
            sizes: [[portraitWidth, portraitHeight], [portraitHeight, portraitWidth]],
            backgroundColor: icon.backgroundColor,
            margin: icon.margin ?? 25,
            imageType: opts.imageType,
            quality: opts.quality,
        };
        // The request mode is part of the key: with or without credentials, a server can send a different image.
        return cached(JSON.stringify([url, opts.crossOrigin, spec]), async () => renderSplashes(await loadImage(url, opts.crossOrigin, opts.fetchPriority), spec));
    };

    const images = Promise.all([
        splashImages(opts.icon),
        opts.iconDark && splashImages(opts.iconDark),
    ]);

    // Trimmed after the lookups above, so a call never evicts images it is about to use.
    while (imageCache.size > imageCacheSize) imageCache.delete(imageCache.keys().next().value!);

    const [light, dark] = await images;

    // A newer call started meanwhile, and its tags are the ones to keep.
    if (latestCalls.get(opts.customAttribute) !== call) return;

    const splashScreens = [
        { href: light[0], media: 'screen and (orientation: portrait)' },
        { href: light[1], media: 'screen and (orientation: landscape)' },
    ];

    // Generate dark mode splash screens if configured
    if (dark) {
        splashScreens.push(
            { href: dark[0], media: 'screen and (prefers-color-scheme: dark) and (orientation: portrait)' },
            { href: dark[1], media: 'screen and (prefers-color-scheme: dark) and (orientation: landscape)' },
        );
    }

    // Keep existing splash screens if loading or generation fails: tags change only once every image is ready.
    replaceLinkTags(splashScreens, opts.customAttribute);
}
