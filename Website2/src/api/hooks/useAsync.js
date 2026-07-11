/**
 * useAsync
 *
 * Generic hook for managing async API calls with loading/error/data state.
 * Provides a clean pattern for components consuming API services.
 *
 * Usage:
 *   const { data, loading, error, execute } = useAsync(() => productService.getProducts())
 *   useEffect(() => { execute() }, [])
 */

import { useCallback, useReducer, useRef } from 'react';

const initialState = {
  status: 'idle',
  data: null,
  error: null,
};

function asyncReducer(state, action) {
  switch (action.type) {
    case 'START':
      return { ...state, status: 'loading', error: null };
    case 'SUCCESS':
      return { status: 'success', data: action.payload, error: null };
    case 'ERROR':
      return { status: 'error', data: null, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useAsync(asyncFn, immediate = false) {
  const [state, dispatch] = useReducer(asyncReducer, initialState);
  const fnRef = useRef(asyncFn);
  fnRef.current = asyncFn;

  const execute = useCallback(async (...args) => {
    dispatch({ type: 'START' });
    try {
      const result = await fnRef.current(...args);
      dispatch({ type: 'SUCCESS', payload: result });
      return result;
    } catch (error) {
      const normalized = error?.code && error?.message ? error : { code: 'UNKNOWN', message: error.message || 'An error occurred' };
      dispatch({ type: 'ERROR', payload: normalized });
      throw normalized;
    }
  }, []);

  return {
    ...state,
    loading: state.status === 'loading',
    idle: state.status === 'idle',
    execute,
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
  };
}

export default useAsync;
