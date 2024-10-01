import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { DateTime } from 'luxon'
import { forwardRef, RefObject } from 'react'
import styled, { css } from 'styled-components'

import {
  Accordion,
  Avatar,
  Button,
  Icon,
  Skeleton,
  Status,
  StatusProps,
  StatusType,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { TimezoneDate } from '~/components/TimezoneDate'
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
import { theme } from '~/styles'

import { TopupWalletDialogRef } from './TopupWalletDialog'
import { WalletTransactionList } from './WalletTransactionList'
import { WalletTransactionListItem } from './WalletTransactionListItem'

import { PremiumWarningDialogRef } from '../PremiumWarningDialog'

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

export const WalletAccordion = forwardRef<TopupWalletDialogRef, WalletAccordionProps>(
  ({ customerTimezone, premiumWarningDialogRef, wallet }: WalletAccordionProps, ref) => {
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
    let [creditAmountUnit = '0', creditAmountCents = '00'] = String(creditsBalance).split('.')
    let [consumedCreditUnit = '0', consumedCreditCents = '00'] =
      String(creditsOngoingBalance).split('.')
    const { translate } = useInternationalization()
    const isWalletActive = status === WalletStatusEnum.Active

    return (
      <Accordion
        noContentMargin
        transitionProps={{ unmountOnExit: false }}
        summary={
          <SummaryContainer>
            <SummaryLeft>
              <Avatar size="big" variant="connector">
                <Icon name="wallet" color="dark" />
              </Avatar>
              <SummaryInfos>
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
              </SummaryInfos>
            </SummaryLeft>

            <Status {...statusMap} />
          </SummaryContainer>
        }
      >
        {({ isOpen }) => (
          <>
            {!isPremium && (
              <FreemiumWarningBlock>
                <Stack direction="column">
                  <Stack direction="row" spacing={1}>
                    <Typography variant="bodyHl" color="grey700">
                      {translate('text_65ae73ebe3a66bec2b91d721')}
                    </Typography>

                    <Icon name="sparkles" />
                  </Stack>
                  <Typography variant="caption" color="grey600">
                    {translate('text_65ae73ebe3a66bec2b91d727')}
                  </Typography>
                </Stack>
                <Button
                  variant="tertiary"
                  endIcon="sparkles"
                  onClick={() => premiumWarningDialogRef.current?.openDialog()}
                >
                  {translate('text_65ae73ebe3a66bec2b91d72d')}
                </Button>
              </FreemiumWarningBlock>
            )}
            <DetailSummary>
              <DetailSummaryBlock>
                <DetailSummaryLine>
                  <TextWithSideSpace variant="captionHl" color="grey600">
                    {translate('text_65ae73ebe3a66bec2b91d747')}
                  </TextWithSideSpace>
                  <Tooltip
                    className="flex h-5 items-end"
                    placement="bottom-start"
                    title={translate('text_65ae73ebe3a66bec2b91d741', {
                      date: formatTimeOrgaTZ(lastBalanceSyncAt || DateTime.now()),
                    })}
                  >
                    <Icon name="info-circle" />
                  </Tooltip>
                </DetailSummaryLine>
                <DetailSummaryLine $alignBaseLine>
                  <Typography
                    color={isWalletActive ? 'grey700' : 'grey600'}
                    variant="subhead"
                    noWrap
                  >
                    {creditAmountUnit}
                  </Typography>
                  <TextWithSideSpace
                    color={isWalletActive ? 'grey700' : 'grey600'}
                    variant="captionHl"
                  >
                    .{creditAmountCents}
                  </TextWithSideSpace>
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
              </DetailSummaryBlock>

              {isWalletActive && (
                <DetailSummaryBlock>
                  <DetailSummaryLine>
                    <TextWithSideSpace variant="captionHl" color="grey600">
                      {translate('text_65ae73ebe3a66bec2b91d75f')}
                    </TextWithSideSpace>
                    <Tooltip
                      className="flex h-5 items-end"
                      placement="bottom-start"
                      title={translate('text_65ae73ebe3a66bec2b91d749')}
                    >
                      <Icon name="info-circle" />
                    </Tooltip>
                  </DetailSummaryLine>
                  <DetailSummaryLine $alignBaseLine>
                    <Typography
                      blur={!isPremium}
                      color={isWalletActive ? 'grey700' : 'grey600'}
                      variant="subhead"
                      noWrap
                    >
                      {isPremium ? consumedCreditUnit : '0'}
                    </Typography>
                    <TextWithSideSpace
                      blur={!isPremium}
                      color={isWalletActive ? 'grey700' : 'grey600'}
                      variant="captionHl"
                    >
                      .{isPremium ? consumedCreditCents : '00'}
                    </TextWithSideSpace>
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
                </DetailSummaryBlock>
              )}

              <DetailSummaryBlock>
                <DetailSummaryLine>
                  <Typography color="grey500" variant="captionHl">
                    {isWalletActive
                      ? translate('text_62da6ec24a8e24e44f81288a')
                      : translate('text_62e2a2f2a79d60429eff3035')}
                  </Typography>
                </DetailSummaryLine>
                <DetailSummaryLine>
                  {!isWalletActive ? (
                    <TimezoneDate
                      mainTypographyProps={{ variant: 'caption', color: 'grey700' }}
                      date={terminatedAt}
                      customerTimezone={customerTimezone}
                    />
                  ) : expirationAt ? (
                    <TimezoneDate
                      mainTypographyProps={{ variant: 'caption', color: 'grey700' }}
                      date={expirationAt}
                      customerTimezone={customerTimezone}
                    />
                  ) : (
                    <Typography color="grey700" variant="caption">
                      {translate('text_62da6ec24a8e24e44f81288c')}
                    </Typography>
                  )}
                </DetailSummaryLine>
              </DetailSummaryBlock>
            </DetailSummary>

            {isWalletActive && (
              <WalletTransactionListItem
                isRealTimeTransaction
                transaction={{
                  id: 'real-time-transaction-id',
                  amount: String(
                    deserializeAmount(wallet.ongoingUsageBalanceCents, wallet.currency),
                  ),
                  creditAmount: String(wallet.creditsOngoingUsageBalance),
                  createdAt: new Date(),
                  settledAt: new Date(),
                  wallet,
                  status: WalletTransactionStatusEnum.Settled,
                  transactionType: WalletTransactionTransactionTypeEnum.Outbound,
                  transactionStatus: undefined,
                }}
                customerTimezone={customerTimezone}
              />
            )}

            <WalletTransactionList
              ref={ref}
              customerTimezone={customerTimezone}
              isOpen={isOpen}
              wallet={wallet}
            />

            <WalletConsumptionSummary color="grey600" variant="caption">
              {translate('text_65ae73ece3a66bec2b91d7d7')}&nbsp;
              {consumedCredits}&nbsp;
              {translate('text_62da6ec24a8e24e44f81287a', undefined, Number(consumedCredits) || 0)}
              &nbsp;|&nbsp;
              {intlFormatNumber(deserializeAmount(consumedAmountCents, currency), {
                currencyDisplay: 'symbol',
                currency,
              })}
              &nbsp;
              <InlineTooltip
                placement="top-end"
                title={translate('text_62da6db136909f52c2704c40', {
                  date: formatTimeOrgaTZ(lastConsumedCreditAt || DateTime.now()),
                })}
              >
                <Icon name="info-circle" />
              </InlineTooltip>
            </WalletConsumptionSummary>
          </>
        )}
      </Accordion>
    )
  },
)

export const WalletAccordionSkeleton = () => {
  return (
    <SkeletonContainer>
      <SummaryLeft>
        <Icon name="chevron-right" color="disabled" />
        <Skeleton variant="connectorAvatar" size="big" />
        <SummaryInfos $isLoading>
          <Skeleton variant="text" height={12} width={240} marginBottom={theme.spacing(3)} />
          <Skeleton variant="text" height={12} width={120} />
        </SummaryInfos>
      </SummaryLeft>
    </SkeletonContainer>
  )
}

const SkeletonContainer = styled.div`
  border-radius: 12px;
  border: 1px solid ${theme.palette.grey[400]};
  padding: ${theme.spacing(4)};
`

const SummaryContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex: 1;
  align-items: center;
`

const SummaryLeft = styled.div`
  display: flex;
  align-items: center;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }
