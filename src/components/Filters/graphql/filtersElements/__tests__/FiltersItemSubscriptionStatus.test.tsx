import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemSubscriptionStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemSubscriptionStatus'
import { StatusTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(
    <FiltersItemSubscriptionStatus value={value} setFilterValue={mockSetFilterValue} />,
    {
      wrapper: AllTheProviders,
    },
  )
}

describe('FiltersItemSubscriptionStatus', () => {
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
      ['active', StatusTypeEnum.Active],
      ['pending', StatusTypeEnum.Pending],
      ['incomplete', StatusTypeEnum.Incomplete],
      ['canceled', StatusTypeEnum.Canceled],
      ['terminated', StatusTypeEnum.Terminated],
    ])('THEN displays chip for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByText(enumValue)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      const multipleValues = `${StatusTypeEnum.Active},${StatusTypeEnum.Terminated}`

      renderComponent(multipleValues)

      await waitFor(() => {
        expect(screen.getByText(StatusTypeEnum.Active)).toBeInTheDocument()
        expect(screen.getByText(StatusTypeEnum.Terminated)).toBeInTheDocument()
      })
    })
  })
})
