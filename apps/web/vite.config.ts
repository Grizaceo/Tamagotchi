import { defineConfig } from 'vite';

export default defineConfig({
    base: process.env.VITE_BASE_PATH || '/',
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
