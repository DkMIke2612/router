import { createContext, useContext } from 'react';

export interface LoaderDataContextType {
  data: unknown;
  isLoading: boolean;
  error: Error | null;
}

export interface ActionDataContextType {
  data: unknown;
  isSubmitting: boolean;
  error: Error | null;
  submit: (formData: FormData | Record<string, unknown>) => Promise<void>;
}

export const LoaderDataContext = createContext<LoaderDataContextType | null>(null);
export const ActionDataContext = createContext<ActionDataContextType | null>(null);

export function useLoaderData<T = unknown>(): T {
  const context = useContext(LoaderDataContext);
  if (!context) {
    throw new Error('useLoaderData must be used within a route with a loader');
  }
  return context.data as T;
}

export function useActionData<T = unknown>(): T | undefined {
  const context = useContext(ActionDataContext);
  return context?.data as T | undefined;
}

export function useIsLoading(): boolean {
  const context = useContext(LoaderDataContext);
  return context?.isLoading ?? false;
}

export function useIsSubmitting(): boolean {
  const context = useContext(ActionDataContext);
  return context?.isSubmitting ?? false;
}

export function usePending(): boolean {
  const loaderContext = useContext(LoaderDataContext);
  const actionContext = useContext(ActionDataContext);
  return (loaderContext?.isLoading ?? false) || (actionContext?.isSubmitting ?? false);
}

export function useLoaderError(): Error | null {
  const context = useContext(LoaderDataContext);
  return context?.error ?? null;
}

export function useSubmit(): ((formData: FormData | Record<string, unknown>) => Promise<void>) | undefined {
  const context = useContext(ActionDataContext);
  return context?.submit;
}
