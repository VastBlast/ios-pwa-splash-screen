/**
 * Configuration for a single icon variant (e.g., light or dark mode).
 */
export interface IconConfig {
    /** The URL of the icon image. Should be a square image (e.g., 512x512). */
    url: string;
    /** The background color of the splash screen. Can be any valid CSS color string. */
    backgroundColor: string;
    /**
     * The margin around the icon as a percentage of the shorter screen dimension.
     * E.g., a value of 20 means the icon will have a margin of 20% on all sides.
     * @default 25
     */
    margin?: number;
}

/**
 * Main options for the splash screen generator.
 */
export interface PwaSplashOptions {
    /** Configuration for the default (light mode) icon. */
    icon: IconConfig;
    /** Optional configuration for the dark mode icon. If provided, a dark mode splash screen will be generated. */
    icon_dark?: IconConfig;
    /**
     * If true, the script will only run if the user agent indicates an iOS or iPadOS device.
     * @default true
     */
    ensure_ios?: boolean;
    /**
     * If true, the script will ensure the `<meta name="apple-mobile-web-app-capable" content="yes">` tag
     * exists in the document head, adding it if not found.
     * @default true
     */
    ensure_meta_tags?: boolean;
    /**
     * The cross-origin attribute for the image request. Important if the icon is hosted on a different domain.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin
     */
    crossOrigin?: 'anonymous' | 'use-credentials';
    /**
     * The image format for the generated splash screen.
     * @default 'image/png'
     */
    imageType?: 'image/png' | 'image/jpeg';
    /**
     * The quality of the generated image if `imageType` is 'image/jpeg'. A number between 0 and 1.
     * @default 1
     */
    quality?: number;
    /**
     * Fetch priority for the icon images. Can be 'low', 'medium', or 'high'.
     * This is used to optimize loading performance.
     * @default 'high'
     */
    fetchPriority?: 'low' | 'medium' | 'high';
    /**
     * If true, removes any previously generated splash screen link tags before adding new ones.
     * @default true
     */
    cleanup?: boolean;
    /**
     * A custom data attribute to mark the generated link tags. Used for cleanup.
     * @default 'data-pwa-splash-generated'
     */
    customAttribute?: string;
    /**
     * If true, logs diagnostic information to the console.
     * @default false
     */
    debug?: boolean;
}