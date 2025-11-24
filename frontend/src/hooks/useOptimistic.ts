import { useState, useCallback } from 'react'
import { getErrorMessage } from '../utils/errorHandling'

/**
 * Hook for optimistic UI updates
 * Usage:
 * const { data, loading, error, optimisticUpdate } = useOptimistic(initialData)
 * 
 * optimisticUpdate(
 *   newData,
 *   () => apiCall(newData),
 *   rollbackData
 * )
 */
export function useOptimistic<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const optimisticUpdate = useCallback(
    async (
      optimisticValue: T,
      apiCall: () => Promise<T>,
      rollbackValue?: T
    ) => {
      // Immediately update UI
      setData(optimisticValue)
      setLoading(true)
      setError(null)

      try {
        // Make API call
        const result = await apiCall()
        // Update with server response
        setData(result)
      } catch (err) {
        // Rollback on error
        setData(rollbackValue ?? initialData)
        setError(getErrorMessage(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [initialData]
  )

  const reset = useCallback(() => {
    setData(initialData)
    setLoading(false)
    setError(null)
  }, [initialData])

  return {
    data,
    loading,
    error,
    optimisticUpdate,
    reset,
    setData
  }
}
