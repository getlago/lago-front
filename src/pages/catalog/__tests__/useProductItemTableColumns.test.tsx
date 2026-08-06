import { renderHook, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableColumn } from '~/components/designSystem/Table/Table'
import { ProductItemForListFragment, ProductItemTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  PRODUCT_ITEM_TYPE_TRANSLATION_KEY,
  useProductItemTableColumns,
} from '../useProductItemTableColumns'

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

const buildProductItem = (
  overrides: Partial<ProductItemForListFragment> = {},
): ProductItemForListFragment => ({
  __typename: 'ProductItem',
  id: 'pitem-1',
  name: 'Seats',
  code: 'seats',
  invoiceDisplayName: 'Seat charge',
  itemType: ProductItemTypeEnum.Fixed,
  filtersCount: 3,
  createdAt: '2024-01-20T00:00:00Z',
  description: null,
  attachedToPlanOrSubscription: false,
  product: { __typename: 'Product', id: 'prod-1', name: 'Object storage', code: 'object_storage' },
  billableMetric: null,
  ...overrides,
})

const renderColumns = (withAttachedProduct: boolean) =>
  renderHook(() => useProductItemTableColumns({ withAttachedProduct })).result.current

const getColumnContent = (
  columns: Array<TableColumn<ProductItemForListFragment> | null>,
  key: string,
): ((item: ProductItemForListFragment) => ReactNode) => {
  const column = columns.find(
    (candidate): candidate is TableColumn<ProductItemForListFragment> => candidate?.key === key,
  )

  if (!column?.content) {
    throw new Error(`Column "${key}" or its content renderer was not found`)
  }

  return column.content
}

describe('useProductItemTableColumns', () => {
  describe('GIVEN the attached-product column is requested', () => {
    describe('WHEN the hook runs', () => {
      it('THEN returns the name, attached product, filters count, type and created columns', () => {
        const columns = renderColumns(true)

        expect(columns.filter(Boolean).map((column) => column?.key)).toEqual([
          'name',
          'product.name',
          'filtersCount',
          'itemType',
          'createdAt',
        ])
      })
    })
  })

  describe('GIVEN the attached-product column is not requested', () => {
    describe('WHEN the hook runs', () => {
      it('THEN drops the attached-product column', () => {
        const columns = renderColumns(false)

        expect(columns.filter(Boolean).map((column) => column?.key)).toEqual([
          'name',
          'filtersCount',
          'itemType',
          'createdAt',
        ])
      })
    })
  })

  describe('GIVEN a product item row', () => {
    describe('WHEN the name column content renders', () => {
      it('THEN prefers the invoice display name and shows the code', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'name')(buildProductItem())}</>)

        expect(screen.getByText('Seat charge')).toBeInTheDocument()
        expect(screen.getByText('seats')).toBeInTheDocument()
      })

      it('THEN falls back to the name when there is no invoice display name', () => {
        const columns = renderColumns(true)

        render(
          <>{getColumnContent(columns, 'name')(buildProductItem({ invoiceDisplayName: null }))}</>,
        )

        expect(screen.getByText('Seats')).toBeInTheDocument()
      })
    })

    describe('WHEN the attached-product column content renders', () => {
      it('THEN shows the product name', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'product.name')(buildProductItem())}</>)

        expect(screen.getByText('Object storage')).toBeInTheDocument()
      })

      it('THEN shows a dash when there is no attached product', () => {
        const columns = renderColumns(true)

        render(
          <>{getColumnContent(columns, 'product.name')(buildProductItem({ product: null }))}</>,
        )

        expect(screen.getByText('-')).toBeInTheDocument()
      })
    })

    describe('WHEN the filters count column content renders', () => {
      it('THEN shows the filters count', () => {
        const columns = renderColumns(true)

        render(
          <>{getColumnContent(columns, 'filtersCount')(buildProductItem({ filtersCount: 7 }))}</>,
        )

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
              'itemType',
            )(buildProductItem({ itemType: ProductItemTypeEnum.Usage }))}
          </>,
        )

        expect(
          screen.getByText(PRODUCT_ITEM_TYPE_TRANSLATION_KEY[ProductItemTypeEnum.Usage]),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN the created column content renders', () => {
      it('THEN shows the organization-timezone formatted date', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'createdAt')(buildProductItem())}</>)

        expect(screen.getByText('Jan 20, 2024')).toBeInTheDocument()
      })
    })
  })
})
