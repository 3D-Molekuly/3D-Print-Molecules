// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupCanvasResizing } from './canvasUtils';

describe('setupCanvasResizing', () => {
    let leftPanel: HTMLDivElement;
    let container: HTMLDivElement;
    let canvas: HTMLCanvasElement;
    let leftPanelHeight = 540;
    let containerClientWidth = 416;

    beforeEach(() => {
        document.body.innerHTML = '';

        leftPanel = document.createElement('div');
        leftPanel.className = 'left-panel';
        vi.spyOn(leftPanel, 'getBoundingClientRect').mockImplementation(
            () =>
                ({
                    height: leftPanelHeight,
                    width: 800,
                    top: 0,
                    left: 0,
                    right: 800,
                    bottom: leftPanelHeight,
                    x: 0,
                    y: 0,
                    toJSON: () => ({})
                }) as DOMRect
        );

        container = document.createElement('div');
        container.className = 'canvas-container';
        Object.defineProperty(container, 'clientWidth', {
            configurable: true,
            get: () => containerClientWidth
        });

        canvas = document.createElement('canvas');
        canvas.style.width = '999px';
        canvas.style.height = '999px';
        container.appendChild(canvas);

        document.body.appendChild(leftPanel);
        document.body.appendChild(container);
    });

    afterEach(() => {
        Object.defineProperty(document, 'fullscreenElement', {
            configurable: true,
            value: null
        });
        vi.restoreAllMocks();
    });

    it('matches left-panel height on desktop when within viewport and proportion bounds, and strips inline canvas dimensions', () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
        leftPanelHeight = 540;
        containerClientWidth = 416;

        const updateCanvasSize = vi.fn();
        const handle = setupCanvasResizing(canvas, updateCanvasSize);

        expect(canvas.style.width).toBe('');
        expect(canvas.style.height).toBe('');
        expect(container.style.height).toBe('540px');
        expect(updateCanvasSize).toHaveBeenCalledTimes(1);

        handle();
    });

    it('clamps desktop container height when left-panel expands and shrinks back when collapsed', () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
        leftPanelHeight = 1800;
        containerClientWidth = 416;

        const updateCanvasSize = vi.fn();
        const handle = setupCanvasResizing(canvas, updateCanvasSize);

        // min(900 - 40 = 860, 416 * 1.75 = 728) => 728px
        expect(container.style.height).toBe('728px');

        // On shorter laptop viewport (600px), viewport cap wins: 600 - 40 = 560px
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });
        handle.resize();
        expect(container.style.height).toBe('560px');

        // Collapsing settings shrinks container back down to left-panel height
        leftPanelHeight = 480;
        handle.resize();
        expect(container.style.height).toBe('480px');

        handle();
    });

    it('uses 1:1 square sizing on portrait mobile and caps height on short landscape mobile', () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });
        containerClientWidth = 358;

        const updateCanvasSize = vi.fn();
        const handle = setupCanvasResizing(canvas, updateCanvasSize);
        expect(container.style.height).toBe('358px');

        // Landscape mobile: width 520, viewport height 360 -> 360 - 48 = 312px
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 667 });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 360 });
        containerClientWidth = 520;
        handle.resize();
        expect(container.style.height).toBe('312px');

        handle();
    });

    it('clears inline height during fullscreen and restores it after exiting fullscreen', () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
        leftPanelHeight = 520;
        containerClientWidth = 416;

        const updateCanvasSize = vi.fn();
        const handle = setupCanvasResizing(canvas, updateCanvasSize);
        expect(container.style.height).toBe('520px');

        Object.defineProperty(document, 'fullscreenElement', {
            configurable: true,
            value: container
        });
        document.dispatchEvent(new Event('fullscreenchange'));
        expect(container.style.height).toBe('');

        Object.defineProperty(document, 'fullscreenElement', {
            configurable: true,
            value: null
        });
        document.dispatchEvent(new Event('fullscreenchange'));
        expect(container.style.height).toBe('520px');

        handle();
    });
});
