import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { FiltersProvider } from '~/components/Filters/presentation/context'
import {
  FILTERS_PANEL_ADD_FILTER_TEST_ID,
  FILTERS_PANEL_APPLY_TEST_ID,
  FILTERS_PANEL_CANCEL_TEST_ID,
  FILTERS_PANEL_CLEAR_ALL_TEST_ID,
  FILTERS_PANEL_FILTER_ITEM_TEST_ID,
  FILTERS_PANEL_OPENER_TEST_ID,
  FILTERS_PANEL_REMOVE_FILTER_TEST_ID,
  FILTERS_PANEL_TEST_ID,
  FiltersPanelPopper,
} from '~/components/Filters/presentation/FiltersPanelPopper'
import { AvailableFiltersEnum } from '~/components/Filters/presentation/types'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

const CUSTOM_OPENER_TEST_ID = 'custom-opener'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

// The real ComboBox renders its options through a virtualized list, which measures 0px in jsdom
// and therefore renders no option to click. Only the filter-type picker is stubbed.
jest.mock('~/components/form', () => {
  const actual = jest.requireActual('~/components/form')

  return {
    ...actual,
    ComboBox: ({
      data,
      value,
      disabled,
      onChange,
    }: {
      data: Array<{ value: string; disabled?: boolean }>
      value?: string
      disabled?: boolean
      onChange: (value: string) => void
    }) => (
      <select
        data-test="mock-filter-type-combobox"
        disabled={disabled}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" />
        {data.map((item) => (
          <option key={item.value} value={item.value} disabled={item.disabled}>
            {item.value}
          </option>
        ))}
      </select>
    ),
  }
})

const AVAILABLE_FILTERS = [
  AvailableFiltersEnum.status,
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.externalId,
]

const DATE_AVAILABLE_FILTERS = [AvailableFiltersEnum.issuingDate]
const SINGLE_AVAILABLE_FILTERS = [AvailableFiltersEnum.externalId]
const MIXED_AVAILABLE_FILTERS = [AvailableFiltersEnum.issuingDate, AvailableFiltersEnum.externalId]
const NORMALISING_AVAILABLE_FILTERS = [
  AvailableFiltersEnum.activeSubscriptions,
  AvailableFiltersEnum.metadata,
]
const FILTER_TYPE_COMBOBOX_TEST_ID = 'mock-filter-type-combobox'

const FROM = '2024-01-01T00:00:00.000Z'
const TO = '2024-01-31T23:59:59.999Z'

const hydrateUrlWithFilters = (search: string): void => {
  window.history.replaceState({}, '', search)
}

const renderPanel = (props: Partial<Parameters<typeof FiltersProvider>[0]> = {}): void => {
  render(
    <FiltersProvider filtersNamePrefix="f" availableFilters={AVAILABLE_FILTERS} {...props}>
      <FiltersPanelPopper />
    </FiltersProvider>,
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AllTheProviders>{children}</AllTheProviders>
      ),
    },
  )
}

const openPanel = async (): Promise<void> => {
  await userEvent.click(screen.getByTestId(FILTERS_PANEL_OPENER_TEST_ID))
}

