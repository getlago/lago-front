import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Avatar, Icon, Typography } from '~/components/designSystem'
import { TimezoneDate } from '~/components/TimezoneDate'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  TimezoneEnum,
  WalletTransactionForTransactionListItemFragment,
  WalletTransactionStatusEnum,
  WalletTransactionTransactionTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { theme } from '~/styles'

gql`
  fragment WalletTransactionForTransactionListItem on WalletTransaction {
    id
    status
    transactionType
    amount
    creditAmount
    settledAt
    createdAt
    wallet {
      id
      currency
    }
  }
`

interface WalletTransactionListItemProps {
  customerTimezone: TimezoneEnum | undefined
  isRealTimeTransaction?: boolean
  transaction: WalletTransactionForTransactionListItemFragment
}

export const WalletTransactionListItem = ({
  customerTimezone,
  isRealTimeTransaction,
  transaction,
  ...props
}: WalletTransactionListItemProps) => {
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const blurValue = !isPremium && isRealTimeTransaction
  const { amount, createdAt, creditAmount, settledAt, status, transactionType } = transaction
  const isPending = status === WalletTransactionStatusEnum.Pending
  const isInbound = transactionType === WalletTransactionTransactionTypeEnum.Inbound
  const iconName = isRealTimeTransaction
    ? 'pulse'
    : isPending
      ? 'sync'
      : isInbound
        ? 'plus'
        : 'minus'

  return (
    <ListItemWrapper {...props}>
      <ListLeftWrapper>
        <ItemIcon size="big" variant="connector">
          <Icon name={iconName} color="dark" />
        </ItemIcon>
        <ColumnWrapper>
          <Typography
            variant="bodyHl"
            color={isPending || isRealTimeTransaction ? 'grey600' : 'grey700'}
          >
            {isRealTimeTransaction
              ? translate('text_65ae9a58ed65be00a35a0d72')
              : isInbound
                ? translate('text_62da6ec24a8e24e44f81289a', undefined, Number(creditAmount) || 0)
                : translate('text_62da6ec24a8e24e44f812892', undefined, Number(creditAmount) || 0)}
          </Typography>
          {!isRealTimeTransaction && (
            <DateBlock variant="caption" color="grey600">
              <TimezoneDate
                mainTypographyProps={{ variant: 'caption', color: 'grey600' }}
                date={isPending ? createdAt : settledAt}
                customerTimezone={customerTimezone}
              />
              {isPending && ` • ${translate('text_62da6db136909f52c2704c30')}`}
            </DateBlock>
          )}
        </ColumnWrapper>
      </ListLeftWrapper>
      <ListRightWrapper>
        <Typography
          variant="body"
          color={
            isPending || isRealTimeTransaction ? 'grey600' : isInbound ? 'success600' : 'grey700'
          }
          blur={blurValue}
        >
          {isInbound && Number(creditAmount) > 0
            ? '+ '
            : !isInbound && Number(creditAmount) < 0
              ? '- '
              : ''}
          {translate(
            'text_62da6ec24a8e24e44f812896',
            {
              amount: intlFormatNumber(Number(blurValue ? 0 : creditAmount) || 0, {
                maximumFractionDigits: 15,
                style: 'decimal',
              }),
            },
            Number(creditAmount) || 0,
          )}
        </Typography>
        <Typography variant="caption" color="grey600" blur={blurValue}>
          {intlFormatNumber(Number(blurValue ? 0 : amount) || 0, {
            currencyDisplay: 'symbol',
            maximumFractionDigits: 15,
            currency: transaction?.wallet?.currency,
          })}
        </Typography>
      </ListRightWrapper>
    </ListItemWrapper>
  )
}

WalletTransactionListItem.displayName = 'WalletTransactionListItem'

const ListItemWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${theme.spacing(3)} ${theme.spacing(4)};
  box-shadow: ${theme.shadows[7]};
`

const ListLeftWrapper = styled.div`
  display: flex;
  align-items: center;

  &:last-child {
    align-items: flex-end;
  }
`

const ItemIcon = styled(Avatar)`
  margin-right: ${theme.spacing(3)};
`

const ListRightWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
`

const ColumnWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`

const DateBlock = styled(Typography)`
  display: flex;
  align-items: baseline;

  > * {
    margin-right: ${theme.spacing(1)};
  }
`
