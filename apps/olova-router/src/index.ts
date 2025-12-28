/**
 * Olova Router - Vite Plugin
 * Next.js-style folder-based routing for React + Vite
 */

import type { Plugin, ResolvedConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import type { OlovaRouterOptions, RouteEntry, RouteConfig, NotFoundEntry } from './types';

// Re-export types
export type { OlovaRouterOptions, RouteEntry, RouteConfig, NotFoundEntry } from './types';

// Re-export router components
export { 
  OlovaRouter, 
  useRouter, 
  useParams, 
  useSearchParams, 
  createLink,
  Outlet,
  type NotFoundPageConfig,
  type SearchParams,
  type SetSearchParamsOptions,
  type LayoutRoute
} from './router';

/** Layout entry for _layout.tsx files */
interface LayoutEntry {
  path: string;
  filePath: string;
}

function parseDynamicSegment(segment: string) {
  // Support catch-all: $ or [...slug] → matches multiple segments
  if (segment === '$' || segment.match(/^\[\.\.\.(.+)\]$/)) {
    const paramName = segment === '$' ? 'slug' : segment.match(/^\[\.\.\.(.+)\]$/)?.[1] || 'slug';
    return { isDynamic: true, paramName, isCatchAll: true };
  }
  
  // Support both [id] and $id syntax for dynamic routes
  const bracketMatch = segment.match(/^\[(.+)\]$/);
  if (bracketMatch) {
    return { isDynamic: true, paramName: bracketMatch[1], isCatchAll: false };
  }
  
  const dollarMatch = segment.match(/^\$(.+)$/);
  if (dollarMatch) {
    return { isDynamic: true, paramName: dollarMatch[1], isCatchAll: false };
  }
  
  return { isDynamic: false, paramName: null, isCatchAll: false };
}

/**
 * Check if a folder name is a route group (wrapped in parentheses)
 * Route groups organize code without affecting the URL path
 * Example: (auth), (dashboard), (marketing)
 */
function isRouteGroup(segment: string): boolean {
  return /^\(.+\)$/.test(segment);
}

function pathToRoute(relativePath: string, sep: string) {
  const params: string[] = [];
  let hasCatchAll = false;
  const segments = relativePath.split(sep).filter(Boolean);
  
  const routeSegments = segments
    .filter(segment => !isRouteGroup(segment))
    .map(segment => {
      const { isDynamic, paramName, isCatchAll } = parseDynamicSegment(segment);
      if (isDynamic && paramName) {
        params.push(paramName);
        if (isCatchAll) {
          hasCatchAll = true;
          return `*`;
        }
        return `:${paramName}`;
      }
      return segment;
    });

  const routePath = '/' + routeSegments.join('/');
  return { routePath: routePath === '/' ? '/' : routePath, params, hasCatchAll };
}

function detectExportType(filePath: string): { hasDefault: boolean; namedExport: string | null } {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (/export\s+default\s+/.test(content)) {
      return { hasDefault: true, namedExport: null };
    }
    
    const namedMatch = content.match(/export\s+(?:const|function|class)\s+(\w+)/);
    if (namedMatch) {
      return { hasDefault: false, namedExport: namedMatch[1] };
    }
    
    const exportMatch = content.match(/export\s*\{\s*(\w+)(?:\s+as\s+default)?\s*\}/);
    if (exportMatch) {
      if (content.includes('as default')) {
        return { hasDefault: true, namedExport: null };
      }
      return { hasDefault: false, namedExport: exportMatch[1] };
    }
    
    return { hasDefault: false, namedExport: null };
  } catch {
    return { hasDefault: true, namedExport: null };
  }
}

function scanDirectory(
  dir: string, 
  rootDir: string, 
  extensions: string[], 
  routes: RouteEntry[], 
  notFoundPages: NotFoundEntry[],
  layouts: LayoutEntry[],
  isRoot = false
) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'assets' || entry.name.startsWith('_')) continue;
      scanDirectory(fullPath, rootDir, extensions, routes, notFoundPages, layouts, false);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      const baseName = path.basename(entry.name, ext);
      
      // Detect _layout.tsx files
      if (baseName === '_layout' && extensions.includes(ext)) {
        const relativePath = path.relative(rootDir, dir);
        const { routePath } = pathToRoute(relativePath, path.sep);
        layouts.push({ 
          path: isRoot ? '/' : routePath, 
          filePath: fullPath 
        });
      }
      // Detect 404.tsx files
      else if (baseName === '404' && extensions.includes(ext)) {
        const relativeParts = path.relative(rootDir, dir).split(path.sep).filter(Boolean);
        const filteredParts = relativeParts.filter(p => !isRouteGroup(p));
        const pathPrefix = isRoot ? '' : '/' + filteredParts.join('/');
        notFoundPages.push({ pathPrefix: pathPrefix || '', filePath: fullPath });
      } else if (isRoot && baseName === 'App' && extensions.includes(ext)) {
        routes.push({ path: '/', filePath: fullPath, isDynamic: false, params: [] });
      } else if (!isRoot && baseName === 'index' && extensions.includes(ext)) {
        const relativePath = path.relative(rootDir, path.dirname(fullPath));
        const { routePath, params } = pathToRoute(relativePath, path.sep);
        routes.push({ path: routePath, filePath: fullPath, isDynamic: params.length > 0, params });
      }
    }
  }
}

