/**
 * Olova Router - Shared TypeScript Interfaces
 */

import type { ComponentType } from 'react';

/** Represents a discovered route from the file system */
export interface RouteEntry {
  /** URL path (e.g., "/hello/world") */
  path: string;
  /** Absolute file path to index.tsx */
  filePath: string;
  /** True if path contains dynamic segments */
  isDynamic: boolean;
  /** Array of parameter names from dynamic segments */
  params: string[];
}

/** Configuration for the route scanner */
export interface ScannerOptions {
  /** Root directory to scan */
  rootDir: string;
  /** File extensions to look for (default: [".tsx", ".ts"]) */
  extensions: string[];
}

/** Route configuration for the virtual module */
export interface RouteConfig {
  /** URL path with dynamic segments converted to :param syntax */
  path: string;
  /** Import path for lazy loading */
  component: string;
  /** Optional list of parameter names */
  params?: string[];
}

/** Options for the route generator */
export interface GeneratorOptions {
  /** Discovered routes from scanner */
  routes: RouteEntry[];
  /** Base path for imports */
  basePath: string;
}

/** Options for the Olova Router Vite plugin */
export interface OlovaRouterOptions {
  /** Root directory to scan (default: "src") */
  rootDir?: string;
  /** File extensions to look for (default: [".tsx", ".ts"]) */
  extensions?: string[];
}

/** Result of parsing a dynamic segment */
export interface DynamicSegmentResult {
  /** Whether the segment is dynamic */
  isDynamic: boolean;
  /** Parameter name if dynamic, null otherwise */
  paramName: string | null;
}

/** Represents a 404 page entry detected by the scanner */
export interface NotFoundEntry {
  /** Path prefix this 404 applies to (empty string for global) */
  pathPrefix: string;
  /** Absolute file path to 404.tsx */
  filePath: string;
}

/** 404 page config with component reference for runtime */
export interface NotFoundPageConfig {
  /** Path prefix this 404 applies to (empty string for global) */
  pathPrefix: string;
  /** The 404 component to render */
  component: ComponentType;
}
