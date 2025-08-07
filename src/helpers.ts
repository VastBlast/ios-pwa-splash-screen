import type { IconConfig, PwaSplashOptions } from "./types";

export function isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

export function loadImage(url: string, crossOrigin?: 'anonymous' | 'use-credentials', fetchPriority?: 'low' | 'medium' | 'high'): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (crossOrigin) img.crossOrigin = crossOrigin;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image from: ${url}`));
        if (fetchPriority) img.fetchPriority = fetchPriority;
        img.src = url;
    });
};

export const createSplashscreen = (iconImage: HTMLImageElement, config: IconConfig, canvasWidth: number, canvasHeight: number, options: PwaSplashOptions): string | null => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        if (options.debug) console.error("Could not get 2D context from canvas.");
        return null;
    }

    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const margin = (config.margin ?? 25) / 100;
    const smallerDim = Math.min(canvas.width, canvas.height);
    const marginPixels = smallerDim * margin;

    const drawableWidth = canvas.width - (marginPixels * 2);
    const drawableHeight = canvas.height - (marginPixels * 2);

    const aspectRatio = iconImage.width / iconImage.height;
    let drawWidth = drawableWidth;
    let drawHeight = drawWidth / aspectRatio;

    if (drawHeight > drawableHeight) {
        drawHeight = drawableHeight;
        drawWidth = drawHeight * aspectRatio;
    }

    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;
    ctx.drawImage(iconImage, x, y, drawWidth, drawHeight);

    return canvas.toDataURL(options.imageType, options.quality);
};

export function injectLinkTag(href: string, media: string, customAttribute: string) {
    const link = document.createElement('link');
    link.rel = 'apple-touch-startup-image';
    link.href = href;
    link.media = media;
    link.setAttribute(customAttribute, 'true');
    document.head.appendChild(link);
};