interface ScanResult {
  routes: RouteEntry[];
  notFoundPages: NotFoundEntry[];
  layouts: LayoutEntry[];
}

function scanRoutes(rootDir: string, extensions: string[]): ScanResult {
  const routes: RouteEntry[] = [];
  const notFoundPages: NotFoundEntry[] = [];
  const layouts: LayoutEntry[] = [];
  const absoluteRoot = path.isAbsolute(rootDir) ? rootDir : path.resolve(rootDir);
  
  if (!fs.existsSync(absoluteRoot)) {
    throw new Error(`Olova Router: Root directory does not exist: ${absoluteRoot}`);
  }

  scanDirectory(absoluteRoot, absoluteRoot, extensions, routes, notFoundPages, layouts, true);
  routes.sort((a, b) => (a.isDynamic !== b.isDynamic ? (a.isDynamic ? 1 : -1) : a.path.localeCompare(b.path)));
  notFoundPages.sort((a, b) => b.pathPrefix.length - a.pathPrefix.length);
  layouts.sort((a, b) => a.path.length - b.path.length); // Least specific first (for nesting)
  return { routes, notFoundPages, layouts };
}

interface RouteWithExport extends RouteConfig {
  hasDefault: boolean;
  namedExport: string | null;
}

interface NotFoundWithExport extends NotFoundEntry {
  hasDefault: boolean;
  namedExport: string | null;
}

interface LayoutWithExport extends LayoutEntry {
  hasDefault: boolean;
  namedExport: string | null;
}

function generateRouteTree(
  routes: RouteWithExport[], 
  notFoundPages: NotFoundWithExport[], 
  layouts: LayoutWithExport[],
  srcDir: string
): string {
  const routeImports = routes.map((route, index) => {
    const relativePath = './' + path.relative(srcDir, route.component).replace(/\\/g, '/').replace(/\.tsx?$/, '');
    
    if (route.hasDefault) {
      return `import Route${index} from '${relativePath}';`;
    } else if (route.namedExport) {
      return `import { ${route.namedExport} as Route${index} } from '${relativePath}';`;
    } else {
      return `import Route${index} from '${relativePath}';`;
    }
  }).join('\n');

  const notFoundImports = notFoundPages.map((nf, index) => {
    const relativePath = './' + path.relative(srcDir, nf.filePath).replace(/\\/g, '/').replace(/\.tsx?$/, '');
    
    if (nf.hasDefault) {
      return `import NotFound${index} from '${relativePath}';`;
    } else if (nf.namedExport) {
      return `import { ${nf.namedExport} as NotFound${index} } from '${relativePath}';`;
    } else {
      return `import NotFound${index} from '${relativePath}';`;
    }
  }).join('\n');

  const layoutImports = layouts.map((layout, index) => {
    const relativePath = './' + path.relative(srcDir, layout.filePath).replace(/\\/g, '/').replace(/\.tsx?$/, '');
    
    if (layout.hasDefault) {
      return `import Layout${index} from '${relativePath}';`;
    } else if (layout.namedExport) {
      return `import { ${layout.namedExport} as Layout${index} } from '${relativePath}';`;
    } else {
      return `import Layout${index} from '${relativePath}';`;
    }
  }).join('\n');

  const routeObjects = routes.map((route, index) => {
    return `  { path: '${route.path}', component: Route${index} }`;
  }).join(',\n');

  const notFoundObjects = notFoundPages.map((nf, index) => {
    return `  { pathPrefix: '${nf.pathPrefix}', component: NotFound${index} }`;
  }).join(',\n');

  const layoutObjects = layouts.map((layout, index) => {
    return `  { path: '${layout.path}', layout: Layout${index}, children: [] }`;
  }).join(',\n');

  const routePaths = routes.length > 0 ? routes.map(r => `'${r.path}'`).join(' | ') : 'never';

  const allImports = [routeImports, notFoundImports, layoutImports].filter(Boolean).join('\n');

  return `// Auto-generated by olova-router - DO NOT EDIT
// This file is auto-updated when you add/remove route folders

import { createLink, OlovaRouter, useRouter, useParams, useSearchParams, Outlet } from 'olova-router/router';
${allImports}

export const routes = [
${routeObjects || ''}
];

export const notFoundPages = [
${notFoundObjects || ''}
];

export const layouts = [
${layoutObjects || ''}
];

export type RoutePaths = ${routePaths};

export const Link = createLink<RoutePaths>();
export { OlovaRouter, useRouter, useParams, useSearchParams, Outlet };
export type { NotFoundPageConfig, SearchParams, SetSearchParamsOptions, LayoutRoute } from 'olova-router/router';
`;
}

