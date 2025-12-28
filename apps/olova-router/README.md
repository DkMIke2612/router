# Olova Router

<p align="center">
  <img src="https://img.shields.io/npm/v/olova-router?style=flat-square&color=blue" alt="npm version" />
  <img src="https://img.shields.io/npm/dm/olova-router?style=flat-square&color=green" alt="downloads" />
  <img src="https://img.shields.io/npm/l/olova-router?style=flat-square" alt="license" />
</p>

**Next.js-style file-based routing for React + Vite applications** — with nested layouts, dynamic routes, and zero configuration.

---

## ✨ Features

| Feature                   | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| 📁 **File-based routing** | Create routes by adding folders with `index.tsx`           |
| 🏗️ **Nested layouts**     | Use `_layout.tsx` with `<Outlet />` for persistent layouts |
| 🎯 **Dynamic routes**     | Use `$id` or `[id]` syntax for dynamic segments            |
| 🌟 **Catch-all routes**   | Use `$` or `[...slug]` for wildcard matching               |
| 📦 **Route groups**       | Use `(group)` folders to organize without affecting URLs   |
| 🔍 **Search params**      | Built-in `useSearchParams` hook with merge support         |
| 🚫 **Custom 404 pages**   | Global and route-specific 404 error pages                  |
| 🔄 **Hot reload**         | Auto-regenerates routes when files change                  |
| 📝 **Type-safe**          | Full TypeScript support with typed Link paths              |

---

## 📦 Installation

```bash
npm install olova-router
```

---

## 🚀 Quick Start

### 1. Add the Vite Plugin

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { olovaRouter } from "olova-router";

export default defineConfig({
  plugins: [react(), olovaRouter()],
});
```

### 2. Create App Entry

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { routes, layouts, notFoundPages, OlovaRouter } from "./route.tree";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OlovaRouter
      routes={routes}
      layouts={layouts}
      notFoundPages={notFoundPages}
    />
  </StrictMode>
);
```

### 3. Create Your Routes

```
src/
├── _layout.tsx          → Root layout (persistent nav/header)
├── App.tsx              → / (home page)
├── 404.tsx              → Global 404 page
├── about/
│   └── index.tsx        → /about
├── users/
│   ├── index.tsx        → /users
│   └── $id/
│       └── index.tsx    → /users/:id (dynamic)
├── blog/
│   └── $/
│       └── index.tsx    → /blog/* (catch-all)
└── (auth)/              → Route group (not in URL)
    ├── login/
    │   └── index.tsx    → /login
    └── register/
        └── index.tsx    → /register
```

---

## 🏗️ Nested Layouts

Create persistent layouts that don't re-mount on navigation — headers, sidebars, and navs stay stable while only page content changes.

### Create a Layout

```tsx
// src/_layout.tsx
import { Link, Outlet } from "./route.tree";

export default function RootLayout() {
  return (
    <div>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/users">Users</Link>
      </nav>

      <main>
        <Outlet /> {/* Page content renders here */}
      </main>
    </div>
  );
}
```

### How It Works

- `_layout.tsx` in any folder creates a layout for that route scope
- `<Outlet />` renders the matched child route
- Layouts stay mounted while navigating between child routes
- No more flickering navbars!

---

## 🧭 Navigation

### Using Link Component

```tsx
import { Link } from "./route.tree";

function MyComponent() {
  return (
    <div>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/users/123">User 123</Link> {/* Dynamic paths work! */}
    </div>
  );
}
```

### Programmatic Navigation

```tsx
import { useRouter } from "./route.tree";

function MyComponent() {
  const { navigate, currentPath } = useRouter();

  return (
    <div>
      <p>Current path: {currentPath}</p>
      <button onClick={() => navigate("/users/456")}>Go to User 456</button>
    </div>
  );
}
```

---

## 🎯 Dynamic Routes

Use `$param` or `[param]` folder names for dynamic segments.

### Folder Structure

```
src/users/$id/index.tsx     →  /users/:id
src/posts/[postId]/index.tsx  →  /posts/:postId
```

### Access Params

```tsx
// src/users/$id/index.tsx
import { useParams } from "./route.tree";

export default function UserPage() {
  const { id } = useParams<{ id: string }>();

  return <div>User ID: {id}</div>;
}
```

---

## 🌟 Catch-All Routes

Use `$` or `[...slug]` for catch-all segments that match multiple path levels.

### Folder Structure

```
src/blog/$/index.tsx           →  /blog/*
src/docs/[...slug]/index.tsx   →  /docs/*
```

