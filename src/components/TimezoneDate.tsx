import styled from 'styled-components'

import { Icon, Tooltip, Typography, TypographyProps } from '~/components/designSystem'
import { formatDateToTZ, getTimezoneConfig } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { theme } from '~/styles'

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
    <StyledTooltip
      className={className}
      maxWidth="unset"
      title={
        <div>
          <Header variant="captionHl" color="white">
            {translate('text_6390bbcc05db04e825d347a7')}
          </Header>

          <Grid>
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
          </Grid>
        </div>
      }
      placement="top-end"
    >
      <Date color="grey700" {...mainTypographyProps} noWrap>
        {formatDateToTZ(
          date,
          mainTimezone === MainTimezoneEnum.organization
            ? timezone
            : mainTimezone === MainTimezoneEnum.customer
            ? customerTimezone
            : TimezoneEnum.TzUtc,
          mainDateFormat
        )}
      </Date>
    </StyledTooltip>
  )
}

const Date = styled(Typography)`
  border-bottom: 2px dotted ${theme.palette.grey[400]};
  width: max-content;
`

const Header = styled(Typography)`
  margin-bottom: ${theme.spacing(3)};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 16px 40px 85px max-content;
  gap: ${theme.spacing(2)};
  width: 100%;
`

const StyledTooltip = styled(Tooltip)`
  max-width: unset !important;
  .MuiTooltip-tooltip {
    max-width: unset !important;
  }
`
