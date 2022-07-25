import { useState } from 'react'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import styled, { css } from 'styled-components'
import { DateTime } from 'luxon'
import { gql } from '@apollo/client'

import { theme } from '~/styles'
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

gql`
  fragment WalletAccordion on Wallet {
    id
    balance
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

export const WalletAccordion = ({ wallet }: WalletAccordionProps) => {
  const {
    balance,
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
  } = wallet

  const statusMap = mapStatus(status)
  let [creditAmountUnit = '0', creditAmountCents = '00'] = creditsBalance.split('.')
  let [consumerCreditUnit = '0', consumerCreditCents = '00'] = consumedCredits.split('.')
  const { translate } = useInternationalization()
  // All active wallets should be opened by default on first render
  const [isOpen, setIsOpen] = useState(status === WalletStatusEnum.Active)

  return (
    <Container>
      <StyledAccordion expanded={isOpen} onChange={(_, expanded) => setIsOpen(expanded)} square>
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
              <Typography variant="bodyHl">
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
                    date: DateTime.fromISO(lastBalanceSyncAt).toFormat('LLL. dd, yyyy'),
                  })}
                >
                  <Icon name="info-circle" />
                </TooltipIcon>
              </DetailSummaryLine>
              <DetailSummaryLine>
                <Typography color="grey700" variant="subhead">
                  {creditAmountUnit}
                </Typography>
                <TextWithSideSpace color="grey700" variant="bodyHl">
                  .{creditAmountCents}
                </TextWithSideSpace>
                <Typography color="grey700" variant="bodyHl">
                  {translate(
                    'text_62da6ec24a8e24e44f81287a',
                    undefined,
                    Math.max(Number(creditAmountUnit) || Number(creditAmountCents))
                  )}
                </Typography>
              </DetailSummaryLine>
              <DetailSummaryLine>
                <TextWithSideSpace color="grey600" variant="caption">
                  {currency}
                </TextWithSideSpace>
                <Typography color="grey600" variant="caption">
                  {balance}
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
                    date: DateTime.fromISO(lastConsumedCreditAt).toFormat('LLL. dd, yyyy'),
                  })}
                >
                  <Icon name="info-circle" />
                </TooltipIcon>
              </DetailSummaryLine>
              <DetailSummaryLine>
                <Typography color="grey700" variant="subhead">
                  {consumerCreditUnit}
                </Typography>
                <TextWithSideSpace color="grey700" variant="bodyHl">
                  .{consumerCreditCents}
                </TextWithSideSpace>
                <Typography color="grey700" variant="bodyHl">
                  {translate(
                    'text_62da6ec24a8e24e44f812884',
                    undefined,
                    Math.max(Number(consumerCreditUnit) || Number(consumerCreditCents))
                  )}
                </Typography>
              </DetailSummaryLine>
              <DetailSummaryLine>
                <TextWithSideSpace color="grey600" variant="caption">
                  {currency}
                </TextWithSideSpace>
                <Typography color="grey600" variant="caption">
                  TODO: Wait for the new attribut consumed_balance from backend
                </Typography>
              </DetailSummaryLine>
            </DetailSummaryBlock>

            <DetailSummaryBlock>
              <DetailSummaryLine>
                <Typography color="grey500" variant="captionHl">
                  {translate('text_62da6ec24a8e24e44f81288a')}
                </Typography>
              </DetailSummaryLine>
              <DetailSummaryLine>
                <Typography color="grey700" variant="caption">
                  {expirationDate
                    ? DateTime.fromISO(expirationDate).toFormat('LLL. dd, yyyy')
                    : translate('text_62da6ec24a8e24e44f81288c')}
                </Typography>
              </DetailSummaryLine>
            </DetailSummaryBlock>
          </DetailSummary>

          <TransactionListHeader>
            <Typography variant="bodyHl" color="grey500">
              {translate('text_62da6ec24a8e24e44f81288e')}
            </Typography>
            <Typography variant="bodyHl" color="grey500">
              {translate('text_62da6ec24a8e24e44f812890')}
            </Typography>
          </TransactionListHeader>

          <TransactionList>TODO</TransactionList>

          <Loadmore>
            <Button variant="quaternary">
              <Typography variant="body" color="grey600">
                {translate('text_62da6ec24a8e24e44f8128aa')}
              </Typography>
            </Button>
          </Loadmore>
        </Details>
      </StyledAccordion>
    </Container>
  )
}

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

  &.MuiAccordionDetails-root {
    margin: ${theme.spacing(3)} ${theme.spacing(4)} 0 ${theme.spacing(4)};
  }
`

const Summary = styled(AccordionSummary)<{ $isOpen?: boolean }>`
  height: 72px;
  box-shadow: ${({ $isOpen }) => ($isOpen ? theme.shadows[7] : undefined)};

  &.Mui-disabled {
    opacity: 1;
  }

  .MuiAccordionSummary-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${theme.spacing(3)} ${theme.spacing(4)} ${theme.spacing(3)} ${theme.spacing(4)};

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

const DetailSummaryLine = styled.div`
  display: flex;
  align-items: center;

  > * {
    display: flex;
  }
`

const TextWithSideSpace = styled(Typography)`
  margin-right: ${theme.spacing(1)};
`

const TransactionListHeader = styled.div`
  display: flex;
  padding: 10px ${theme.spacing(4)};
  justify-content: space-between;
`

const TransactionList = styled.div`
  > *:not(:last-child) {
    box-shadow: ${theme.shadows[7]};
  }
`

const Loadmore = styled.div`
  margin: ${theme.spacing(1)} auto;
`
