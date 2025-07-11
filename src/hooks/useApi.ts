import { useState, useCallback, useEffect, useRef } from 'react'
import { handleApiError } from '../lib/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
  setData: (data: T) => void
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  initialData: T | null = null
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (...args: any[]) => {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const result = await apiFunction(...args)
        setState(prev => ({ ...prev, data: result, loading: false }))
        return result
      } catch (error) {
        const errorMessage = handleApiError(error)
        setState(prev => ({ ...prev, error: errorMessage, loading: false }))
        return null
      }
    },
    [apiFunction]
  )

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    })
  }, [initialData])

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }))
  }, [])

  return {
    ...state,
    execute,
    reset,
    setData,
  }
}

// Hook específico para listas paginadas
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

interface UsePaginatedApiState<T> {
  data: PaginatedResponse<T>
  loading: boolean
  error: string | null
}

interface UsePaginatedApiReturn<T> extends UsePaginatedApiState<T> {
  execute: (params?: { search?: string; ordering?: string; filter?: string }) => Promise<PaginatedResponse<T> | null>
  refresh: () => Promise<void>
  reset: () => void
}

export function usePaginatedApi<T = any>(
  apiFunction: (params?: any) => Promise<PaginatedResponse<T>>
): UsePaginatedApiReturn<T> {
  const [state, setState] = useState<UsePaginatedApiState<T>>({
    data: { count: 0, next: null, previous: null, results: [] },
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (params?: { search?: string; ordering?: string; filter?: string }) => {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const result = await apiFunction(params)
        setState(prev => ({
          ...prev,
          data: result,
          loading: false,
        }))
        return result
      } catch (error) {
        const errorMessage = handleApiError(error)
        setState(prev => ({ ...prev, error: errorMessage, loading: false }))
        return null
      }
    },
    [apiFunction]
  )

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, data: { count: 0, next: null, previous: null, results: [] } }))
    await execute()
  }, [execute])

  const reset = useCallback(() => {
    setState({
      data: { count: 0, next: null, previous: null, results: [] },
      loading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    execute,
    refresh,
    reset,
  }
}

// Hook para operaciones CRUD
interface UseCrudApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  creating: boolean
  updating: boolean
  deleting: boolean
}

interface UseCrudApiReturn<T> extends UseCrudApiState<T> {
  get: (id: string) => Promise<T | null>
  create: (data: Partial<T>) => Promise<T | null>
  update: (id: string, data: Partial<T>) => Promise<T | null>
  remove: (id: string) => Promise<boolean>
  reset: () => void
}

export function useCrudApi<T = any>(
  getFunction: (id: string) => Promise<T>,
  createFunction: (data: Partial<T>) => Promise<T>,
  updateFunction: (id: string, data: Partial<T>) => Promise<T>,
  deleteFunction: (id: string) => Promise<void>
): UseCrudApiReturn<T> {
  const [state, setState] = useState<UseCrudApiState<T>>({
    data: null,
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
  })

  const get = useCallback(
    async (id: string) => {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const result = await getFunction(id)
        setState(prev => ({ ...prev, data: result, loading: false }))
        return result
      } catch (error) {
        const errorMessage = handleApiError(error)
        setState(prev => ({ ...prev, error: errorMessage, loading: false }))
        return null
      }
    },
    [getFunction]
  )

  const create = useCallback(
    async (data: Partial<T>) => {
      setState(prev => ({ ...prev, creating: true, error: null }))
      
      try {
        const result = await createFunction(data)
        setState(prev => ({ ...prev, data: result, creating: false }))
        return result
      } catch (error) {
        const errorMessage = handleApiError(error)
        setState(prev => ({ ...prev, error: errorMessage, creating: false }))
        return null
      }
    },
    [createFunction]
  )

  const update = useCallback(
    async (id: string, data: Partial<T>) => {
      setState(prev => ({ ...prev, updating: true, error: null }))
      
      try {
        const result = await updateFunction(id, data)
        setState(prev => ({ ...prev, data: result, updating: false }))
        return result
      } catch (error) {
        const errorMessage = handleApiError(error)
        setState(prev => ({ ...prev, error: errorMessage, updating: false }))
        return null
      }
    },
    [updateFunction]
  )

  const remove = useCallback(
    async (id: string) => {
      setState(prev => ({ ...prev, deleting: true, error: null }))
      
      try {
        await deleteFunction(id)
        setState(prev => ({ ...prev, data: null, deleting: false }))
        return true
      } catch (error) {
        const errorMessage = handleApiError(error)
        setState(prev => ({ ...prev, error: errorMessage, deleting: false }))
        return false
      }
    },
    [deleteFunction]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      creating: false,
      updating: false,
      deleting: false,
    })
  }, [])

  return {
    ...state,
    get,
    create,
    update,
    remove,
    reset,
  }
}

// Hook para debounce
/**
 * Hook personalizado para implementar debounce en valores
 * @param value - El valor que se quiere debouncar
 * @param delay - El delay en milisegundos antes de actualizar el valor
 * @returns El valor debouncado
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearchTerm = useDebounce(searchTerm, 500)
 * 
 * // El valor debouncedSearchTerm se actualizará 500ms después
 * // de que el usuario deje de escribir en searchTerm
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
} 