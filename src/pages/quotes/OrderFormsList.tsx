import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { formatFiltersForOrderFormsQuery } from '~/components/designSystem/Filters'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { QuotesSectionTable } from './common/QuotesSectionTable'
import { useOrderFormsColumns } from './common/useOrderFormsColumns'
import { useOrderFormActions } from './hooks/useOrderFormActions'
import { useOrderForms } from './hooks/useOrderForms'

interface OrderFormsListProps {
  quoteNumber?: string
}

const OrderFormsList = ({ quoteNumber }: OrderFormsListProps): JSX.Element => {
  const { translate } = useInternationalization()
  const [searchParams] = useSearchParams()

  const filtersForOrderFormsQuery = useMemo(
    () => formatFiltersForOrderFormsQuery(searchParams),
    [searchParams],
  )

  const { orderForms, loading, error, fetchMore, metadata } = useOrderForms({
    ...filtersForOrderFormsQuery,
    ...(quoteNumber ? { quoteNumber: [quoteNumber] } : {}),
  })
  const { getActions } = useOrderFormActions()
  const columns = useOrderFormsColumns()

  return (
    <QuotesSectionTable
      name="order-forms-list"
      data={orderForms}
      isLoading={loading}
      hasError={!!error}
      metadata={metadata}
      fetchMore={fetchMore}
      columns={columns}
      getActions={(orderForm) => getActions(orderForm)}
      emptyState={{
        title: translate('text_1776697938480e54yje9i5aa'),
        subtitle: translate('text_17766979384803pz48gknynl'),
      }}
    />
  )
}

export default OrderFormsList
