import { render, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import {
  ActiveFiltersList,
  FILTERS_ACTIVE_FILTER_ITEM_TEST_ID,
} from '~/components/Filters/presentation/ActiveFiltersList'
import { FiltersProvider } from '~/components/Filters/presentation/context'
import { AvailableFiltersEnum } from '~/components/Filters/presentation/types'
import { AllTheProviders } from '~/test-utils'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
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

const renderActiveFiltersList = (availableFilters: AvailableFiltersEnum[]): void => {
  render(
    <FiltersProvider filtersNamePrefix="f" availableFilters={availableFilters}>
      <ActiveFiltersList />
    </FiltersProvider>,
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AllTheProviders>{children}</AllTheProviders>
      ),
    },
  )
}

describe('ActiveFiltersList', () => {
  afterEach(() => {
    mockSearchParams = new URLSearchParams()
  })

  describe('GIVEN no active filters in the URL', () => {
    describe('WHEN the component renders', () => {
      it('THEN it renders no chips', () => {
        mockSearchParams = new URLSearchParams()

        renderActiveFiltersList([AvailableFiltersEnum.externalId])

        expect(screen.queryAllByTestId(FILTERS_ACTIVE_FILTER_ITEM_TEST_ID)).toHaveLength(0)
      })
    })
  })

  describe('GIVEN a single active filter matching the available filters', () => {
    describe('WHEN the component renders', () => {
      it('THEN it renders a single chip with the filter value', () => {
        mockSearchParams = new URLSearchParams('f_externalId=foobar')

        renderActiveFiltersList([AvailableFiltersEnum.externalId])

        const chips = screen.getAllByTestId(FILTERS_ACTIVE_FILTER_ITEM_TEST_ID)

        expect(chips).toHaveLength(1)
        expect(chips[0]).toHaveTextContent('foobar')
      })
    })
  })

  describe('GIVEN several active filters', () => {
    describe('WHEN the component renders', () => {
      it('THEN it renders one chip per matching filter', () => {
        mockSearchParams = new URLSearchParams('f_externalId=foobar&f_status=draft')

        renderActiveFiltersList([AvailableFiltersEnum.externalId, AvailableFiltersEnum.status])

        expect(screen.getAllByTestId(FILTERS_ACTIVE_FILTER_ITEM_TEST_ID)).toHaveLength(2)
      })
    })
  })

  describe('GIVEN an active filter with a long value', () => {
    describe('WHEN the component renders', () => {
      it('THEN the chip stays on one line and ellipsises its content', () => {
        mockSearchParams = new URLSearchParams(
          `f_externalId=${'a-very-long-external-id-value'.repeat(5)}`,
        )

        renderActiveFiltersList([AvailableFiltersEnum.externalId])

        const chip = screen.getAllByTestId(FILTERS_ACTIVE_FILTER_ITEM_TEST_ID)[0]

        expect(chip).toHaveClass('max-w-full')
        expect(chip.firstChild).toHaveClass('MuiTypography-noWrap')
      })
    })
  })

  describe('GIVEN a URL param that is not part of the available filters', () => {
    describe('WHEN the component renders', () => {
      it('THEN it ignores the unknown param', () => {
        mockSearchParams = new URLSearchParams('f_externalId=foobar&f_unknown=ignored')

        renderActiveFiltersList([AvailableFiltersEnum.externalId])

        expect(screen.getAllByTestId(FILTERS_ACTIVE_FILTER_ITEM_TEST_ID)).toHaveLength(1)
      })
    })
  })
})
