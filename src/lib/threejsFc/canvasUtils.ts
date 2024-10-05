export function setupCanvasResizing(canvas: HTMLCanvasElement, updateCanvasSize: () => void) {
    const formElement = document.querySelector('.left-panel') as HTMLElement;
    const containerElement = document.querySelector('.main-panel') as HTMLElement;

    function resizeCanvas() {
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            canvas.style.width = `${formElement.clientWidth - 25}px`;
            canvas.style.height = 'auto';
        } else {
            canvas.style.height = `${formElement.clientHeight}px`;

            const canvasLeftOffset = canvas.getBoundingClientRect().left;
            const containerRightOffset = containerElement.getBoundingClientRect().right;

            const newCanvasWidth = containerRightOffset - canvasLeftOffset;
            canvas.style.width = `${newCanvasWidth}px`;
        }

        updateCanvasSize();
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial call to set canvas size

    return resizeCanvas; // Return the resizeCanvas function
}
