export type CanvasResizeCleanup = (() => void) & {
    resize: () => void;
};

const DESKTOP_BREAKPOINT = 768;
const MIN_DESKTOP_HEIGHT = 320;
const MIN_MOBILE_HEIGHT = 240;
const VIEWPORT_VERTICAL_MARGIN = 40;
const MOBILE_VIEWPORT_MARGIN = 48;
const MAX_ASPECT_HEIGHT_FACTOR = 1.75;
const MIN_PROPORTION_CAP = 520;

export function setupCanvasResizing(
    canvas: HTMLCanvasElement,
    updateCanvasSize: () => void
): CanvasResizeCleanup {
    const formElement = document.querySelector('.left-panel') as HTMLElement | null;
    const containerElement =
        (canvas.closest('.canvas-container') as HTMLElement | null) ?? canvas.parentElement;

    // Ensure CSS layout inside .canvas-container owns the element box size
    canvas.style.removeProperty('width');
    canvas.style.removeProperty('height');

    let rafId: number | null = null;

    function getViewportHeight(): number {
        return window.visualViewport?.height ?? window.innerHeight;
    }

    function isContainerFullscreen(): boolean {
        const fullscreenEl =
            document.fullscreenElement ??
            (document as Document & { webkitFullscreenElement?: Element | null })
                .webkitFullscreenElement ??
            null;
        return Boolean(
            fullscreenEl && (fullscreenEl === containerElement || fullscreenEl === canvas)
        );
    }

    function applyResize() {
        rafId = null;

        if (!containerElement) {
            updateCanvasSize();
            return;
        }

        if (isContainerFullscreen()) {
            if (containerElement.style.height !== '') {
                containerElement.style.height = '';
            }
            updateCanvasSize();
            return;
        }

        const viewportHeight = getViewportHeight();
        const isMobile = window.innerWidth < DESKTOP_BREAKPOINT;
        const containerWidth =
            containerElement.clientWidth || formElement?.clientWidth || MIN_DESKTOP_HEIGHT;

        let targetHeight: number;

        if (isMobile) {
            const mobileViewportCap = Math.max(
                MIN_MOBILE_HEIGHT,
                viewportHeight - MOBILE_VIEWPORT_MARGIN
            );
            targetHeight = Math.round(
                Math.max(MIN_MOBILE_HEIGHT, Math.min(containerWidth, mobileViewportCap))
            );
        } else {
            const leftPanelHeight = formElement ? formElement.getBoundingClientRect().height : 0;
            const viewportCap = Math.max(
                MIN_DESKTOP_HEIGHT,
                viewportHeight - VIEWPORT_VERTICAL_MARGIN
            );
            const proportionCap = Math.max(
                MIN_PROPORTION_CAP,
                containerWidth * MAX_ASPECT_HEIGHT_FACTOR
            );
            const maxDesktopHeight = Math.min(viewportCap, proportionCap);
            const desiredHeight = leftPanelHeight > 0 ? leftPanelHeight : containerWidth;

            targetHeight = Math.round(
                Math.min(Math.max(desiredHeight, MIN_DESKTOP_HEIGHT), maxDesktopHeight)
            );
        }

        const nextHeightStyle = `${targetHeight}px`;
        if (containerElement.style.height !== nextHeightStyle) {
            containerElement.style.height = nextHeightStyle;
        }

        updateCanvasSize();
    }

    function scheduleResize() {
        if (rafId !== null) return;
        rafId = window.requestAnimationFrame(applyResize);
    }

    function handleFullscreenChange() {
        applyResize();
        scheduleResize();
    }

    // Initial synchronous sizing so the first WebGL frame has accurate bounds
    applyResize();

    const resizeObserver =
        typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleResize) : null;

    if (resizeObserver) {
        if (containerElement) {
            resizeObserver.observe(containerElement);
        }
        if (formElement) {
            resizeObserver.observe(formElement);
        }
    }

    window.addEventListener('resize', scheduleResize, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleResize, { passive: true });
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    const cleanup = () => {
        if (rafId !== null) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
        }
        resizeObserver?.disconnect();
        window.removeEventListener('resize', scheduleResize);
        window.visualViewport?.removeEventListener('resize', scheduleResize);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };

    return Object.assign(cleanup, { resize: applyResize });
}
