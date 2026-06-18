import { renderHook } from '@testing-library/react'

import { OrderFormListItemFragment, OrderFormStatusEnum } from '~/generated/graphql'
import { buildQuotePreviewProps } from '~/pages/quotes/common/buildQuotePreviewProps'
import { testMockNavigateFn } from '~/test-utils'

import { useOrderFormActions } from '../useOrderFormActions'

const mockHasPermissions = jest.fn()
const mockDownload = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: mockHasPermissions,
  }),
}))

jest.mock('~/pages/quotes/common/QuotePdfProvider', () => ({
  useDownloadQuotePdf: () => ({ download: mockDownload }),
}))

jest.mock('~/pages/quotes/common/buildQuotePreviewProps', () => ({
  buildQuotePreviewProps: jest.fn(() => ({ content: '# Hello World' })),
}))

const mockedBuildQuotePreviewProps = buildQuotePreviewProps as jest.MockedFunction<
  typeof buildQuotePreviewProps
>

const createMockOrderForm = (
  overrides: Partial<OrderFormListItemFragment> = {},
): OrderFormListItemFragment => ({
  id: 'of-1',
  number: 'OF-2026-0001',
  status: OrderFormStatusEnum.Generated,
  createdAt: '2026-04-10T10:00:00Z',
  customer: { id: 'customer-001', name: 'Acme Corp' },
  quote: {
    id: 'q-1',
    number: 'QUO-001',
    currentVersion: { id: 'qv-1', version: 1, content: '# Hello World' },
  },
  ...overrides,
})

describe('useOrderFormActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockDownload.mockResolvedValue(undefined)
  })

  describe('GIVEN a generated order form with all permissions', () => {
    describe('WHEN getActions is called', () => {
      it('THEN should return 2 actions: download and void', () => {
        const { result } = renderHook(() => useOrderFormActions())
        const actions = result.current.getActions(createMockOrderForm())

        expect(actions).toHaveLength(2)
        expect(actions[0].icon).toBe('download')
        expect(actions[1].icon).toBe('stop')
      })
    })
  })

  describe('GIVEN a signed order form', () => {
    describe('WHEN getActions is called', () => {
      it('THEN should return only the download action', () => {
        const { result } = renderHook(() => useOrderFormActions())
        const actions = result.current.getActions(
          createMockOrderForm({ status: OrderFormStatusEnum.Signed }),
        )

        expect(actions).toHaveLength(1)
        expect(actions[0].icon).toBe('download')
      })
    })
  })

  describe('GIVEN a voided order form', () => {
    describe('WHEN getActions is called', () => {
      it('THEN should return only the download action', () => {
        const { result } = renderHook(() => useOrderFormActions())
        const actions = result.current.getActions(
          createMockOrderForm({ status: OrderFormStatusEnum.Voided }),
        )

        expect(actions).toHaveLength(1)
        expect(actions[0].icon).toBe('download')
      })
    })
  })

  describe('GIVEN an expired order form', () => {
    describe('WHEN getActions is called', () => {
      it('THEN should return only the download action', () => {
        const { result } = renderHook(() => useOrderFormActions())
        const actions = result.current.getActions(
          createMockOrderForm({ status: OrderFormStatusEnum.Expired }),
        )

        expect(actions).toHaveLength(1)
        expect(actions[0].icon).toBe('download')
      })
    })
  })

  describe('GIVEN a generated order form without void permission', () => {
    describe('WHEN getActions is called', () => {
      it('THEN should return only the download action', () => {
        mockHasPermissions.mockReturnValue(false)
        const { result } = renderHook(() => useOrderFormActions())
        const actions = result.current.getActions(createMockOrderForm())

        expect(actions).toHaveLength(1)
        expect(actions[0].icon).toBe('download')
      })
    })
  })

  describe('GIVEN an order form whose quote has no content', () => {
    describe('WHEN getActions is called', () => {
      it('THEN should not include the download action', () => {
        const { result } = renderHook(() => useOrderFormActions())
        const actions = result.current.getActions(
          createMockOrderForm({
            quote: {
              id: 'q-1',
              number: 'QUO-001',
              currentVersion: { id: 'qv-1', version: 1, content: null },
            },
          }),
        )

        expect(actions.find((a) => a.icon === 'download')).toBeUndefined()
      })
    })
  })

  describe('GIVEN the void action', () => {
    describe('WHEN triggered', () => {
      it('THEN should navigate to the void order form route', () => {
        const { result } = renderHook(() => useOrderFormActions())
        const actions = result.current.getActions(createMockOrderForm({ id: 'of-42' }))
        const voidAction = actions.find((a) => a.icon === 'stop')

        voidAction?.onAction()

        expect(testMockNavigateFn).toHaveBeenCalledWith('/order-form/of-42/void')
      })
    })
  })

  describe('GIVEN the download action', () => {
    describe('WHEN triggered', () => {
      it('THEN should download with preview props including the header data', () => {
        const { result } = renderHook(() => useOrderFormActions())
        const orderForm = createMockOrderForm()
        const actions = result.current.getActions(orderForm)
        const downloadAction = actions.find((a) => a.icon === 'download')

        downloadAction?.onAction()

        expect(mockedBuildQuotePreviewProps).toHaveBeenCalledWith(
          orderForm.quote.currentVersion,
          orderForm.customer,
          {
            documentNumber: 'OF-2026-0001',
            title: 'text_1781778938224v233vcwkqyt',
            rows: ['text_1781778938224iupllzr5sgb'],
          },
        )
        expect(mockDownload).toHaveBeenCalledWith({ content: '# Hello World' })
      })
    })
  })
})
