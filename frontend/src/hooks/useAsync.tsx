import React, { useState, useCallback } from 'react';
import Loader from '../components/common/Loader';

export interface UseAsyncResult<T, Args extends any[]> {
    /** Whether the async execution is currently pending */
    loading: boolean;
    /** Any error thrown during execution */
    error: Error | null;
    /** The resolved data payload */
    data: T | null;
    /** Triggers the async operation with custom arguments */
    execute: (...args: Args) => Promise<T>;
    /** Directly mutate the data payload state */
    setData: React.Dispatch<React.SetStateAction<T | null>>;
    /** Directly mutate the error state */
    setError: React.Dispatch<React.SetStateAction<Error | null>>;
    /** 
     * Loader overlay component.
     * Simply place `<LoadingScreen />` at the top of your page JSX.
     * Pass `<LoadingScreen global />` if you want a screen-wide overlay.
     */
    LoadingScreen: React.FC<{ global?: boolean }>;
}

/**
 * A highly-reusable React hook to manage async API operations.
 * Handles loading status, API data payload storage, error states,
 * and provides a ready-made full-screen Loader component.
 * 
 * @param asyncFunction Any async API or promise-returning function.
 * @param immediate If true, the hook starts in a loading state. Default is false.
 */
export function useAsync<T = any, Args extends any[] = any[]>(
    asyncFunction: (...args: Args) => Promise<any>,
    immediate = false
): UseAsyncResult<T, Args> {
    const [loading, setLoading] = useState(immediate);
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async (...args: Args): Promise<T> => {
        setLoading(true);
        setError(null);
        try {
            const response = await asyncFunction(...args);
            // Handle standard Axios response wrapper or raw responses elegantly
            const resultData = response && response.data !== undefined ? response.data : response;
            setData(resultData);
            return resultData;
        } catch (err: any) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [asyncFunction]);

    const LoadingScreen = useCallback(({ global = false }: { global?: boolean } = {}) => {
        if (!loading) return null;
        return <Loader global={global} />;
    }, [loading]);

    return {
        loading,
        error,
        data,
        execute,
        setData,
        setError,
        LoadingScreen,
    };
}
