import { useState, useEffect, createContext, useContext, useMemo, type ReactNode, type ComponentType } from 'react';

interface Route {
  path: string;
  component: ComponentType;
}

export interface LayoutRoute {
  path: string;
  layout: ComponentType;
  children: Route[];
}

export interface NotFoundPageConfig {
  pathPrefix: string;
  component: ComponentType;
}

export type SearchParams = Record<string, string | string[]>;

export interface SetSearchParamsOptions {
  replace?: boolean;
  merge?: boolean;
}

function parseSearchParams(search: string): SearchParams {
  const params: SearchParams = {};
  const urlParams = new URLSearchParams(search);

  for (const key of urlParams.keys()) {
    const values = urlParams.getAll(key);
    params[key] = values.length === 1 ? values[0] : values;
  }

  return params;
}

function buildSearchString(params: Record<string, string | string[] | null>): string {
  const urlParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach(v => urlParams.append(key, v));
    } else {
      urlParams.set(key, value);
    }
  }

  const str = urlParams.toString();
  return str ? `?${str}` : '';
}

interface RouterContextType {
  currentPath: string;
  params: Record<string, string>;
  searchParams: SearchParams;
  navigate: (path: string) => void;
  setSearchParams: (params: Record<string, string | string[] | null>, options?: SetSearchParamsOptions) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

interface OutletContextType {
  component: ComponentType | null;
  params: Record<string, string>;
}

const OutletContext = createContext<OutletContextType | null>(null);

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouter must be used within OlovaRouter');
  return context;
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const context = useContext(RouterContext);
  return (context?.params || {}) as T;
}

export function useSearchParams(): [
  SearchParams,
  (params: Record<string, string | string[] | null>, options?: SetSearchParamsOptions) => void
] {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useSearchParams must be used within OlovaRouter');
  return [context.searchParams, context.setSearchParams];
}

export function Outlet() {
  const context = useContext(OutletContext);
  if (!context?.component) return null;
  const Component = context.component;
  return <Component />;
}

function matchRoute(pattern: string, pathname: string) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    // Catch-all: * matches rest of path
    if (patternPart === '*') {
      // Get the param name from the route (stored as slug by default)
      params['slug'] = pathParts.slice(i).join('/');
      return { match: true, params };
    }

    // No more path parts but pattern expects more
    if (pathPart === undefined) {
      return { match: false, params: {} };
    }

    // Dynamic segment :param
    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = pathPart;
    } else if (patternPart !== pathPart) {
      return { match: false, params: {} };
    }
  }

  // If pattern is exhausted but path has more parts, no match
  if (pathParts.length > patternParts.length) {
    return { match: false, params: {} };
  }

  return { match: true, params };
}

/**
 * Check if a path matches a layout's scope
 * A layout matches if the path starts with or equals the layout path prefix
 */
function matchLayoutScope(layoutPath: string, pathname: string): boolean {
  if (layoutPath === '/') return true; // Root layout matches everything
  return pathname === layoutPath || pathname.startsWith(layoutPath + '/');
}

/**
 * Find the most specific 404 page for a given path
 * Returns the component with the longest matching pathPrefix
 */
function findNotFoundPage(path: string, notFoundPages: NotFoundPageConfig[]): ComponentType | null {
  if (!notFoundPages || notFoundPages.length === 0) return null;

  // Sort by prefix length descending (most specific first)
  const sorted = [...notFoundPages].sort((a, b) =>
    b.pathPrefix.length - a.pathPrefix.length
  );

  // Find the most specific matching 404
  for (const nf of sorted) {
    // Global 404 (empty prefix) matches everything
    if (nf.pathPrefix === '') {
      return nf.component;
    }
    // Route-specific 404 matches if path starts with prefix
    if (path === nf.pathPrefix || path.startsWith(nf.pathPrefix + '/')) {
      return nf.component;
    }
  }
  return null;
}

interface OlovaRouterProps {
  routes: Route[];
  layouts?: LayoutRoute[];
  notFoundPages?: NotFoundPageConfig[];
  notFound?: ReactNode;
}

