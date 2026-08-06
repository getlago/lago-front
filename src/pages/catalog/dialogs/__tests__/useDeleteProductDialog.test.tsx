import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { DeleteProductDocument, ProductsDocument } from '~/generated/graphql'

import { useDeleteProductDialog } from '../useDeleteProductDialog'

type CapturedDialogArgs = {
  title?: string
  description?: string
  colorVariant?: string
  actionText?: string
  onAction?: () => Promise<void> | void
}

let lastDialogArgs: CapturedDialogArgs | null = null
const mockDialogOpen = jest.fn((args: CapturedDialogArgs) => {
  lastDialogArgs = args
})

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/apolloClient/evictFromCache', () => ({
  evictFromCache: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

const productFixture = { id: 'prod-1', name: 'Object storage' }

const deleteMockFactory = (result: MockedResponse['result']): MockedResponse => ({
  request: { query: DeleteProductDocument },
  variableMatcher: (vars) => vars?.input?.id === 'prod-1',
  result,
})

const renderDialogHook = (mocks: MockedResponse[] = []) =>
  renderHook(() => useDeleteProductDialog(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
        defaultOptions={{ mutate: { errorPolicy: 'all' } }}
      >
        {children}
      </MockedProvider>
    ),
  })

describe('useDeleteProductDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDialogArgs = null
  })

  it('opens a danger dialog naming the product', () => {
    const { result } = renderDialogHook()

    act(() => result.current.openDeleteProductDialog({ product: productFixture }))

    expect(mockDialogOpen).toHaveBeenCalledTimes(1)
    expect(lastDialogArgs?.title).toBe('text_1783627031283dfpxgl9r41e|Object storage')
    expect(lastDialogArgs?.description).toBe('text_178362703128385dvkieytgl')
    expect(lastDialogArgs?.colorVariant).toBe('danger')
    expect(lastDialogArgs?.actionText).toBe('text_1783627031283vpb5h6gacvj')
  })

  it('destroys the product then evicts it, runs the callback and toasts', async () => {
    const callback = jest.fn()
    const { result } = renderDialogHook([
      deleteMockFactory({ data: { destroyProduct: { id: 'prod-1' } } }),
    ])

    act(() => result.current.openDeleteProductDialog({ product: productFixture, callback }))

    await act(async () => {
      await lastDialogArgs?.onAction?.()
    })

    expect(evictFromCache).toHaveBeenCalledWith(expect.anything(), {
      id: 'prod-1',
      __typename: 'Product',
      listFieldName: 'products',
      listQueryDocument: ProductsDocument,
    })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(addToast).toHaveBeenCalledWith({
      message: 'text_17836270312831a7f7gdaxir',
      severity: 'success',
    })
  })

  it('does nothing beyond the mutation when the backend rejects the delete', async () => {
    const callback = jest.fn()
    const { result } = renderDialogHook([
      deleteMockFactory({
        data: null,
        errors: [new GraphQLError('Cannot delete', { extensions: { code: 'forbidden' } })],
      }),
    ])

    act(() => result.current.openDeleteProductDialog({ product: productFixture, callback }))

    await act(async () => {
      await lastDialogArgs?.onAction?.()
    })

    expect(evictFromCache).not.toHaveBeenCalled()
    expect(callback).not.toHaveBeenCalled()
    expect(addToast).not.toHaveBeenCalled()
  })
})
