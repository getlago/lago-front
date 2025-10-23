/*
 * This hook serves as a central point for ONLY common formatting logic
 * that can be shared across multiple components
 * NB:
 * A new method is supposed to be added here only when we have duplication in formatting logic
 * across multiple components. If the formatting logic is specific to a single component,
 * it should reside within that component or, in case, its dedicated hook.
 */
import { useMemo } from 'react'

import { intlFormatDateTime, TimeFormat } from '~/core/timezone/utils'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

type useFormatterDateHelper = () => {
  formattedDateTimeWithSecondsOrgaTZ: (date: string) => string
  formattedDateWithTimezone: (date: string) => string
}

export const useFormatterDateHelper: useFormatterDateHelper = () => {
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  // Memoized formatter for date-time with seconds considering organization's timezone
  const formattedDateTimeWithSecondsOrgaTZ = useMemo(() => {
    return (date: string) => {
      const { date: d, time } = intlFormatDateTimeOrgaTZ(date, {
        formatTime: TimeFormat.TIME_WITH_SECONDS,
      })

      return `${d} ${time}`
    }
  }, [intlFormatDateTimeOrgaTZ])

  // Memoized formatter for date-timezone without preset organization timezone
  const formattedDateWithTimezone = useMemo(() => {
    return (date: string) => {
      const { date: d, timezone } = intlFormatDateTime(date, {})

      return `${d} ${timezone}`
    }
  }, [])

  return {
    formattedDateTimeWithSecondsOrgaTZ,
    formattedDateWithTimezone,
  }
}
