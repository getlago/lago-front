import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { DateTime } from 'luxon'
import styled, { css } from 'styled-components'

import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  SubscriptionLifetimeUsageForLifetimeUsageGraphFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { palette, theme } from '~/styles'

import { TGraphProps } from './types'

import { Skeleton, Typography } from '../designSystem'
import ChartHeader from '../designSystem/graphs/ChartHeader'
import { subscriptionLifetimeUsageFakeData } from '../designSystem/graphs/fixtures'
import InlineBarsChart from '../designSystem/graphs/InlineBarsChart'
import { GenericPlaceholder } from '../GenericPlaceholder'

export const LAST_USAGE_GRAPH_LINE_KEY_NAME = 'Others'

gql`
  fragment SubscriptionLifetimeUsageForLifetimeUsageGraph on Subscription {
    id
    lifetimeUsage {
      lastThresholdAmountCents
      nextThresholdAmountCents
      totalUsageAmountCents
      totalUsageFromDatetime
      totalUsageToDatetime
    }
  }
`

const GRAPH_COLORS = [
  theme.palette.primary[700],
  theme.palette.primary[400],
  theme.palette.primary[300],
  theme.palette.primary[200],
  theme.palette.grey[300],
]

export type TSubscriptionLifetimeUsageDataResult =
  SubscriptionLifetimeUsageForLifetimeUsageGraphFragment['lifetimeUsage']

const LifetimeUsage = ({
  demoMode,
  currency = CurrencyEnum.Usd,
  className,
  blur = false,
  forceLoading,
  hasError,
  data,
}: Partial<TGraphProps> & {
  hasError?: boolean
  data?: TSubscriptionLifetimeUsageDataResult
}) => {
  const { translate } = useInternationalization()
  const isLoading = forceLoading

  return (
    <Wrapper className={className}>
      {!!hasError ? (
        <Error
          title={translate('text_636d023ce11a9d038819b579')}
          subtitle={translate('text_636d023ce11a9d038819b57b')}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : (
        <>
          <ChartHeader
            name={translate('TODO: Total lifetime usage')}
            amount={intlFormatNumber(
              deserializeAmount(subscriptionLifetimeUsageFakeData?.totalUsageAmountCents, currency),
              {
                currency,
              },
            )}
            blur={blur}
            loading={isLoading}
          />

          <GraphContainer $blur={blur}>
            <GraphWrapper>
              {!!isLoading ? (
                <>
                  <Skeleton variant="text" width="100%" height={12} />

                  <div>
                    {[...Array(3)].map((_, index) => (
                      <SkeletonLine key={`usage-skeleton-${index}`}>
                        <Skeleton variant="circular" width={8} height={8} />
                        <Skeleton variant="text" width="32%" height={12} />
                        <Skeleton variant="text" width="32%" height={12} />
                      </SkeletonLine>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <InlineBarsChart
                    data={[
                      {
                        lastThresholdAmountCents: 1000,
                        nextThresholdAmountCents: 2000,
                      },
                    ]}
                    tooltipsData={[
                      { lastThresholdAmountCents: 'hello', nextThresholdAmountCents: 'world' },
                    ]}
                    colors={GRAPH_COLORS}
                  />
                  <Stack direction={'row'} justifyContent={'space-between'}>
                    <Typography variant="caption" color="grey600">
                      {translate('text_636d023ce11a9d038819b57d')}
                    </Typography>
                    <Typography variant="caption" color="grey600">
                      {translate('text_636d023ce11a9d038819b57d')}
                    </Typography>
                  </Stack>
                </>
              )}
            </GraphWrapper>
          </GraphContainer>
        </>
      )}
    </Wrapper>
  )
}

export default LifetimeUsage

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(6)};
  padding: ${theme.spacing(6)} 0;
  box-sizing: border-box;
  background-color: ${theme.palette.common.white};
`

const GraphContainer = styled.div<{ $blur: boolean }>`
  ${({ $blur }) =>
    $blur &&
    css`
      filter: blur(4px);
      pointer-events: none;
    `}
`

const GraphWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`

const SkeletonLine = styled.div`
  display: flex;
  align-items: center;
  height: 40px;
  gap: ${theme.spacing(2)};

  &:not(:last-child) {
    box-shadow: ${theme.shadows[7]};
  }

  > *:last-child {
    margin-left: auto;
  }
`

const Error = styled(GenericPlaceholder)`
  margin: 0;
  padding: 0;
`
