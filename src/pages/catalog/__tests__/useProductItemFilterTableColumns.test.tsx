import { renderHook, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableColumn } from '~/components/designSystem/Table/Table'
import { ProductItemFilterForListFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

import { useProductItemFilterTableColumns } from '../useProductItemFilterTableColumns'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: 'Jan 20, 2024', time: '00:00' }),
  }),
}))

const buildProductItemFilter = (
  overrides: Partial<ProductItemFilterForListFragment> = {},
): ProductItemFilterForListFragment => ({
  __typename: 'ProductItemFilter',
  id: 'pitem-filter-1',
  name: 'Premium seats',
  code: 'premium_seats',
  invoiceDisplayName: 'Premium seats filter',
  createdAt: '2024-01-20T00:00:00Z',
  attachedToPlanOrSubscription: false,
  description: null,
  productItem: {
    __typename: 'ProductItem',
    id: 'pitem-1',
    name: 'Seats',
    invoiceDisplayName: 'Seat charge',
    code: 'seats',
  },
  values: [],
  ...overrides,
})

const renderColumns = (withAttachedProductItem: boolean) =>
  renderHook(() => useProductItemFilterTableColumns({ withAttachedProductItem })).result.current
    .columns

const getColumnContent = (
  columns: Array<TableColumn<ProductItemFilterForListFragment> | null>,
  key: string,
): ((item: ProductItemFilterForListFragment) => ReactNode) => {
  const column = columns.find(
    (candidate): candidate is TableColumn<ProductItemFilterForListFragment> =>
      candidate?.key === key,
  )

  if (!column?.content) {
    throw new Error(`Column "${key}" or its content renderer was not found`)
  }

  return column.content
}

describe('useProductItemFilterTableColumns', () => {
  describe('GIVEN the attached-product-item column is requested', () => {
    describe('WHEN the hook runs', () => {
      it('THEN returns the name, attached product item and created columns', () => {
        const columns = renderColumns(true)

        expect(columns.filter(Boolean).map((column) => column?.key)).toEqual([
          'name',
          'productItem.name',
          'createdAt',
        ])
      })
    })
  })

  describe('GIVEN the attached-product-item column is not requested', () => {
    describe('WHEN the hook runs', () => {
      it('THEN drops the attached-product-item column', () => {
        const columns = renderColumns(false)

        expect(columns.filter(Boolean).map((column) => column?.key)).toEqual(['name', 'createdAt'])
      })
    })
  })

  describe('GIVEN a product item filter row', () => {
    describe('WHEN the name column content renders', () => {
      it('THEN prefers the invoice display name and shows the code', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'name')(buildProductItemFilter())}</>)

        expect(screen.getByText('Premium seats filter')).toBeInTheDocument()
        expect(screen.getByText('premium_seats')).toBeInTheDocument()
      })

      it('THEN falls back to the name when there is no invoice display name', () => {
        const columns = renderColumns(true)

        render(
          <>
            {getColumnContent(
              columns,
              'name',
            )(buildProductItemFilter({ invoiceDisplayName: null }))}
          </>,
        )

        expect(screen.getByText('Premium seats')).toBeInTheDocument()
      })
    })

    describe('WHEN the attached product item column content renders', () => {
      it('THEN shows the attached product item invoice display name in a chip', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'productItem.name')(buildProductItemFilter())}</>)

        expect(screen.getByText('Seat charge')).toBeInTheDocument()
      })

      it('THEN falls back to the attached product item name when there is no invoice display name', () => {
        const columns = renderColumns(true)

        render(
          <>
            {getColumnContent(
              columns,
              'productItem.name',
            )(
              buildProductItemFilter({
                productItem: {
                  __typename: 'ProductItem',
                  id: 'pitem-1',
                  name: 'Seats',
                  invoiceDisplayName: null,
                  code: 'seats',
                },
              }),
            )}
          </>,
        )

        expect(screen.getByText('Seats')).toBeInTheDocument()
      })
    })

    describe('WHEN the created column content renders', () => {
      it('THEN shows the organization-timezone formatted date', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'createdAt')(buildProductItemFilter())}</>)

        expect(screen.getByText('Jan 20, 2024')).toBeInTheDocument()
      })
    })
  })
})
