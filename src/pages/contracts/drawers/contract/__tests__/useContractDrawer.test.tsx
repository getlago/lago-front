import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { CreateContractDocument } from '~/generated/graphql'
import { render } from '~/test-utils'

import { CONTRACT_FORM_ID } from '../constants'
import { useContractDrawer } from '../useContractDrawer'

type CapturedDrawerArgs = {
  children?: ReactNode
  form?: { id: string; submit: () => void | Promise<void> }
  closeOnSubmitSuccess?: boolean
  shouldPromptOnClose?: () => boolean
}

let lastDrawerArgs: CapturedDrawerArgs | null = null
const mockOpen = jest.fn((args: CapturedDrawerArgs) => {
  lastDrawerArgs = args
})
const mockClose = jest.fn()
const mockNavigate = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/components/drawers/createMore/useCreateMore', () => ({
  useCreateMore: () => ({
    createMoreControl: null,
    isCreateMoreEnabled: () => false,
    resetCreateMore: jest.fn(),
    resetSignal: undefined,
    notifyReset: jest.fn(),
  }),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => ({ organizationSlug: 'acme' }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/form/scrollToFirstInputError', () => ({
  scrollToFirstInputError: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('../ContractDrawerContent', () => ({
  ContractDrawerContent: ({
    form,
  }: {
    form: { setFieldValue: (name: string, value: unknown) => void }
  }) => (
    <button
      type="button"
      onClick={() => {
        form.setFieldValue('externalCustomerId', 'customer-external-id')
        form.setFieldValue('externalId', 'customer-contract-id')
        form.setFieldValue('planCode', 'enterprise')
        form.setFieldValue('name', 'Enterprise agreement')
        form.setFieldValue('billingEntityId', 'billing-entity-1')
        form.setFieldValue('consolidateInvoice', false)
        form.setFieldValue('paymentMethod', {
          paymentMethodId: 'payment-method-1',
          paymentMethodType: 'provider',
        })
        form.setFieldValue('purchaseOrderNumber', '  PO-42  ')
        form.setFieldValue('startedAt', '2099-01-01T00:00:00.000Z')
        form.setFieldValue('endedAt', '2099-02-01T00:00:00.000Z')
        form.setFieldValue('billingAnchorDate', '2099-01-01T00:00:00.000Z')
      }}
    >
      seed contract
    </button>
  ),
}))

const renderDrawerHook = (mocks: MockedResponse[] = []) =>
  renderHook(() => useContractDrawer(), {
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

describe('useContractDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('opens with the canonical form drawer configuration', () => {
    const { result } = renderDrawerHook()

    act(() => result.current.openDrawer())

    expect(lastDrawerArgs?.form?.id).toBe(CONTRACT_FORM_ID)
    expect(lastDrawerArgs?.closeOnSubmitSuccess).toBe(false)
    expect(lastDrawerArgs?.shouldPromptOnClose?.()).toBe(false)
  })

  it('submits the selected customer and plan, then navigates to the created contract', async () => {
    let capturedInput: Record<string, unknown> = {}
    const createContractMock: MockedResponse = {
      request: { query: CreateContractDocument },
      variableMatcher: ({ input }) => {
        capturedInput = input
        return true
      },
      result: {
        data: {
          createContract: {
            id: 'contract-1',
            name: 'Enterprise agreement',
            externalId: 'customer-contract-id',
          },
        },
      },
    }
    const { result } = renderDrawerHook([createContractMock])

    act(() => result.current.openDrawer())
    render(<MockedProvider>{lastDrawerArgs?.children}</MockedProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'seed contract' }))
    await submit()

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))
    expect(capturedInput).toEqual({
      externalCustomerId: 'customer-external-id',
      externalId: 'customer-contract-id',
      planCode: 'enterprise',
      name: 'Enterprise agreement',
      billingEntityId: 'billing-entity-1',
      consolidateInvoice: false,
      paymentMethod: {
        paymentMethodId: 'payment-method-1',
        paymentMethodType: 'provider',
      },
      purchaseOrderNumber: 'PO-42',
      startedAt: '2099-01-01T00:00:00.000Z',
      endedAt: '2099-02-01T00:00:00.000Z',
      billingAnchorDate: '2099-01-01',
    })
    expect(mockNavigate).toHaveBeenCalledWith('/contracts/contract-1')
    expect(addToast).toHaveBeenCalledWith({
      severity: 'success',
      translateKey: 'text_1789552637141hilxjurcb4j',
    })
  })

  it('focuses the first invalid field when submission fails validation', async () => {
    const { result } = renderDrawerHook()

    act(() => result.current.openDrawer())
    await submit()

    expect(scrollToFirstInputError).toHaveBeenCalledWith(
      CONTRACT_FORM_ID,
      expect.objectContaining({
        externalCustomerId: expect.anything(),
        planCode: expect.anything(),
      }),
    )
  })
})
