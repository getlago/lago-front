import { screen } from '@testing-library/react'

import { OrderFormStatusEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { orderFormCreatedAtColumn, orderFormStatusColumn } from '../orderFormTableColumns'

describe('orderFormStatusColumn', () => {
  const mockTranslate = jest.fn((key: string) => key)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the column config is created', () => {
    it('THEN should return a column with key "status"', () => {
      const column = orderFormStatusColumn(mockTranslate)

      expect(column.key).toBe('status')
    })

    it('THEN should have minWidth of 100', () => {
      const column = orderFormStatusColumn(mockTranslate)

      expect(column.minWidth).toBe(100)
    })

    describe('WHEN rendering content for a generated order form', () => {
      it('THEN should render a Status component with warning type', () => {
        const column = orderFormStatusColumn(mockTranslate)
        const content = column.content({
          id: 'of-1',
          number: 'OF-001',
          status: OrderFormStatusEnum.Generated,
          createdAt: '2026-04-10T10:00:00Z',
          customer: { id: 'c-1', name: 'Test Customer' },
        })

        render(<>{content}</>)

        const statusEl = screen.getByTestId('status')

        expect(statusEl).toBeInTheDocument()
      })
    })

    describe('WHEN rendering content for each status', () => {
      it.each([
        [OrderFormStatusEnum.Generated],
        [OrderFormStatusEnum.Signed],
        [OrderFormStatusEnum.Voided],
        [OrderFormStatusEnum.Expired],
      ])('THEN should render a status badge for %s', (status) => {
        const column = orderFormStatusColumn(mockTranslate)
        const content = column.content({
          id: 'of-1',
          number: 'OF-001',
          status,
          createdAt: '2026-04-10T10:00:00Z',
          customer: { id: 'c-1', name: 'Test Customer' },
        })

        render(<>{content}</>)

        expect(screen.getByTestId('status')).toBeInTheDocument()
      })
    })
  })
})

describe('orderFormCreatedAtColumn', () => {
  const mockTranslate = jest.fn((key: string) => key)
  const mockIntlFormatDateTimeOrgaTZ = jest.fn((date: string) => ({
    date: new Date(date).toLocaleDateString('en-US'),
  }))

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the column config is created', () => {
    it('THEN should return a column with key "createdAt"', () => {
      const column = orderFormCreatedAtColumn(
        mockTranslate,
        'text_titleKey',
        mockIntlFormatDateTimeOrgaTZ,
      )

      expect(column.key).toBe('createdAt')
    })

    it('THEN should have minWidth of 120', () => {
      const column = orderFormCreatedAtColumn(
        mockTranslate,
        'text_titleKey',
        mockIntlFormatDateTimeOrgaTZ,
      )

      expect(column.minWidth).toBe(120)
    })

    describe('WHEN rendering content with a date', () => {
      it('THEN should format and display the date', () => {
        const column = orderFormCreatedAtColumn(
          mockTranslate,
          'text_titleKey',
          mockIntlFormatDateTimeOrgaTZ,
        )
        const content = column.content({
          id: 'of-1',
          number: 'OF-001',
          status: OrderFormStatusEnum.Generated,
          createdAt: '2026-04-10T10:00:00Z',
          customer: { id: 'c-1', name: 'Test Customer' },
        })

        render(<>{content}</>)

        expect(mockIntlFormatDateTimeOrgaTZ).toHaveBeenCalledWith('2026-04-10T10:00:00Z')
        expect(screen.getByText('4/10/2026')).toBeInTheDocument()
      })
    })
  })
})
