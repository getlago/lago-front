import { act, renderHook } from '@testing-library/react'

import { OrderFormListItemFragment, OrderFormStatusEnum } from '~/generated/graphql'
import { testMockNavigateFn } from '~/test-utils'

import { useOrderFormActions } from '../useOrderFormActions'

const mockHasPermissions = jest.fn()

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

const mockGetQuote = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetQuoteLazyQuery: () => [mockGetQuote, { loading: false }],
}))

jest.mock('~/components/designSystem/RichTextEditor/common/downloadMarkdownPdf', () => ({
  downloadMarkdownPdf: jest.fn(),
}))

const createMockOrderForm = (
  overrides: Partial<OrderFormListItemFragment> = {},
): OrderFormListItemFragment => ({
  id: 'of-1',
  number: 'OF-2026-0001',
  status: OrderFormStatusEnum.Generated,
  createdAt: '2026-04-10T10:00:00Z',
  customer: { id: 'customer-001', name: 'Acme Corp' },
  quote: { id: 'q-1', number: 'QUO-001', currentVersion: { id: 'qv-1', version: 1 } },
  ...overrides,
})

describe('useOrderFormActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
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
    describe('WHEN triggered and quote content is fetched successfully', () => {
      it('THEN should call downloadMarkdownPdf with the content', async () => {
        const { downloadMarkdownPdf } = jest.requireMock(
          '~/components/designSystem/RichTextEditor/common/downloadMarkdownPdf',
        )

        mockGetQuote.mockResolvedValueOnce({
          data: {
            quote: {
              id: 'q-1',
              currentVersion: { content: '# Hello World' },
            },
          },
        })

        const { result } = renderHook(() => useOrderFormActions())
        const actions = result.current.getActions(createMockOrderForm())
        const downloadAction = actions.find((a) => a.icon === 'download')

        await act(async () => {
          await downloadAction?.onAction()
        })

        expect(mockGetQuote).toHaveBeenCalledWith({ variables: { id: 'q-1' } })
        expect(downloadMarkdownPdf).toHaveBeenCalledWith({ markdown: '# Hello World' })
      })
    })

    describe('WHEN triggered but quote has no content', () => {
      it('THEN should not call downloadMarkdownPdf', async () => {
        const { downloadMarkdownPdf } = jest.requireMock(
          '~/components/designSystem/RichTextEditor/common/downloadMarkdownPdf',
        )

        mockGetQuote.mockResolvedValueOnce({
          data: {
            quote: {
              id: 'q-1',
              currentVersion: { content: null },
            },
          },
        })

        const { result } = renderHook(() => useOrderFormActions())
        const actions = result.current.getActions(createMockOrderForm())
        const downloadAction = actions.find((a) => a.icon === 'download')

        await act(async () => {
          await downloadAction?.onAction()
        })

        expect(downloadMarkdownPdf).not.toHaveBeenCalled()
      })
    })
  })
})
