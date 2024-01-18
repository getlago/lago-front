import { TimezoneEnum } from "~/generated/graphql"
import { TranslateFunc } from "~/hooks/core/useInternationalization"

import { formatDateToTZ } from "../timezone"

const DATE_FORMAT = 'LLL. dd, yyyy'
const TIME_ONLY_FORMAT = 'HH:mm'

const formatFeesRangeToString = (
  fromDatetime: string,
  toDatetime: string,
  timezone: TimezoneEnum | null | undefined,
  translate: TranslateFunc
): string => {
  const fromDateString = formatDateToTZ(fromDatetime, timezone, DATE_FORMAT)
  const toDateString = formatDateToTZ(toDatetime, timezone, DATE_FORMAT)

  if (fromDateString === toDateString) {
    const fromDateTimeString = formatDateToTZ(fromDatetime, timezone, TIME_ONLY_FORMAT)
    const toDateTimeString = formatDateToTZ(toDatetime, timezone, TIME_ONLY_FORMAT)

    return `Fees on ${fromDateString} (${fromDateTimeString} - ${toDateTimeString})`
  }

  return translate('text_6499a4e4db5730004703f36b', {
    from: fromDateString,
    to: toDateString,
  })
}

export default formatFeesRangeToString