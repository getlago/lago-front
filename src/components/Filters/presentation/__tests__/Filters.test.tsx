import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { FiltersProvider } from '~/components/Filters/presentation/context'
import { Filters, FILTERS_RESET_BUTTON_TEST_ID } from '~/components/Filters/presentation/Filters'
import { AvailableFiltersEnum } from '~/components/Filters/presentation/types'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

const PANEL_POPPER_TEST_ID = 'mock-filters-panel-popper'
const ACTIVE_FILTERS_TEST_ID = 'mock-active-filters-list'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/components/Filters/presentation/FiltersPanelPopper', () => ({
  FiltersPanelPopper: () => <div data-test="mock-filters-panel-popper" />,
}))

jest.mock('~/components/Filters/presentation/ActiveFiltersList', () => ({
  ActiveFiltersList: () => <div data-test="mock-active-filters-list" />,
}))

let mockSearchParams = new URLSearchParams()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  const { mockNavigate } = (
    globalThis as unknown as { __testRouterMocks: { mockNavigate: jest.Mock } }
  ).__testRouterMocks

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, jest.fn()],
  }
})

const renderFilters = (): void => {
  render(
    <FiltersProvider
      filtersNamePrefix="f"
      availableFilters={[AvailableFiltersEnum.status, AvailableFiltersEnum.currency]}
    >
      <Filters />
    </FiltersProvider>,
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AllTheProviders>{children}</AllTheProviders>
      ),
    },
  )
}

describe('Filters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    mockSearchParams = new URLSearchParams()
  })

  describe('GIVEN no applied filters', () => {
    describe('WHEN the shell renders', () => {
      it('THEN it renders the panel and the active filters list', () => {
        mockSearchParams = new URLSearchParams()

        renderFilters()

        expect(screen.getByTestId(PANEL_POPPER_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(ACTIVE_FILTERS_TEST_ID)).toBeInTheDocument()
      })

      it('THEN it hides the reset button', () => {
        mockSearchParams = new URLSearchParams()

        renderFilters()

        expect(screen.queryByTestId(FILTERS_RESET_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN at least one applied filter', () => {
    describe('WHEN the shell renders', () => {
      it('THEN it shows the reset button', () => {
        mockSearchParams = new URLSearchParams('f_status=draft')

        renderFilters()

        expect(screen.getByTestId(FILTERS_RESET_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the reset button is clicked', () => {
      it('THEN it navigates to clear the filters', async () => {
        mockSearchParams = new URLSearchParams('f_status=draft')

        renderFilters()

        await userEvent.click(screen.getByTestId(FILTERS_RESET_BUTTON_TEST_ID))

        expect(testMockNavigateFn).toHaveBeenCalled()
      })
    })
  })
})
