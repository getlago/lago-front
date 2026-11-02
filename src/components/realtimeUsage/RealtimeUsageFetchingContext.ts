import { createContext, useContext, useEffect, useId } from 'react'

export type ReportFetching = (id: string, isFetching: boolean) => void

export const RealtimeUsageFetchingContext = createContext<ReportFetching | undefined>(undefined)

export const useReportFetching = (isFetching: boolean, report?: ReportFetching): void => {
  const contextReport = useContext(RealtimeUsageFetchingContext)
  const reportFetching = report || contextReport
  const id = useId()

  useEffect(() => {
    if (!reportFetching) return

    reportFetching(id, isFetching)

    return () => reportFetching(id, false)
  }, [id, isFetching, reportFetching])
}
