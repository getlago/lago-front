import { FC } from 'react'

import {
  Avatar,
  Button,
  Icon,
  IconName,
  Popper,
  Tooltip,
  Typography,
  TypographyColor,
} from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { intlFormatDateTime } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'
import { tw } from '~/styles/utils'

interface ListItemProps {
  iconName: IconName
  labelColor: TypographyColor
  transactionId: string
  label: string
  date?: string
  timezone?: TimezoneEnum
  creditsColor: TypographyColor
  credits: string
  amount: string
  isBlurry?: boolean
  isPending?: boolean
  hasAction?: boolean
  onClick?: () => void
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
  hasAction,
  transactionId,
  onClick,
  ...props
}) => {
  const { translate } = useInternationalization()

  const isClickable = !!onClick

  return (
    <li className={tw('relative shadow-b', isClickable && 'hover:bg-grey-100')}>
      <div
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onClick) {
            onClick()
          }
        }}
        className={tw(
          'flex items-center justify-between px-4 py-3',
          isClickable && 'focus-visible:bg-grey-200 focus-visible:ring focus-visible:ring-inset',
        )}
        {...props}
      >
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
                {isPending && (
                  <span data-test="caption-pending">{`${translate(
                    'text_62da6db136909f52c2704c30',
                  )} • `}</span>
                )}
                {intlFormatDateTime(date, { timezone }).date}
              </Typography>
            )}
          </div>
        </div>
        <div className="flex flex-row items-center gap-7">
          <div className="flex flex-col items-end">
            <Typography
              variant="bodyHl"
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
          {hasAction && <div className="size-10" />}
        </div>
      </div>
      {hasAction && (
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={({ isOpen, openPopper }) => (
            <div className="absolute right-4 top-4">
              <Tooltip
                placement="top-start"
                disableHoverListener={isOpen}
                title={translate('text_1741251836185jea576d14uj')}
              >
                <Button
                  size="medium"
                  variant="quaternary"
                  icon="dots-horizontal"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    openPopper()
                  }}
                />
              </Tooltip>
            </div>
          )}
        >
          {({ closePopper }) => (
            <MenuPopper>
              <Button
                startIcon="duplicate"
                variant="quaternary"
                align="left"
                fullWidth
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard(transactionId)
                  addToast({
                    severity: 'info',
                    translateKey: 'text_17412580835361rm20fysfba',
                  })
                  closePopper()
                }}
              >
                {translate('text_1741258064758s59ws4fg2l9')}
              </Button>
            </MenuPopper>
          )}
        </Popper>
      )}
    </li>
  )
}
