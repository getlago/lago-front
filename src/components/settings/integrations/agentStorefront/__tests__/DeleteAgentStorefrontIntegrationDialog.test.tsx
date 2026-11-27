import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { CentralizedDialogProps } from '~/components/dialogs/CentralizedDialog'
import { addToast, onNetworkError } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  DeleteAgentStorefrontIntegrationDialogFragment,
  GetAgentStorefrontIntegrationsListDocument,
} from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { useDeleteAgentStorefrontIntegrationDialog } from '../DeleteAgentStorefrontIntegrationDialog'

const mockCentralizedDialogOpen = jest.fn()
const mockDestroy = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockCentralizedDialogOpen, close: jest.fn() }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/apolloClient/evictFromCache', () => ({
  evictFromCache: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useDestroyAgentStorefrontIntegrationMutation: () => [mockDestroy],
}))

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <AllTheProviders>{children}</AllTheProviders>
)

const createIntegration = (
  overrides: Partial<DeleteAgentStorefrontIntegrationDialogFragment> = {},
): DeleteAgentStorefrontIntegrationDialogFragment => ({
  __typename: 'AgentStorefrontIntegration',
  id: 'sf_1',
  name: 'Agentic Flow A',
  hasEnrolledAgents: false,
  ...overrides,
})

const getProps = (
  integration: DeleteAgentStorefrontIntegrationDialogFragment,
  callback?: () => void,
): CentralizedDialogProps => {
  const { result } = renderHook(() => useDeleteAgentStorefrontIntegrationDialog(), { wrapper })

  return result.current.getDeleteAgentStorefrontIntegrationDialogProps({ integration, callback })
}

describe('useDeleteAgentStorefrontIntegrationDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a connection without enrolled agents', () => {
    describe('WHEN building the dialog props', () => {
      it('THEN should allow the delete and keep the dialog open on network errors', () => {
        const props = getProps(createIntegration())

        expect(props).toEqual(
          expect.objectContaining({
            colorVariant: 'danger',
            disableOnContinue: false,
            closeOnError: false,
            onError: onNetworkError,
            title: expect.any(String),
            description: expect.any(String),
          }),
        )
        expect(props.children).toBeUndefined()
      })
    })

    describe('WHEN the delete succeeds', () => {
      it('THEN should destroy, evict the connection, run the callback and toast success', async () => {
        const callback = jest.fn()

        mockDestroy.mockResolvedValue({ data: { destroyIntegration: { id: 'sf_1' } } })

        const props = getProps(createIntegration(), callback)

        await act(async () => {
          await props.onAction()
        })

        expect(mockDestroy).toHaveBeenCalledWith({ variables: { input: { id: 'sf_1' } } })
        expect(evictFromCache).toHaveBeenCalledWith(expect.anything(), {
          id: 'sf_1',
          __typename: 'AgentStorefrontIntegration',
          listFieldName: 'integrations',
          listQueryDocument: GetAgentStorefrontIntegrationsListDocument,
        })
        expect(callback).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })

    describe('WHEN the API refuses the delete', () => {
      it('THEN should not evict, call back or toast success', async () => {
        const callback = jest.fn()

        mockDestroy.mockResolvedValue({
          data: { destroyIntegration: null },
          errors: [{ message: 'Method Not Allowed' }],
        })

        const props = getProps(createIntegration(), callback)

        await act(async () => {
          await props.onAction()
        })

        expect(evictFromCache).not.toHaveBeenCalled()
        expect(callback).not.toHaveBeenCalled()
        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the delete fails on the network', () => {
      it('THEN should reject so the dialog stays open', async () => {
        const networkError = new Error('Network error')
        const callback = jest.fn()

        mockDestroy.mockRejectedValue(networkError)

        const props = getProps(createIntegration(), callback)

        await expect(props.onAction()).rejects.toBe(networkError)
        expect(callback).not.toHaveBeenCalled()
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a connection with enrolled agents', () => {
    describe('WHEN building the dialog props', () => {
      it('THEN should disable the delete and show the danger alert', () => {
        const props = getProps(createIntegration({ hasEnrolledAgents: true }))

        expect(props.disableOnContinue).toBe(true)

        const { getByTestId } = render(<>{props.children}</>)

        expect(getByTestId('alert-type-danger')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the dialog is opened directly', () => {
    describe('WHEN calling openDeleteAgentStorefrontIntegrationDialog', () => {
      it('THEN should open the centralized dialog with the same props', () => {
        mockCentralizedDialogOpen.mockResolvedValue({ reason: 'close' })

        const { result } = renderHook(() => useDeleteAgentStorefrontIntegrationDialog(), {
          wrapper,
        })

        act(() => {
          result.current.openDeleteAgentStorefrontIntegrationDialog({
            integration: createIntegration({ hasEnrolledAgents: true }),
          })
        })

        expect(mockCentralizedDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({ disableOnContinue: true, closeOnError: false }),
        )
      })
    })
  })
})
