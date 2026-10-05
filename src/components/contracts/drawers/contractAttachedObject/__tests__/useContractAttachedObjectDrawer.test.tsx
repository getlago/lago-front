import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { contractForDrawerFixture } from '~/components/contracts/drawers/contract/__tests__/fixtures'
import { addToast } from '~/core/apolloClient'
import { UpdateContractDocument } from '~/generated/graphql'

import { useContractAttachedObjectDrawer } from '../useContractAttachedObjectDrawer'

type CapturedDrawerArgs = {
  form?: { id: string; submit: () => void | Promise<void> }
  shouldPromptOnClose?: () => boolean
}

let lastDrawerArgs: CapturedDrawerArgs | null = null
const mockOpen = jest.fn((args: CapturedDrawerArgs) => {
  lastDrawerArgs = args
})
const mockClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const renderDrawerHook = (mocks: MockedResponse[] = []) =>
  renderHook(() => useContractAttachedObjectDrawer(), {
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

const submit = async (): Promise<void> => {
  await act(async () => {
    await lastDrawerArgs?.form?.submit()
  })
}

const updateContractMock = (
  onInput: (input: Record<string, unknown>) => void,
  result: MockedResponse['result'] = { data: { updateContract: contractForDrawerFixture } },
): MockedResponse => ({
  request: { query: UpdateContractDocument },
  variableMatcher: ({ input }) => {
    onInput(input)
    return true
  },
  result,
})

describe('useContractAttachedObjectDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  it('opens pristine, seeded from the contract', () => {
    const { result } = renderDrawerHook()

    act(() => result.current.openDrawer(contractForDrawerFixture))

    expect(lastDrawerArgs?.shouldPromptOnClose?.()).toBe(false)
  })

  it('submits the attached object fields keyed on the contract external id, then closes', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([
      updateContractMock((input) => {
        capturedInput = input
      }),
    ])

    act(() => result.current.openDrawer(contractForDrawerFixture))
    await submit()

    expect(capturedInput).toEqual({
      externalId: 'external-contract-1',
      planCode: 'enterprise',
      billingEntityId: 'billing-entity-2',
    })
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(addToast).toHaveBeenCalledWith({
      severity: 'success',
      translateKey: 'text_1790280529941qgc3lu3ni4u',
    })
  })
})
