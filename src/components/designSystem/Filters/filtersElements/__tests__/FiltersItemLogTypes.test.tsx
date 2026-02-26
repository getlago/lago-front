import { render, screen, waitFor } from '@testing-library/react'

import { LogTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { FiltersItemLogTypes } from '../FiltersItemLogTypes'

jest.mock('~/components/designSystem/Filters/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemLogTypes value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemLogTypes', () => {
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

  describe('GIVEN undefined value', () => {
    it('THEN should not crash and displays the combobox', async () => {
      renderComponent(undefined)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a single value', () => {
    describe('WHEN value is "api_key"', () => {
      it('THEN displays the chip', async () => {
        renderComponent(LogTypeEnum.ApiKey)

        await waitFor(() => {
          expect(screen.getByText(LogTypeEnum.ApiKey)).toBeInTheDocument()
        })
      })
    })

    describe('WHEN value is "user"', () => {
      it('THEN displays the chip', async () => {
        renderComponent(LogTypeEnum.User)

        await waitFor(() => {
          expect(screen.getByText(LogTypeEnum.User)).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN multiple values', () => {
    describe('WHEN two log types are selected', () => {
      it('THEN displays all chips', async () => {
        const multipleValues = `${LogTypeEnum.ApiKey},${LogTypeEnum.User}`

        renderComponent(multipleValues)

        await waitFor(() => {
          expect(screen.getByText(LogTypeEnum.ApiKey)).toBeInTheDocument()
          expect(screen.getByText(LogTypeEnum.User)).toBeInTheDocument()
        })
      })
    })
  })
})
