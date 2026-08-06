import { renderHook, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableColumn } from '~/components/designSystem/Table/Table'
import { ProductForListFragment, ProductTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  PRODUCT_ITEM_TYPE_TRANSLATION_KEY,
  useProductTableColumns,
} from '../useProductTableColumns'

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

const buildProduct = (overrides: Partial<ProductForListFragment> = {}): ProductForListFragment => ({
  __typename: 'Product',
  id: 'pitem-1',
  name: 'Seats',
  code: 'seats',
  invoiceDisplayName: 'Seat charge',
  productType: ProductTypeEnum.Fixed,
  filtersCount: 3,
  createdAt: '2024-01-20T00:00:00Z',
  description: null,
  attachedToPlanOrSubscription: false,
  productCategory: {
    __typename: 'ProductCategory',
    id: 'prod-1',
    name: 'Object storage',
    code: 'object_storage',
  },
  billableMetric: null,
  ...overrides,
})

const renderColumns = (withAttachedProductCategory: boolean) =>
  renderHook(() => useProductTableColumns({ withAttachedProductCategory })).result.current

const getColumnContent = (
  columns: Array<TableColumn<ProductForListFragment> | null>,
  key: string,
): ((item: ProductForListFragment) => ReactNode) => {
  const column = columns.find(
    (candidate): candidate is TableColumn<ProductForListFragment> => candidate?.key === key,
  )

  if (!column?.content) {
    throw new Error(`Column "${key}" or its content renderer was not found`)
  }

  return column.content
}

describe('useProductTableColumns', () => {
  describe('GIVEN the attached-productCategory column is requested', () => {
    describe('WHEN the hook runs', () => {
      it('THEN returns the name, attached productCategory, filters count, type and created columns', () => {
        const columns = renderColumns(true)

        expect(columns.filter(Boolean).map((column) => column?.key)).toEqual([
          'name',
          'productCategory.name',
          'filtersCount',
          'productType',
          'createdAt',
        ])
      })
    })
  })

  describe('GIVEN the attached-productCategory column is not requested', () => {
    describe('WHEN the hook runs', () => {
      it('THEN drops the attached-productCategory column', () => {
        const columns = renderColumns(false)

        expect(columns.filter(Boolean).map((column) => column?.key)).toEqual([
          'name',
          'filtersCount',
          'productType',
          'createdAt',
        ])
      })
    })
  })

  describe('GIVEN a productCategory item row', () => {
    describe('WHEN the name column content renders', () => {
      it('THEN prefers the invoice display name and shows the code', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'name')(buildProduct())}</>)

        expect(screen.getByText('Seat charge')).toBeInTheDocument()
        expect(screen.getByText('seats')).toBeInTheDocument()
      })

      it('THEN falls back to the name when there is no invoice display name', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'name')(buildProduct({ invoiceDisplayName: null }))}</>)

        expect(screen.getByText('Seats')).toBeInTheDocument()
      })
    })

    describe('WHEN the attached-productCategory column content renders', () => {
      it('THEN shows the productCategory name', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'productCategory.name')(buildProduct())}</>)

        expect(screen.getByText('Object storage')).toBeInTheDocument()
      })

      it('THEN shows a dash when there is no attached productCategory', () => {
        const columns = renderColumns(true)

        render(
          <>
            {getColumnContent(
              columns,
              'productCategory.name',
            )(buildProduct({ productCategory: null }))}
          </>,
        )

        expect(screen.getByText('-')).toBeInTheDocument()
      })
    })

    describe('WHEN the filters count column content renders', () => {
      it('THEN shows the filters count', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'filtersCount')(buildProduct({ filtersCount: 7 }))}</>)

        expect(screen.getByText('7')).toBeInTheDocument()
      })
    })

    describe('WHEN the item type column content renders', () => {
      it('THEN shows the mapped type label in a chip', () => {
        const columns = renderColumns(true)

        render(
          <>
            {getColumnContent(
              columns,
              'productType',
            )(buildProduct({ productType: ProductTypeEnum.Usage }))}
          </>,
        )

        expect(
          screen.getByText(PRODUCT_ITEM_TYPE_TRANSLATION_KEY[ProductTypeEnum.Usage]),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN the created column content renders', () => {
      it('THEN shows the organization-timezone formatted date', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'createdAt')(buildProduct())}</>)

        expect(screen.getByText('Jan 20, 2024')).toBeInTheDocument()
      })
    })
  })
})
