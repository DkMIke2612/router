# Olova Router Starter Template

A modern file-based routing starter template for **React 19** + **Vite** applications, powered by [Olova Router](https://www.npmjs.com/package/olova-router).

## Features

- **File-Based Routing** - Create routes by adding folders and files
- **Vite Powered** - Lightning-fast development and build times
- **Type-Safe** - Full TypeScript support with auto-generated route types
- **Dynamic Routes** - Support for dynamic parameters (`/users/:id`)
- **Catch-All Routes** - Handle wildcard paths (`/blog/*`)
- **Route Groups** - Organize routes without affecting URLs (`(auth)`)
- **Search Params** - Built-in query parameter handling
- **404 Pages** - Custom not found page support
- **Route Metadata** - SEO-friendly title, description, and keywords
- **Client-Only Data Loading** - Loaders, actions, and caching

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm, yarn, or pnpm

### Installation

1. Clone or download this template
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── (auth)/              # Route group (doesn't affect URL)
│   ├── login/           # → /login
│   └── register/        # → /register
├── about/               # → /about
├── blog/
│   └── $/               # → /blog/* (catch-all)
├── search/              # → /search (with query params)
├── users/
│   ├── index.tsx        # → /users
│   └── $id/             # → /users/:id (dynamic)
├── assets/              # Static assets
├── 404.tsx              # Not found page
├── App.tsx              # Home page (/)
├── index.css            # Global styles
├── main.tsx             # App entry point
└── route.tree.ts        # Auto-generated routes (DO NOT EDIT)
```

## Available Scripts

| Script            | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |

## Route Examples

| Path            | Type          | Description                    |
| --------------- | ------------- | ------------------------------ |
| `/`             | Static        | Home page                      |
| `/about`        | Static        | About page                     |
| `/users`        | Static        | Users list                     |
| `/users/:id`    | Dynamic       | Single user page               |
| `/blog/*`       | Catch-all     | Blog with wildcard paths       |
| `/login`        | Route Group   | Login page (in `(auth)` group) |
| `/search?q=...` | Search Params | Search with query parameters   |

## Core Imports

```tsx
import {
  Link, // Type-safe navigation component
  OlovaRouter, // Router provider
  useRouter, // Navigation hook
  useParams, // Access route parameters
  useSearchParams, // Access query parameters
  usePathname, // Get current pathname
  Outlet, // Render child routes in layouts
  clientOnly, // Define loaders and actions
  useLoaderData, // Access loader data
  useActionData, // Access action result
} from "@/route.tree";
```

## Adding New Routes

1. **Static Route**: Create a folder with `index.tsx`

   ```
   src/contact/index.tsx → /contact
   ```

2. **Dynamic Route**: Use `$` prefix for parameters

   ```
   src/products/$id/index.tsx → /products/:id
   ```

3. **Catch-All Route**: Use `$` folder for wildcards

   ```
   src/docs/$/index.tsx → /docs/*
   ```

4. **Route Group**: Use parentheses (won't affect URL)
   ```
   src/(dashboard)/settings/index.tsx → /settings
   ```

## Route Metadata

Add SEO metadata to any route by exporting a `metadata` object:

```tsx
// src/about/index.tsx
export const metadata = {
  title: "About Us - My App",
  description: "Learn more about our company and mission",
  keywords: ["about", "company", "mission"],
};

export default function About() {
  return <h1>About Us</h1>;
}
```

The router automatically updates the document title and meta tags when navigating.

| Property      | Type       | Description            |
| ------------- | ---------- | ---------------------- |
| `title`       | `string`   | Page title             |
| `description` | `string`   | Meta description       |
| `keywords`    | `string[]` | Meta keywords          |
| `[key]`       | `any`      | Custom metadata fields |

## Client-Only Data Loading

Use `clientOnly` to define loaders and actions for routes:

```tsx
// src/users/$id/index.tsx
import { useLoaderData, useParams, clientOnly } from "@/route.tree";

// Define the route configuration
export const route = clientOnly({
  loader: async ({ params }) => {
    const res = await fetch(`/api/users/${params.id}`);
    return res.json();
  },
  pendingComponent: () => <div>Loading user...</div>,
  errorComponent: ({ error, retry }) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  ),
});

export default function UserProfile() {
  const user = useLoaderData();
  const { id } = useParams();

  return <h1>{user.name}</h1>;
}
```

### clientOnly Options

| Option             | Type                            | Description                     |
| ------------------ | ------------------------------- | ------------------------------- |
| `loader`           | `(ctx) => Promise<T>`           | Fetch data before rendering     |
| `action`           | `(ctx) => Promise<T>`           | Handle form submissions         |
| `pendingComponent` | `ComponentType`                 | Show while loading              |
| `errorComponent`   | `ComponentType<{error, retry}>` | Show on error with retry        |
| `preload`          | `boolean`                       | Preload data on link hover      |
| `staleTime`        | `number`                        | Cache duration in ms            |
| `validateParams`   | `(params) => T`                 | Validate/transform route params |
| `beforeEnter`      | `(ctx) => boolean`              | Guard navigation                |

### Data Hooks

```tsx
import {
  useLoaderData, // Access loader data
  useActionData, // Access action result
  usePending, // Check if loading/submitting
  useIsLoading, // Check if loader is running
  useIsSubmitting, // Check if action is running
  useLoaderError, // Get loader error
  useSubmit, // Programmatic form submission
} from "@/route.tree";
```

## Tech Stack

- **React 19** - UI library
- **Vite 7** - Build tool
- **TypeScript** - Type safety
- **Olova Router** - File-based routing
- **ESLint** - Code linting

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built with [Olova Router](https://www.npmjs.com/package/olova-router)
