import { forwardRef, useState } from 'react'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import styled, { css } from 'styled-components'
import { DateTime } from 'luxon'
import { gql } from '@apollo/client'

import { NAV_HEIGHT, theme } from '~/styles'
import {
  Avatar,
  Button,
  Icon,
  Skeleton,
  Status,
  StatusEnum,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { WalletAccordionFragment, WalletStatusEnum } from '~/generated/graphql'
import { intlFormatNumber } from '~/core/intlFormatNumber'

import { WalletTransactionList } from './WalletTransactionList'
import { TopupWalletDialogRef } from './TopupWalletDialog'

gql`
  fragment WalletAccordion on Wallet {
    id
    balance
    consumedAmount
    consumedCredits
    createdAt
    creditsBalance
    currency
    expirationDate
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
  ({ wallet }: WalletAccordionProps, ref) => {
    const {
      balance,
      consumedAmount,
      consumedCredits,
      createdAt,
      creditsBalance,
      currency,
      expirationDate,
      lastBalanceSyncAt,
      lastConsumedCreditAt,
      name,
      rateAmount,
      status,
      terminatedAt,
    } = wallet

    const statusMap = mapStatus(status)
    let [creditAmountUnit = '0', creditAmountCents = '00'] = creditsBalance.split('.')
    let [consumedCreditUnit = '0', consumedCreditCents = '00'] = consumedCredits.split('.')
    const { translate } = useInternationalization()
    const isWalletActive = status === WalletStatusEnum.Active
    // All active wallets should be opened by default on first render
    const [isOpen, setIsOpen] = useState(isWalletActive)

    return (
      <Container>
        <StyledAccordion
          expanded={isOpen}
          onChange={(_, expanded) => {
            setIsOpen(expanded)
          }}
          square
        >
          <Summary $isOpen={isOpen}>
            <SummaryLeft>
              <Button
                variant="quaternary"
                size="small"
                icon={isOpen ? 'chevron-down' : 'chevron-right'}
              />
              <Avatar variant="connector">
                <Icon name="wallet" color="dark" />
              </Avatar>
              <SummaryInfos>
                <Typography variant="bodyHl" color="grey700">
                  {name
                    ? name
                    : translate('text_62da6ec24a8e24e44f8128b2', {
                        createdAt: DateTime.fromISO(createdAt).toFormat('LLL. dd, yyyy'),
                      })}
                </Typography>
                <Typography variant="caption">
                  {translate('text_62da6ec24a8e24e44f812872', {
                    rateAmount: rateAmount,
                    currency: currency,
                  })}
                </Typography>
              </SummaryInfos>
            </SummaryLeft>
            <SummaryRight>
              <Status type={statusMap.type} label={translate(statusMap.label)} />
            </SummaryRight>
          </Summary>

          <Details>
            <DetailSummary>
              <DetailSummaryBlock>
                <DetailSummaryLine>
                  <TextWithSideSpace color="grey500">
                    {translate('text_62da6ec24a8e24e44f812876')}
                  </TextWithSideSpace>
                  <TooltipIcon
                    placement="bottom-start"
                    title={translate('text_62da6db136909f52c2704c40', {
                      date: DateTime.fromISO(lastBalanceSyncAt || DateTime.now()).toFormat(
                        'LLL. dd, yyyy'
                      ),
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
                      Number(creditAmountUnit) || 0
                    )}
                  </Typography>
                </DetailSummaryLine>
                <DetailSummaryLine>
                  <Typography color="grey600" variant="caption">
                    {intlFormatNumber(Number(balance), {
                      currencyDisplay: 'code',
                      initialUnit: 'standard',
                      maximumFractionDigits: 2,
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
                      date: DateTime.fromISO(lastConsumedCreditAt || DateTime.now()).toFormat(
                        'LLL. dd, yyyy'
                      ),
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
                      Number(consumedCreditUnit) || 0
                    )}
                  </Typography>
                </DetailSummaryLine>
                <DetailSummaryLine>
                  <Typography color="grey600" variant="caption">
                    {intlFormatNumber(Number(consumedAmount), {
                      currencyDisplay: 'code',
                      initialUnit: 'standard',
                      maximumFractionDigits: 2,
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
                  <Typography color="grey700" variant="caption">
                    {!isWalletActive
                      ? DateTime.fromISO(terminatedAt).toFormat('LLL. dd, yyyy')
                      : expirationDate
                      ? DateTime.fromISO(expirationDate).toFormat('LLL. dd, yyyy')
                      : translate('text_62da6ec24a8e24e44f81288c')}
                  </Typography>
                </DetailSummaryLine>
              </DetailSummaryBlock>
            </DetailSummary>

            <WalletTransactionList isOpen={isOpen} wallet={wallet} ref={ref} />
          </Details>
        </StyledAccordion>
      </Container>
    )
  }
)

export const WalletAccordionSkeleton = () => {
  return (
    <Container>
      <Summary disabled>
        <SummaryLeft>
          <Icon name="chevron-right" color="disabled" />
          <Skeleton variant="connectorAvatar" size="medium" />
          <SummaryInfos $isLoading>
            <Skeleton variant="text" height={12} width={240} marginBottom={theme.spacing(3)} />
            <Skeleton variant="text" height={12} width={120} />
          </SummaryInfos>
        </SummaryLeft>
      </Summary>
    </Container>
  )
}

const Container = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;
  margin-bottom: ${theme.spacing(4)};
`

const StyledAccordion = styled(Accordion)`
  border-radius: 12px;
  overflow: hidden;

  &.MuiAccordionDetails-root {
    margin: ${theme.spacing(3)} ${theme.spacing(4)} 0 ${theme.spacing(4)};
  }
`

const Summary = styled(AccordionSummary)<{ $isOpen?: boolean }>`
  min-height: ${NAV_HEIGHT}px;
  box-shadow: ${({ $isOpen }) => ($isOpen ? theme.shadows[7] : undefined)};

  border-radius: ${({ $isOpen }) => ($isOpen ? '12px 12px 0 0' : '12px')};

  &.Mui-disabled {
    opacity: 1;
  }

  .MuiAccordionSummary-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${theme.spacing(3)} ${theme.spacing(4)} ${theme.spacing(3)} ${theme.spacing(4)};

    &:hover {
      background-color: ${theme.palette.grey[100]};
    }

    > *:first-child {
      margin-right: ${theme.spacing(4)};
    }
  }
`

const SummaryLeft = styled.div`
  display: flex;
  align-items: center;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }
`
const SummaryRight = styled.div`
  text-align: left;
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

const Details = styled(AccordionDetails)`
  display: flex;
  flex-direction: column;

  &.MuiAccordionDetails-root {
    > *:not(:last-child) {
      box-shadow: ${theme.shadows[7]};
    }
  }
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
