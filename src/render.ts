/** The splash images to make from one icon. */
export interface SplashSpec {
    /** Width and height of each image, in device pixels. */
    sizes: [number, number][];
    backgroundColor: string;
    /** Icon margin as a percentage of the shorter edge. */
    margin: number;
    imageType: 'image/png' | 'image/jpeg';
    quality: number;
}

/** Where the icon goes in one image. */
interface Layout {
    width: number;
    height: number;
    x: number;
    y: number;
    iconWidth: number;
    iconHeight: number;
}

/** A message to the worker: the icon drawn for each image, and how to paint and encode the images. */
interface WorkerJob {
    id: number;
    icons: ImageBitmap[];
    spec: SplashSpec;
    layouts: Layout[];
}

// Worker-only API that the DOM lib does not declare.
declare const FileReaderSync: new () => { readAsDataURL(blob: Blob): string };

/**
 * The worker's code. Jobs run one at a time, so only one icon's full-screen canvases exist at once.
 * It runs from its own source text, so it must not use anything from outside the function. Consumers'
 * bundlers can turn code into calls to their own helpers, so it avoids what they rewrite: async
 * functions, spread, for...of, and functions stored under a name (which keep-names options wrap).
 * If a transform still breaks it, the worker fails and the main thread takes over.
 */
function splashWorker(): void {
    let queue = Promise.resolve();
    addEventListener('message', ({ data: { id, icons, spec, layouts } }: MessageEvent<WorkerJob>) => {
        queue = queue
            .then(() => Promise.all(layouts.map((layout, i) => {
                const canvas = new OffscreenCanvas(layout.width, layout.height);
                const ctx = canvas.getContext('2d')!;
                ctx.fillStyle = spec.backgroundColor;
                ctx.fillRect(0, 0, layout.width, layout.height);
                ctx.drawImage(icons[i], Math.floor(layout.x), Math.floor(layout.y));
                icons[i].close();
                return canvas.convertToBlob({ type: spec.imageType, quality: spec.quality }).then(blob => {
                    canvas.width = canvas.height = 0;
                    return new FileReaderSync().readAsDataURL(blob);
                });
            })))
            .then(hrefs => postMessage({ id, hrefs }))
            .catch(() => postMessage({ id }));
    });
}

/** Pending worker jobs by id. A job resolves without images when the main thread has to render it. */
const workerJobs = new Map<number, (hrefs?: string[]) => void>();
let worker: Worker | undefined;
let workerUrl = '';
/** Set once a worker could not start or crashed, so later calls go straight to the main thread. */
let workerFailed = false;
let lastJobId = 0;

/** Returns the running worker, starting one if needed, or undefined when workers cannot run here. */
function startWorker(): Worker | undefined {
    if (worker || workerFailed) return worker;
    workerUrl = URL.createObjectURL(new Blob([`(${splashWorker})()`], { type: 'text/javascript' }));
    try {
        worker = new Worker(workerUrl);
    } catch {
        // Enforced Trusted Types make this throw. A CSP that blocks blob: workers fires an error event instead.
        workerFailed = true;
        stopWorker();
        return;
    }
    worker.onmessage = ({ data: { id, hrefs } }: MessageEvent<{ id: number; hrefs?: string[] }>) => settleJob(id, hrefs);
    worker.onerror = worker.onmessageerror = () => {
        workerFailed = true;
        stopWorker();
    };
    return worker;
}

/** Terminates the worker and hands its unfinished jobs back to the main thread. */
function stopWorker(): void {
    worker?.terminate();
    worker = undefined;
    URL.revokeObjectURL(workerUrl);
    for (const resolve of workerJobs.values()) resolve();
    workerJobs.clear();
}

function settleJob(id: number, hrefs?: string[]): void {
    workerJobs.get(id)?.(hrefs);
    workerJobs.delete(id);
    // Calls are rare, so the worker only lives while it has work.
    if (!workerJobs.size) stopWorker();
}

/**
 * Draws the icon at its final size and sub-pixel offset, so the worker only copies it into place.
 * It is drawn from the image element because a bitmap of an SVG holds it at its intrinsic size.
 */
function drawIcon(image: HTMLImageElement, { x, y, iconWidth, iconHeight }: Layout): ImageBitmap {
    const left = Math.floor(x);
    const top = Math.floor(y);
    const canvas = new OffscreenCanvas(Math.ceil(x + iconWidth) - left, Math.ceil(y + iconHeight) - top);
    canvas.getContext('2d')!.drawImage(image, x - left, y - top, iconWidth, iconHeight);
    return canvas.transferToImageBitmap();
}

/** Renders in a worker, or resolves undefined when the main thread has to. */
function renderInWorker(image: HTMLImageElement, spec: SplashSpec, layouts: Layout[]): Promise<string[] | undefined> {
    return new Promise(resolve => {
        if (workerFailed || typeof OffscreenCanvas === 'undefined') return resolve(undefined);
        // Registered first, so every failure below resolves it, including a worker that cannot start.
        const id = ++lastJobId;
        workerJobs.set(id, resolve);
        try {
            const icons = layouts.map(layout => drawIcon(image, layout));
            // Posted in the same task as the worker is started or found running, so it cannot stop in between.
            startWorker()?.postMessage({ id, icons, spec, layouts } satisfies WorkerJob, icons);
        } catch {
            settleJob(id);
        }
    });
}

async function renderOnMainThread(image: HTMLImageElement, spec: SplashSpec, layouts: Layout[]): Promise<string[]> {
    const hrefs: string[] = [];
    for (const layout of layouts) {
        // Yield before each image, so the encodes do not add up to one long block.
        await new Promise(resolve => setTimeout(resolve));
        const canvas = document.createElement('canvas');
        canvas.width = layout.width;
        canvas.height = layout.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('Failed to get 2D context from canvas.');

        ctx.fillStyle = spec.backgroundColor;
        ctx.fillRect(0, 0, layout.width, layout.height);
        ctx.drawImage(image, layout.x, layout.y, layout.iconWidth, layout.iconHeight);
        hrefs.push(canvas.toDataURL(spec.imageType, spec.quality));
        // Free the pixels now rather than at garbage collection; iOS caps total canvas memory.
        canvas.width = canvas.height = 0;
    }
    return hrefs;
}

/** Fits the icon inside the margin, keeping its aspect ratio, and centres it. */
function layout(image: HTMLImageElement, width: number, height: number, margin: number): Layout {
    const marginPixels = Math.min(width, height) * (margin / 100);
    const drawableWidth = width - (marginPixels * 2);
    const drawableHeight = height - (marginPixels * 2);

    const aspectRatio = image.width / image.height;
    let iconWidth = drawableWidth;
    let iconHeight = iconWidth / aspectRatio;

    if (iconHeight > drawableHeight) {
        iconHeight = drawableHeight;
        iconWidth = iconHeight * aspectRatio;
    }

    return { width, height, x: (width - iconWidth) / 2, y: (height - iconHeight) / 2, iconWidth, iconHeight };
}

/**
 * Paints the splash images for an icon and encodes them as data URLs, in the order of `spec.sizes`.
 * Encoding a full-screen image takes tens of milliseconds, so it runs in a worker when the browser
 * allows one and on the main thread otherwise.
 */
export async function renderSplashes(image: HTMLImageElement, spec: SplashSpec): Promise<string[]> {
    const layouts = spec.sizes.map(([width, height]) => layout(image, width, height, spec.margin));
    return await renderInWorker(image, spec, layouts) ?? renderOnMainThread(image, spec, layouts);
}
