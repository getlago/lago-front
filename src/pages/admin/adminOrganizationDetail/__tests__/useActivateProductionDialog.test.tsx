import NiceModal from '@ebay/nice-modal-react'
import { act, renderHook } from '@testing-library/react'
import { GraphQLFormattedError } from 'graphql'

import { REASON_MODAL_NAME } from '~/components/admin/const'
import { ReasonModalProps } from '~/components/admin/ReasonModal'
import { addToast, initializeTranslations } from '~/core/apolloClient'
import { AdminActivateOrganizationMutation, LagoApiError } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { useActivateProductionDialog } from '../useActivateProductionDialog'

const ORGANIZATION = { id: 'production-org', name: 'Acme' }
const REASON = 'Prospect opened without a card by sales'

const mockActivateOrganization = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useAdminActivateOrganizationMutation: () => [mockActivateOrganization],
}))

const openActivateProductionDialog = (): void => {
  const { result } = renderHook(() => useActivateProductionDialog(), {
    wrapper: AllTheProviders,
  })

  act(() => result.current.openActivateProductionDialog(ORGANIZATION))
}

const getReasonModalProps = (): ReasonModalProps =>
  jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

const confirmReason = async (): Promise<void> => {
  await act(() => getReasonModalProps().onConfirm(REASON, false))
}

const buildErrorResult = (
  code: string,
  details?: Record<string, string[]>,
): { data: AdminActivateOrganizationMutation; errors: GraphQLFormattedError[] } => ({
  data: { adminActivateOrganization: null },
  errors: [{ message: code, extensions: { code, ...(details && { details }) } }],
})

describe('useActivateProductionDialog', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(NiceModal, 'show').mockResolvedValue(undefined)
    mockActivateOrganization.mockResolvedValue({
      data: {
        adminActivateOrganization: { id: ORGANIZATION.id, activationStatus: 'active' },
      },
    })
  })

  afterEach(() => jest.restoreAllMocks())

  describe('GIVEN the dialog is opened for an organization', () => {
    describe('WHEN it renders', () => {
      it('THEN should open the reason modal naming the organization, without the notify checkbox', () => {
        openActivateProductionDialog()

        expect(NiceModal.show).toHaveBeenCalledTimes(1)
        expect(NiceModal.show).toHaveBeenCalledWith(
          REASON_MODAL_NAME,
          expect.objectContaining({
            title: 'Activate production',
            showNotifyCheckbox: false,
          }),
        )
        expect(getReasonModalProps().description).toBe(
          `"${ORGANIZATION.name}" opens without waiting for a payment method, and its members can use production right away.`,
        )
      })

      it('THEN should not run the mutation before the reason is confirmed', () => {
        openActivateProductionDialog()

        expect(mockActivateOrganization).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the reason modal is open', () => {
    describe('WHEN the reason is confirmed and the activation succeeds', () => {
      beforeEach(async () => {
        openActivateProductionDialog()
        await confirmReason()
      })

      it('THEN should run the activate mutation with the organization, the reason and silenced errors', () => {
        expect(mockActivateOrganization).toHaveBeenCalledWith({
          variables: { input: { organizationId: ORGANIZATION.id, reason: REASON } },
          context: {
            silentErrorCodes: [
              LagoApiError.OrganizationNotSelfServeProduction,
              LagoApiError.SelfServeDisabled,
              LagoApiError.NotFound,
              LagoApiError.UnprocessableEntity,
            ],
          },
          errorPolicy: 'all',
        })
      })

      it('THEN should show the success toast only', () => {
        expect(addToast).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith({
          severity: 'success',
          message: 'Production activated.',
        })
      })
    })

    describe.each([
      [
        'the organization is not a self-serve production organization',
        buildErrorResult(LagoApiError.OrganizationNotSelfServeProduction),
        'Only a self-serve production organization can be activated.',
      ],
      [
        'self-serve is disabled on the deployment',
        buildErrorResult(LagoApiError.SelfServeDisabled),
        'Self-serve is not enabled on this deployment, so organizations cannot be activated.',
      ],
      [
        'the organization does not exist',
        buildErrorResult(LagoApiError.NotFound, { organization: ['not_found'] }),
        'The organization does not exist.',
      ],
      [
        'the API refuses the reason',
        buildErrorResult(LagoApiError.UnprocessableEntity, { reason: ['value_is_too_long'] }),
        'Failed to activate the organization. Please try again.',
      ],
    ])('WHEN %s', (_, errorResult, expectedMessage) => {
      beforeEach(async () => {
        mockActivateOrganization.mockResolvedValue(errorResult)
        openActivateProductionDialog()
        await confirmReason()
      })

      it('THEN should show the matching danger toast and no success toast', () => {
        expect(addToast).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith({ severity: 'danger', message: expectedMessage })
      })
    })

    describe('WHEN the mutation fails with a code left to the global error link', () => {
      beforeEach(async () => {
        mockActivateOrganization.mockResolvedValue(buildErrorResult(LagoApiError.Unauthorized))
        openActivateProductionDialog()
        await confirmReason()
      })

      it('THEN should not add a toast of its own', () => {
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })
})
