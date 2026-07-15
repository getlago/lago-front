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

// jsdom measures a 0-height scroll element, so the real virtualizer renders no
// options — render them all instead (same mock as BaseComboBoxVirtualizedList.test.tsx)
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn((config) => {
    const items = Array.from({ length: config.count }, (_, i) => ({
      index: i,
      key: i,
      size: config.estimateSize(i),
      start: Array.from({ length: i }, (__, j) => config.estimateSize(j)).reduce(
        (acc, val) => acc + val,
        0,
      ),
    }))

    return {
      getVirtualItems: () => items,
      getTotalSize: () => items.reduce((acc, item) => acc + item.size, 0),
      scrollToIndex: jest.fn(),
      measureElement: jest.fn(),
    }
  }),
}))

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

// captures the live form so tests can assert values after interactions
let lastForm: { state: { values: TWalletDataForm } } | undefined

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

  lastForm = form as unknown as { state: { values: TWalletDataForm } }

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

  describe('GIVEN the user adds a fee type from the combobox', () => {
    describe('WHEN selecting the first available option', () => {
      it('THEN should add it to the form values and render its chip', async () => {
        const user = userEvent.setup()
        const { container } = render(<TestWrapper />, { mocks: billableMetricsMocks })

        // the show button auto-clicks the input (scrollToAndClickElement), which
        // opens the popup — clicking the input again would toggle it closed
        await user.click(screen.getByTestId(SHOW_LIMIT_INPUT_DATA_TEST))

        const option = (await screen.findAllByRole('option'))[0]

        await user.click(option)

        await waitFor(() => {
          expect(document.querySelectorAll('.MuiChip-root')).toHaveLength(1)
        })
        expect(lastForm?.state.values.appliesTo?.feeTypes).toHaveLength(1)
        // selecting an option also closes the input
        expect(container.querySelector('.MuiAutocomplete-root')).toBeNull()
      })
    })
  })

  describe('GIVEN the fee-type input is open', () => {
    describe('WHEN clicking the trash button next to it', () => {
      it('THEN should close the input without touching the form values', async () => {
        const user = userEvent.setup()
        const { container } = render(<TestWrapper />, { mocks: billableMetricsMocks })

        await user.click(screen.getByTestId(SHOW_LIMIT_INPUT_DATA_TEST))

        const row = (container.querySelector('.MuiAutocomplete-root') as HTMLElement).closest(
          '.flex.items-center.gap-4',
        ) as HTMLElement
        // the row also contains the autocomplete's own clear/popup buttons — pick by icon
        const trashButton = Array.from(row.querySelectorAll('button')).find((button) =>
          button.querySelector('svg[data-test="trash/medium"]'),
        ) as HTMLButtonElement

        await user.click(trashButton)

        await waitFor(() => {
          expect(container.querySelector('.MuiAutocomplete-root')).toBeNull()
        })
        expect(lastForm?.state.values.appliesTo?.feeTypes).toHaveLength(0)
      })
    })
  })

  describe('GIVEN two billable metrics are applied', () => {
    describe('WHEN deleting one chip', () => {
      it('THEN should remove only that metric from the form values', async () => {
        const user = userEvent.setup()

        render(
          <TestWrapper
            appliesTo={
              {
                feeTypes: [],
                billableMetrics: [
                  { id: 'bm-1', name: 'API calls', code: 'api_calls' },
                  { id: 'bm-2', name: 'Storage', code: 'storage' },
                ],
              } as unknown as TWalletDataForm['appliesTo']
            }
          />,
          { mocks: billableMetricsMocks },
        )

        const firstChip = screen.getByText('API calls').closest('.MuiChip-root') as HTMLElement
        const deleteButton = firstChip.querySelector('button, svg') as HTMLElement

        await user.click(deleteButton)

        await waitFor(() => {
          expect(screen.queryByText('API calls')).not.toBeInTheDocument()
        })
        expect(screen.getByText('Storage')).toBeInTheDocument()
        expect(lastForm?.state.values.appliesTo?.billableMetrics).toHaveLength(1)
        expect(lastForm?.state.values.appliesTo?.billableMetrics?.[0]?.id).toBe('bm-2')
      })
    })
  })
})