describe('FiltersPanelPopper', () => {
  beforeAll(() => {
    // jsdom does not implement Element.scrollTo; the "add filter" handler calls it
    // inside a setTimeout to scroll the newly added row into view.
    Element.prototype.scrollTo = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the default opener', () => {
    describe('WHEN the component renders', () => {
      it('THEN it shows the opener button and the panel stays closed', () => {
        renderPanel()

        expect(screen.getByTestId(FILTERS_PANEL_OPENER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(FILTERS_PANEL_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the opener is clicked', () => {
      it('THEN it opens the panel with a single empty filter row', async () => {
        renderPanel()

        await openPanel()

        expect(screen.getByTestId(FILTERS_PANEL_TEST_ID)).toBeInTheDocument()
        expect(screen.getAllByTestId(FILTERS_PANEL_FILTER_ITEM_TEST_ID)).toHaveLength(1)
      })

      it('THEN the apply button is disabled while the only filter row is incomplete', async () => {
        renderPanel()

        await openPanel()

        expect(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID)).toBeDisabled()
      })
    })
  })

  describe('GIVEN a custom button opener', () => {
    describe('WHEN the component renders', () => {
      it('THEN it renders the custom opener instead of the default one', () => {
        renderPanel({
          buttonOpener: <button data-test={CUSTOM_OPENER_TEST_ID}>open</button>,
        })

        expect(screen.getByTestId(CUSTOM_OPENER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(FILTERS_PANEL_OPENER_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the panel is open', () => {
    describe('WHEN the add-filter button is clicked', () => {
      it('THEN it appends a new empty filter row', async () => {
        renderPanel()
        await openPanel()

        await userEvent.click(screen.getByTestId(FILTERS_PANEL_ADD_FILTER_TEST_ID))

        expect(screen.getAllByTestId(FILTERS_PANEL_FILTER_ITEM_TEST_ID)).toHaveLength(2)
      })
    })

    describe('WHEN the clear-all button is clicked after adding a row', () => {
      it('THEN it resets back to a single empty filter row', async () => {
        renderPanel()
        await openPanel()
        await userEvent.click(screen.getByTestId(FILTERS_PANEL_ADD_FILTER_TEST_ID))

        expect(screen.getAllByTestId(FILTERS_PANEL_FILTER_ITEM_TEST_ID)).toHaveLength(2)

        await userEvent.click(screen.getByTestId(FILTERS_PANEL_CLEAR_ALL_TEST_ID))

        expect(screen.getAllByTestId(FILTERS_PANEL_FILTER_ITEM_TEST_ID)).toHaveLength(1)
      })
    })

    describe('WHEN a filter row is removed after adding one', () => {
      it('THEN it drops that row', async () => {
        renderPanel()
        await openPanel()
        await userEvent.click(screen.getByTestId(FILTERS_PANEL_ADD_FILTER_TEST_ID))

        const removeButtons = screen.getAllByTestId(FILTERS_PANEL_REMOVE_FILTER_TEST_ID)

        expect(removeButtons).toHaveLength(2)

        await userEvent.click(removeButtons[0])

        expect(screen.getAllByTestId(FILTERS_PANEL_FILTER_ITEM_TEST_ID)).toHaveLength(1)
      })
    })

    describe('WHEN the cancel button is clicked', () => {
      it('THEN it closes the panel', async () => {
        renderPanel()
        await openPanel()

        expect(screen.getByTestId(FILTERS_PANEL_TEST_ID)).toBeInTheDocument()

        await userEvent.click(screen.getByTestId(FILTERS_PANEL_CANCEL_TEST_ID))

        expect(screen.queryByTestId(FILTERS_PANEL_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an empty panel over a single available filter', () => {
    afterEach(() => {
      hydrateUrlWithFilters('/')
    })

    describe('WHEN a filter type and a value are picked', () => {
      it('THEN it enables apply, navigates with the filter and closes the panel', async () => {
        renderPanel({ availableFilters: SINGLE_AVAILABLE_FILTERS })
        await openPanel()

        expect(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID)).toBeDisabled()

        await userEvent.selectOptions(
          screen.getByTestId(FILTER_TYPE_COMBOBOX_TEST_ID),
          AvailableFiltersEnum.externalId,
        )

        expect(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID)).toBeDisabled()

        await userEvent.type(screen.getByRole('textbox'), 'cust-1')

        expect(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID)).not.toBeDisabled()

        await userEvent.click(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID))

        expect(testMockNavigateFn).toHaveBeenCalledWith({ search: 'f_externalId=cust-1' })
        expect(screen.queryByTestId(FILTERS_PANEL_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN filters hydrated from the URL', () => {
    afterEach(() => {
      hydrateUrlWithFilters('/')
    })

    describe('WHEN apply is pressed without touching anything', () => {
      it('THEN it re-applies the filters, as no dirty state gates the button', async () => {
        hydrateUrlWithFilters('/?f_externalId=cust-1')
        renderPanel({ availableFilters: SINGLE_AVAILABLE_FILTERS })
        await openPanel()

        expect(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID)).not.toBeDisabled()

        await userEvent.click(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID))

        expect(testMockNavigateFn).toHaveBeenCalledWith({ search: 'f_externalId=cust-1' })
      })
    })

    describe('WHEN every filter is cleared and applied', () => {
      it('THEN it navigates with the filters dropped from the URL', async () => {
        hydrateUrlWithFilters('/?f_externalId=cust-1')
        renderPanel({ availableFilters: SINGLE_AVAILABLE_FILTERS })
        await openPanel()

        await userEvent.click(screen.getByTestId(FILTERS_PANEL_CLEAR_ALL_TEST_ID))

        expect(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID)).not.toBeDisabled()

        await userEvent.click(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID))

        expect(testMockNavigateFn).toHaveBeenCalledWith({ search: '' })
      })
    })

    describe('WHEN the filter type is changed on a row that already had a value', () => {
      it('THEN it clears the previous value and disables apply again', async () => {
        hydrateUrlWithFilters(`/?f_issuingDate=${FROM},${TO}`)
        renderPanel({ availableFilters: MIXED_AVAILABLE_FILTERS })
        await openPanel()

        expect(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID)).not.toBeDisabled()

        await userEvent.selectOptions(
          screen.getByTestId(FILTER_TYPE_COMBOBOX_TEST_ID),
          AvailableFiltersEnum.externalId,
        )

        expect(screen.getByRole('textbox')).toHaveValue('')
        expect(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN the filters change outside the panel after an edit', () => {
      it('THEN it re-seeds from the URL, discarding the unapplied edit', async () => {
        hydrateUrlWithFilters('/?f_externalId=cust-1')
        renderPanel({ availableFilters: SINGLE_AVAILABLE_FILTERS })
        await openPanel()
        await userEvent.type(screen.getByRole('textbox'), '-edited')

        expect(screen.getByRole('textbox')).toHaveValue('cust-1-edited')

        act(() => {
          hydrateUrlWithFilters('/?f_externalId=cust-2')
          window.dispatchEvent(new PopStateEvent('popstate'))
        })

        expect(screen.getByRole('textbox')).toHaveValue('cust-2')
      })
    })

    describe('WHEN the panel is cancelled after an edit and reopened', () => {
      it('THEN it restores the applied filters and keeps apply enabled', async () => {
        hydrateUrlWithFilters('/?f_externalId=cust-1')
        renderPanel({ availableFilters: SINGLE_AVAILABLE_FILTERS })
        await openPanel()

        await userEvent.clear(screen.getByRole('textbox'))

        expect(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID)).toBeDisabled()

        await userEvent.click(screen.getByTestId(FILTERS_PANEL_CANCEL_TEST_ID))
        await openPanel()

        expect(screen.getByRole('textbox')).toHaveValue('cust-1')
        expect(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID)).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN two filters that each normalise their own value on mount', () => {
    afterEach(() => {
      hydrateUrlWithFilters('/')
    })

    describe('WHEN apply is pressed', () => {
      // Both widgets write back through `setFilterValue` in the same commit. Rebuilding the array
      // from the render snapshot made the second write drop the first one's normalisation, so
      // `isEqualTo,10,` reached the URL instead of `isEqualTo,10,10`.
      it('THEN it keeps every normalised value, not only the last one written', async () => {
        hydrateUrlWithFilters('/?f_activeSubscriptions=isEqualTo,10,&f_metadata=a=1')
        renderPanel({ availableFilters: NORMALISING_AVAILABLE_FILTERS })
        await openPanel()

        await userEvent.click(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID))

        const [{ search }] = testMockNavigateFn.mock.calls[0]
        const appliedFilters = new URLSearchParams(search)

        expect(appliedFilters.get('f_activeSubscriptions')).toBe('isEqualTo,10,10')
        expect(appliedFilters.get('f_metadata')).toBe('a=1')
      })
    })
  })

  describe('GIVEN a date range filter hydrated from the URL', () => {
    afterEach(() => {
      hydrateUrlWithFilters('/')
    })

    describe('WHEN the range cannot be queried and the user edits one bound', () => {
      it('THEN it keeps the apply button disabled', async () => {
        hydrateUrlWithFilters('/?f_issuingDate=not-a-date,2024-01-31T23:59:59.999Z')
        renderPanel({ availableFilters: DATE_AVAILABLE_FILTERS })
        await openPanel()

        const toInput = screen.getAllByRole('textbox')[1]

        fireEvent.change(toInput, { target: { value: '02/15/2024' } })

        expect(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN the range is ordered and the user edits one bound', () => {
      it('THEN it enables the apply button', async () => {
        hydrateUrlWithFilters('/?f_issuingDate=2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.999Z')
        renderPanel({ availableFilters: DATE_AVAILABLE_FILTERS })
        await openPanel()

        const toInput = screen.getAllByRole('textbox')[1]

        fireEvent.change(toInput, { target: { value: '02/15/2024' } })

        expect(screen.getByTestId(FILTERS_PANEL_APPLY_TEST_ID)).not.toBeDisabled()
      })
    })
  })
})
