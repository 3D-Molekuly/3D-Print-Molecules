export function setupCanvasResizing(canvas: HTMLCanvasElement, updateCanvasSize: () => void) {
    const formElement = document.querySelector('.left-panel') as HTMLElement;
    const containerElement = document.querySelector('.main-panel') as HTMLElement;

    function resizeCanvas() {
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            canvas.style.width = `${formElement.clientWidth}px`;
            canvas.style.height = `auto`; // Set height to auto first

            // Measure the computed height
            const computedHeight = canvas.scrollHeight; // or use canvas.getBoundingClientRect().height

            // Set height based on the conditions
            if (computedHeight > formElement.clientWidth) {
                canvas.style.height = `${formElement.clientWidth}px`; // Use max height
            } else if (computedHeight < (formElement.clientWidth / 2)) {
                canvas.style.height = `${formElement.clientWidth}px`; // Use min height
            } else {
                canvas.style.height = `${computedHeight}px`; // Use computed height
            }
        } else {
            canvas.style.height = `${formElement.clientHeight}px`;

            const canvasLeftOffset = canvas.getBoundingClientRect().left;
            const containerRightOffset = containerElement.getBoundingClientRect().right;

            const newCanvasWidth = containerRightOffset - canvasLeftOffset;
            canvas.style.width = `${newCanvasWidth}px`;
        }

        updateCanvasSize();
    }

    // Call resizeCanvas on initial load
    resizeCanvas();

    // Add resize listener
    window.addEventListener('resize', resizeCanvas);

    return resizeCanvas;
}
