import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemActivityTypes } from '~/components/Filters/graphql/filtersElements/FiltersItemActivityTypes'
import { ActivityTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemActivityTypes value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemActivityTypes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no initial value', () => {
    it('THEN displays the combobox', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a single value', () => {
    it.each([
      ['applied_coupon_created', ActivityTypeEnum.AppliedCouponCreated],
      ['billable_metric_created', ActivityTypeEnum.BillableMetricCreated],
      ['coupon_created', ActivityTypeEnum.CouponCreated],
    ])('THEN displays chip for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByText(enumValue)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      const multipleValues = `${ActivityTypeEnum.CouponCreated},${ActivityTypeEnum.CouponDeleted}`

      renderComponent(multipleValues)

      await waitFor(() => {
        expect(screen.getByText(ActivityTypeEnum.CouponCreated)).toBeInTheDocument()
        expect(screen.getByText(ActivityTypeEnum.CouponDeleted)).toBeInTheDocument()
      })
    })
  })
})
