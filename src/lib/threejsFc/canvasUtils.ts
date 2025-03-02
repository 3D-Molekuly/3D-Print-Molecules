export function setupCanvasResizing(canvas: HTMLCanvasElement, updateCanvasSize: () => void) {
    const formElement = document.querySelector('.left-panel') as HTMLElement;
    const containerElement = document.querySelector('.main-panel') as HTMLElement;

    // Debounce function to prevent too many resize events
    function debounce(func: Function, wait: number) {
        let timeout: NodeJS.Timeout;
        return function executedFunction(...args: any[]) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function resizeCanvas() {
        const isMobile = window.innerWidth < 768;

        if (!formElement) return; // Guard clause

        if (isMobile) {
            const width = formElement.clientWidth;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${width}px`;
        } else {
            // Get the actual height of the left panel
            const leftPanelHeight = formElement.getBoundingClientRect().height;

            // Ensure we have a valid height
            if (leftPanelHeight > 0) {
                canvas.style.height = `${leftPanelHeight}px`;

                const canvasLeftOffset = canvas.getBoundingClientRect().left;
                const containerRightOffset = containerElement.getBoundingClientRect().right;
                const availableWidth = containerRightOffset - canvasLeftOffset;

                const width = Math.min(availableWidth, leftPanelHeight * 1.5);
                canvas.style.width = `${width}px`;
            }
        }

        // Force a reflow
        canvas.getBoundingClientRect();

        updateCanvasSize();
    }

    // Debounced version of resizeCanvas
    const debouncedResize = debounce(resizeCanvas, 100);

    // Initial resize
    resizeCanvas();

    // Add resize listener with debouncing
    window.addEventListener('resize', debouncedResize);

    // Create mutation observer to watch for DOM changes
    const observer = new MutationObserver(debouncedResize);

    // Start observing the form element for changes
    observer.observe(formElement, {
        attributes: true,
        childList: true,
        subtree: true
    });

    // Return a cleanup function
    return () => {
        window.removeEventListener('resize', debouncedResize);
        observer.disconnect();
        resizeCanvas(); // One final resize
    };
}
