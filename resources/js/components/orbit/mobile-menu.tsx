import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const destinations = [
    { href: "#story", label: "The story", detail: "From laptop to fleet" },
    { href: "#build", label: "Build with Orbit", detail: "Your environment, connected" },
    { href: "#install", label: "Get started", detail: "Let your agent set it up" },
    { href: "/docs", label: "Docs", detail: "Guides and reference" },
];

export function MobileMenu() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const desktop = matchMedia("(min-width: 1101px)");
        const closeOnDesktop = () => {
            if (desktop.matches) setOpen(false);
        };
        desktop.addEventListener("change", closeOnDesktop);
        return () => desktop.removeEventListener("change", closeOnDesktop);
    }, []);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="orbit-mobile-menu__trigger" aria-label="Open navigation menu">
                <Menu size={24} strokeWidth={1.5} aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="top" showCloseButton={false} className="orbit-mobile-menu">
                <div className="orbit-mobile-menu__heading">
                    <SheetTitle className="orbit-label">Explore Orbit</SheetTitle>
                    <span className="orbit-label" aria-hidden="true">
                        01 to 04
                    </span>
                </div>
                <nav aria-label="Mobile navigation">
                    {destinations.map(({ href, label, detail }, index) => (
                        <SheetClose
                            key={href}
                            nativeButton={false}
                            role="link"
                            render={<a href={href} />}
                        >
                            <span className="orbit-mobile-menu__index">0{index + 1}</span>
                            <span>
                                <span className="orbit-mobile-menu__label">{label}</span>
                                <span className="orbit-mobile-menu__detail">{detail}</span>
                            </span>
                            <ArrowUpRight size={20} strokeWidth={1} aria-hidden="true" />
                        </SheetClose>
                    ))}
                </nav>
                <div className="orbit-mobile-menu__footer">
                    <a href="https://github.com/nckrtl/orbit" target="_blank" rel="noreferrer">
                        GitHub <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                    <SheetClose
                        className="orbit-mobile-menu__close"
                        aria-label="Close navigation menu"
                    >
                        <X size={18} strokeWidth={1.5} aria-hidden="true" /> Close
                    </SheetClose>
                </div>
            </SheetContent>
        </Sheet>
    );
}
