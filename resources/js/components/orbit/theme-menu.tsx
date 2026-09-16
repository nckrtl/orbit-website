import { Monitor, Moon, Sun } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppearance } from "@/hooks/use-appearance";

export function ThemeMenu() {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="orbit-theme-trigger"
                aria-label="Choose color theme"
                title="Color theme"
            >
                <Sun className="orbit-theme-trigger__light" aria-hidden="true" />
                <Moon className="orbit-theme-trigger__dark" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-44">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Color theme</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={appearance} onValueChange={updateAppearance}>
                        <DropdownMenuRadioItem
                            value="light"
                            closeOnClick
                            className="min-h-11 gap-3 px-3"
                        >
                            <Sun aria-hidden="true" /> Light
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                            value="dark"
                            closeOnClick
                            className="min-h-11 gap-3 px-3"
                        >
                            <Moon aria-hidden="true" /> Dark
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                            value="system"
                            closeOnClick
                            className="min-h-11 gap-3 px-3"
                        >
                            <Monitor aria-hidden="true" /> System
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
