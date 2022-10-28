import { useRef, useState } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { DateTime } from 'luxon'

import { CustomerUsageSubscriptionFragment, useCustomerUsageLazyQuery } from '~/generated/graphql'
import { Skeleton, Icon, Button, Tooltip, Avatar, Typography } from '~/components/designSystem'
import { theme, NAV_HEIGHT } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import EmptyImage from '~/public/images/maneki/empty.svg'
import { intlFormatNumber } from '~/core/intlFormatNumber'

import {
  CustomerBMUsageDetailDrawer,
  CustomerBMUsageDetailDrawerRef,
} from './CustomerBMUsageDetailDrawer'

gql`
  query customerUsage($customerId: ID!, $subscriptionId: ID!) {
    customerUsage(customerId: $customerId, subscriptionId: $subscriptionId) {
      amountCents
      amountCurrency
      fromDate
      toDate
      chargesUsage {
        units
        amountCents
        billableMetric {
          id
          code
          name
        }
      }
    }
  }
`

interface UsageItemProps {
  customerId: string
  subscription: CustomerUsageSubscriptionFragment
}

export const UsageItem = ({ customerId, subscription }: UsageItemProps) => {
  const { id, name, plan } = subscription
  const [isOpen, setIsOpen] = useState(false)
  const { translate } = useInternationalization()
  const customerBMUsageDetailDrawerRef = useRef<CustomerBMUsageDetailDrawerRef>(null)
  const [fetchUsage, { data, error, loading, refetch }] = useCustomerUsageLazyQuery({
    variables: { customerId: customerId, subscriptionId: id },
  })
  const currency = data?.customerUsage?.amountCurrency

  return (
    <Container>
      <StyledAccordion
        expanded={isOpen}
        onChange={(_, expanded) => {
          fetchUsage()
          setIsOpen(expanded)
        }}
        square
      >
        <Summary>
          <Tooltip
            placement="top-start"
            title={translate(
              isOpen ? 'text_62d7f6178ec94cd09370e4cd' : 'text_62d7f6178ec94cd09370e60d'
            )}
          >
            <Button
              variant="quaternary"
              size="small"
              icon={isOpen ? 'chevron-down' : 'chevron-right'}
            />
          </Tooltip>
          <StyledAvatar variant="connector">
            <Icon name="pulse" color="dark" />
          </StyledAvatar>
          <Title>
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {name || plan?.name}
            </Typography>
            <Typography variant="caption" noWrap>
              {plan?.code}
            </Typography>
          </Title>
          <Tooltip placement="top-start" title={translate('text_62d7f6178ec94cd09370e4b3')}>
            <Button
              variant="quaternary"
              icon="reload"
              size="small"
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()

                await refetch()
              }}
            />
          </Tooltip>
        </Summary>
        <Details>
          {!!error && !loading ? (
            <GenericPlaceholder
              title={translate('text_62c3f3fca8a1625624e83379')}
              subtitle={translate('text_62c3f3fca8a1625624e8337e')}
              buttonTitle={translate('text_62c3f3fca8a1625624e83382')}
              buttonVariant="primary"
              buttonAction={() => location.reload()}
              image={<ErrorImage width="136" height="104" />}
            />
          ) : !loading && !data ? (
            <GenericPlaceholder
              title={translate('text_62c3f454e5d7f4ec8888c1d5')}
              subtitle={translate('text_62c3f454e5d7f4ec8888c1d7')}
              image={<EmptyImage width="136" height="104" />}
            />
          ) : (
            <div>
              <Header>
                {loading ? (
                  <UsageHeader $hasCharge>
                    <MainInfos>
                      <Block>
                        <Skeleton variant="text" height={12} width={144} marginBottom="12px" />
                        <Skeleton variant="text" height={12} width={88} />
                      </Block>
                    </MainInfos>
                    <Skeleton variant="text" height={12} width={96} />
                  </UsageHeader>
                ) : (
                  <UsageHeader $hasCharge={!!data?.customerUsage?.chargesUsage?.length}>
                    <MainInfos>
                      <Block>
                        <Typography variant="bodyHl" color="textSecondary" noWrap>
                          {translate('text_62c3f3fca8a1625624e83380')}
                        </Typography>
                        <Typography variant="caption" noWrap>
                          {translate('text_62c3f3fca8a1625624e83383', {
                            fromDate: DateTime.fromISO(data?.customerUsage?.fromDate).toFormat(
                              'LLL. dd yyyy'
                            ),
                            toDate: DateTime.fromISO(data?.customerUsage?.toDate).toFormat(
                              'LLL. dd yyyy'
                            ),
                          })}
                        </Typography>
                      </Block>
                    </MainInfos>
                    <Typography color="textSecondary">
                      {intlFormatNumber(data?.customerUsage?.amountCents || 0, {
                        currencyDisplay: 'symbol',
                        currency,
                      })}
                    </Typography>
                  </UsageHeader>
                )}
              </Header>
              <UsageLogContainer>
                {loading
                  ? [0, 1, 2, 3].map((i) => {
                      return (
                        <ItemContainer key={`customer-usage-skeleton-${i}`}>
                          <Skeleton variant="text" height={12} width={120} marginBottom="12px" />
                          <Skeleton variant="text" height={12} width={80} marginBottom="44px" />
                          <Line>
                            <Skeleton variant="text" height={12} width={80} marginRight="16px" />
                            <Skeleton variant="text" height={12} width={120} />
                          </Line>
                        </ItemContainer>
                      )
                    })
                  : data?.customerUsage?.chargesUsage?.map((usage, i) => {
                      const { billableMetric, units, amountCents } = usage

                      return (
                        <ItemContainer key={`customer-usage-${i}`}>
                          <BillableMetricHeaderLine>
                            <div>
                              <Typography variant="bodyHl" color="textSecondary">
                                {billableMetric?.name}
                              </Typography>
                              <UsageSubtitle variant="caption">
                                {billableMetric?.code}
                              </UsageSubtitle>
                            </div>
                            <Tooltip title={translate('TODO:')} placement="top-end">
                              <Button
                                icon="info-circle"
                                size="small"
                                variant="secondary"
                                onClick={() => {
                                  customerBMUsageDetailDrawerRef.current?.openDrawer(
                                    billableMetric.id
                                  )
                                }}
                              />
                            </Tooltip>
                          </BillableMetricHeaderLine>
                          <Line>
                            <Typography variant="caption">
                              {translate('text_62c3f3fca8a1625624e8338d', { units })}
                            </Typography>
                            <Typography color="textSecondary">
                              {intlFormatNumber(amountCents || 0, {
                                currencyDisplay: 'symbol',
                                currency,
                              })}
                            </Typography>
                          </Line>
                        </ItemContainer>
                      )
                    })}
              </UsageLogContainer>
            </div>
          )}
        </Details>
      </StyledAccordion>

      <CustomerBMUsageDetailDrawer ref={customerBMUsageDetailDrawerRef} />
    </Container>
  )
}

