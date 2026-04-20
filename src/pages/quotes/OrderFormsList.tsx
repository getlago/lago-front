import { InfiniteScroll } from '~/components/designSystem/InfiniteScroll'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { OrderFormListItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { createOrderFormsPaginationHandler } from './common/orderFormsPaginationHandler'
import { orderFormCreatedAtColumn, orderFormStatusColumn } from './common/orderFormTableColumns'
import { useOrderForms } from './hooks/useOrderForms'

const OrderFormsList = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { orderForms, loading, error, fetchMore, metadata } = useOrderForms()

  const columns: Array<TableColumn<OrderFormListItemFragment>> = [
    {
      key: 'number',
      title: translate('text_1775746196826pyjlfqx3anr'),
      minWidth: 160,
      maxSpace: true,
      content: ({ number }) => (
        <Typography variant="bodyHl" noWrap>
          {number}
        </Typography>
      ),
    },
    {
      key: 'customer.name',
      title: translate('text_65201c5a175a4b0238abf29a'),
      maxSpace: true,
      minWidth: 160,
      content: ({ customer }) => (
        <Typography color="grey600" noWrap>
          {customer.name}
        </Typography>
      ),
    },
    orderFormStatusColumn(translate),
    orderFormCreatedAtColumn(translate, 'text_624efab67eb2570101d117e3', intlFormatDateTimeOrgaTZ),
  ]

  return (
    <DetailsPage.Container>
      <InfiniteScroll onBottom={createOrderFormsPaginationHandler(metadata, loading, fetchMore)}>
        <Table
          name="order-forms-list"
          data={orderForms}
          isLoading={loading}
          hasError={!!error}
          containerSize={0}
          columns={columns}
          placeholder={{
            emptyState: {
              title: translate('text_1776697938480e54yje9i5aa'),
              subtitle: translate('text_17766979384803pz48gknynl'),
            },
          }}
        />
      </InfiniteScroll>
    </DetailsPage.Container>
  )
}

export default OrderFormsList
