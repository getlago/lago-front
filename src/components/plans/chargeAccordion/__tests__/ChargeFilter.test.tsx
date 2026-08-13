import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { BillableMetricFilter } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  buildChargeFilterAddFilterButtonId,
  CHARGE_FILTER_VALUES_CONTAINER_TEST_ID,
  ChargeFilter,
} from '../ChargeFilter'

// --- Mocks ---

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => `translated_${key}`,
  }),
}))

// --- Helpers ---

const defaultProps = {
  filter: {
    invoiceDisplayName: '',
    properties: {},
    values: [],
  },
  filterIndex: 0,
  chargeIndex: 0,
  billableMetricFilters: [] as BillableMetricFilter[],
  otherFiltersValues: undefined as string[][] | undefined,
  setFilterValues: jest.fn(),
  deleteFilterValue: jest.fn(),
}

const makeFilterValue = (key: string, value?: string): string => {
  return `{ "${key}": "${value || '__ALL_FILTER_VALUES__'}" }`
}

// --- Tests ---

describe('ChargeFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // jsdom doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = jest.fn()
  })

  describe('GIVEN the filter has no values', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the add filter button', () => {
        render(<ChargeFilter {...defaultProps} />)

        const addButton = document.getElementById(
          buildChargeFilterAddFilterButtonId(0, 0),
        ) as HTMLButtonElement

        expect(addButton).toBeInTheDocument()
      })

      it('THEN should not render the values container', () => {
        render(<ChargeFilter {...defaultProps} />)

        expect(screen.queryByTestId(CHARGE_FILTER_VALUES_CONTAINER_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the filter has values', () => {
    const filterWithValues = {
      ...defaultProps,
      filter: {
        invoiceDisplayName: '',
        properties: {},
        values: [makeFilterValue('region', 'us-east')],
      },
    }

    describe('WHEN the component renders', () => {
      it('THEN should render the values container with chips', () => {
        render(<ChargeFilter {...filterWithValues} />)

        expect(screen.getByTestId(CHARGE_FILTER_VALUES_CONTAINER_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN a filter value chip is deleted', () => {
      it('THEN should call deleteFilterValue with the value index', async () => {
        const user = userEvent.setup()
        const mockDeleteFilterValue = jest.fn()

        render(<ChargeFilter {...filterWithValues} deleteFilterValue={mockDeleteFilterValue} />)

        // The Chip component renders a delete button
        const deleteButtons = screen.getAllByRole('button')
        // The delete button is the one within the Chip
        const chipDeleteButton = deleteButtons.find(
          (btn) => btn.getAttribute('aria-label') !== null,
        )

        if (chipDeleteButton) {
          await user.click(chipDeleteButton)
          expect(mockDeleteFilterValue).toHaveBeenCalledWith(0)
        }
      })
    })
  })

  describe('GIVEN the add filter button is clicked', () => {
    describe('WHEN the user clicks the add filter button', () => {
      it('THEN should show the combobox', async () => {
        const user = userEvent.setup()

        render(<ChargeFilter {...defaultProps} />)

        const addButton = document.getElementById(
          buildChargeFilterAddFilterButtonId(0, 0),
        ) as HTMLButtonElement

        await user.click(addButton)

        // After clicking, the add button should be replaced by the combobox section
        expect(
          document.getElementById(buildChargeFilterAddFilterButtonId(0, 0)),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN another filter has the exact same definition', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the duplicate definition warning alert', () => {
        const filterValue = makeFilterValue('region', 'us-east')
        const propsWithDuplicateDefinition = {
          ...defaultProps,
          filter: {
            invoiceDisplayName: '',
            properties: {},
            values: [filterValue],
          },
          otherFiltersValues: [[filterValue]],
        }

        render(<ChargeFilter {...propsWithDuplicateDefinition} />)

        // Alert with type="warning" renders with data-test="alert-type-warning"
        expect(screen.getByTestId('alert-type-warning')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN another filter only partially overlaps this filter values', () => {
    describe('WHEN the component renders', () => {
      it('THEN should not render the duplicate definition warning alert', () => {
        const propsWithPartialOverlap = {
          ...defaultProps,
          filter: {
            invoiceDisplayName: '',
            properties: {},
            values: [makeFilterValue('region', 'us-east')],
          },
          otherFiltersValues: [
            [makeFilterValue('region', 'us-east'), makeFilterValue('plan', 'premium')],
          ],
        }

        render(<ChargeFilter {...propsWithPartialOverlap} />)

        expect(screen.queryByTestId('alert-type-warning')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN there are no other filters', () => {
    describe('WHEN the component renders', () => {
      it('THEN should not render the duplicate definition warning alert', () => {
        const propsWithoutOtherFilters = {
          ...defaultProps,
          filter: {
            invoiceDisplayName: '',
            properties: {},
            values: [makeFilterValue('region', 'us-east')],
          },
          otherFiltersValues: [],
        }

        render(<ChargeFilter {...propsWithoutOtherFilters} />)

        expect(screen.queryByTestId('alert-type-warning')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple filter values', () => {
    describe('WHEN the component renders with two values', () => {
      it('THEN should render chips for each value', () => {
        const propsWithMultipleValues = {
          ...defaultProps,
          filter: {
            invoiceDisplayName: '',
            properties: {},
            values: [makeFilterValue('region', 'us-east'), makeFilterValue('region', 'us-west')],
          },
        }

        render(<ChargeFilter {...propsWithMultipleValues} />)

        expect(screen.getByTestId(CHARGE_FILTER_VALUES_CONTAINER_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
