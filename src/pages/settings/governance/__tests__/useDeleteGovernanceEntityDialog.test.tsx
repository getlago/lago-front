import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import {
  DestroyGovernanceEntityDocument,
  DestroyGovernanceEntityMutationOptions,
} from '~/generated/graphql'

import { useDeleteGovernanceEntityDialog } from '../useDeleteGovernanceEntityDialog'

type CapturedDialogArgs = {
  title?: string
  description?: string
  colorVariant?: string
  actionText?: string
  onAction?: () => Promise<void> | void
}

type RefetchQueriesFn = Extract<
  NonNullable<DestroyGovernanceEntityMutationOptions['refetchQueries']>,
  (...args: never[]) => unknown
>

let lastDialogArgs: CapturedDialogArgs | null = null
const mockDialogOpen = jest.fn((args: CapturedDialogArgs) => {
  lastDialogArgs = args
})

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen }),
}))

const mockMutationOptions: { current?: DestroyGovernanceEntityMutationOptions } = {}

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  return {
    ...actual,
    useDestroyGovernanceEntityMutation: (options: DestroyGovernanceEntityMutationOptions) => {
      mockMutationOptions.current = options

      return actual.useDestroyGovernanceEntityMutation(options)
    },
  }
})

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const ENTITY_ID = 'entity-1'

const destroyMock = (result: MockedResponse['result']): MockedResponse & { result: jest.Mock } => ({
  request: { query: DestroyGovernanceEntityDocument, variables: { input: { id: ENTITY_ID } } },
  result: jest.fn(() => result),
})

const openDialog = (mocks: MockedResponse[] = []): void => {
  const { result } = renderHook(() => useDeleteGovernanceEntityDialog(), {
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

  act(() => result.current.openDeleteGovernanceEntityDialog({ id: ENTITY_ID }))
}

const confirm = async (): Promise<void> => {
  await act(async () => {
    await lastDialogArgs?.onAction?.()
  })
}

const refetchQueriesFor = (result: Parameters<RefetchQueriesFn>[0]): unknown => {
  const { refetchQueries } = mockMutationOptions.current ?? {}

  if (typeof refetchQueries !== 'function') throw new Error('refetchQueries is not a function')

  return refetchQueries(result)
}

describe('useDeleteGovernanceEntityDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDialogArgs = null
  })

  describe('GIVEN the dialog is opened', () => {
    it('THEN should open a danger confirmation', () => {
      openDialog()

      expect(mockDialogOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          description: expect.any(String),
          actionText: expect.any(String),
          colorVariant: 'danger',
        }),
      )
    })
  })

  describe('GIVEN the deletion is confirmed', () => {
    describe('WHEN the mutation succeeds', () => {
      it('THEN should destroy the entity by id and show a success toast', async () => {
        const mutation = destroyMock({ data: { destroyUsageAttributionType: { id: ENTITY_ID } } })

        openDialog([mutation])
        await confirm()

        await waitFor(() => expect(mutation.result).toHaveBeenCalledTimes(1))
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })

      it('THEN should refetch the list and the role counts', () => {
        openDialog()

        expect(
          refetchQueriesFor({ data: { destroyUsageAttributionType: { id: ENTITY_ID } } }),
        ).toEqual(['getGovernanceEntities', 'getGovernanceEntitiesRoleCounts'])
      })
    })

    describe('WHEN the mutation fails', () => {
      it('THEN should not show a success toast', async () => {
        const mutation = destroyMock({ errors: [new GraphQLError('Not found')] })

        openDialog([mutation])
        await confirm()

        await waitFor(() => expect(mutation.result).toHaveBeenCalledTimes(1))
        expect(addToast).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })

      it('THEN should refetch nothing', () => {
        openDialog()

        expect(refetchQueriesFor({ errors: [new GraphQLError('Not found')] })).toEqual([])
      })
    })
  })
})
