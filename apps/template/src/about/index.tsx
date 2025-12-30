import { Link, clientOnly, useLoaderData } from "@/route.tree";

export const metadata = {
    title: "About",
    description: "About page",
    keywords: ["about", "page"],
}

// Define route configuration with loader
export const route = clientOnly({
    loader: async () => {
        // Simulate API call
        console.log("🚀 Loader running before component renders!");
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            message: "Hello from loader!",
            timestamp: new Date().toISOString()
        };
    },
    pendingComponent: () => (
        <div className="page">
            <main className="container py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                        <p>loading...</p>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
                    </div>
                </div>
            </main>
        </div>
    )
});

export default function About() {
    // Access loader data
    const data = useLoaderData<{ message: string; timestamp: string }>();

    return (
        <div className="page">
            <nav className="nav container">
                <Link href="/" className="font-semibold">← Back</Link>
            </nav>

            <main className="container py-12">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4">About</h1>
                    
                    {/* Show loader data */}
                    <div className="card mb-6 bg-green-50 border-green-200">
                        <h3 className="card-title mb-2 text-green-700">✅ Loader Data</h3>
                        <p className="text-green-600">
                            <strong>Message:</strong> {data.message}
                        </p>
                        <p className="text-green-600 text-sm">
                            <strong>Loaded at:</strong> {data.timestamp}
                        </p>
                    </div>

                    <p className="text-muted mb-6">
                        This page uses <code>clientOnly()</code> with a loader that runs BEFORE the component renders.
                        The loader simulates an API call with a 500ms delay.
                    </p>

                    <div className="card">
                        <h3 className="card-title mb-2">Static Routes</h3>
                        <p className="card-description">
                            Create routes by adding folders with an <code>index.tsx</code> file.
                            The folder structure determines the URL path.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
