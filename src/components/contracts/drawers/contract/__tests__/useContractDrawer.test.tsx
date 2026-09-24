import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { CreateContractDocument, UpdateContractDocument } from '~/generated/graphql'
import { render } from '~/test-utils'

import { contractForDrawerFixture } from './fixtures'

import {
  CONTRACT_DRAWER_TITLE_CREATE_KEY,
  CONTRACT_DRAWER_TITLE_EDIT_KEY,
  CONTRACT_DRAWER_UPDATE_ERROR_KEY,
  CONTRACT_DRAWER_UPDATE_SUCCESS_KEY,
  CONTRACT_FORM_ID,
} from '../constants'
import { useContractDrawer } from '../useContractDrawer'

type CapturedDrawerArgs = {
  title?: string
  secondaryAction?: ReactNode
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
    createMoreControl: 'create-more-control',
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

  describe('edit mode', () => {
    const updateContractMock = (
      onInput: (input: Record<string, unknown>) => void,
      result: MockedResponse['result'] = {
        data: { updateContract: contractForDrawerFixture },
      },
    ): MockedResponse => ({
      request: { query: UpdateContractDocument },
      variableMatcher: ({ input }) => {
        onInput(input)
        return true
      },
      result,
    })

    it('opens seeded from the contract, pristine, with the edit title and no create more', () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer({ contract: contractForDrawerFixture }))

      expect(lastDrawerArgs?.title).toBe(CONTRACT_DRAWER_TITLE_EDIT_KEY)
      expect(lastDrawerArgs?.secondaryAction).toBeUndefined()
      expect(lastDrawerArgs?.shouldPromptOnClose?.()).toBe(false)
    })

    it('keeps the create title and create more control in create mode', () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())

      expect(lastDrawerArgs?.title).toBe(CONTRACT_DRAWER_TITLE_CREATE_KEY)
      expect(lastDrawerArgs?.secondaryAction).toBe('create-more-control')
    })

    it('submits updateContract keyed on the contract external id, then closes without navigating', async () => {
      let capturedInput: Record<string, unknown> = {}
      const { result } = renderDrawerHook([
        updateContractMock((input) => {
          capturedInput = input
        }),
      ])

      act(() => result.current.openDrawer({ contract: contractForDrawerFixture }))
      await submit()

      await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))
      expect(capturedInput).toEqual({
        externalId: 'external-contract-1',
        planCode: 'enterprise',
        name: 'Enterprise agreement',
        billingEntityId: 'billing-entity-2',
        consolidateInvoice: true,
        paymentMethod: { paymentMethodId: 'payment-method-1', paymentMethodType: 'provider' },
        purchaseOrderNumber: 'PO-42',
        startedAt: '2026-01-01T00:00:00.000Z',
        endedAt: '2099-12-31T00:00:00.000Z',
        billingAnchorDate: '2026-01-15',
      })
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(addToast).toHaveBeenCalledWith({
        severity: 'success',
        translateKey: CONTRACT_DRAWER_UPDATE_SUCCESS_KEY,
      })
    })

    it('keeps the drawer open and shows the update error toast when the backend rejects it', async () => {
      const { result } = renderDrawerHook([
        updateContractMock(() => undefined, {
          data: { updateContract: null },
          errors: [new GraphQLError('contract_locked')],
        }),
      ])

      act(() => result.current.openDrawer({ contract: contractForDrawerFixture }))
      await submit()

      await waitFor(() =>
        expect(addToast).toHaveBeenCalledWith({
          severity: 'danger',
          translateKey: CONTRACT_DRAWER_UPDATE_ERROR_KEY,
        }),
      )
      expect(mockClose).not.toHaveBeenCalled()
    })

    // The plan combobox is locked on an active contract, so a required plan would block every save.
    it('saves a contract that has no plan without sending a plan code', async () => {
      let capturedInput: Record<string, unknown> = {}
      const { result } = renderDrawerHook([
        updateContractMock((input) => {
          capturedInput = input
        }),
      ])

      act(() =>
        result.current.openDrawer({ contract: { ...contractForDrawerFixture, plan: null } }),
      )
      await submit()

      await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))
      expect(capturedInput.planCode).toBeUndefined()
    })

    it('goes back to an empty create form when reopened without a contract', async () => {
      let capturedCreateInput: Record<string, unknown> | undefined
      const { result } = renderDrawerHook([
        {
          request: { query: CreateContractDocument },
          variableMatcher: ({ input }) => {
            capturedCreateInput = input
            return true
          },
          result: { data: { createContract: contractForDrawerFixture } },
        },
      ])

      act(() => result.current.openDrawer({ contract: contractForDrawerFixture }))
      act(() => result.current.openDrawer())
      await submit()

      expect(capturedCreateInput).toBeUndefined()
      expect(scrollToFirstInputError).toHaveBeenCalled()
    })
  })
})