export function OlovaRouter({ routes, layouts = [], notFoundPages = [], notFound = <div>404 - Not Found</div> }: OlovaRouterProps) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [searchParams, setSearchParamsState] = useState<SearchParams>(() =>
    parseSearchParams(window.location.search)
  );

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname);
      setSearchParamsState(parseSearchParams(window.location.search));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.split('?')[0]);
    setSearchParamsState(parseSearchParams(path.includes('?') ? path.split('?')[1] : ''));
  };

  const setSearchParams = (
    newParams: Record<string, string | string[] | null>,
    options: SetSearchParamsOptions = {}
  ) => {
    const { replace = false, merge = false } = options;

    let finalParams: Record<string, string | string[] | null>;

    if (merge) {
      // Merge with existing params
      finalParams = { ...searchParams, ...newParams };
      // Remove null values
      for (const key of Object.keys(finalParams)) {
        if (finalParams[key] === null) {
          delete finalParams[key];
        }
      }
    } else {
      // Replace all params
      finalParams = newParams;
    }

    const searchString = buildSearchString(finalParams as Record<string, string | string[] | null>);
    const newUrl = currentPath + searchString;

    if (replace) {
      window.history.replaceState({}, '', newUrl);
    } else {
      window.history.pushState({}, '', newUrl);
    }

    setSearchParamsState(parseSearchParams(searchString));
  };

  // Sort routes: static first, then dynamic, then catch-all last
  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => {
      const aHasCatchAll = a.path.includes('*');
      const bHasCatchAll = b.path.includes('*');
      const aHasDynamic = a.path.includes(':');
      const bHasDynamic = b.path.includes(':');

      if (aHasCatchAll && !bHasCatchAll) return 1;
      if (!aHasCatchAll && bHasCatchAll) return -1;
      if (aHasDynamic && !bHasDynamic) return 1;
      if (!aHasDynamic && bHasDynamic) return -1;
      return b.path.length - a.path.length; // Longer paths first
    });
  }, [routes]);

  // Find matching route and params
  let Component: ComponentType | null = null;
  let params: Record<string, string> = {};

  for (const route of sortedRoutes) {
    if (route.path === '/' && currentPath === '/') {
      Component = route.component;
      break;
    }
    const result = matchRoute(route.path, currentPath);
    if (result.match) {
      Component = route.component;
      params = result.params;
      break;
    }
  }

  // If no route matched, find the appropriate 404 page
  if (!Component) {
    const NotFoundComponent = findNotFoundPage(currentPath, notFoundPages);
    if (NotFoundComponent) {
      Component = NotFoundComponent;
    }
  }

  // Find matching layouts (from most specific to least specific)
  const matchingLayouts = useMemo(() => {
    return layouts
      .filter(layout => matchLayoutScope(layout.path, currentPath))
      .sort((a, b) => b.path.length - a.path.length); // Most specific first
  }, [layouts, currentPath]);

  // Build the nested layout tree
  const renderWithLayouts = () => {
    if (matchingLayouts.length === 0) {
      // No layouts, render component directly
      return Component ? <Component /> : notFound;
    }

    // Render layouts from outermost to innermost
    // The innermost outlet will render the actual page component
    let content: ReactNode = Component ? <Component /> : notFound;

    // Build from inside out - start with the most specific layout
    for (let i = 0; i < matchingLayouts.length; i++) {
      const layout = matchingLayouts[i];
      const Layout = layout.layout;
      const childComponent = i === 0 ? Component : null;

      content = (
        <OutletContext.Provider value={{ component: i === 0 ? Component : null, params }}>
          <Layout />
        </OutletContext.Provider>
      );
    }

    // Actually, we need to nest them properly
    // Start from innermost (page) and wrap with layouts
    content = Component ? <Component /> : notFound;

    // Wrap from most specific to least specific (reverse order for proper nesting)
    for (let i = 0; i < matchingLayouts.length; i++) {
      const layout = matchingLayouts[i];
      const Layout = layout.layout;
      const prevContent = content;

      // Create a wrapper component that provides the outlet context
      const WrappedLayout = () => (
        <OutletContext.Provider value={{ component: () => <>{prevContent}</>, params }}>
          <Layout />
        </OutletContext.Provider>
      );

      content = <WrappedLayout />;
    }

    return content;
  };

  return (
    <RouterContext.Provider value={{ currentPath, params, searchParams, navigate, setSearchParams }}>
      {renderWithLayouts()}
    </RouterContext.Provider>
  );
}

/**
 * Type utilities for resolving dynamic route paths
 * Transforms route patterns like '/users/:id' into types accepting '/users/1'
 */

// Resolve a single path segment: ':param' or '*' becomes string, otherwise literal
type ResolveSegment<S extends string> =
  S extends `:${string}`
    ? string
    : S extends '*'
      ? string
      : S;

// Recursively resolve all segments in a path
type ResolvePathSegments<Path extends string> =
  Path extends `${infer Segment}/${infer Rest}`
    ? `${ResolveSegment<Segment>}/${ResolvePathSegments<Rest>}`
    : ResolveSegment<Path>;

// For catch-all routes ending with *, allow additional path segments
type ResolveCatchAll<Path extends string> =
  Path extends `${infer Base}/*`
    ? `${Base}/${string}`
    : Path;

// Main type: resolve route pattern to accept concrete paths
export type ResolveRoutePath<Path extends string> =
  Path extends `${infer Base}/*`
    ? `${ResolvePathSegments<Base>}/${string}`
    : ResolvePathSegments<Path>;

/**
 * Creates a type-safe Link component for the given route paths
 * Accepts both pattern paths ('/users/:id') and resolved paths ('/users/1')
 */
export function createLink<T extends string>() {
  return function Link({ href, children, className }: { href: ResolveRoutePath<T>; children: ReactNode; className?: string }) {
    const { navigate } = useRouter();
    return (
      <a href={href} className={className} onClick={(e) => { e.preventDefault(); navigate(href); }}>
        {children}
      </a>
    );
  };
}
