import NiceModal from '@ebay/nice-modal-react'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { REASON_MODAL_NAME } from '~/components/admin/const'
import { ReasonModalProps } from '~/components/admin/ReasonModal'
import { FormDialogProps } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import { GetAdminOrganizationsForLinkSandboxDocument, LagoApiError } from '~/generated/graphql'
import { AllTheProviders, render, TestMocksType } from '~/test-utils'

import { LINK_SANDBOX_FORM_ID, useLinkSandboxDialog } from '../useLinkSandboxDialog'

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void }

const createDeferred = <T,>(): Deferred<T> => {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((res) => {
    resolve = res
  })

  return { promise, resolve }
}

const PRODUCTION = { id: 'production-org', name: 'Acme' }
const SANDBOX = { id: 'sandbox-org', name: 'Acme Test' }
const SEARCHED = { id: 'searched-org', name: 'Globex Sandbox' }
const SEARCH_TERM = 'Globex'
const REASON = 'Customer asked to link their test account'

const mockFormDialogOpen = jest.fn()
const mockLinkSandbox = jest.fn()
const mockOnLinked = jest.fn()

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 56,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        key: String(i),
        start: i * 56,
        size: 56,
      })),
    scrollToIndex: jest.fn(),
    measureElement: jest.fn(),
  }),
}))

