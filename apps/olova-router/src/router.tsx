/**
 * Olova Router - Client-Side Router Component
 */

import { useState, useEffect, createContext, useContext, useMemo, type ReactNode, type ComponentType } from 'react';

interface Route {
  path: string;
  component: ComponentType;
}

/** Layout route for nested layouts */
export interface LayoutRoute {
  path: string;
  layout: ComponentType;
  children: Route[];
}

/** 404 page configuration */
export interface NotFoundPageConfig {
  pathPrefix: string;
  component: ComponentType;
}

/** Search params type - values can be string or array for multi-value params */
export type SearchParams = Record<string, string | string[]>;

/** Options for setSearchParams */
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

/** Context for Outlet - passes the matched child component */
interface OutletContextType {
  component: ComponentType | null;
}

const OutletContext = createContext<OutletContextType | null>(null);

/** Hook to access router context (navigate, currentPath) */
export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouter must be used within OlovaRouter');
  return context;
}

/** Hook to access route params (e.g., :id from /users/:id) */
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const context = useContext(RouterContext);
  return (context?.params || {}) as T;
}

/** Hook to read and update URL search params (query string) */
export function useSearchParams(): [
  SearchParams,
  (params: Record<string, string | string[] | null>, options?: SetSearchParamsOptions) => void
] {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useSearchParams must be used within OlovaRouter');
  return [context.searchParams, context.setSearchParams];
}

/**
 * Outlet component - renders the matched child route
 * Use this in _layout.tsx to render nested routes
 */
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
    
    if (patternPart === '*') {
      params['slug'] = pathParts.slice(i).join('/');
      return { match: true, params };
    }
    
    if (pathPart === undefined) {
      return { match: false, params: {} };
    }
    
    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = pathPart;
    } else if (patternPart !== pathPart) {
      return { match: false, params: {} };
    }
  }
  
  if (pathParts.length > patternParts.length) {
    return { match: false, params: {} };
  }

  return { match: true, params };
}

/** Check if pathname matches the layout's scope */
function matchLayoutScope(layoutPath: string, pathname: string): boolean {
  if (layoutPath === '/') return true;
  return pathname === layoutPath || pathname.startsWith(layoutPath + '/');
}

function findNotFoundPage(path: string, notFoundPages: NotFoundPageConfig[]): ComponentType | null {
  if (!notFoundPages || notFoundPages.length === 0) return null;
  
  const sorted = [...notFoundPages].sort((a, b) => 
    b.pathPrefix.length - a.pathPrefix.length
  );
  
  for (const nf of sorted) {
    if (nf.pathPrefix === '') {
      return nf.component;
    }
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

/** Main router component - wrap your app with this */
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
      finalParams = { ...searchParams, ...newParams };
      for (const key of Object.keys(finalParams)) {
        if (finalParams[key] === null) {
          delete finalParams[key];
        }
      }
    } else {
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

  // Sort routes: static first, dynamic next, catch-all last
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
      return b.path.length - a.path.length;
    });
  }, [routes]);

  // Find matching layouts (sorted by specificity)
  const matchingLayouts = useMemo(() => {
    return layouts
      .filter(layout => matchLayoutScope(layout.path, currentPath))
      .sort((a, b) => a.path.length - b.path.length); // Least specific first for nesting
  }, [layouts, currentPath]);

  // Find matched route
  let MatchedComponent: ComponentType | null = null;
  let params: Record<string, string> = {};

  for (const route of sortedRoutes) {
    if (route.path === '/' && currentPath === '/') {
      MatchedComponent = route.component;
      break;
    }
    const result = matchRoute(route.path, currentPath);
    if (result.match) {
      MatchedComponent = route.component;
      params = result.params;
      break;
    }
  }

  if (!MatchedComponent) {
    const NotFoundComponent = findNotFoundPage(currentPath, notFoundPages);
    if (NotFoundComponent) {
      MatchedComponent = NotFoundComponent;
    }
  }

  // Build nested layout structure
  const renderContent = () => {
    const content = MatchedComponent ? <MatchedComponent /> : notFound;
    
    if (matchingLayouts.length === 0) {
      return content;
    }

    // Wrap content with layouts from innermost to outermost
    let result = content;
    for (let i = matchingLayouts.length - 1; i >= 0; i--) {
      const Layout = matchingLayouts[i].layout;
      const wrapped = result;
      result = (
        <OutletContext.Provider value={{ component: () => <>{wrapped}</> }}>
          <Layout />
        </OutletContext.Provider>
      );
    }
    return result;
  };

  return (
    <RouterContext.Provider value={{ currentPath, params, searchParams, navigate, setSearchParams }}>
      {renderContent()}
    </RouterContext.Provider>
  );
}

/**
 * Type utilities for resolving dynamic route paths
 * Transforms '/users/:id' into accepting '/users/anything'
 */

// Resolve a segment: ':param' or '*' becomes string, otherwise literal
type ResolveSegment<S extends string> = 
  S extends `:${string}` ? string : 
  S extends '*' ? string : 
  S;

// Recursively resolve path segments
type ResolvePathSegments<Path extends string> = 
  Path extends `${infer Segment}/${infer Rest}`
    ? `${ResolveSegment<Segment>}/${ResolvePathSegments<Rest>}`
    : ResolveSegment<Path>;

// Main type for resolving route patterns
export type ResolveRoutePath<Path extends string> = 
  Path extends `${infer Base}/*`
    ? `${ResolvePathSegments<Base>}/${string}`
    : ResolvePathSegments<Path>;

// Union of all resolved paths
type ResolveRoutes<T extends string> = T extends string ? ResolveRoutePath<T> : never;

/** Creates a type-safe Link component that accepts resolved dynamic paths */
export function createLink<T extends string>() {
  return function Link({ href, children, className }: { href: ResolveRoutes<T>; children: ReactNode; className?: string }) {
    const { navigate } = useRouter();
    return (
      <a href={href} className={className} onClick={(e) => { e.preventDefault(); navigate(href); }}>
        {children}
      </a>
    );
  };
}
