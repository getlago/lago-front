import { createContext, useContext, useEffect, useId } from 'react'

export type ReportFetching = (id: string, isFetching: boolean, hasError?: boolean) => void

export const RealtimeUsageFetchingContext = createContext<ReportFetching | undefined>(undefined)

export const useReportFetching = (
  isFetching: boolean,
  hasError: boolean,
  report?: ReportFetching,
): void => {
  const contextReport = useContext(RealtimeUsageFetchingContext)
  const reportFetching = report || contextReport
  const id = useId()

  useEffect(() => {
    if (!reportFetching) return

    reportFetching(id, isFetching, hasError)

    return () => reportFetching(id, false, false)
  }, [id, isFetching, hasError, reportFetching])
}
