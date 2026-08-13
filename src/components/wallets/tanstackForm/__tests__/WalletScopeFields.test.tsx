import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FeeTypesEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import type { WalletScopeSlice } from '../walletFormSchema'
import {
  WALLET_SCOPE_BILLABLE_METRIC_ADD_BUTTON_TEST_ID,
  WALLET_SCOPE_BILLABLE_METRIC_CHIPS_TEST_ID,
  WALLET_SCOPE_BILLABLE_METRIC_COMBOBOX_TEST_ID,
  WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID,
  WALLET_SCOPE_FEE_TYPE_CANCEL_BUTTON_TEST_ID,
  WALLET_SCOPE_FEE_TYPE_CHIPS_TEST_ID,
  WALLET_SCOPE_FEE_TYPE_COMBOBOX_TEST_ID,
  WalletScopeFields,
} from '../WalletScopeFields'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

// The billable-metric combobox reads its options from the lazy query; stub it so
// tests can feed a loaded `selectableBillableMetrics` payload (undefined by default,
// matching the pre-fetch state the other cases rely on).
let mockBillableMetricsData: unknown = undefined
const mockGetBillableMetrics = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetBillableMetricsForWalletLazyQuery: () => [
    mockGetBillableMetrics,
    { data: mockBillableMetricsData, loading: false },
  ],
}))

// jsdom measures a 0-height scroll element, so the real virtualizer renders no
// combobox options — render them all instead (same mock as ScopeSection.test.tsx).
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

const emptyScope: WalletScopeSlice = { feeTypes: [], billableMetricCodes: [] }

const TestWrapper = ({ initialValues = emptyScope }: { initialValues?: WalletScopeSlice }) => {
  const form = useAppForm({ defaultValues: initialValues })

  return <WalletScopeFields form={form} />
}

// The fee-type "all selected" info alert renders with the design-system default.
const FEE_TYPE_ALERT_TEST_ID = 'alert-type-info'

