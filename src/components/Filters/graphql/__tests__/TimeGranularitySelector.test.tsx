import { fireEvent, render, screen } from '@testing-library/react'

import { TimeGranularitySelector } from '~/components/Filters/graphql/TimeGranularitySelector'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

const mockIsQuickFilterActive = jest.fn().mockReturnValue(false)
const mockSelectTimeGranularity = jest.fn().mockReturnValue('timeGranularity=daily')

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    isQuickFilterActive: mockIsQuickFilterActive,
    selectTimeGranularity: mockSelectTimeGranularity,
  }),
}))

const renderComponent = () => {
  return render(<TimeGranularitySelector />, { wrapper: AllTheProviders })
}

describe('TimeGranularitySelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the selector renders', () => {
    it('THEN displays one button per granularity (daily, weekly, monthly)', () => {
      renderComponent()

      expect(screen.getAllByRole('button')).toHaveLength(3)
    })
  })

  describe('WHEN a granularity button is clicked', () => {
    it('THEN navigates using the selected granularity search', () => {
      renderComponent()

      fireEvent.click(screen.getAllByRole('button')[0])

      expect(mockSelectTimeGranularity).toHaveBeenCalled()
      expect(testMockNavigateFn).toHaveBeenCalledWith({ search: 'timeGranularity=daily' })
    })
  })
})
