import { vi } from 'vitest';

// Polyfill for CanvasRenderingContext2D methods in JSDOM/Vitest
if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  (HTMLCanvasElement.prototype.getContext as any) = function (this: HTMLCanvasElement, type: string, ...args: any[]) {
    const ctx = originalGetContext.call(this, type, ...args);
    if (type === '2d' && ctx) {
      const ctx2d = ctx as any;
      if (!ctx2d.roundRect) {
        ctx2d.roundRect = vi.fn().mockReturnValue(ctx2d);
      }
      if (!ctx2d.arc) {
        ctx2d.arc = vi.fn().mockReturnValue(ctx2d);
      }
      if (!ctx2d.ellipse) {
        ctx2d.ellipse = vi.fn().mockReturnValue(ctx2d);
      }
      // Add other missing methods if needed
      if (!ctx2d.resetTransform) ctx2d.resetTransform = vi.fn();
    }
    return ctx;
  };
}
