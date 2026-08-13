import { render, screen } from '@testing-library/react'
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
import { AllTheProviders } from '~/test-utils'

const CUSTOM_OPENER_TEST_ID = 'custom-opener'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const AVAILABLE_FILTERS = [
  AvailableFiltersEnum.status,
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.externalId,
]

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

      it('THEN the apply button is disabled until the form is dirty and valid', async () => {
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
})
