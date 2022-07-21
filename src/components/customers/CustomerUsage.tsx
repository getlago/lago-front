import { gql } from '@apollo/client'
import styled from 'styled-components'
import { DateTime } from 'luxon'

import { useCustomerUsageQuery } from '~/generated/graphql'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import EmptyImage from '~/public/images/maneki/empty.svg'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme, NAV_HEIGHT } from '~/styles'
import { Typography, Button, Skeleton, Avatar, Icon, Tooltip } from '~/components/designSystem'
import { intlFormatNumber } from '~/core/intlFormatNumber'

gql`
  query customerUsage($customerId: ID!) {
    customerUsage(customerId: $customerId) {
      amountCents
      totalAmountCurrency
      fromDate
      toDate
      chargesUsage {
        units
        amountCents
        amountCurrency
        billableMetric {
          id
          code
          name
        }
      }
    }
  }
`

interface CustomerUsageProps {
  id: string
}

export const CustomerUsage = ({ id }: CustomerUsageProps) => {
  const { translate } = useInternationalization()
  const { data, error, loading, refetch } = useCustomerUsageQuery({
    variables: { customerId: id },
    skip: !id,
    notifyOnNetworkStatusChange: true,
  })

  return !!error && !loading ? (
    <GenericPlaceholder
      title={translate('text_62c3f3fca8a1625624e83379')}
      subtitle={translate('text_62c3f3fca8a1625624e8337e')}
      buttonTitle={translate('text_62c3f3fca8a1625624e83382')}
      buttonVariant="primary"
      buttonAction={() => location.reload()}
      image={<ErrorImage width="136" height="104" />}
    />
  ) : !loading && !data?.customerUsage?.chargesUsage?.length ? (
    <GenericPlaceholder
      title={translate('text_62c3f454e5d7f4ec8888c1d5')}
      subtitle={translate('text_62c3f454e5d7f4ec8888c1d7')}
      image={<EmptyImage width="136" height="104" />}
    />
  ) : (
    <div>
      <Header>
        <Title variant="subhead">{translate('text_62c3f3fca8a1625624e8337b')}</Title>
        <Tooltip placement="top-end" title={translate('text_62c3f3fca8a1625624e83375')}>
          <Button
            variant="quaternary"
            disabled={!data && loading}
            onClick={async () => {
              await refetch()
            }}
            icon="reload"
          ></Button>
        </Tooltip>
      </Header>
      <Header>
        {loading ? (
          <>
            <MainInfos>
              <Skeleton variant="connectorAvatar" size="medium" />
              <Skeleton variant="text" height={12} width={144} />
            </MainInfos>
            <Skeleton variant="text" height={12} width={96} />
          </>
        ) : (
          <>
            <MainInfos>
              <Avatar variant="connector">
                <Icon name="pulse" color="dark" />
              </Avatar>
              <Block>
                <Typography variant="bodyHl" color="textSecondary" noWrap>
                  {translate('text_62c3f3fca8a1625624e83380')}
                </Typography>
                <Typography variant="caption" noWrap>
                  {translate('text_62c3f3fca8a1625624e83383', {
                    fromDate: DateTime.fromISO(data?.customerUsage?.fromDate).toFormat(
                      'LLL. dd yyyy'
                    ),
                    toDate: DateTime.fromISO(data?.customerUsage?.toDate).toFormat('LLL. dd yyyy'),
                  })}
                </Typography>
              </Block>
            </MainInfos>
            <Typography color="textSecondary">
              {intlFormatNumber(data?.customerUsage?.amountCents || 0, {
                currencyDisplay: 'code',
                currency: data?.customerUsage?.totalAmountCurrency,
              })}
            </Typography>
          </>
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
              const { billableMetric, units, amountCents, amountCurrency } = usage

              return (
                <ItemContainer key={`customer-usage-${i}`}>
                  <Typography variant="bodyHl" color="textSecondary">
                    {billableMetric?.name}
                  </Typography>
                  <UsageSubtitle variant="caption">{billableMetric?.code}</UsageSubtitle>
                  <Line>
                    <Typography variant="caption">
                      {translate('text_62c3f3fca8a1625624e8338d', { units })}
                    </Typography>
                    <Typography color="textSecondary">
                      {intlFormatNumber(amountCents || 0, {
                        currencyDisplay: 'code',
                        currency: amountCurrency,
                      })}
                    </Typography>
                  </Line>
                </ItemContainer>
              )
            })}
      </UsageLogContainer>
    </div>
  )
}

const Header = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
`

const Title = styled(Typography)`
  margin-right: ${theme.spacing(3)};
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

  &:after {
    content: '';
    box-shadow: ${theme.shadows[7]};
    width: 100%;
    display: inline-block;
  }
`

const ItemContainer = styled.div`
  padding: ${theme.spacing(6)} ${theme.spacing(4)};
  min-width: 250px;
  box-sizing: border-box;
  background-color: ${theme.palette.background.default};
  flex: 1;
`

const Line = styled.div`
  justify-content: space-between;
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
    white-space: pre;
  }
`

const UsageSubtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
  min-width: 0;
`
