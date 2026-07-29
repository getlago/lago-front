import { fireEvent, render, screen } from '@testing-library/react'

import { InvoiceStatusQuickFilter } from '~/components/Filters/graphql/InvoiceStatusQuickFilter'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

const mockResetFilters = jest.fn()
const mockIsQuickFilterActive = jest.fn().mockReturnValue(false)
const mockBuildQuickFilterUrlParams = jest.fn().mockReturnValue('status=draft')

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    resetFilters: mockResetFilters,
    isQuickFilterActive: mockIsQuickFilterActive,
    buildQuickFilterUrlParams: mockBuildQuickFilterUrlParams,
    hasAppliedFilters: false,
  }),
}))

const renderComponent = () => {
  return render(<InvoiceStatusQuickFilter />, { wrapper: AllTheProviders })
}

describe('InvoiceStatusQuickFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the quick filter renders', () => {
    it('THEN displays a reset button plus one button per status mapping', () => {
      renderComponent()

      // 1 reset ("all") button + 6 status quick filters
      expect(screen.getAllByRole('button')).toHaveLength(7)
    })
  })

  describe('WHEN the reset (all) button is clicked', () => {
    it('THEN calls resetFilters', () => {
      renderComponent()

      fireEvent.click(screen.getAllByRole('button')[0])

      expect(mockResetFilters).toHaveBeenCalled()
    })
  })

  describe('WHEN a status quick filter button is clicked', () => {
    it('THEN navigates using the built quick filter url params', () => {
      renderComponent()

      fireEvent.click(screen.getAllByRole('button')[1])

      expect(mockBuildQuickFilterUrlParams).toHaveBeenCalled()
      expect(testMockNavigateFn).toHaveBeenCalledWith({ search: 'status=draft' })
    })
  })
})
