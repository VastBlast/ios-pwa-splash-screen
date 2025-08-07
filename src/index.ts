import { createSplashscreen, injectLinkTag, isIOS, loadImage } from "./helpers";
import type { PwaSplashOptions } from "./types";

const defaultOptions: Partial<PwaSplashOptions> = {
    ensure_ios: true,
    ensure_meta_tags: true,
    imageType: 'image/png',
    quality: 1,
    cleanup: true,
    customAttribute: 'data-pwa-splash-generated',
    debug: false,
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

    if (opts.debug) console.debug("PWA Splash Generator: Initializing with options", opts);

    if (typeof window === 'undefined' || typeof document === 'undefined') {
        if (opts.debug) console.warn("PWA Splash Generator: Not in a browser environment. Aborting.");
        return;
    }

    if (opts.ensure_ios && !isIOS()) {
        if (opts.debug) console.debug("PWA Splash Generator: Not an iOS device. Aborting.");
        return;
    }

    if (opts.cleanup && opts.customAttribute) {
        document.querySelectorAll(`link[${opts.customAttribute}]`).forEach(el => el.remove());
        if (opts.debug) console.debug("PWA Splash Generator: Cleaned up previous tags.");
    }

    if (opts.ensure_meta_tags) {
        if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
            const meta = document.createElement('meta');
            meta.name = 'apple-mobile-web-app-capable';
            meta.content = 'yes';
            document.head.appendChild(meta);
            if (opts.debug) console.debug("PWA Splash Generator: Added 'apple-mobile-web-app-capable' meta tag.");
        }
    }

    const [mainIconImage, darkIconImage] = await Promise.all([
        loadImage(opts.icon.url, opts.crossOrigin),
        opts.icon_dark ? loadImage(opts.icon_dark.url, opts.crossOrigin) : Promise.resolve(null)
    ]);

    if (opts.debug) console.debug("PWA Splash Generator: Icons loaded successfully.");

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

            if (opts.debug) console.debug(`PWA Splash Generator: Detected possible private mode. Adjusted dimensions to ${deviceWidth}x${deviceHeight}`);
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
    if (opts.debug) console.debug("PWA Splash Generator: Injected light mode splash screens.");

    // Generate and inject dark mode splash screens if configured
    if (darkIconImage && opts.icon_dark) {
        const darkPortraitDataUrl = createSplashscreen(darkIconImage, opts.icon_dark, portraitWidth, portraitHeight, opts);
        const darkLandscapeDataUrl = createSplashscreen(darkIconImage, opts.icon_dark, landscapeWidth, landscapeHeight, opts);

        if (darkPortraitDataUrl) injectLinkTag(darkPortraitDataUrl, `screen and (prefers-color-scheme: dark) and (orientation: portrait)`, opts.customAttribute!);
        if (darkLandscapeDataUrl) injectLinkTag(darkLandscapeDataUrl, `screen and (prefers-color-scheme: dark) and (orientation: landscape)`, opts.customAttribute!);
        if (opts.debug) console.debug("PWA Splash Generator: Injected dark mode splash screens.");
    }
}