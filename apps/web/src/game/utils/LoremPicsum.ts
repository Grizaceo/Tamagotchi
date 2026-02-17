/**
 * Utility for generating Lorem Picsum placeholder image URLs.
 * See https://picsum.photos/ for API details.
 */

export class LoremPicsum {
    private static readonly BASE_URL = 'https://picsum.photos';

    /**
     * Generates a random image URL with the specified dimensions.
     * @param width The width of the image.
     * @param height The height of the image. Defaults to width if not provided.
     * @returns The URL string.
     */
    static getRandom(width: number, height?: number): string {
        const h = height || width;
        return `${this.BASE_URL}/${width}/${h}`;
    }

    /**
     * Generates a specific seeded image URL.
     * Using the same seed will always result in the same image.
     * @param seed The seed string (e.g., 'tamagotchi', 'background').
     * @param width The width of the image.
     * @param height The height of the image. Defaults to width if not provided.
     * @returns The URL string.
     */
    static getSeeded(seed: string, width: number, height?: number): string {
        const h = height || width;
        return `${this.BASE_URL}/seed/${seed}/${width}/${h}`;
    }

    /**
     * Generates a specific image by ID.
     * @param id The image ID (from https://picsum.photos/images).
     * @param width The width of the image.
     * @param height The height of the image. Defaults to width if not provided.
     * @returns The URL string.
     */
    static getById(id: number, width: number, height?: number): string {
        const h = height || width;
        return `${this.BASE_URL}/id/${id}/${width}/${h}`;
    }

    /**
     * Generates a grayscale image URL.
     * @param width The width of the image.
     * @param height The height of the image.
     * @param seed Optional seed.
     * @returns The URL string.
     */
    static getGrayscale(width: number, height?: number, seed?: string): string {
        const url = seed ? this.getSeeded(seed, width, height) : this.getRandom(width, height);
        return `${url}?grayscale`;
    }

    /**
     * Generates a blurred image URL.
     * @param blur Amount of blur (1-10).
     * @param width The width of the image.
     * @param height The height of the image.
     * @param seed Optional seed.
     * @returns The URL string.
     */
    static getBlurred(blur: number, width: number, height?: number, seed?: string): string {
        const url = seed ? this.getSeeded(seed, width, height) : this.getRandom(width, height);
        return `${url}?blur=${Math.max(1, Math.min(10, blur))}`;
    }
}