`

// const SummaryRight = styled.div`
//   min-width: 120px;
// `

const SummaryInfos = styled.div<{ $isLoading?: boolean }>`
  display: flex;
  flex-direction: column;
  min-width: 20px;

  > div:first-child {
    margin-bottom: ${({ $isLoading }) => ($isLoading ? theme.spacing(3) : 0)};
  }

  ${({ $isLoading }) =>
    $isLoading &&
    css`
      height: 40px;
      justify-content: flex-end;
    `}
`

const DetailSummary = styled.div`
  display: flex;
  padding: ${theme.spacing(6)} ${theme.spacing(4)};
  align-items: flex-end;
  box-shadow: ${theme.shadows[7]};

  > *:not(:last-child) {
    margin-right: ${theme.spacing(8)};
  }
`

const DetailSummaryBlock = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`

const DetailSummaryLine = styled.div<{ $alignBaseLine?: boolean }>`
  display: flex;
  align-items: center;
  align-items: ${({ $alignBaseLine }) => ($alignBaseLine ? 'baseline' : undefined)};

  > * {
    display: flex;
  }
`

const TextWithSideSpace = styled(Typography)`
  margin-right: ${theme.spacing(1)};
`

const WalletConsumptionSummary = styled(Typography)`
  height: 40px;
  padding: 0 ${theme.spacing(4)};
  display: flex;
  align-items: center;
  justify-content: flex-end;
`

const InlineTooltip = styled(Tooltip)`
  height: 16px;
`

const FreemiumWarningBlock = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing(4)};
  background-color: ${theme.palette.grey[100]};
  padding: ${theme.spacing(4)};
  border-top: 1px solid ${theme.palette.grey[400]};
  box-shadow: ${theme.shadows[7]};
`

WalletAccordion.displayName = 'WalletAccordion'
