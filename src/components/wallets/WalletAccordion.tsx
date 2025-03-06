import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { FC, PropsWithChildren, RefObject } from 'react'

import {
  Accordion,
  Avatar,
  Button,
  Card,
  Icon,
  Skeleton,
  Status,
  StatusProps,
  StatusType,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { TimezoneDate } from '~/components/TimezoneDate'
import { WalletTransactionList } from '~/components/wallets/WalletTransactionList'
import { WalletTransactionListItem } from '~/components/wallets/WalletTransactionListItem'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  TimezoneEnum,
  WalletAccordionFragment,
  WalletInfosForTransactionsFragmentDoc,
  WalletStatusEnum,
  WalletTransactionStatusEnum,
  WalletTransactionTransactionTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { tw } from '~/styles/utils'

gql`
  fragment WalletAccordion on Wallet {
    id
    balanceCents
    consumedAmountCents
    consumedCredits
    createdAt
    creditsBalance
    currency
    expirationAt
    lastBalanceSyncAt
    lastConsumedCreditAt
    name
    rateAmount
    status
    terminatedAt
    ongoingBalanceCents
    creditsOngoingBalance

    ...WalletInfosForTransactions
  }

  ${WalletInfosForTransactionsFragmentDoc}
`

const TODAY = DateTime.now().toISODate()

interface WalletAccordionProps {
  wallet: WalletAccordionFragment
  premiumWarningDialogRef: RefObject<PremiumWarningDialogRef>
  customerTimezone?: TimezoneEnum
}

const mapStatus = (type?: WalletStatusEnum | undefined): StatusProps => {
  switch (type) {
    case WalletStatusEnum.Active:
      return {
        type: StatusType.success,
        label: 'active',
      }
    default:
      return {
        type: StatusType.danger,
        label: 'terminated',
      }
  }
}

export const WalletAccordion: FC<WalletAccordionProps> = ({
  customerTimezone,
  premiumWarningDialogRef,
  wallet,
}) => {
  const {
    balanceCents,
    consumedAmountCents,
    consumedCredits,
    createdAt,
    creditsBalance,
    currency,
    expirationAt,
    lastBalanceSyncAt,
    lastConsumedCreditAt,
    name,
    rateAmount,
    status,
    terminatedAt,
    ongoingBalanceCents,
    creditsOngoingBalance,
  } = wallet
  const { isPremium } = useCurrentUser()
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const statusMap = mapStatus(status)
  const [creditAmountUnit = '0', creditAmountCents = '00'] = String(creditsBalance).split('.')
  const [consumedCreditUnit = '0', consumedCreditCents = '00'] =
    String(creditsOngoingBalance).split('.')
  const { translate } = useInternationalization()
  const isWalletActive = status === WalletStatusEnum.Active

  return (
    <Accordion
      noContentMargin
      transitionProps={{ unmountOnExit: false }}
      summary={
        <div className="flex flex-1 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar size="big" variant="connector">
              <Icon name="wallet" color="dark" />
            </Avatar>
            <div>
              <Typography variant="bodyHl" color="grey700">
                {name
                  ? name
                  : translate('text_62da6ec24a8e24e44f8128b2', {
                      createdAt: formatTimeOrgaTZ(createdAt),
                    })}
              </Typography>
              <Typography variant="caption">
                {translate('text_62da6ec24a8e24e44f812872', {
                  rateAmount: intlFormatNumber(Number(rateAmount) || 0, {
                    currencyDisplay: 'symbol',
                    currency,
                  }),
                })}
              </Typography>
            </div>
          </div>

          <div>
            <Status {...statusMap} />
          </div>
        </div>
      }
    >
      {({ isOpen }) => (
        <>
          {!isPremium && (
            <div className="flex items-center justify-between gap-4 bg-grey-100 p-4 shadow-y">
              <div>
                <div className="flex flex-row items-baseline gap-1">
                  <Typography variant="bodyHl" color="grey700">
                    {translate('text_65ae73ebe3a66bec2b91d721')}
                  </Typography>

                  <Icon name="sparkles" />
                </div>
                <Typography variant="caption" color="grey600">
                  {translate('text_65ae73ebe3a66bec2b91d727')}
                </Typography>
              </div>
              <Button
                variant="tertiary"
                endIcon="sparkles"
                onClick={() => premiumWarningDialogRef.current?.openDialog()}
              >
                {translate('text_65ae73ebe3a66bec2b91d72d')}
              </Button>
            </div>
          )}
          <div className="flex flex-row items-end gap-8 px-4 py-6 shadow-b">
            <div className="flex flex-col gap-1">
              <div className="flex items-center [&_*]:flex">
                <Typography className="mr-1" variant="captionHl" color="grey600">
                  {translate('text_65ae73ebe3a66bec2b91d747')}
                </Typography>
                <Tooltip
                  className="flex h-5 items-end"
                  placement="bottom-start"
                  title={translate('text_65ae73ebe3a66bec2b91d741', {
                    date: formatTimeOrgaTZ(lastBalanceSyncAt || DateTime.now()),
                  })}
                >
                  <Icon name="info-circle" />
                </Tooltip>
              </div>
              <DetailSummaryLine className="items-baseline">
                <Typography color={isWalletActive ? 'grey700' : 'grey600'} variant="subhead" noWrap>
                  {creditAmountUnit}
                </Typography>
                <Typography
                  className="mr-1"
                  color={isWalletActive ? 'grey700' : 'grey600'}
                  variant="captionHl"
                >
                  .{creditAmountCents}
                </Typography>
                <Typography color={isWalletActive ? 'grey700' : 'grey600'} variant="captionHl">
                  {translate(
                    'text_62da6ec24a8e24e44f81287a',
                    undefined,
                    Number(creditAmountUnit) || 0,
                  )}
                </Typography>
              </DetailSummaryLine>
              <DetailSummaryLine>
                <Typography color="grey600" variant="caption">
                  {intlFormatNumber(deserializeAmount(balanceCents, currency), {
                    currencyDisplay: 'symbol',
                    currency,
                  })}
                </Typography>
              </DetailSummaryLine>
            </div>

            {isWalletActive && (
              <div className="flex flex-col gap-1">
                <DetailSummaryLine>
                  <Typography className="mr-1" variant="captionHl" color="grey600">
                    {translate('text_65ae73ebe3a66bec2b91d75f')}
                  </Typography>
                  <Tooltip
                    className="flex h-5 items-end"
                    placement="bottom-start"
                    title={translate('text_65ae73ebe3a66bec2b91d749')}
                  >
                    <Icon name="info-circle" />
                  </Tooltip>
                </DetailSummaryLine>
                <DetailSummaryLine className="items-baseline">
                  <Typography
                    blur={!isPremium}
                    color={isWalletActive ? 'grey700' : 'grey600'}
                    variant="subhead"
                    noWrap
                  >
                    {isPremium ? consumedCreditUnit : '0'}
                  </Typography>
                  <Typography
                    className="mr-1"
                    blur={!isPremium}
                    color={isWalletActive ? 'grey700' : 'grey600'}
                    variant="captionHl"
                  >
                    .{isPremium ? consumedCreditCents : '00'}
                  </Typography>
                  <Typography
                    color={isWalletActive ? 'grey700' : 'grey600'}
                    variant="captionHl"
                    blur={!isPremium}
                  >
                    {translate(
                      'text_62da6ec24a8e24e44f812884',
                      undefined,
                      Number(consumedCreditUnit) || 0,
                    )}
                  </Typography>
                </DetailSummaryLine>
                <DetailSummaryLine>
                  <Typography color="grey600" variant="caption" blur={!isPremium}>
                    {intlFormatNumber(
                      deserializeAmount(isPremium ? ongoingBalanceCents : 0, currency),
                      {
                        currencyDisplay: 'symbol',
                        currency,
                      },
                    )}
                  </Typography>
                </DetailSummaryLine>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <DetailSummaryLine>
                <Typography color="grey500" variant="captionHl">
                  {isWalletActive
                    ? translate('text_62da6ec24a8e24e44f81288a')
                    : translate('text_62e2a2f2a79d60429eff3035')}
                </Typography>
              </DetailSummaryLine>
              <DetailSummaryLine>
                {!isWalletActive && (
                  <TimezoneDate
                    mainTypographyProps={{ variant: 'caption', color: 'grey700' }}
                    date={terminatedAt}
                    customerTimezone={customerTimezone}
                  />
                )}
                {isWalletActive && expirationAt && (
                  <TimezoneDate
                    mainTypographyProps={{ variant: 'caption', color: 'grey700' }}
                    date={expirationAt}
                    customerTimezone={customerTimezone}
                  />
                )}
                {isWalletActive && !expirationAt && (
                  <Typography color="grey700" variant="caption">
                    {translate('text_62da6ec24a8e24e44f81288c')}
                  </Typography>
                )}
              </DetailSummaryLine>
            </div>
          </div>

          {isWalletActive && (
            <WalletTransactionListItem
              isRealTimeTransaction
              transaction={{
                id: 'real-time-transaction-id',
                amount: String(deserializeAmount(wallet.ongoingUsageBalanceCents, wallet.currency)),
                creditAmount: String(wallet.creditsOngoingUsageBalance),
                createdAt: TODAY,
                settledAt: TODAY,
                wallet,
                status: WalletTransactionStatusEnum.Settled,
                transactionType: WalletTransactionTransactionTypeEnum.Outbound,
                transactionStatus: undefined,
              }}
              customerTimezone={customerTimezone}
            />
          )}

          <WalletTransactionList
            customerTimezone={customerTimezone}
            isOpen={isOpen}
            wallet={wallet}
            footer={
              <Typography
                className="ml-auto flex items-center gap-1"
                color="grey600"
                variant="caption"
              >
                {`${translate('text_65ae73ece3a66bec2b91d7d7')} ${consumedCredits} ${translate('text_62da6ec24a8e24e44f81287a', undefined, Number(consumedCredits) || 0)} | ${intlFormatNumber(
                  deserializeAmount(consumedAmountCents, currency),
                  {
                    currencyDisplay: 'symbol',
                    currency,
                  },
                )}`}
                <Tooltip
                  className="flex h-5 items-end"
                  placement="top-end"
                  title={translate('text_62da6db136909f52c2704c40', {
                    date: formatTimeOrgaTZ(lastConsumedCreditAt || DateTime.now()),
                  })}
                >
                  <Icon name="info-circle" />
                </Tooltip>
              </Typography>
            }
          />
        </>
      )}
    </Accordion>
  )
}

const DetailSummaryLine: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return <div className={tw('flex items-center [&_*]:flex', className)}>{children}</div>
}

export const WalletAccordionSkeleton = () => {
  return (
    <Card className="p-4">
      <div className="flex flex-1 items-center gap-3">
        <Icon name="chevron-right" color="disabled" />
        <Skeleton variant="connectorAvatar" size="big" />
        <div className="w-full">
          <Skeleton variant="text" className="max-w-60" />
          <Skeleton variant="text" className="max-w-30" />
        </div>
      </div>
    </Card>
  )
}