jest.mock('~/components/dialogs/FormDialog', () => ({
  ...jest.requireActual('~/components/dialogs/FormDialog'),
  useFormDialog: () => ({ open: mockFormDialogOpen, close: jest.fn() }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useAdminLinkSandboxOrganizationMutation: () => [mockLinkSandbox],
}))

const organizationsMocks: TestMocksType = [
  {
    request: { query: GetAdminOrganizationsForLinkSandboxDocument, variables: { limit: 20 } },
    result: { data: { adminOrganizations: { collection: [SANDBOX] } } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: GetAdminOrganizationsForLinkSandboxDocument,
      variables: { searchTerm: SEARCH_TERM, limit: 20 },
    },
    result: { data: { adminOrganizations: { collection: [SEARCHED] } } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
]

const getPickerCall = (index: number): FormDialogProps =>
  mockFormDialogOpen.mock.calls[index][0] as FormDialogProps

const getLastPickerCall = (): FormDialogProps =>
  getPickerCall(mockFormDialogOpen.mock.calls.length - 1)

const getReasonModalProps = (): ReasonModalProps =>
  jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

const openLinkSandboxDialog = (productionOrganization: { id: string; name: string }): void => {
  const { result } = renderHook(() => useLinkSandboxDialog({ onLinked: mockOnLinked }), {
    wrapper: AllTheProviders,
  })

  act(() => result.current.openLinkSandboxDialog(productionOrganization))
}

const renderPicker = (payload: FormDialogProps): (() => void) => {
  const { unmount } = render(<>{payload.children}</>, { mocks: organizationsMocks })

  return unmount
}

const getOrganizationInput = (fieldName: string): HTMLInputElement =>
  document.querySelector(`input[name="${fieldName}"]`) as HTMLInputElement

const getOptionLabel = (organization: { id: string; name: string }): string =>
  `${organization.name} (${organization.id})`

const pickOrganization = async (
  fieldName: string,
  organization: { id: string; name: string },
): Promise<void> => {
  await userEvent.click(getOrganizationInput(fieldName))
  await userEvent.click(
    await screen.findByText(getOptionLabel(organization), undefined, { timeout: 2000 }),
  )
}

const PRODUCTION_FIELD = 'productionOrganizationId'
const SANDBOX_FIELD = 'sandboxOrganizationId'

const submitPicker = async (): Promise<void> => {
  await act(async () => {
    await getLastPickerCall().form.submit()
  })
}

const didPickerSubmitSucceed = (): boolean | undefined =>
  getLastPickerCall().form.didSubmitSucceed?.()

const submitValidPicker = async (): Promise<void> => {
  openLinkSandboxDialog(PRODUCTION)
  const closePicker = renderPicker(getLastPickerCall())

  await pickOrganization(SANDBOX_FIELD, SANDBOX)
  await submitPicker()

  closePicker()
}

const confirmReason = async (reasonModal: Deferred<DialogResult>): Promise<void> => {
  await act(() => getReasonModalProps().onConfirm(REASON, false))
  await act(async () => reasonModal.resolve({ reason: 'success' }))
}

const LINK_REFUSAL_CODES = [
  LagoApiError.SelfServeDisabled,
  LagoApiError.ProductionIsASandbox,
  LagoApiError.ProductionAlreadyHasSandbox,
  LagoApiError.SandboxAlreadyLinked,
  LagoApiError.SandboxHasSandbox,
  LagoApiError.SandboxIsSelfServe,
  LagoApiError.SandboxHasSsoIntegration,
  LagoApiError.SandboxHasExtraPremiumIntegrations,
  LagoApiError.SandboxHasExtraFeatureFlags,
  LagoApiError.SandboxHasStricterAuthentication,
  LagoApiError.SandboxHasPendingInvites,
  LagoApiError.SandboxHasOtherMembers,
  LagoApiError.LockAcquisitionFailed,
]

const buildErrorResult = (code: string, details?: Record<string, unknown>) => ({
  data: null,
  errors: [{ message: code, extensions: { code, ...(details && { details }) } }],
})

describe('useLinkSandboxDialog', () => {
  let reasonModal: Deferred<DialogResult>

  beforeEach(() => {
    jest.clearAllMocks()
    mockFormDialogOpen.mockResolvedValue({ reason: 'close' })
    reasonModal = createDeferred<DialogResult>()
    jest.spyOn(NiceModal, 'show').mockImplementation(() => reasonModal.promise)
    mockLinkSandbox.mockResolvedValue({ data: { adminLinkSandboxOrganization: {} } })
  })

  afterEach(() => jest.restoreAllMocks())

  describe('GIVEN the dialog is opened for a production organization', () => {
    describe('WHEN the picker renders', () => {
      it('THEN should open the form dialog wired to the link sandbox form', () => {
        openLinkSandboxDialog(PRODUCTION)

        expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)
        expect(getLastPickerCall().form).toEqual({
          id: LINK_SANDBOX_FORM_ID,
          submit: expect.any(Function),
          didSubmitSucceed: expect.any(Function),
        })
      })

      it('THEN should prefill the production organization from its seeded name even when the first page lacks it', async () => {
        openLinkSandboxDialog(PRODUCTION)
        renderPicker(getLastPickerCall())

        await waitFor(() =>
          expect(getOrganizationInput(PRODUCTION_FIELD)).toHaveValue(getOptionLabel(PRODUCTION)),
        )
        expect(getOrganizationInput(SANDBOX_FIELD)).toHaveValue('')
      })

      it('THEN should offer the first page of organizations to link', async () => {
        openLinkSandboxDialog(PRODUCTION)
        renderPicker(getLastPickerCall())

        await userEvent.click(getOrganizationInput(SANDBOX_FIELD))

        expect(await screen.findByText(getOptionLabel(SANDBOX))).toBeInTheDocument()
        expect(screen.queryByText(getOptionLabel(SEARCHED))).not.toBeInTheDocument()
      })
    })

    describe('WHEN typing a search in the organization to link field', () => {
      it('THEN should search the organizations and let the returned one be picked and named', async () => {
        openLinkSandboxDialog(PRODUCTION)
        renderPicker(getLastPickerCall())

        await userEvent.type(getOrganizationInput(SANDBOX_FIELD), SEARCH_TERM)
        await userEvent.click(
          await screen.findByText(getOptionLabel(SEARCHED), undefined, { timeout: 2000 }),
        )

        expect(getOrganizationInput(SANDBOX_FIELD)).toHaveValue(getOptionLabel(SEARCHED))

        await submitPicker()

        expect(getReasonModalProps().description).toContain(
          `"${SEARCHED.name}" becomes the sandbox of "${PRODUCTION.name}"`,
        )
      })
    })

    describe('WHEN submitting without an organization to link', () => {
      it('THEN should keep the picker open and not ask for a reason', async () => {
        openLinkSandboxDialog(PRODUCTION)
        renderPicker(getLastPickerCall())

        await submitPicker()

        expect(didPickerSubmitSucceed()).toBe(false)
        expect(NiceModal.show).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the organization to link is the production organization', () => {
      it('THEN should keep the picker open with a message on the organization to link', async () => {
        openLinkSandboxDialog(SANDBOX)
        renderPicker(getLastPickerCall())
        await pickOrganization(SANDBOX_FIELD, SANDBOX)

        await submitPicker()

        expect(didPickerSubmitSucceed()).toBe(false)
        expect(NiceModal.show).not.toHaveBeenCalled()
        expect(
          screen.getByText('Pick an organization other than the production organization'),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN submitting without a production organization', () => {
      it('THEN should keep the picker open and not ask for a reason', async () => {
        openLinkSandboxDialog({ id: '', name: '' })
        renderPicker(getLastPickerCall())
        await pickOrganization(SANDBOX_FIELD, SANDBOX)

        await submitPicker()

        expect(didPickerSubmitSucceed()).toBe(false)
        expect(NiceModal.show).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the production organization is cleared before submitting', () => {
      it('THEN should show the required message instead of the raw type error', async () => {
        openLinkSandboxDialog(PRODUCTION)
        renderPicker(getLastPickerCall())
        await pickOrganization(SANDBOX_FIELD, SANDBOX)

        const productionInput = getOrganizationInput(PRODUCTION_FIELD)
        const clearButton = productionInput.parentElement?.querySelector(
          '.MuiAutocomplete-clearIndicator',
        ) as HTMLButtonElement

        await userEvent.click(clearButton)
        await submitPicker()

        expect(productionInput).toHaveValue('')
        expect(didPickerSubmitSucceed()).toBe(false)
        expect(NiceModal.show).not.toHaveBeenCalled()
        expect(screen.getByText('Field is required')).toBeInTheDocument()
        expect(screen.queryByText(/expected string/i)).not.toBeInTheDocument()
      })
    })

    describe('WHEN submitting both organizations', () => {
      it('THEN should report a successful submit and open the reason modal with the permanence warning', async () => {
        await submitValidPicker()

        expect(didPickerSubmitSucceed()).toBe(true)

        expect(NiceModal.show).toHaveBeenCalledTimes(1)
        expect(NiceModal.show).toHaveBeenCalledWith(
          REASON_MODAL_NAME,
          expect.objectContaining({
            showNotifyCheckbox: false,
            description: expect.stringMatching(/permanent.*no unlink/),
          }),
        )
        expect(getReasonModalProps().description).toContain(
          `"${SANDBOX.name}" becomes the sandbox of "${PRODUCTION.name}"`,
        )
      })
    })

    describe('WHEN the production organization has no known name', () => {
      it('THEN should name it by its id in the reason modal', async () => {
        jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        openLinkSandboxDialog({ id: PRODUCTION.id, name: undefined as unknown as string })
        renderPicker(getLastPickerCall())

        await pickOrganization(SANDBOX_FIELD, SANDBOX)
        await submitPicker()

        expect(getReasonModalProps().description).toContain(
          `"${SANDBOX.name}" becomes the sandbox of "${PRODUCTION.id}"`,
        )
      })
    })
  })

  describe('GIVEN the reason modal is open', () => {
    describe('WHEN the reason is confirmed and the link succeeds', () => {
      beforeEach(async () => {
        await submitValidPicker()
        await confirmReason(reasonModal)
      })

      it('THEN should run the link mutation with both organizations, the reason and silenced errors', () => {
        expect(mockLinkSandbox).toHaveBeenCalledWith({
          variables: {
            input: {
              productionOrganizationId: PRODUCTION.id,
              sandboxOrganizationId: SANDBOX.id,
              reason: REASON,
            },
          },
          context: {
            silentErrorCodes: expect.arrayContaining([
              ...LINK_REFUSAL_CODES,
              LagoApiError.NotFound,
              LagoApiError.UnprocessableEntity,
            ]),
          },
          errorPolicy: 'all',
        })
      })

      it('THEN should show a success toast and call onLinked', () => {
        expect(addToast).toHaveBeenCalledWith({
          severity: 'success',
          message: 'Organizations linked.',
        })
        expect(mockOnLinked).toHaveBeenCalledTimes(1)
      })

      it('THEN should not reopen the picker', () => {
        expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the link succeeds AND onLinked rejects asynchronously', () => {
      it('THEN should still resolve the confirmation after the success toast', async () => {
        mockOnLinked.mockImplementation(() => {
          const failedRefetch = Promise.reject(new Error('refetch failed'))

          failedRefetch.catch(() => undefined)

          return failedRefetch
        })

        await submitValidPicker()

        await expect(
          act(() => getReasonModalProps().onConfirm(REASON, false)),
        ).resolves.toBeUndefined()
        expect(addToast).toHaveBeenCalledWith({
          severity: 'success',
          message: 'Organizations linked.',
        })
        expect(mockOnLinked).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the reason modal is cancelled', () => {
      it('THEN should not link and reopen the picker with the selected organizations kept', async () => {
        await submitValidPicker()
        await act(async () => reasonModal.resolve({ reason: 'close' }))

        expect(mockLinkSandbox).not.toHaveBeenCalled()
        expect(mockFormDialogOpen).toHaveBeenCalledTimes(2)

        renderPicker(getPickerCall(1))

        await waitFor(() =>
          expect(getOrganizationInput(PRODUCTION_FIELD)).toHaveValue(getOptionLabel(PRODUCTION)),
        )
        expect(getOrganizationInput(SANDBOX_FIELD)).toHaveValue(getOptionLabel(SANDBOX))
      })
    })

    describe('WHEN the link is refused', () => {
      it.each([
        [
          LagoApiError.SelfServeDisabled,
          'Self-serve is not enabled on this deployment, so organizations cannot be linked.',
        ],
        [
          LagoApiError.ProductionIsASandbox,
          'The production organization is itself a sandbox. Pick its production organization instead.',
        ],
        [
          LagoApiError.ProductionAlreadyHasSandbox,
          'The production organization already has a sandbox.',
        ],
        [
          LagoApiError.SandboxAlreadyLinked,
          'This organization is already the sandbox of another organization.',
        ],
        [
          LagoApiError.SandboxHasSandbox,
          'This organization has its own sandbox, so it cannot become one.',
        ],
        [
          LagoApiError.SandboxIsSelfServe,
          'A self-serve organization cannot be linked as a sandbox.',
        ],
        [
          LagoApiError.SandboxHasSsoIntegration,
          'This organization has its own Okta or Entra ID integration. Remove it before linking.',
        ],
        [
          LagoApiError.SandboxHasExtraPremiumIntegrations,
          'This organization has premium integrations the production organization lacks. Linking would remove them: align them first.',
        ],
        [
          LagoApiError.SandboxHasExtraFeatureFlags,
          'This organization has feature flags the production organization lacks. Linking would remove them: align them first.',
        ],
        [
          LagoApiError.SandboxHasStricterAuthentication,
          'The production organization allows login methods this organization refuses. Align its login methods first.',
        ],
        [
          LagoApiError.SandboxHasPendingInvites,
          'This organization has pending invites. Revoke them before linking.',
        ],
        [
          LagoApiError.SandboxHasOtherMembers,
          'This organization has members the production organization lacks. Remove them before linking.',
        ],
        [LagoApiError.LockAcquisitionFailed, 'Another link is in progress. Try again in a moment.'],
      ])('THEN should show the %s refusal message', async (code, message) => {
        mockLinkSandbox.mockResolvedValue(buildErrorResult(code))

        await submitValidPicker()
        await confirmReason(reasonModal)

        expect(addToast).toHaveBeenCalledWith({ severity: 'danger', message })
        expect(mockOnLinked).not.toHaveBeenCalled()
      })

      it.each([
        [
          'the production organization is not found',
          LagoApiError.NotFound,
          { productionOrganization: ['not_found'] },
          'The production organization does not exist.',
        ],
        [
          'the organization to link is not found',
          LagoApiError.NotFound,
          { sandboxOrganization: ['not_found'] },
          'The organization to link does not exist.',
        ],
        [
          'the organization is linked to itself',
          LagoApiError.UnprocessableEntity,
          { sandboxOrganizationId: ['cannot_link_organization_to_itself'] },
          'An organization cannot be linked to itself.',
        ],
        [
          'the production already has a sandbox at the database level',
          LagoApiError.UnprocessableEntity,
          { productionOrganizationId: ['value_already_exist'] },
          'The production organization already has a sandbox.',
        ],
        [
          'the validation error is unknown',
          LagoApiError.UnprocessableEntity,
          { sandboxOrganizationId: ['invalid'] },
          'Failed to link the organizations. Please try again.',
        ],
      ])('THEN should explain that %s', async (_, code, details, message) => {
        mockLinkSandbox.mockResolvedValue(buildErrorResult(code, details))

        await submitValidPicker()
        await confirmReason(reasonModal)

        expect(addToast).toHaveBeenCalledWith({ severity: 'danger', message })
      })

      it('THEN should leave an unknown error code to the global error toast and reopen the picker', async () => {
        mockLinkSandbox.mockResolvedValue(buildErrorResult('internal_error'))

        await submitValidPicker()
        await confirmReason(reasonModal)

        expect(addToast).not.toHaveBeenCalled()
        expect(mockFormDialogOpen).toHaveBeenCalledTimes(2)
      })

      it('THEN should reopen the picker with the selected organizations kept', async () => {
        mockLinkSandbox.mockResolvedValue(buildErrorResult(LagoApiError.SandboxHasSandbox))

        await submitValidPicker()
        await confirmReason(reasonModal)

        expect(mockFormDialogOpen).toHaveBeenCalledTimes(2)

        renderPicker(getPickerCall(1))

        await waitFor(() =>
          expect(getOrganizationInput(PRODUCTION_FIELD)).toHaveValue(getOptionLabel(PRODUCTION)),
        )
        expect(getOrganizationInput(SANDBOX_FIELD)).toHaveValue(getOptionLabel(SANDBOX))
      })
    })
  })
})
