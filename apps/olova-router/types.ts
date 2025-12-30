import type { ComponentType } from 'react';

export interface RouteEntry {

  path: string;

  filePath: string;

  isDynamic: boolean;

  params: string[];
}

export interface ScannerOptions {

  rootDir: string;

  extensions: string[];
}

export interface RouteConfig {

  path: string;

  component: string;

  params?: string[];
}

export interface GeneratorOptions {

  routes: RouteEntry[];

  basePath: string;
}

export interface OlovaRouterOptions {

  rootDir?: string;

  extensions?: string[];
}

export interface DynamicSegmentResult {

  isDynamic: boolean;

  paramName: string | null;
}

export interface NotFoundEntry {

  pathPrefix: string;

  filePath: string;
}

export interface NotFoundPageConfig {

  pathPrefix: string;

  component: ComponentType;
}
