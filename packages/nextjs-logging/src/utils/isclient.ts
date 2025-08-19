// src/utils/isclient.ts

/**
 * Checks if the code is running in a browser environment.
 *
 * @returns {boolean} True if running in a browser, false otherwise.
 */
export const isClient = (): boolean =>
    typeof window !== "undefined" && typeof document !== "undefined";