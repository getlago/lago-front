import { render, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { FiltersProvider } from '~/components/Filters/presentation/context'
import { QuickFilters } from '~/components/Filters/presentation/QuickFilters'
import {
  AvailableFiltersEnum,
  AvailableQuickFilters,
} from '~/components/Filters/presentation/types'
import { AllTheProviders } from '~/test-utils'

const INVOICE_STATUS_TEST_ID = 'mock-invoice-status-quick-filter'
const CUSTOMER_ACCOUNT_TYPE_TEST_ID = 'mock-customer-account-type-quick-filter'
const TIME_GRANULARITY_TEST_ID = 'mock-time-granularity-selector'

jest.mock('~/components/Filters/graphql/InvoiceStatusQuickFilter', () => ({
  InvoiceStatusQuickFilter: () => <div data-test="mock-invoice-status-quick-filter" />,
}))

jest.mock('~/components/Filters/graphql/CustomerAccountTypeQuickFilter', () => ({
  CustomerAccountTypeQuickFilter: () => <div data-test="mock-customer-account-type-quick-filter" />,
}))

jest.mock('~/components/Filters/graphql/TimeGranularitySelector', () => ({
  TimeGranularitySelector: () => <div data-test="mock-time-granularity-selector" />,
}))

const renderQuickFilters = (quickFiltersType?: AvailableQuickFilters): void => {
  render(
    <FiltersProvider
      filtersNamePrefix="f"
      availableFilters={[AvailableFiltersEnum.currency]}
      quickFiltersType={quickFiltersType}
    >
      <QuickFilters />
    </FiltersProvider>,
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AllTheProviders>{children}</AllTheProviders>
      ),
    },
  )
}

describe('QuickFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no quick filters type', () => {
    describe('WHEN the component renders', () => {
      it('THEN none of the quick filter variants are shown', () => {
        renderQuickFilters(undefined)

        expect(screen.queryByTestId(INVOICE_STATUS_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(CUSTOMER_ACCOUNT_TYPE_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(TIME_GRANULARITY_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the invoiceStatus quick filters type', () => {
    describe('WHEN the component renders', () => {
      it('THEN only the invoice status quick filter is shown', () => {
        renderQuickFilters(AvailableQuickFilters.invoiceStatus)

        expect(screen.getByTestId(INVOICE_STATUS_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CUSTOMER_ACCOUNT_TYPE_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(TIME_GRANULARITY_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the customerAccountType quick filters type', () => {
    describe('WHEN the component renders', () => {
      it('THEN only the customer account type quick filter is shown', () => {
        renderQuickFilters(AvailableQuickFilters.customerAccountType)

        expect(screen.getByTestId(CUSTOMER_ACCOUNT_TYPE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(INVOICE_STATUS_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(TIME_GRANULARITY_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the timeGranularity quick filters type', () => {
    describe('WHEN the component renders', () => {
      it('THEN only the time granularity selector is shown', () => {
        renderQuickFilters(AvailableQuickFilters.timeGranularity)

        expect(screen.getByTestId(TIME_GRANULARITY_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(INVOICE_STATUS_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(CUSTOMER_ACCOUNT_TYPE_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })
})
