import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { forwardRef } from 'react'
import styled, { css } from 'styled-components'

import {
  Accordion,
  Avatar,
  Icon,
  Skeleton,
  Status,
  StatusEnum,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { TimezoneDate } from '~/components/TimezoneDate'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { TimezoneEnum, WalletAccordionFragment, WalletStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { theme } from '~/styles'

import { TopupWalletDialogRef } from './TopupWalletDialog'
import { WalletTransactionList } from './WalletTransactionList'

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
  }
`

interface WalletAccordionProps {
  wallet: WalletAccordionFragment
  customerTimezone?: TimezoneEnum
}

const mapStatus = (type?: WalletStatusEnum | undefined) => {
  switch (type) {
    case WalletStatusEnum.Active:
      return {
        type: StatusEnum.running,
        label: 'text_62da6ec24a8e24e44f812874',
      }
    default:
      return {
        type: StatusEnum.error,
        label: 'text_62da6ec24a8e24e44f8128b0',
      }
  }
}

export const WalletAccordion = forwardRef<TopupWalletDialogRef, WalletAccordionProps>(
  ({ wallet, customerTimezone }: WalletAccordionProps, ref) => {
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
    } = wallet
    const { formatTimeOrgaTZ } = useOrganizationInfos()

    const statusMap = mapStatus(status)
    let [creditAmountUnit = '0', creditAmountCents = '00'] = String(creditsBalance).split('.')
    let [consumedCreditUnit = '0', consumedCreditCents = '00'] = String(consumedCredits).split('.')
    const { translate } = useInternationalization()
    const isWalletActive = status === WalletStatusEnum.Active
    // All active wallets should be opened by default on first render

    return (
      <Accordion
        noContentMargin
        transitionProps={{ unmountOnExit: false }}
        summary={
          <SummaryContainer>
            <SummaryLeft>
              <Avatar variant="connector">
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
            <SummaryRight>
              <Status type={statusMap.type} label={translate(statusMap.label)} />
            </SummaryRight>
          </SummaryContainer>
        }
      >
        {({ isOpen }) => (
          <>
            <DetailSummary>
              <DetailSummaryBlock>
                <DetailSummaryLine>
                  <TextWithSideSpace color="grey500">
                    {translate('text_62da6ec24a8e24e44f812876')}
                  </TextWithSideSpace>
                  <TooltipIcon
                    placement="bottom-start"
                    title={translate('text_62da6db136909f52c2704c40', {
                      date: formatTimeOrgaTZ(lastBalanceSyncAt || DateTime.now()),
                    })}
                  >
                    <Icon name="info-circle" />
                  </TooltipIcon>
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
                    variant="bodyHl"
                  >
                    .{creditAmountCents}
                  </TextWithSideSpace>
                  <Typography color={isWalletActive ? 'grey700' : 'grey600'} variant="bodyHl">
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

              <DetailSummaryBlock>
                <DetailSummaryLine>
                  <TextWithSideSpace color="grey500">
                    {translate('text_62da6ec24a8e24e44f812880')}
                  </TextWithSideSpace>
                  <TooltipIcon
                    placement="bottom-start"
                    title={translate('text_62da6db136909f52c2704c40', {
                      date: formatTimeOrgaTZ(lastConsumedCreditAt || DateTime.now()),
                    })}
                  >
                    <Icon name="info-circle" />
                  </TooltipIcon>
                </DetailSummaryLine>
                <DetailSummaryLine $alignBaseLine>
                  <Typography
                    color={isWalletActive ? 'grey700' : 'grey600'}
                    variant="subhead"
                    noWrap
                  >
                    {consumedCreditUnit}
                  </Typography>
                  <TextWithSideSpace
                    color={isWalletActive ? 'grey700' : 'grey600'}
                    variant="bodyHl"
                  >
                    .{consumedCreditCents}
                  </TextWithSideSpace>
                  <Typography color={isWalletActive ? 'grey700' : 'grey600'} variant="bodyHl">
                    {translate(
                      'text_62da6ec24a8e24e44f812884',
                      undefined,
                      Number(consumedCreditUnit) || 0,
                    )}
                  </Typography>
                </DetailSummaryLine>
                <DetailSummaryLine>
                  <Typography color="grey600" variant="caption">
                    {intlFormatNumber(deserializeAmount(consumedAmountCents, currency), {
                      currencyDisplay: 'symbol',
                      currency,
                    })}
                  </Typography>
                </DetailSummaryLine>
              </DetailSummaryBlock>

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
                      mainTypographyProps={{ variant: 'caption' }}
                      date={terminatedAt}
                      customerTimezone={customerTimezone}
                    />
                  ) : expirationAt ? (
                    <TimezoneDate
                      mainTypographyProps={{ variant: 'caption' }}
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

            <WalletTransactionList
              isOpen={isOpen}
              wallet={wallet}
              ref={ref}
              customerTimezone={customerTimezone}
            />
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
        <Skeleton variant="connectorAvatar" size="medium" />
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
const SummaryRight = styled.div`
  min-width: 120px;
`

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

  > *:not(:last-child) {
    margin-right: ${theme.spacing(8)};
  }
`

const TooltipIcon = styled(Tooltip)`
  height: 16px;
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

WalletAccordion.displayName = 'WalletAccordion'
