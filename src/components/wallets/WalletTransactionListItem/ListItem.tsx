import { FC } from 'react'

import { Avatar, Icon, IconName, Typography, TypographyColor } from '~/components/designSystem'
import { TimezoneDate } from '~/components/TimezoneDate'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface ListItemProps {
  iconName: IconName
  labelColor: TypographyColor
  label: string
  date?: string
  timezone?: TimezoneEnum
  creditsColor: TypographyColor
  credits: string
  amount: string
  isBlurry?: boolean
  isPending?: boolean
}
export const ListItem: FC<ListItemProps> = ({
  iconName,
  labelColor,
  label,
  date,
  timezone,
  creditsColor,
  credits,
  amount,
  isBlurry,
  isPending,
  ...props
}) => {
  const { translate } = useInternationalization()

  return (
    <div className="flex justify-between px-4 py-3 shadow-b" {...props}>
      <div className="flex items-center">
        <Avatar className="mr-3" size="big" variant="connector">
          <Icon name={isPending ? 'sync' : iconName} color="dark" />
        </Avatar>
        <div className="flex flex-col justify-end">
          <Typography variant="bodyHl" color={isPending ? 'grey600' : labelColor}>
            {label}
          </Typography>
          {date && (
            <Typography className="flex items-baseline *:mr-1" variant="caption" color="grey600">
              <TimezoneDate
                mainTypographyProps={{ variant: 'caption', color: 'grey600' }}
                date={date}
                customerTimezone={timezone}
              />
              {isPending && (
                <span data-test="caption-pending">{` • ${translate(
                  'text_62da6db136909f52c2704c30',
                )}`}</span>
              )}
            </Typography>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end justify-end">
        <Typography
          variant="body"
          color={isPending ? 'grey600' : creditsColor}
          blur={isBlurry}
          data-test="credits"
        >
          {credits}
        </Typography>
        <Typography variant="caption" color="grey600" blur={isBlurry} data-test="amount">
          {amount}
        </Typography>
      </div>
    </div>
  )
}