/**
 * Olova Router Vite Plugin
 * Automatically generates route.tree.ts based on folder structure
 */
export function olovaRouter(options: OlovaRouterOptions = {}): Plugin {
  const rootDir = options.rootDir || 'src';
  const extensions = options.extensions || ['.tsx', '.ts'];

  let config: ResolvedConfig;
  let absoluteRootDir: string;
  let watcher: fs.FSWatcher | null = null;

  function generateRouteTreeFile() {
    const { routes, notFoundPages, layouts } = scanRoutes(absoluteRootDir, extensions);
    
    const routeConfigs: RouteWithExport[] = routes.map(r => {
      const exportInfo = detectExportType(r.filePath);
      return {
        path: r.path,
        component: r.filePath.replace(/\\/g, '/'),
        params: r.params.length > 0 ? r.params : undefined,
        hasDefault: exportInfo.hasDefault,
        namedExport: exportInfo.namedExport
      };
    });

    const notFoundConfigs: NotFoundWithExport[] = notFoundPages.map(nf => {
      const exportInfo = detectExportType(nf.filePath);
      return {
        pathPrefix: nf.pathPrefix,
        filePath: nf.filePath.replace(/\\/g, '/'),
        hasDefault: exportInfo.hasDefault,
        namedExport: exportInfo.namedExport
      };
    });

    const layoutConfigs: LayoutWithExport[] = layouts.map(l => {
      const exportInfo = detectExportType(l.filePath);
      return {
        path: l.path,
        filePath: l.filePath.replace(/\\/g, '/'),
        hasDefault: exportInfo.hasDefault,
        namedExport: exportInfo.namedExport
      };
    });
    
    const content = generateRouteTree(routeConfigs, notFoundConfigs, layoutConfigs, absoluteRootDir);
    const treePath = path.resolve(absoluteRootDir, 'route.tree.ts');
    
    const existing = fs.existsSync(treePath) ? fs.readFileSync(treePath, 'utf-8') : '';
    if (existing !== content) {
      fs.writeFileSync(treePath, content);
      console.log('\x1b[32m[olova-router]\x1b[0m Route tree updated');
    }
  }

  function startWatcher() {
    if (watcher) return;

    watcher = fs.watch(absoluteRootDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (filename.includes('route.tree.ts')) return;
      
      const isIndexFile = filename.endsWith('index.tsx') || filename.endsWith('index.ts');
      const isAppFile = filename === 'App.tsx' || filename === 'App.ts';
      const is404File = filename.endsWith('404.tsx') || filename.endsWith('404.ts');
      const isLayoutFile = filename.endsWith('_layout.tsx') || filename.endsWith('_layout.ts');
      const isDirectory = !filename.includes('.');
      const isDynamicSegment = filename.includes('$') || filename.includes('[');
      const isRenameEvent = eventType === 'rename';
      
      // Trigger on any relevant file change, folder change, dynamic segment, or rename
      if (isIndexFile || isAppFile || is404File || isLayoutFile || isDirectory || isDynamicSegment || isRenameEvent) {
        setTimeout(() => generateRouteTreeFile(), 100);
      }
    });

    console.log('\x1b[32m[olova-router]\x1b[0m Watching for route changes...');
  }

  return {
    name: 'olova-router',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      absoluteRootDir = path.resolve(config.root, rootDir);
    },

    buildStart() {
      generateRouteTreeFile();
      
      if (config.command === 'serve') {
        startWatcher();
      }
    },

    buildEnd() {
      if (watcher) {
        watcher.close();
        watcher = null;
      }
    },
  };
}

export default olovaRouter;
