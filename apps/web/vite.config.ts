import { defineConfig } from 'vite';

export default defineConfig({
    base: process.env.VITE_BASE_PATH || '/',
    // @ts-ignore - Vitest types
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test-setup.ts'],
        globals: true,
    },
    optimizeDeps: {
        // Don't pre-bundle workspace packages — always read fresh source
        exclude: ['@pompom/core'],
    },
    server: {
        // Watch changes in the workspace packages too
        watch: {
            ignored: ['!**/packages/**'],
        },
    },
});
