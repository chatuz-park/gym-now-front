import { useQuery } from '@tanstack/react-query'
import { dashboardAPI } from '../lib/api'
import { queryKeys } from '../lib/query-keys'

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: () => dashboardAPI.getSummary(),
  })
}
