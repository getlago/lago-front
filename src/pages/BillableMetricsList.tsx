import { gql } from '@apollo/client'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'

import { Typography, Button } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { useI18nContext } from '~/core/I18nContext'
import { theme, PageHeader, ListHeader } from '~/styles'
import { CREATE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import {
  useBillableMetricsQuery,
  BillableMetricItemFragmentDoc,
  DeleteBillableMetricDialogFragmentDoc,
} from '~/generated/graphql'
import EmojiError from '~/public/images/exploding-head.png'
import EmojiEmpty from '~/public/images/spider-web.png'
import {
  BillableMetricItem,
  BillableMetricItemSkeleton,
} from '~/components/billableMetrics/BillableMetricItem'
import { useKeysNavigation } from '~/hooks/ui/useKeyNavigation'

gql`
  query billableMetrics($page: Int, $limit: Int) {
    billableMetrics(page: $page, limit: $limit) {
      collection {
        ...BillableMetricItem
        ...DeleteBillableMetricDialog
      }
    }
  }

  ${BillableMetricItemFragmentDoc}
  ${DeleteBillableMetricDialogFragmentDoc}
`

const BillableMetricsList = () => {
  const { translate } = useI18nContext()
  let navigate = useNavigate()
  const { data, error, loading } = useBillableMetricsQuery()
  const list = data?.billableMetrics?.collection || []
  const { onKeyDown } = useKeysNavigation({
    getElmId: (i) => `billable-metric-item-${i}`,
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
        <div>
          <ListHead $withActions>
            <Typography color="disabled" variant="bodyHl">
              {translate('text_623b497ad05b960101be343e')}
            </Typography>
            <CellSmall align="right" color="disabled" variant="bodyHl">
              {translate('text_623b497ad05b960101be3440')}
            </CellSmall>
          </ListHead>
          {loading
            ? [0, 1, 2].map((i) => (
                <BillableMetricItemSkeleton key={`billable-metric-item-skeleton-${i}`} />
              ))
            : list.map((billableMetric) => {
                index += 1

                return (
                  <BillableMetricItem
                    key={billableMetric.id}
                    billableMetric={billableMetric}
                    rowId={`billable-metric-item-${index}`}
                  />
                )
              })}
        </div>
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
