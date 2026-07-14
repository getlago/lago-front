import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SHOW_LIMIT_INPUT_DATA_TEST } from '~/components/wallets/utils/dataTestConstants'
import {
  CurrencyEnum,
  FeeTypesEnum,
  GetBillableMetricsForWalletDocument,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { ScopeSection } from '~/pages/wallet/components/ScopeSection'
import { mapFromApiToForm } from '~/pages/wallet/mappers/mapFromApiToForm'
import { TWalletDataForm } from '~/pages/wallet/types'
import { render, TestMocksType } from '~/test-utils'

const billableMetricsMocks: TestMocksType = [
  {
    request: {
      query: GetBillableMetricsForWalletDocument,
      variables: { limit: 50 },
    },
    result: {
      data: {
        billableMetrics: {
          __typename: 'BillableMetricCollection',
          collection: [
            { __typename: 'BillableMetric', id: 'bm-1', name: 'API calls', code: 'api_calls' },
          ],
          metadata: { __typename: 'CollectionMetadata', totalCount: 1 },
        },
      },
    },
  },
]

const TestWrapper = ({ appliesTo }: { appliesTo?: TWalletDataForm['appliesTo'] }) => {
  const form = useAppForm({
    defaultValues: {
      ...mapFromApiToForm({
        wallet: undefined,
        customerData: undefined,
        currency: CurrencyEnum.Usd,
      }),
      ...(appliesTo ? { appliesTo } : {}),
    },
  })

  return <ScopeSection form={form} />
}

describe('ScopeSection', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView (used by scrollToAndClickElement)
    Element.prototype.scrollIntoView = jest.fn()
  })

  describe('GIVEN no limitation is applied', () => {
    describe('WHEN the section renders', () => {
      it('THEN should display the add-limitation buttons and no chips', () => {
        render(<TestWrapper />, { mocks: billableMetricsMocks })

        expect(screen.getByTestId(SHOW_LIMIT_INPUT_DATA_TEST)).toBeInTheDocument()
        expect(document.querySelector('.MuiChip-root')).toBeNull()
      })
    })

    describe('WHEN clicking the add object limitation button', () => {
      it('THEN should display the fee-type combobox', async () => {
        const user = userEvent.setup()
        const { container } = render(<TestWrapper />, { mocks: billableMetricsMocks })

        await user.click(screen.getByTestId(SHOW_LIMIT_INPUT_DATA_TEST))

        await waitFor(() => {
          expect(container.querySelector('.MuiAutocomplete-root')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN fee types are applied', () => {
    const appliedFeeTypes = {
      feeTypes: [FeeTypesEnum.Charge, FeeTypesEnum.Commitment],
      billableMetrics: [],
    } as unknown as TWalletDataForm['appliesTo']

    describe('WHEN the section renders', () => {
      it('THEN should display one chip per applied fee type', () => {
        render(<TestWrapper appliesTo={appliedFeeTypes} />, { mocks: billableMetricsMocks })

        expect(document.querySelectorAll('.MuiChip-root')).toHaveLength(2)
      })
    })

    describe('WHEN deleting a chip', () => {
      it('THEN should remove the fee type', async () => {
        const user = userEvent.setup()

        render(<TestWrapper appliesTo={appliedFeeTypes} />, { mocks: billableMetricsMocks })

        const firstChipDelete = document.querySelector(
          '.MuiChip-root button, .MuiChip-root svg[data-testid], .MuiChip-root [class*="delete"]',
        ) as HTMLElement

        await user.click(firstChipDelete)

        await waitFor(() => {
          expect(document.querySelectorAll('.MuiChip-root')).toHaveLength(1)
        })
      })
    })
  })

  describe('GIVEN all fee types are applied', () => {
    const allFeeTypes = {
      feeTypes: [FeeTypesEnum.Charge, FeeTypesEnum.Commitment, FeeTypesEnum.Subscription],
      billableMetrics: [],
    } as unknown as TWalletDataForm['appliesTo']

    describe('WHEN the section renders', () => {
      it('THEN should display the info alert and disable the add button', () => {
        render(<TestWrapper appliesTo={allFeeTypes} />, { mocks: billableMetricsMocks })

        expect(document.querySelector('[data-test="alert-type-info"]')).toBeInTheDocument()
        expect(screen.getByTestId(SHOW_LIMIT_INPUT_DATA_TEST)).toBeDisabled()
      })
    })
  })

  describe('GIVEN billable metrics are applied', () => {
    const appliedBillableMetrics = {
      feeTypes: [],
      billableMetrics: [{ id: 'bm-1', name: 'API calls', code: 'api_calls' }],
    } as unknown as TWalletDataForm['appliesTo']

    describe('WHEN the section renders', () => {
      it('THEN should display a chip with the billable metric name', () => {
        render(<TestWrapper appliesTo={appliedBillableMetrics} />, {
          mocks: billableMetricsMocks,
        })

        expect(screen.getByText('API calls')).toBeInTheDocument()
      })
    })
  })
})
