import { gql } from '@apollo/client'
import styled from 'styled-components'
import { useNavigate, generatePath } from 'react-router-dom'

import { Typography, Button, InfiniteScroll } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { useI18nContext } from '~/core/I18nContext'
import { theme, PageHeader, ListHeader, ListContainer } from '~/styles'
import { CREATE_BILLABLE_METRIC_ROUTE, UPDATE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import { useBillableMetricsQuery, BillableMetricItemFragmentDoc } from '~/generated/graphql'
import EmojiError from '~/public/images/exploding-head.png'
import EmojiEmpty from '~/public/images/spider-web.png'
import {
  BillableMetricItem,
  BillableMetricItemSkeleton,
} from '~/components/billableMetrics/BillableMetricItem'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'

gql`
  query billableMetrics($page: Int, $limit: Int) {
    billableMetrics(page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        ...BillableMetricItem
      }
    }
  }

  ${BillableMetricItemFragmentDoc}
`

const BillableMetricsList = () => {
  const { translate } = useI18nContext()
  let navigate = useNavigate()
  const { data, error, loading, fetchMore } = useBillableMetricsQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
  })
  const list = data?.billableMetrics?.collection || []
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `billable-metric-item-${i}`,
    navigate: (id) => navigate(generatePath(UPDATE_BILLABLE_METRIC_ROUTE, { id: String(id) })),
  })
  let index = -1

  return (
    <div role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <Header $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_623b497ad05b960101be3438')}
        </Typography>
        <StyledButton onClick={() => navigate(CREATE_BILLABLE_METRIC_ROUTE)}>
          {translate('text_623b497ad05b960101be343a')}
        </StyledButton>
      </Header>

      {!loading && !!error ? (
        <GenericPlaceholder
          title={translate('text_623b53fea66c76017eaebb6e')}
          subtitle={translate('text_623b53fea66c76017eaebb76')}
          buttonTitle={translate('text_623b53fea66c76017eaebb7a')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<img src={EmojiError} alt="error-emoji" />}
        />
      ) : !loading && (!list || !list.length) ? (
        <GenericPlaceholder
          title={translate('text_623b53fea66c76017eaebb70')}
          subtitle={translate('text_623b53fea66c76017eaebb78')}
          buttonTitle={translate('text_623b53fea66c76017eaebb7c')}
          buttonVariant="primary"
          buttonAction={() => navigate(CREATE_BILLABLE_METRIC_ROUTE)}
          image={<img src={EmojiEmpty} alt="empty-emoji" />}
        />
      ) : (
        <ListContainer>
          <ListHead $withActions>
            <Typography color="disabled" variant="bodyHl">
              {translate('text_623b497ad05b960101be343e')}
            </Typography>
            <CellSmall align="right" color="disabled" variant="bodyHl">
              {translate('text_623b497ad05b960101be3440')}
            </CellSmall>
          </ListHead>
          <InfiniteScroll
            onBottom={() => {
              const { currentPage = 0, totalPages = 0 } = data?.billableMetrics?.metadata || {}

              currentPage < totalPages &&
                !loading &&
                fetchMore({
                  variables: { page: currentPage + 1 },
                })
            }}
          >
            {!!list &&
              list.map((billableMetric) => {
                index += 1

                return (
                  <BillableMetricItem
                    key={billableMetric.id}
                    billableMetric={billableMetric}
                    navigationProps={{
                      id: `billable-metric-item-${index}`,
                      'data-id': billableMetric.id,
                    }}
                  />
                )
              })}
            {loading &&
              [0, 1, 2].map((i) => (
                <BillableMetricItemSkeleton key={`billable-metric-item-skeleton-${i}`} />
              ))}
          </InfiniteScroll>
        </ListContainer>
      )}
    </div>
  )
}

const Header = styled(PageHeader)`
  > * {
    white-space: pre;

    &:first-child {
      margin-right: ${theme.spacing(4)};
    }
  }
`

const ListHead = styled(ListHeader)`
  > *:first-child {
    flex: 1;
  }
  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};
  }
`

const CellSmall = styled(Typography)`
  width: 112px;
`

const StyledButton = styled(Button)`
  min-width: 179px;
`

export default BillableMetricsList
