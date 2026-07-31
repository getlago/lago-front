import { renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { FiltersProvider, useFilterContext } from '~/components/Filters/presentation/context'
import {
  AvailableFiltersEnum,
  AvailableQuickFilters,
} from '~/components/Filters/presentation/types'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

const buildWrapper = (props: Parameters<typeof FiltersProvider>[0]) => {
  const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <AllTheProviders>
      <FiltersProvider {...props}>{children}</FiltersProvider>
    </AllTheProviders>
  )

  Wrapper.displayName = 'FiltersTestWrapper'

  return Wrapper
}

describe('FiltersProvider / useFilterContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a consumer rendered outside of the provider', () => {
    describe('WHEN useFilterContext is called', () => {
      it('THEN it throws an explicit error', () => {
        expect(() => renderHook(() => useFilterContext(), { wrapper: AllTheProviders })).toThrow(
          'useFilters must be used within a FilterProvider',
        )
      })
    })
  })

  describe('GIVEN a provider with only the required props', () => {
    describe('WHEN useFilterContext is called', () => {
      it('THEN it exposes the provided values and leaves optionals undefined', () => {
        const availableFilters = [AvailableFiltersEnum.status, AvailableFiltersEnum.currency]

        const { result } = renderHook(() => useFilterContext(), {
          wrapper: buildWrapper({
            filtersNamePrefix: 'f',
            availableFilters,
            children: null,
          }),
        })

        expect(result.current.filtersNamePrefix).toBe('f')
        expect(result.current.availableFilters).toEqual(availableFilters)
        expect(result.current.quickFiltersType).toBeUndefined()
        expect(result.current.staticFilters).toBeUndefined()
        expect(result.current.displayInDialog).toBeUndefined()
      })
    })
  })

  describe('GIVEN a provider with quick filters and dialog display', () => {
    describe('WHEN useFilterContext is called', () => {
      it('THEN it forwards every optional prop unchanged', () => {
        const { result } = renderHook(() => useFilterContext(), {
          wrapper: buildWrapper({
            filtersNamePrefix: 'q',
            availableFilters: [AvailableFiltersEnum.currency],
            quickFiltersType: AvailableQuickFilters.invoiceStatus,
            displayInDialog: true,
            children: null,
          }),
        })

        expect(result.current.quickFiltersType).toBe(AvailableQuickFilters.invoiceStatus)
        expect(result.current.displayInDialog).toBe(true)
      })
    })
  })

  describe('GIVEN a provider with static filters', () => {
    describe('WHEN it mounts', () => {
      it('THEN it seeds the static filters into the URL via navigate', () => {
        renderHook(() => useFilterContext(), {
          wrapper: buildWrapper({
            filtersNamePrefix: 'f',
            availableFilters: [AvailableFiltersEnum.currency],
            staticFilters: { [AvailableFiltersEnum.currency]: 'eur' },
            children: null,
          }),
        })

        expect(testMockNavigateFn).toHaveBeenCalledTimes(1)

        const search = testMockNavigateFn.mock.calls[0][0].search as string

        expect(search).toContain('f_currency=eur')
      })
    })
  })

  describe('GIVEN a provider without static filters', () => {
    describe('WHEN it mounts', () => {
      it('THEN it does not navigate', () => {
        renderHook(() => useFilterContext(), {
          wrapper: buildWrapper({
            filtersNamePrefix: 'f',
            availableFilters: [AvailableFiltersEnum.currency],
            children: null,
          }),
        })

        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })
})
