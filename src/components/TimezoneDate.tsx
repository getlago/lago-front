import { Icon } from 'lago-design-system'
import { useMemo } from 'react'

import { Tooltip, TooltipProps, Typography, TypographyProps } from '~/components/designSystem'
import { DateFormat, getTimezoneConfig, intlFormatDateTime, TimeFormat } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { tw } from '~/styles/utils'

enum MainTimezoneEnum {
  utc0 = 'utc0',
  organization = 'organization',
  customer = 'customer',
}

interface TimezoneDateProps {
  date: string // Should be given in UTC +0
  showFullDateTime?: boolean
  mainDateFormat?: {
    formatTime: TimeFormat
    formatDate: DateFormat
  }
  mainTimezone?: keyof typeof MainTimezoneEnum
  customerTimezone?: TimezoneEnum
  mainTypographyProps?: Pick<TypographyProps, 'variant' | 'color' | 'className' | 'noWrap'>
  className?: string
  typographyClassName?: string
  position?: TooltipProps['placement']
}

export const TimezoneDate = ({
  showFullDateTime = false,
  mainDateFormat = {
    formatTime: TimeFormat.TIME_SIMPLE,
    formatDate: DateFormat.DATE_MED,
  },
  date,
  mainTimezone = MainTimezoneEnum.organization,
  customerTimezone,
  mainTypographyProps,
  position = 'top-end',
  typographyClassName,
  className,
}: TimezoneDateProps) => {
  const { translate } = useInternationalization()
  const { timezone, timezoneConfig } = useOrganizationInfos()
  const formattedCustomerTZ = getTimezoneConfig(customerTimezone || timezone)

  const displayTimezone = useMemo(() => {
    if (mainTimezone === MainTimezoneEnum.organization) return timezone
    if (mainTimezone === MainTimezoneEnum.customer) return customerTimezone
    return TimezoneEnum.TzUtc
  }, [mainTimezone, customerTimezone, timezone])

  const customerFormattedDate = useMemo(() => {
    return intlFormatDateTime(date, {
      timezone: customerTimezone,
      formatTime: TimeFormat.TIME_24_WITH_SECONDS,
      formatDate: DateFormat.DATE_MED_WITH_WEEKDAY,
    })
  }, [date, customerTimezone])

  const organizationFormattedDate = useMemo(() => {
    return intlFormatDateTime(date, {
      formatTime: TimeFormat.TIME_24_WITH_SECONDS,
      formatDate: DateFormat.DATE_MED_WITH_WEEKDAY,
    })
  }, [date])

  const timestampFormattedDate = useMemo(() => {
    const formattedDate = intlFormatDateTime(date, {
      timezone: displayTimezone,
      ...mainDateFormat,
    })

    if (showFullDateTime) {
      return `${formattedDate.date} ${formattedDate.time} ${formattedDate.timezone}`
    }
    return formattedDate.date
  }, [date, displayTimezone, mainDateFormat, showFullDateTime])

  return (
    <Tooltip
      className={className}
      maxWidth="unset"
      title={
        <div>
          <Typography className="mb-3" variant="captionHl" color="white">
            {translate('text_6390bbcc05db04e825d347a7')}
          </Typography>

          <div className="grid w-full grid-cols-[16px_40px_85px_max-content] gap-2">
            <Icon name="user" color="disabled" />
            <Typography variant="caption" color="grey400">
              {translate('text_6390bbe826d6143fdecb81e1')}
            </Typography>
            <Typography variant="caption" color="white">
              {translate('text_6390bc0405db04e825d347aa', { offset: formattedCustomerTZ.offset })}
            </Typography>
            <Typography variant="caption" color="white">
              {`${customerFormattedDate.date} ${customerFormattedDate.time}`}
            </Typography>

            <Icon name="company" color="disabled" />
            <Typography variant="caption" color="grey400">
              {translate('text_6390bbff05db04e825d347a9')}
            </Typography>
            <Typography variant="caption" color="white">
              {translate('text_6390bc0405db04e825d347aa', { offset: timezoneConfig.offset })}
            </Typography>
            <Typography variant="caption" color="white">
              {`${organizationFormattedDate.date} ${organizationFormattedDate.time}`}
            </Typography>
          </div>
        </div>
      }
      placement={position}
    >
      <Typography
        className={tw('w-max border-b-2 border-dotted border-grey-400', typographyClassName)}
        color="grey700"
        {...mainTypographyProps}
        noWrap
      >
        {timestampFormattedDate}
      </Typography>
    </Tooltip>
  )
}
