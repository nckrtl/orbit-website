import { useSyncExternalStore } from "react";

export type ResolvedAppearance = "light" | "dark";
export type Appearance = ResolvedAppearance | "system";

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const listeners = new Set<() => void>();
let currentAppearance: Appearance = "dark";
let initialized = false;

const isAppearance = (value: unknown): value is Appearance =>
    value === "light" || value === "dark" || value === "system";

const isDarkMode = (appearance: Appearance): boolean =>
    appearance === "dark" ||
    (appearance === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

const setCookie = (appearance: Appearance): void => {
    try {
        document.cookie = `appearance=${appearance};path=/;max-age=31536000;SameSite=Lax`;
    } catch {
        // The theme still works when browser storage is unavailable.
    }
};

const applyTheme = (appearance: Appearance): void => {
    const root = document.documentElement;
    const dark = isDarkMode(appearance);
    root.classList.toggle("dark", dark);
    root.dataset.appearance = appearance;
    root.style.colorScheme = dark ? "dark" : "light";
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = meta.dataset[dark ? "dark" : "light"] ?? meta.content;
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

const updateAppearance = (mode: Appearance): void => {
    currentAppearance = mode;
    try {
        localStorage.setItem("appearance", mode);
    } catch {
        // Keep the in-memory choice usable in restricted browsing contexts.
    }
    setCookie(mode);
    applyTheme(mode);
    notify();
};

export function initializeTheme(): void {
    if (typeof window === "undefined" || initialized) return;
    initialized = true;

    // The nonce-protected bootstrap resolves storage before the first paint.
    const initial = document.documentElement.dataset.appearance;
    currentAppearance = isAppearance(initial) ? initial : "dark";
    applyTheme(currentAppearance);
    setCookie(currentAppearance);

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (currentAppearance === "system") {
            applyTheme("system");
            notify();
        }
    });
    window.addEventListener("storage", (event) => {
        if (event.key !== "appearance" && event.key !== null) return;
        currentAppearance = isAppearance(event.newValue) ? event.newValue : "dark";
        setCookie(currentAppearance);
        applyTheme(currentAppearance);
        notify();
    });
}

export function useAppearance(): UseAppearanceReturn {
    const appearance = useSyncExternalStore<Appearance>(
        subscribe,
        () => currentAppearance,
        () => "dark",
    );
    const resolvedDark = useSyncExternalStore(
        subscribe,
        () => isDarkMode(currentAppearance),
        () => true,
    );

    return {
        appearance,
        resolvedAppearance: resolvedDark ? "dark" : "light",
        updateAppearance,
    };
}
