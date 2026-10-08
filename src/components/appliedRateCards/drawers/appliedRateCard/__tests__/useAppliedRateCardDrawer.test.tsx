import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { CREATE_MORE_SWITCH_TEST_ID } from '~/components/drawers/createMore/CreateMoreControl'
import { addToast } from '~/core/apolloClient'
import {
  CreateContractAppliedRateCardDocument,
  CreatePlanAppliedRateCardDocument,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { useAppliedRateCardDrawer } from '../useAppliedRateCardDrawer'

type CapturedDrawerArgs = {
  title?: ReactNode
  children?: ReactNode
  mainAction?: ReactNode
  secondaryAction?: ReactNode
  form?: { id: string; submit: () => void | Promise<void> }
  closeOnSubmitSuccess?: boolean
}

let lastDrawerArgs: CapturedDrawerArgs | null = null
const mockOpen = jest.fn((args: CapturedDrawerArgs) => {
  lastDrawerArgs = args
})
const mockClose = jest.fn()
const mockNavigate = jest.fn()

// Mock the NiceModal-backed drawer hook so Jest never loads the drawer stack
// (drawerStack.ts uses import.meta and crashes Jest) and we can capture the
// args the hook passes to `open`.
jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

// Replace the drawer body (drives the real product/rate-card cascade query, out of scope for
// this hook's own submit/create-more/navigate behavior) with a control that seeds the fields
// directly, mirroring useRateCardDrawer.create.test.tsx's own established pattern.
jest.mock('../AppliedRateCardDrawerContent', () => ({
  AppliedRateCardDrawerContent: ({
    context,
    form,
  }: {
    context: 'plan' | 'contract'
    form: { setFieldValue: (name: string, value: unknown) => void }
  }) => (
    <>
      <span data-test="context-probe">{context}</span>
      <button
        type="button"
        onClick={() => {
          form.setFieldValue('productId', 'product-1')
          form.setFieldValue('rateCardId', 'standard-card')
          form.setFieldValue('currency', 'USD')
        }}
      >
        seed required fields
      </button>
      <button type="button" onClick={() => form.setFieldValue('billingAnchorDate', '2026-01-01')}>
        seed billing anchor date
      </button>
    </>
  ),
}))

const createPlanAppliedRateCardMock = (
  captureInput: (input: Record<string, unknown>) => void,
): MockedResponse => ({
  request: { query: CreatePlanAppliedRateCardDocument },
  variableMatcher: (vars) => {
    captureInput(vars?.input)
    return true
  },
  result: { data: { createPlanAppliedRateCard: { id: 'applied-rc-1' } } },
})

const createContractAppliedRateCardMock = (
  captureInput: (input: Record<string, unknown>) => void,
): MockedResponse => ({
  request: { query: CreateContractAppliedRateCardDocument },
  variableMatcher: (vars) => {
    captureInput(vars?.input)
    return true
  },
  result: { data: { createContractAppliedRateCard: { id: 'applied-rc-2' } } },
})

const renderDrawerHook = (mocks: MockedResponse[] = []) =>
  renderHook(() => useAppliedRateCardDrawer(), {
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

const renderDrawerBody = () =>
  render(
    <MockedProvider mocks={[]} addTypename={false}>
      {lastDrawerArgs?.children}
    </MockedProvider>,
  )

const submit = async () => {
  await act(async () => {
    await lastDrawerArgs?.form?.submit()
  })
}

describe('useAppliedRateCardDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  it('GIVEN context plan THEN submitting with an empty local phases array calls createPlanAppliedRateCard with no ratePhases key', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([
      createPlanAppliedRateCardMock((input) => (capturedInput = input)),
    ])

    act(() => result.current.openDrawer({ context: 'plan', planId: 'plan-1' }))
    renderDrawerBody()
    await userEvent.click(screen.getByRole('button', { name: 'seed required fields' }))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

    expect(capturedInput).toMatchObject({ planId: 'plan-1', rateCardCode: 'standard-card' })
    expect(capturedInput).not.toHaveProperty('ratePhases')
  })

  it('GIVEN context contract THEN the billing anchor date field renders and submitting includes billingAnchorDate', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([
      createContractAppliedRateCardMock((input) => (capturedInput = input)),
    ])

    act(() => result.current.openDrawer({ context: 'contract', contractId: 'contract-1' }))
    renderDrawerBody()

    expect(screen.getByTestId('context-probe')).toHaveTextContent('contract')

    await userEvent.click(screen.getByRole('button', { name: 'seed required fields' }))
    await userEvent.click(screen.getByRole('button', { name: 'seed billing anchor date' }))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

    expect(capturedInput).toMatchObject({
      externalId: 'contract-1',
      rateCardCode: 'standard-card',
      billingAnchorDate: '2026-01-01',
    })
  })

  it('GIVEN context contract THEN no effective date field renders anywhere in the drawer', async () => {
    const { result } = renderDrawerHook()

    act(() => result.current.openDrawer({ context: 'contract', contractId: 'contract-1' }))
    renderDrawerBody()

    expect(screen.queryByText(/effective date/i)).not.toBeInTheDocument()
  })

  it('GIVEN create-more is enabled THEN on success the form resets and a toast with a link renders instead of navigating', async () => {
    let capturedInput: Record<string, unknown> = {}
    const { result } = renderDrawerHook([
      createPlanAppliedRateCardMock((input) => (capturedInput = input)),
    ])

    act(() => result.current.openDrawer({ context: 'plan', planId: 'plan-1' }))

    render(<>{lastDrawerArgs?.secondaryAction}</>)
    await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

    renderDrawerBody()
    await userEvent.click(screen.getByRole('button', { name: 'seed required fields' }))
    await submit()

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' })),
    )
    expect(capturedInput).toMatchObject({ rateCardCode: 'standard-card' })
    expect(mockClose).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("GIVEN create-more is disabled THEN on success the drawer closes and navigates to the new applied rate card's detail route", async () => {
    const { result } = renderDrawerHook([createPlanAppliedRateCardMock(() => undefined)])

    act(() => result.current.openDrawer({ context: 'plan', planId: 'plan-1' }))
    renderDrawerBody()
    await userEvent.click(screen.getByRole('button', { name: 'seed required fields' }))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))

    expect(mockNavigate).toHaveBeenCalledWith('/plan-pricing/plan-1/rate-cards/applied-rc-1')
  })
})
