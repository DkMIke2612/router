import type { ComponentType } from 'react';

export interface LoaderContext {
  params: Record<string, string>;
  searchParams: URLSearchParams;
  signal: AbortSignal;
}

export interface ActionContext {
  params: Record<string, string>;
  request: Request;
}

export type LoaderFunction<T = unknown> = (context: LoaderContext) => Promise<T> | T;

export type ActionFunction<T = unknown> = (context: ActionContext) => Promise<T> | T;

export interface ClientOnlyOptions<TLoader = unknown, TAction = unknown, TParams = Record<string, string>> {

  loader?: LoaderFunction<TLoader>;

  action?: ActionFunction<TAction>;

  preload?: boolean;

  pendingComponent?: ComponentType;

  errorComponent?: ComponentType<{ error: Error; retry: () => void }>;

  staleTime?: number;

  validateParams?: (params: Record<string, string>) => TParams;

  beforeEnter?: (context: LoaderContext) => boolean | Promise<boolean>;
}

export interface RouteDefinition<TLoader = unknown, TAction = unknown> {
  __isRouteDefinition: true;
  loader?: LoaderFunction<TLoader>;
  action?: ActionFunction<TAction>;
  preload: boolean;
  pendingComponent?: ComponentType;
  errorComponent?: ComponentType<{ error: Error; retry: () => void }>;
  staleTime: number;
  validateParams?: (params: Record<string, string>) => unknown;
  beforeEnter?: (context: LoaderContext) => boolean | Promise<boolean>;
}

export function clientOnly<TLoader = unknown, TAction = unknown, TParams = Record<string, string>>(
  options: ClientOnlyOptions<TLoader, TAction, TParams>
): RouteDefinition<TLoader, TAction> {
  return {
    __isRouteDefinition: true,
    loader: options.loader,
    action: options.action,
    preload: options.preload ?? false,
    pendingComponent: options.pendingComponent,
    errorComponent: options.errorComponent,
    staleTime: options.staleTime ?? 0,
    validateParams: options.validateParams,
    beforeEnter: options.beforeEnter,
  };
}
