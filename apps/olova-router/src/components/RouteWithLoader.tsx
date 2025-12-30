import { useState, useEffect, useCallback, type ReactNode, type ComponentType } from 'react';
import { LoaderDataContext, ActionDataContext, type LoaderDataContextType, type ActionDataContextType } from './loaderContext';
import type { RouteDefinition, LoaderContext, ActionContext } from '../types';

interface RouteWithLoaderProps {
  component: ComponentType;
  routeDefinition: RouteDefinition;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  loadingFallback: ReactNode;
}

export function RouteWithLoader({
  component: Component,
  routeDefinition,
  params,
  searchParams,
  loadingFallback
}: RouteWithLoaderProps) {
  const [loaderData, setLoaderData] = useState<unknown>(null);
  const [loaderError, setLoaderError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!!routeDefinition.loader);

  const [actionData, setActionData] = useState<unknown>(undefined);
  const [actionError, setActionError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runLoader = useCallback(async () => {
    if (!routeDefinition.loader) return;

    const controller = new AbortController();

    const loaderContext: LoaderContext = {
      params,
      searchParams,
      signal: controller.signal,
    };

    try {
      setIsLoading(true);
      setLoaderError(null);

      if (routeDefinition.beforeEnter) {
        const canEnter = await routeDefinition.beforeEnter(loaderContext);
        if (!canEnter) {

          return;
        }
      }

      const data = await routeDefinition.loader(loaderContext);
      setLoaderData(data);
    } catch (err) {
      setLoaderError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [routeDefinition, params, searchParams]);

  useEffect(() => {
    runLoader();
  }, [runLoader]);

  const submitAction = useCallback(async (formData: FormData | Record<string, unknown>) => {
    if (!routeDefinition.action) return;

    const request = new Request(window.location.href, {
      method: 'POST',
      body: formData instanceof FormData ? formData : JSON.stringify(formData),
    });

    const actionContext: ActionContext = {
      params,
      request,
    };

    try {
      setIsSubmitting(true);
      setActionError(null);
      const data = await routeDefinition.action(actionContext);
      setActionData(data);

      await runLoader();
    } catch (err) {
      setActionError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSubmitting(false);
    }
  }, [routeDefinition, params, runLoader]);

  const retry = useCallback(() => {
    runLoader();
  }, [runLoader]);

  if (isLoading && routeDefinition.pendingComponent) {
    const PendingComponent = routeDefinition.pendingComponent;
    return <PendingComponent />;
  }

  // Show loading fallback if no pending component defined
  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (loaderError && routeDefinition.errorComponent) {
    const ErrorComponent = routeDefinition.errorComponent;
    return <ErrorComponent error={loaderError} retry={retry} />;
  }

  // Create context values
  const loaderContextValue: LoaderDataContextType = {
    data: loaderData,
    isLoading,
    error: loaderError,
  };

  const actionContextValue: ActionDataContextType = {
    data: actionData,
    isSubmitting,
    error: actionError,
    submit: submitAction,
  };

  // Render component with contexts
  return (
    <LoaderDataContext.Provider value={loaderContextValue}>
      <ActionDataContext.Provider value={actionContextValue}>
        <Component />
      </ActionDataContext.Provider>
    </LoaderDataContext.Provider>
  );
}
