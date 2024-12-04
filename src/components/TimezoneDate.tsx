import { Icon, Tooltip, Typography, TypographyProps } from '~/components/designSystem'
import { formatDateToTZ, getTimezoneConfig } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

enum MainTimezoneEnum {
  utc0 = 'utc0',
  organization = 'organization',
  customer = 'customer',
}

interface TimezoneDateProps {
  date: string // Should be given in UTC +0
  mainDateFormat?: string
  mainTimezone?: keyof typeof MainTimezoneEnum
  customerTimezone?: TimezoneEnum
  mainTypographyProps?: Pick<TypographyProps, 'variant' | 'color'>
  className?: string
}

export const TimezoneDate = ({
  mainDateFormat = 'LLL. dd, yyyy',
  date,
  mainTimezone = MainTimezoneEnum.organization,
  customerTimezone,
  mainTypographyProps,
  className,
}: TimezoneDateProps) => {
  const { translate } = useInternationalization()
  const { timezone, timezoneConfig, formatTimeOrgaTZ } = useOrganizationInfos()
  const formattedCustomerTZ = getTimezoneConfig(customerTimezone || timezone)

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
              {formatDateToTZ(date, customerTimezone, 'EEE dd LLL, yyyy HH:mm:ss')}
            </Typography>

            <Icon name="company" color="disabled" />
            <Typography variant="caption" color="grey400">
              {translate('text_6390bbff05db04e825d347a9')}
            </Typography>
            <Typography variant="caption" color="white">
              {translate('text_6390bc0405db04e825d347aa', { offset: timezoneConfig.offset })}
            </Typography>
            <Typography variant="caption" color="white">
              {formatTimeOrgaTZ(date, 'EEE dd LLL, yyyy HH:mm:ss')}
            </Typography>
          </div>
        </div>
      }
      placement="top-end"
    >
      <Typography
        className="w-max border-b-2 border-dotted border-grey-400"
        color="grey700"
        {...mainTypographyProps}
        noWrap
      >
        {formatDateToTZ(
          date,
          mainTimezone === MainTimezoneEnum.organization
            ? timezone
            : mainTimezone === MainTimezoneEnum.customer
              ? customerTimezone
              : TimezoneEnum.TzUtc,
          mainDateFormat,
        )}
      </Typography>
    </Tooltip>
  )
}
