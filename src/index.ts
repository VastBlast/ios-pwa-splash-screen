import { createSplashscreen, injectLinkTag, removeLinkTags, isIOS, loadImage } from "./helpers";
import type { PwaSplashOptions } from "./types";

const defaultOptions: Partial<PwaSplashOptions> = {
    ensureIos: true,
    ensureMetaTags: true,
    imageType: 'image/png',
    quality: 1,
    cleanup: true,
    customAttribute: 'data-pwa-splash-generated',
    fetchPriority: 'high'
};

/**
 * Generates and injects iOS PWA splash screens for light and dark modes.
 * @param {PwaSplashOptions} userOptions - The configuration options for the splash screens.
 * @returns {Promise<void>} A promise that resolves when the process is complete or rejects on critical errors.
 */
export async function generateIosPwaSplash(userOptions: PwaSplashOptions): Promise<void> {
    const opts: PwaSplashOptions = {
        ...defaultOptions,
        ...userOptions,
    }

    // Abort if not in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Abort if not an iOS device
    if (opts.ensureIos && !isIOS()) return;

    // Clean up previous tags
    if (opts.cleanup && opts.customAttribute) {
        removeLinkTags(opts.customAttribute);
    }

    // Add 'apple-mobile-web-app-capable' meta tag.
    if (opts.ensureMetaTags) {
        if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
            const meta = document.createElement('meta');
            meta.name = 'apple-mobile-web-app-capable';
            meta.content = 'yes';
            document.head.appendChild(meta);
        }
    }

    // Load icon images
    const [mainIconImage, darkIconImage] = await Promise.all([
        loadImage(opts.icon.url, opts.crossOrigin, opts.fetchPriority),
        opts.iconDark ? loadImage(opts.iconDark.url, opts.crossOrigin, opts.fetchPriority) : Promise.resolve(null)
    ]);

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

    const portraitWidth = deviceWidth * pixelRatio;
    const portraitHeight = deviceHeight * pixelRatio;
    const landscapeWidth = deviceHeight * pixelRatio;
    const landscapeHeight = deviceWidth * pixelRatio;

    // Generate and inject light mode splash screens
    const portraitDataUrl = createSplashscreen(mainIconImage, opts.icon, portraitWidth, portraitHeight, opts);
    const landscapeDataUrl = createSplashscreen(mainIconImage, opts.icon, landscapeWidth, landscapeHeight, opts);

    if (portraitDataUrl) injectLinkTag(portraitDataUrl, `screen and (orientation: portrait)`, opts.customAttribute!);
    if (landscapeDataUrl) injectLinkTag(landscapeDataUrl, `screen and (orientation: landscape)`, opts.customAttribute!);

    // Generate and inject dark mode splash screens if configured
    if (darkIconImage && opts.iconDark) {
        const darkPortraitDataUrl = createSplashscreen(darkIconImage, opts.iconDark, portraitWidth, portraitHeight, opts);
        const darkLandscapeDataUrl = createSplashscreen(darkIconImage, opts.iconDark, landscapeWidth, landscapeHeight, opts);

        if (darkPortraitDataUrl) injectLinkTag(darkPortraitDataUrl, `screen and (prefers-color-scheme: dark) and (orientation: portrait)`, opts.customAttribute!);
        if (darkLandscapeDataUrl) injectLinkTag(darkLandscapeDataUrl, `screen and (prefers-color-scheme: dark) and (orientation: landscape)`, opts.customAttribute!);
    }
}