export const UsageItemSkeleton = () => {
  return (
    <SkeletonItem>
      <Button size="small" variant="quaternary" disabled icon="chevron-right" />
      <Skeleton variant="connectorAvatar" size="medium" marginRight="12px" />
      <div>
        <Skeleton variant="text" width={240} height={12} marginBottom="12px" />
        <Skeleton variant="text" width={120} height={12} />
      </div>
    </SkeletonItem>
  )
}

const SkeletonItem = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  height: ${NAV_HEIGHT}px;
  align-items: center;
  display: flex;
  padding: 0 ${theme.spacing(4)};
  border-radius: 12px;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const Container = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;
`

const StyledAccordion = styled(Accordion)`
  border-radius: 12px;
  overflow: hidden;

  &.MuiAccordion-root.MuiPaper-root {
    border-radius: 12px;
    background-color: transparent;
  }
  &.MuiAccordion-root:before {
    height: 0;
  }
  &.MuiAccordion-root.Mui-expanded {
    margin: 0;
  }

  .MuiAccordionSummary-content {
    width: 100%;
  }
`

const Summary = styled(AccordionSummary)`
  && {
    height: ${NAV_HEIGHT}px;
    border-radius: 12px;

    &.MuiAccordionSummary-root.Mui-focused {
      border-radius: 12px;
    }

    .MuiAccordionSummary-content {
      height: ${NAV_HEIGHT}px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      padding: ${theme.spacing(4)};

      &:hover {
        background-color: ${theme.palette.grey[100]};
      }

      > *:first-child {
        margin-right: ${theme.spacing(3)};
      }
    }
  }
`

const StyledAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(3)};
`

const Title = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: auto;
  min-width: 20px;
`

const Details = styled(AccordionDetails)`
  display: flex;
  flex-direction: column;

  &.MuiAccordionDetails-root {
    padding: 0;

    > *:not(:last-child) {
      margin-bottom: ${theme.spacing(6)};
    }
  }
`

const Block = styled.div`
  min-width: 0;
  margin-right: ${theme.spacing(3)};
`

const MainInfos = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const UsageLogContainer = styled.div`
  flex-wrap: wrap;
  display: flex;
  gap: 1px;
  background-color: ${theme.palette.grey[300]};
  overflow: hidden;
  border-radius: 12px;
`

const ItemContainer = styled.div`
  padding: ${theme.spacing(4)};
  min-width: 300px;
  box-sizing: border-box;
  background-color: ${theme.palette.background.default};
  flex: 1;

  ${theme.breakpoints.down('md')} {
    min-width: 180px;
  }
`

const Line = styled.div`
  justify-content: space-between;
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
    white-space: pre;
  }
`

const BillableMetricHeaderLine = styled.div`
  justify-content: space-between;
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: ${theme.spacing(8)};
`

const UsageSubtitle = styled(Typography)`
  min-width: 0;
`

const Header = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[5]};
`

const UsageHeader = styled.div<{ $hasCharge?: boolean }>`
  display: flex;
  height: ${NAV_HEIGHT}px;
  padding: 0 ${theme.spacing(4)};
  align-items: center;
  width: 100%;
  box-shadow: ${({ $hasCharge }) => ($hasCharge ? theme.shadows[7] : 'none')};

  > *:first-child {
    margin-right: auto;
  }
`
