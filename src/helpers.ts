export function isIOS(): boolean {
    // iPadOS 13+ may use the same desktop-class user agent as macOS.
    return (/iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1))
        && !('MSStream' in window);
}

export function loadImage(url: string, crossOrigin?: 'anonymous' | 'use-credentials', fetchPriority?: 'low' | 'high' | 'auto'): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (crossOrigin) img.crossOrigin = crossOrigin;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image from: ${url}`));
        if (fetchPriority) img.fetchPriority = fetchPriority;
        img.src = url;
    });
};

export function injectLinkTag(href: string, media: string, customAttribute: string): void {
    const link = document.createElement('link');
    link.rel = 'apple-touch-startup-image';
    link.href = href;
    link.media = media;
    link.setAttribute(customAttribute, 'true');
    document.head.appendChild(link);
};

/** Replaces the generated startup-image tags, leaving them in place when nothing changed. */
export function replaceLinkTags(splashScreens: { href: string; media: string }[], customAttribute: string): void {
    const links = document.head.querySelectorAll<HTMLLinkElement>(`link[rel="apple-touch-startup-image"][${customAttribute}="true"]`);
    const unchanged = links.length === splashScreens.length
        && splashScreens.every(({ href, media }, i) => links[i].getAttribute('href') === href && links[i].media === media);
    if (unchanged) return;

    links.forEach(el => el.remove());
    for (const { href, media } of splashScreens) {
        injectLinkTag(href, media, customAttribute);
    }
};
