import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  DeleteProductItemDocument,
  GetProductItemsForProductDetailsDocument,
  ProductItemsDocument,
} from '~/generated/graphql'

import { useDeleteProductItemDialog } from '../useDeleteProductItemDialog'

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

const productItemFixture = { id: 'pitem-1', name: 'Seats' }

const deleteMockFactory = (result: MockedResponse['result']): MockedResponse => ({
  request: { query: DeleteProductItemDocument },
  variableMatcher: (vars) => vars?.input?.id === 'pitem-1',
  result,
})

const renderDialogHook = (mocks: MockedResponse[] = []) =>
  renderHook(() => useDeleteProductItemDialog(), {
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

describe('useDeleteProductItemDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDialogArgs = null
  })

  it('opens a danger dialog naming the product item', () => {
    const { result } = renderDialogHook()

    act(() => result.current.openDeleteProductItemDialog({ productItem: productItemFixture }))

    expect(mockDialogOpen).toHaveBeenCalledTimes(1)
    expect(lastDialogArgs?.title).toBe('text_1783980718114rgp3b8u2b8y|Seats')
    expect(lastDialogArgs?.description).toBe('text_1783980718114rt2un11i7wa')
    expect(lastDialogArgs?.colorVariant).toBe('danger')
    expect(lastDialogArgs?.actionText).toBe('text_17839807181152ujl4fo6wyy')
  })

  it('destroys the item then evicts it, runs the callback and toasts', async () => {
    const callback = jest.fn()
    const { result } = renderDialogHook([
      deleteMockFactory({ data: { destroyProductItem: { id: 'pitem-1' } } }),
    ])

    act(() =>
      result.current.openDeleteProductItemDialog({ productItem: productItemFixture, callback }),
    )

    await act(async () => {
      await lastDialogArgs?.onAction?.()
    })

    expect(evictFromCache).toHaveBeenCalledWith(expect.anything(), {
      id: 'pitem-1',
      __typename: 'ProductItem',
      listFieldName: 'productItems',
      listQueryDocument: [ProductItemsDocument, GetProductItemsForProductDetailsDocument],
    })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(addToast).toHaveBeenCalledWith({
      message: 'text_1783980718115h8wwdamd5di',
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

    act(() =>
      result.current.openDeleteProductItemDialog({ productItem: productItemFixture, callback }),
    )

    await act(async () => {
      await lastDialogArgs?.onAction?.()
    })

    expect(evictFromCache).not.toHaveBeenCalled()
    expect(callback).not.toHaveBeenCalled()
    expect(addToast).not.toHaveBeenCalled()
  })
})
