import { useState } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { DateTime } from 'luxon'

import { useUserUsageQuery, AggregationTypeEnum } from '~/generated/graphql'
import { theme, Card, HEADER_TABLE_HEIGHT, NAV_HEIGHT } from '~/styles'
import { Button, Typography, Avatar, Icon, Skeleton } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { formatAmountToCurrency } from '~/core/currencyTool'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import EmojiError from '~/public/images/exploding-head.png'

gql`
  query userUsage($customerId: ID!) {
    forecast(customerId: $customerId) {
      fromDate
      toDate
      amountCents
      amountCurrency
      totalAmountCents
      totalAmountCurrency
      fees {
        billableMetricCode
        aggregationType
        units
      }
    }
  }
`

interface CustomerUsageProps {
  customerId: string
}

const AggregationTypeTradKeys = {
  [AggregationTypeEnum.CountAgg]: 'text_623c4a8c599213014cacc9de',
  [AggregationTypeEnum.UniqueCountAgg]: 'text_62694d9181be8d00a33f20f0',
  [AggregationTypeEnum.MaxAgg]: 'text_62694d9181be8d00a33f20f8',
  [AggregationTypeEnum.SumAgg]: 'text_62694d9181be8d00a33f2100',
}

export const CustomerUsage = ({ customerId }: CustomerUsageProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { data, loading, error, refetch } = useUserUsageQuery({
    variables: { customerId },
    notifyOnNetworkStatusChange: true,
  })
  const { translate } = useI18nContext()

  const {
    fromDate,
    toDate,
    amountCents,
    amountCurrency,
    totalAmountCents,
    totalAmountCurrency,
    fees,
  } = data?.forecast || {}

  return !loading && !!error ? (
    <ErrorContainer $disableChildSpacing>
      <GenericPlaceholder
        title={translate('text_629f47b883ba2301048a393a')}
        subtitle={translate('text_629f47b883ba2301048a393c')}
        buttonTitle={translate('text_629f47b883ba2301048a393e')}
        buttonVariant="primary"
        buttonAction={async () => {
          await refetch()
        }}
        image={<img src={EmojiError} alt="error-emoji" />}
        noMargins
      />
    </ErrorContainer>
  ) : (
    <Container $disableChildSpacing>
      <Header>
        <div>
          {loading ? (
            <>
              <Skeleton variant="text" width={96} height={12} marginBottom="16px" />
              <Skeleton variant="text" width="100%" height={12} />
            </>
          ) : (
            <>
              <Typography variant="caption">
                {translate('text_6298bd525e359200d5ea01ad', {
                  fromDate: DateTime.fromISO(fromDate).toFormat('LLL. dd'),
                  toDate: DateTime.fromISO(toDate).toFormat('LLL. dd'),
                })}
              </Typography>
              <Typography variant="subhead">
                {formatAmountToCurrency(amountCents || 0, {
                  currencyDisplay: 'code',
                  currency: amountCurrency,
                })}
              </Typography>
            </>
          )}
        </div>
        <div>
          {loading ? (
            <>
              <Skeleton variant="text" width={96} height={12} marginBottom="16px" />
              <Skeleton variant="text" width="100%" height={12} />
            </>
          ) : (
            <>
              <Typography variant="caption">
                {translate('text_6298bd525e359200d5ea01c9')}
              </Typography>
              <Typography variant="subhead">
                {formatAmountToCurrency(totalAmountCents || 0, {
                  currencyDisplay: 'code',
                  currency: totalAmountCurrency,
                })}
              </Typography>
            </>
          )}
        </div>
      </Header>
      {!loading && (
        <Content $visible={isOpen}>
          <ListHeader>
            <Typography variant="bodyHl" color="disabled">
              {translate('text_6298bd525e359200d5ea01ec')}
            </Typography>
            <Typography variant="bodyHl" color="disabled">
              {translate('text_6298bd525e359200d5ea01f8', {
                fromDate: DateTime.fromISO(fromDate).toFormat('LLL. dd'),
              })}
            </Typography>
          </ListHeader>
          {(fees || []).map((fee, index) => {
            const { billableMetricCode, aggregationType, units } = fee

            return (
              <Item key={`fee-item-${index}`}>
                <ItemInfos>
                  <Avatar variant="connector">
                    <Icon name="pulse" color="dark" />
                  </Avatar>
                  <NameBlock>
                    <Typography color="textSecondary" variant="bodyHl" noWrap>
                      {billableMetricCode}
                    </Typography>
                    <Typography variant="caption" noWrap>
                      {translate(AggregationTypeTradKeys[aggregationType])}
                    </Typography>
                  </NameBlock>
                </ItemInfos>
                <Typography noWrap>
                  {translate('text_6298bd525e359200d5ea021c', { unitCount: units })}
                </Typography>
              </Item>
            )
          })}
        </Content>
      )}
      <Footer>
        {loading ? (
          <Skeleton variant="text" width={200} height={12} />
        ) : (
          <Button
            disabled={loading || !!error}
            variant="quaternary"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {translate(isOpen ? 'text_6298bd525e359200d5ea026e' : 'text_6298bd525e359200d5ea01e2')}
          </Button>
        )}
      </Footer>
    </Container>
  )
}

const Container = styled(Card)`
  padding: 0;
  margin-top: ${theme.spacing(6)};
`

const ErrorContainer = styled(Card)`
  margin-top: ${theme.spacing(6)};
  padding: ${theme.spacing(8)} ${theme.spacing(22)};

  && > * {
    img {
      margin-bottom: ${theme.spacing(5)};
    }

    *:not(img):not(:last-child) {
      margin-bottom: ${theme.spacing(3)};
    }
  }
`

const Header = styled.div`
  padding: ${theme.spacing(8)};
  box-shadow: ${theme.shadows[7]};
  display: flex;

  > * {
    flex: 1;

    &:first-child {
      margin-right: ${theme.spacing(6)};
    }
  }
`

const Content = styled.div<{ $visible: boolean }>`
  box-shadow: ${theme.shadows[7]};
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  max-height: ${({ $visible }) => ($visible ? '1000px' : '0px')};
  overflow: hidden;
`

const ListHeader = styled.div`
  padding: 0 ${theme.spacing(6)};
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${theme.shadows[7]};
`

const Item = styled.div`
  height: ${NAV_HEIGHT}px;
  padding: 0 ${theme.spacing(6)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${theme.shadows[7]};
`

const ItemInfos = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  margin-right: ${theme.spacing(6)};

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }

  > *:last-child {
    margin-right: ${theme.spacing(6)};
  }
`

const NameBlock = styled.div`
  min-width: 0;
  margin-right: ${theme.spacing(6)};
`

const Footer = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: center;
`
