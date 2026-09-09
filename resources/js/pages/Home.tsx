import { Head } from "@inertiajs/react";
import { OrbitHomepage } from "@/components/orbit/homepage";

export default function Home({ orbitUrl }: { orbitUrl: string }) {
    return (
        <>
            <Head title="Build your ideas on machines you own">
                <meta
                    name="description"
                    content="Orbit turns the machines you already own into an always-on development network, run by your agent and reachable from every device you carry."
                />
                <meta name="theme-color" content="#050506" />
                <meta
                    property="og:title"
                    content="Orbit — Build your ideas on machines you own, run by your agent"
                />
                <meta
                    property="og:description"
                    content="An always-on development network on your own machines, provisioned, routed, and repaired by your agent."
                />
                <meta property="og:type" content="website" />
            </Head>
            <OrbitHomepage orbitUrl={orbitUrl} />
        </>
    );
}
