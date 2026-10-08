import { renderHook, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableColumn } from '~/components/designSystem/Table/Table'
import { render } from '~/test-utils'

import {
  CatalogPlanForTableColumns,
  useCatalogPlanTableColumns,
} from '../useCatalogPlanTableColumns'

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

const buildCatalogPlan = (
  overrides: Partial<CatalogPlanForTableColumns> = {},
): CatalogPlanForTableColumns => ({
  name: 'Premium',
  code: 'premium',
  invoiceDisplayName: null,
  appliedRateCardsCount: 3,
  contractsCount: 2,
  createdAt: '2024-01-20T00:00:00Z',
  ...overrides,
})

const renderColumns = () => renderHook(() => useCatalogPlanTableColumns()).result.current

const getColumnContent = (
  columns: TableColumn<CatalogPlanForTableColumns>[],
  key: string,
): ((item: CatalogPlanForTableColumns) => ReactNode) => {
  const column = columns.find((candidate) => candidate.key === key)

  if (!column?.content) {
    throw new Error(`Column "${key}" or its content renderer was not found`)
  }

  return column.content
}

describe('useCatalogPlanTableColumns', () => {
  it('returns the name, applied rate cards, contracts and created columns', () => {
    const columns = renderColumns()

    expect(columns.map((column) => column.key)).toEqual([
      'name',
      'appliedRateCardsCount',
      'contractsCount',
      'createdAt',
    ])
  })

  describe('GIVEN a catalog plan row', () => {
    describe('WHEN the name column content renders', () => {
      it('THEN prefers the invoice display name and shows the code', () => {
        const columns = renderColumns()

        render(
          <>
            {getColumnContent(
              columns,
              'name',
            )(buildCatalogPlan({ invoiceDisplayName: 'Premium (invoiced)' }))}
          </>,
        )

        expect(screen.getByText('Premium (invoiced)')).toBeInTheDocument()
        expect(screen.queryByText('Premium')).not.toBeInTheDocument()
        expect(screen.getByText('premium')).toBeInTheDocument()
      })

      it('THEN falls back to the name when there is no invoice display name', () => {
        const columns = renderColumns()

        render(<>{getColumnContent(columns, 'name')(buildCatalogPlan())}</>)

        expect(screen.getByText('Premium')).toBeInTheDocument()
      })
    })

    describe('WHEN the applied rate cards column content renders', () => {
      it('THEN shows the count', () => {
        const columns = renderColumns()

        render(
          <>
            {getColumnContent(
              columns,
              'appliedRateCardsCount',
            )(buildCatalogPlan({ appliedRateCardsCount: 7 }))}
          </>,
        )

        expect(screen.getByText('7')).toBeInTheDocument()
      })
    })

    describe('WHEN the contracts column content renders', () => {
      it('THEN shows the count', () => {
        const columns = renderColumns()

        render(
          <>
            {getColumnContent(columns, 'contractsCount')(buildCatalogPlan({ contractsCount: 4 }))}
          </>,
        )

        expect(screen.getByText('4')).toBeInTheDocument()
      })
    })

    describe('WHEN the created column content renders', () => {
      it('THEN shows the organization-timezone formatted date', () => {
        const columns = renderColumns()

        render(<>{getColumnContent(columns, 'createdAt')(buildCatalogPlan())}</>)

        expect(screen.getByText('Jan 20, 2024')).toBeInTheDocument()
      })
    })
  })
})
