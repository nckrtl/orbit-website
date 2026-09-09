import { Head } from "@inertiajs/react";
import { OrbitHomepage } from "@/components/orbit/homepage";

export default function Home({ orbitUrl }: { orbitUrl: string }) {
    return (
        <>
            <Head title="Run your apps on your own infrastructure">
                <meta
                    name="description"
                    content="Orbit is one CLI for development machines, staging nodes, and the applications on your own infrastructure."
                />
                <meta name="theme-color" content="#050506" />
                <meta
                    property="og:title"
                    content="Orbit — Run your apps on your own infrastructure"
                />
                <meta
                    property="og:description"
                    content="One CLI for development machines, staging nodes, and the applications on your own infrastructure."
                />
                <meta property="og:type" content="website" />
            </Head>
            <OrbitHomepage orbitUrl={orbitUrl} />
        </>
    );
}