### Access Slug

```tsx
// src/blog/$/index.tsx
import { useParams } from "./route.tree";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  // /blog/2024/hello-world → slug = "2024/hello-world"
  return <div>Blog path: {slug}</div>;
}
```

---

## 🔍 Search Params

Read and update URL query parameters.

```tsx
import { useSearchParams } from "./route.tree";

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read params - /search?q=react&page=2
  const query = searchParams.q; // "react"
  const page = searchParams.page; // "2"

  // Update params (merge with existing)
  setSearchParams({ page: "3" }, { merge: true });

  // Replace all params
  setSearchParams({ q: "vue", page: "1" });

  // Remove a param
  setSearchParams({ page: null }, { merge: true });

  // Use replaceState instead of pushState
  setSearchParams({ page: "5" }, { replace: true });
}
```

---

## 📦 Route Groups

Organize routes without affecting the URL using `(parentheses)`.

### Folder Structure

```
src/
├── (auth)/
│   ├── login/index.tsx      → /login
│   └── register/index.tsx   → /register
├── (marketing)/
│   ├── pricing/index.tsx    → /pricing
│   └── features/index.tsx   → /features
```

The group folder name `(auth)` is excluded from the URL.

---

## 🚫 Custom 404 Pages

### Global 404

```tsx
// src/404.tsx
import { Link, useRouter } from "./route.tree";

export default function NotFound() {
  const { currentPath } = useRouter();

  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>Path "{currentPath}" doesn't exist.</p>
      <Link href="/">Go Home</Link>
    </div>
  );
}
```

### Route-Specific 404

```tsx
// src/dashboard/404.tsx
// Matches: /dashboard/anything-that-doesnt-exist

export default function DashboardNotFound() {
  return <div>Dashboard page not found</div>;
}
```

The most specific 404 page is used based on path prefix.

---

## 📋 Route Pattern Reference

| File Path                      | URL Pattern           |
| ------------------------------ | --------------------- |
| `src/App.tsx`                  | `/`                   |
| `src/about/index.tsx`          | `/about`              |
| `src/users/$id/index.tsx`      | `/users/:id`          |
| `src/users/[id]/index.tsx`     | `/users/:id`          |
| `src/blog/$/index.tsx`         | `/blog/*`             |
| `src/blog/[...slug]/index.tsx` | `/blog/*`             |
| `src/(auth)/login/index.tsx`   | `/login`              |
| `src/users/_layout.tsx`        | Layout for `/users/*` |
| `src/404.tsx`                  | Global 404            |
| `src/users/404.tsx`            | 404 for `/users/*`    |

---

## ⚙️ API Reference

### Plugin Options

```ts
olovaRouter({
  rootDir: "src", // Directory to scan (default: 'src')
  extensions: [".tsx", ".ts"], // File extensions (default: ['.tsx', '.ts'])
});
```

### Hooks

| Hook                | Returns                                                            | Description             |
| ------------------- | ------------------------------------------------------------------ | ----------------------- |
| `useRouter()`       | `{ currentPath, params, navigate, searchParams, setSearchParams }` | Full router access      |
| `useParams<T>()`    | `T`                                                                | Route parameters object |
| `useSearchParams()` | `[params, setParams]`                                              | Query string params     |

### Components

| Component     | Props                                               | Description                  |
| ------------- | --------------------------------------------------- | ---------------------------- |
| `OlovaRouter` | `routes`, `layouts?`, `notFoundPages?`, `notFound?` | Main router                  |
| `Link`        | `href`, `children`, `className?`                    | Type-safe navigation         |
| `Outlet`      | —                                                   | Renders nested route content |

### Types

```ts
import type {
  RoutePaths, // Union of all route paths
  SearchParams, // Search params object type
  SetSearchParamsOptions,
  LayoutRoute,
  NotFoundPageConfig,
} from "./route.tree";
```

---

## 🔄 Auto-Generated Files

The plugin automatically generates `src/route.tree.ts` containing:

- All route imports and configurations
- Layout configurations
- 404 page configurations
- Type-safe `Link` component
- All hooks re-exported

**Do not edit this file manually** — it's regenerated when routes change.

---

## 💡 Tips

### Path Aliases

Add a path alias for cleaner imports:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

```ts
// vite.config.ts
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Then import from `@/route.tree` anywhere.

---

## 📄 License

MIT © 2026

---

<p align="center">
  Made with ❤️ for the React community
</p>
