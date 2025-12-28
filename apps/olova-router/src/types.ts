/**
 * Olova Router - TypeScript Types
 */

import type { ComponentType } from 'react';

/** Represents a discovered route from the file system */
export interface RouteEntry {
  path: string;
  filePath: string;
  isDynamic: boolean;
  params: string[];
}

/** Configuration for the route scanner */
export interface ScannerOptions {
  rootDir: string;
  extensions: string[];
}

/** Route configuration for the generated module */
export interface RouteConfig {
  path: string;
  component: string;
  params?: string[];
}

/** Options for the route generator */
export interface GeneratorOptions {
  routes: RouteEntry[];
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
  isDynamic: boolean;
  paramName: string | null;
}

/** Represents a 404 page entry detected by the scanner */
export interface NotFoundEntry {
  pathPrefix: string;
  filePath: string;
}

/** 404 page config with component reference for runtime */
export interface NotFoundPageConfig {
  pathPrefix: string;
  component: ComponentType;
}
