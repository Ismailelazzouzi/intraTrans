import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Fetches a protected image from the backend with credentials (cookies)
 * and returns a blob:// URL that can be used in an <img> tag.
 *
 * The backend serves /uploads/:filename behind authMiddleware, so a plain
 * <img src="..."> would fail (no credentials sent). This hook bridges the
 * gap by fetching with credentials: "include" and creating an object URL.
 *
 * Pass `null` or empty string to skip fetching (e.g. when there is no image).
 */
export function useProtectedImage(filename: string | null | undefined): string | null {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    useEffect(() => {
        // No filename → clear any existing blob URL
        if (!filename) {
            setBlobUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            return;
        }

        // Cancellation flag prevents stale responses from overwriting newer ones
        // when the filename changes before the previous fetch resolves
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(`${API_URL}/uploads/${filename}`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!res.ok || cancelled) {
                    if (!cancelled) {
                        console.warn(`Failed to load protected image "${filename}": ${res.status}`);
                    }
                    return;
                }

                const blob = await res.blob();
                if (cancelled) return;

                const url = URL.createObjectURL(blob);
                setBlobUrl(prev => {
                    if (prev) URL.revokeObjectURL(prev);
                    return url;
                });
            } catch (err) {
                if (!cancelled) {
                    console.error(`Error loading protected image "${filename}":`, err);
                }
            }
        })();

        // Cleanup: cancel in-flight request and revoke blob URL
        return () => {
            cancelled = true;
            setBlobUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        };
    }, [filename]);

    return blobUrl;
}
