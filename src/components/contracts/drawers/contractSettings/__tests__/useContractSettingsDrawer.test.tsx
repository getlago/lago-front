import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { contractForDrawerFixture } from '~/components/contracts/drawers/contract/__tests__/fixtures'
import { addToast } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { UpdateContractDocument } from '~/generated/graphql'

import { useContractSettingsDrawer } from '../useContractSettingsDrawer'

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

jest.mock('~/core/form/scrollToFirstInputError', () => ({
  scrollToFirstInputError: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const renderDrawerHook = (mocks: MockedResponse[] = []) =>
  renderHook(() => useContractSettingsDrawer(), {
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

describe('useContractSettingsDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  it('opens pristine, seeded from the contract', () => {
    const { result } = renderDrawerHook()

    act(() => result.current.openDrawer(contractForDrawerFixture))

    expect(lastDrawerArgs?.shouldPromptOnClose?.()).toBe(false)
  })

  it('submits the contract settings fields keyed on the contract external id, then closes', async () => {
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
      name: 'Enterprise agreement',
      startedAt: '2026-01-01T00:00:00.000Z',
      endedAt: '2099-12-31T00:00:00.000Z',
      billingAnchorDate: '2026-01-15',
      purchaseOrderNumber: 'PO-42',
    })
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(addToast).toHaveBeenCalledWith({
      severity: 'success',
      translateKey: 'text_1790280529941qgc3lu3ni4u',
    })
  })

  it('saves an administrative edit on an active contract whose end date has passed', async () => {
    const { result } = renderDrawerHook([updateContractMock(() => undefined)])

    act(() =>
      result.current.openDrawer({
        ...contractForDrawerFixture,
        startedAt: '2020-01-01T00:00:00Z',
        endedAt: '2021-01-01T00:00:00Z',
      }),
    )
    await submit()

    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(scrollToFirstInputError).not.toHaveBeenCalled()
  })
})