describe('WalletScopeFields', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView (used when opening the combobox popup)
    Element.prototype.scrollIntoView = jest.fn()
  })

  beforeEach(() => {
    mockBillableMetricsData = undefined
  })

  describe('GIVEN the scope slice is empty', () => {
    describe('WHEN the component renders', () => {
      it('THEN should show both add buttons and no chips', () => {
        render(<TestWrapper />)

        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(
          screen.getByTestId(WALLET_SCOPE_BILLABLE_METRIC_ADD_BUTTON_TEST_ID),
        ).toBeInTheDocument()
        expect(screen.queryByTestId(WALLET_SCOPE_FEE_TYPE_CHIPS_TEST_ID)).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(WALLET_SCOPE_BILLABLE_METRIC_CHIPS_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN should not show the all-selected alert and the fee-type add button is enabled', () => {
        render(<TestWrapper />)

        expect(screen.queryByTestId(FEE_TYPE_ALERT_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID)).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN some fee types are already selected', () => {
    describe('WHEN one fee type is selected', () => {
      it('THEN should render one chip and keep the add button enabled', () => {
        render(<TestWrapper initialValues={{ ...emptyScope, feeTypes: [FeeTypesEnum.Charge] }} />)

        const chips = screen.getByTestId(WALLET_SCOPE_FEE_TYPE_CHIPS_TEST_ID)

        expect(chips.children).toHaveLength(1)
        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID)).not.toBeDisabled()
        expect(screen.queryByTestId(FEE_TYPE_ALERT_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN all fee types are selected', () => {
      it('THEN should show the all-selected alert and disable the add button', () => {
        render(
          <TestWrapper
            initialValues={{
              ...emptyScope,
              feeTypes: [FeeTypesEnum.Charge, FeeTypesEnum.Commitment, FeeTypesEnum.Subscription],
            }}
          />,
        )

        expect(screen.getByTestId(FEE_TYPE_ALERT_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN deleting a selected fee-type chip', () => {
      it('THEN should remove that chip', async () => {
        const user = userEvent.setup()

        render(
          <TestWrapper
            initialValues={{
              ...emptyScope,
              feeTypes: [FeeTypesEnum.Charge, FeeTypesEnum.Commitment],
            }}
          />,
        )

        const chips = screen.getByTestId(WALLET_SCOPE_FEE_TYPE_CHIPS_TEST_ID)

        expect(chips.children).toHaveLength(2)

        // Chip root carries role="button"; its delete control is the nested
        // <button data-test="button">, so target that rather than the chip itself.
        const [firstDeleteButton] = within(chips).getAllByTestId('button')

        await user.click(firstDeleteButton)

        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_CHIPS_TEST_ID).children).toHaveLength(1)
      })
    })
  })

  describe('GIVEN the fee-type combobox toggle', () => {
    describe('WHEN clicking the add button', () => {
      it('THEN should reveal the combobox', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID))

        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_COMBOBOX_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN cancelling the combobox', () => {
      it('THEN should hide the combobox and restore the add button', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID))
        await user.click(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_CANCEL_BUTTON_TEST_ID))

        expect(screen.queryByTestId(WALLET_SCOPE_FEE_TYPE_COMBOBOX_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN some billable metrics are already selected', () => {
    describe('WHEN codes are present without loaded metric data', () => {
      it('THEN should render one chip per code', () => {
        render(
          <TestWrapper
            initialValues={{ ...emptyScope, billableMetricCodes: ['cpu', 'storage'] }}
          />,
        )

        expect(
          screen.getByTestId(WALLET_SCOPE_BILLABLE_METRIC_CHIPS_TEST_ID).children,
        ).toHaveLength(2)
      })
    })

    describe('WHEN clicking the billable-metric add button', () => {
      it('THEN should reveal the billable-metric combobox', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(WALLET_SCOPE_BILLABLE_METRIC_ADD_BUTTON_TEST_ID))

        expect(
          screen.getByTestId(WALLET_SCOPE_BILLABLE_METRIC_COMBOBOX_TEST_ID),
        ).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the billable-metric query has loaded data', () => {
    const loadedData = {
      selectableBillableMetrics: {
        collection: [
          { id: 'bm-1', name: 'API calls', code: 'api_calls' },
          { id: 'bm-2', name: 'Storage', code: 'storage' },
        ],
      },
    }

    describe('WHEN a selected code matches a loaded metric', () => {
      it('THEN should label the chip with the metric name', () => {
        mockBillableMetricsData = loadedData

        render(
          <TestWrapper initialValues={{ ...emptyScope, billableMetricCodes: ['api_calls'] }} />,
        )

        const chips = screen.getByTestId(WALLET_SCOPE_BILLABLE_METRIC_CHIPS_TEST_ID)

        expect(chips.children).toHaveLength(1)
        expect(within(chips).getByText('API calls')).toBeInTheDocument()
      })
    })

    describe('WHEN a selected code does not match any loaded metric', () => {
      it('THEN should fall back to the raw code as the chip label', () => {
        mockBillableMetricsData = loadedData

        render(
          <TestWrapper initialValues={{ ...emptyScope, billableMetricCodes: ['unknown_code'] }} />,
        )

        const chips = screen.getByTestId(WALLET_SCOPE_BILLABLE_METRIC_CHIPS_TEST_ID)

        expect(within(chips).getByText('unknown_code')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the billable-metric combobox is open with loaded options', () => {
    const loadedData = {
      selectableBillableMetrics: {
        collection: [
          { id: 'bm-1', name: 'API calls', code: 'api_calls' },
          { id: 'bm-2', name: 'Storage', code: 'storage' },
        ],
      },
    }

    const openCombobox = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
      await user.click(screen.getByTestId(WALLET_SCOPE_BILLABLE_METRIC_ADD_BUTTON_TEST_ID))

      const combobox = screen.getByTestId(WALLET_SCOPE_BILLABLE_METRIC_COMBOBOX_TEST_ID)
      const input = combobox.querySelector('input') as HTMLInputElement

      await user.click(input)
    }

    describe('WHEN opening the combobox', () => {
      it('THEN should render one option per selectable billable metric', async () => {
        const user = userEvent.setup()

        mockBillableMetricsData = loadedData

        render(<TestWrapper />)

        await openCombobox(user)

        const options = await screen.findAllByRole('option')

        expect(options).toHaveLength(2)
        expect(options[0]).toHaveTextContent('API calls')
        expect(options[0]).toHaveTextContent('api_calls')
      })
    })

    describe('WHEN a code is already selected', () => {
      it('THEN should render that option as disabled', async () => {
        const user = userEvent.setup()

        mockBillableMetricsData = loadedData

        render(
          <TestWrapper initialValues={{ ...emptyScope, billableMetricCodes: ['api_calls'] }} />,
        )

        await openCombobox(user)

        const options = await screen.findAllByRole('option')

        expect(options[0]).toHaveAttribute('aria-disabled', 'true')
        expect(options[1]).toHaveAttribute('aria-disabled', 'false')
      })
    })

    describe('WHEN selecting an available option', () => {
      it('THEN should add its code and render a chip labelled with the metric name', async () => {
        const user = userEvent.setup()

        mockBillableMetricsData = loadedData

        render(<TestWrapper />)

        await openCombobox(user)

        const options = await screen.findAllByRole('option')

        await user.click(options[1])

        const chips = await screen.findByTestId(WALLET_SCOPE_BILLABLE_METRIC_CHIPS_TEST_ID)

        expect(within(chips).getByText('Storage')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a billable-metric chip is rendered', () => {
    describe('WHEN clicking its delete control', () => {
      it('THEN should remove that code from the selection', async () => {
        const user = userEvent.setup()

        mockBillableMetricsData = {
          selectableBillableMetrics: {
            collection: [{ id: 'bm-1', name: 'API calls', code: 'api_calls' }],
          },
        }

        render(
          <TestWrapper initialValues={{ ...emptyScope, billableMetricCodes: ['api_calls'] }} />,
        )

        const chips = screen.getByTestId(WALLET_SCOPE_BILLABLE_METRIC_CHIPS_TEST_ID)

        expect(chips.children).toHaveLength(1)

        // Chip root carries role="button"; its delete control is the nested
        // <button data-test="button">, so target that rather than the chip itself.
        const [deleteButton] = within(chips).getAllByTestId('button')

        await user.click(deleteButton)

        await waitFor(() => {
          expect(
            screen.queryByTestId(WALLET_SCOPE_BILLABLE_METRIC_CHIPS_TEST_ID),
          ).not.toBeInTheDocument()
        })
      })
    })
  })
})
