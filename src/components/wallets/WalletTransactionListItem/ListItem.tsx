import { Avatar, AvatarBadge, Icon, IconName } from 'lago-design-system'
import { FC } from 'react'

import { Button, Popper, Tooltip, Typography, TypographyColor } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { intlFormatDateTime } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { TimezoneEnum, WalletTransactionStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'
import { tw } from '~/styles/utils'

const concatInfosTextForDisplay = ({
  name,
  date,
  timezone,
}: {
  name: string | null | undefined
  date: string | null | undefined
  timezone: TimezoneEnum | undefined
}) => {
  const formattedDate = date ? intlFormatDateTime(date, { timezone }).date : ''

  return [formattedDate, name].filter(Boolean).join(' • ')
}

interface ListItemProps {
  amount: string
  credits: string
  creditsColor: TypographyColor
  date?: string
  hasAction?: boolean
  iconName: IconName
  isBlurry?: boolean
  label: string
  labelColor: TypographyColor
  name?: string | null
  status?: WalletTransactionStatusEnum
  timezone?: TimezoneEnum
  transactionId: string
  onClick?: () => void
}
export const ListItem: FC<ListItemProps> = ({
  amount,
  credits,
  creditsColor,
  date,
  hasAction,
  iconName,
  isBlurry,
  label,
  labelColor,
  name,
  status,
  timezone,
  transactionId,
  onClick,
  ...props
}) => {
  const { translate } = useInternationalization()

  const isClickable = !!onClick
  const isPending = status === WalletTransactionStatusEnum.Pending
  const isFailed = status === WalletTransactionStatusEnum.Failed
  const displayText = concatInfosTextForDisplay({ name, date, timezone })

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
          'flex items-center justify-between gap-2 px-4 py-3',
          isClickable && 'focus-visible:bg-grey-200 focus-visible:ring focus-visible:ring-inset',
        )}
        {...props}
      >
        <div className="flex min-w-0 items-center">
          <Avatar className="mr-3" size="big" variant="connector">
            <Icon name={iconName} color="dark" />
            {isPending && <AvatarBadge icon="sync" color="dark" />}
            {isFailed && <AvatarBadge icon="stop" color="warning" />}
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <Typography
              noWrap
              variant="bodyHl"
              color={isPending || isFailed ? 'grey500' : labelColor}
              data-test="transaction-label"
            >
              {label}
            </Typography>
            {!!displayText && (
              <Typography noWrap variant="caption" color="grey600">
                {displayText}
              </Typography>
            )}
          </div>
        </div>
        <div className="flex flex-row items-center gap-7">
          <div className="flex flex-col items-end">
            <Typography
              variant="bodyHl"
              color={isPending || isFailed ? 'grey500' : creditsColor}
              blur={isBlurry}
              data-test="credits"
              className={tw(isFailed && 'line-through')}
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
          opener={(opener) => (
            <div className="absolute right-4 top-4">
              <Tooltip
                placement="top-start"
                disableHoverListener={opener.isOpen}
                title={translate('text_1741251836185jea576d14uj')}
              >
                <Button
                  size="medium"
                  variant="quaternary"
                  icon="dots-horizontal"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    opener.onClick()
                  }}
                />
              </Tooltip>
            </div>
          )}
        >
          {({ closePopper }) => (
            <MenuPopper>
              {!!onClick && (
                <Button
                  startIcon="eye"
                  variant="quaternary"
                  align="left"
                  fullWidth
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onClick()
                    closePopper()
                  }}
                >
                  {translate('text_1742218191558g0ysnnxbb32')}
                </Button>
              )}
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
