import "../css/app.css";

import { createInertiaApp } from "@inertiajs/react";
import { initializeTheme } from "@/hooks/use-appearance";

initializeTheme();

createInertiaApp({
    title: (title) =>
        title
            ? `${title} - ${import.meta.env.VITE_APP_NAME || "Orbit"}`
            : import.meta.env.VITE_APP_NAME || "Orbit",
    layout: (_name) => {
        switch (true) {
            // Import layouts and map page names here when scaffolding app-specific pages.
            default:
                return null;
        }
    },
});
