import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'

import { FiltersItemResourceTypes } from '~/components/Filters/graphql/filtersElements/FiltersItemResourceTypes'
import { ResourceTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

jest.mock('~/components/form', () => {
  const actual = jest.requireActual<typeof import('~/components/form')>('~/components/form')

  return {
    ...actual,
    MultipleComboBox: (props: ComponentProps<typeof actual.MultipleComboBox>) => (
      <actual.MultipleComboBox {...props} virtualized={false} />
    ),
  }
})

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemResourceTypes value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemResourceTypes', () => {
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

    it('THEN displays translated resource type options', async () => {
      renderComponent()

      fireEvent.mouseDown(screen.getByRole('combobox'))

      expect(await screen.findAllByRole('option', { name: 'Plan' })).not.toHaveLength(0)
      expect(
        screen.queryByRole('option', { name: ResourceTypeEnum.CatalogPlan }),
      ).not.toBeInTheDocument()
    })
  })

  describe('GIVEN a single value', () => {
    it.each([
      [ResourceTypeEnum.BillableMetric, 'Billable metric'],
      [ResourceTypeEnum.CatalogPlan, 'Plan'],
      [ResourceTypeEnum.Invoice, 'Invoice'],
      [ResourceTypeEnum.Subscription, 'Subscription'],
    ])('THEN displays the translated chip for %s', async (enumValue, label) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByText(label)).toBeInTheDocument()
      })

      expect(screen.queryByText(enumValue)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      const multipleValues = `${ResourceTypeEnum.Invoice},${ResourceTypeEnum.Subscription}`

      renderComponent(multipleValues)

      await waitFor(() => {
        expect(screen.getByText('Invoice')).toBeInTheDocument()
        expect(screen.getByText('Subscription')).toBeInTheDocument()
      })
    })
  })
})
