import { renderHook } from '@testing-library/react'

import { ConnectionCategory } from '~/components/customerConnections/types'

import { useSetConnectionAsDefault } from '../useSetConnectionAsDefault'

const mockSetPaymentDefault = jest.fn(() =>
  Promise.resolve({
    data: { setPaymentProviderCustomerAsDefault: { id: 'pc-1', isDefault: true } },
  }),
)
const mockSetIntegrationDefault = jest.fn(() =>
  Promise.resolve({ data: { setIntegrationCustomerAsDefault: { __typename: 'AnrokCustomer' } } }),
)
const mockAddToast = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useSetCustomerPaymentConnectionAsDefaultMutation: () => [mockSetPaymentDefault],
  useSetCustomerIntegrationConnectionAsDefaultMutation: () => [mockSetIntegrationDefault],
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

const setup = () => renderHook(() => useSetConnectionAsDefault()).result

describe('useSetConnectionAsDefault', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a payment connection', () => {
    describe('WHEN setting it as default', () => {
      it('THEN should call the payment mutation with the connection id only', async () => {
        const result = setup()

        const succeeded = await result.current.setConnectionAsDefault({
          category: ConnectionCategory.Payment,
          connectionId: 'pc-1',
        })

        expect(succeeded).toBe(true)
        expect(mockSetPaymentDefault).toHaveBeenCalledWith({
          variables: { input: { id: 'pc-1' } },
        })
        expect(mockSetIntegrationDefault).not.toHaveBeenCalled()
      })

      it('THEN should show a success toast', async () => {
        const result = setup()

        await result.current.setConnectionAsDefault({
          category: ConnectionCategory.Payment,
          connectionId: 'pc-1',
        })

        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })
  })

  describe('GIVEN an integration connection', () => {
    describe.each([
      ['accounting', ConnectionCategory.Accounting],
      ['tax', ConnectionCategory.Tax],
      ['crm', ConnectionCategory.Crm],
    ])('WHEN setting a %s connection as default', (_, category) => {
      it('THEN should call the integration mutation with the connection id only', async () => {
        const result = setup()

        const succeeded = await result.current.setConnectionAsDefault({
          category,
          connectionId: 'link-1',
        })

        expect(succeeded).toBe(true)
        expect(mockSetIntegrationDefault).toHaveBeenCalledWith({
          variables: { input: { id: 'link-1' } },
        })
        expect(mockSetPaymentDefault).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a connection with no persisted id', () => {
    describe('WHEN setting it as default', () => {
      it('THEN should abort with a danger toast and call no mutation', async () => {
        const result = setup()

        const succeeded = await result.current.setConnectionAsDefault({
          category: ConnectionCategory.Payment,
          connectionId: undefined,
        })

        expect(succeeded).toBe(false)
        expect(mockSetPaymentDefault).not.toHaveBeenCalled()
        expect(mockSetIntegrationDefault).not.toHaveBeenCalled()
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })
  })

  describe('GIVEN a mutation that fails', () => {
    describe('WHEN the response carries GraphQL errors', () => {
      it('THEN should resolve false and show no success toast', async () => {
        mockSetPaymentDefault.mockResolvedValueOnce({
          data: { setPaymentProviderCustomerAsDefault: { id: 'pc-1', isDefault: true } },
          errors: [{ message: 'boom' }],
        } as never)

        const result = setup()

        const succeeded = await result.current.setConnectionAsDefault({
          category: ConnectionCategory.Payment,
          connectionId: 'pc-1',
        })

        expect(succeeded).toBe(false)
        expect(mockAddToast).not.toHaveBeenCalledWith(
          expect.objectContaining({ severity: 'success' }),
        )
      })
    })

    describe('WHEN the mutation REJECTS (network failure)', () => {
      it.each([
        ['payment', ConnectionCategory.Payment],
        ['integration', ConnectionCategory.Tax],
      ])(
        'THEN should resolve false on a %s connection instead of rejecting',
        async (_, category) => {
          // Only the routed mock: an unconsumed `*Once` survives
          // clearAllMocks and would decide the NEXT test's outcome
          const mock =
            category === ConnectionCategory.Payment
              ? mockSetPaymentDefault
              : mockSetIntegrationDefault

          mock.mockRejectedValueOnce(new Error('network'))

          const result = setup()

          await expect(
            result.current.setConnectionAsDefault({ category, connectionId: 'conn-1' }),
          ).resolves.toBe(false)
          expect(mockAddToast).not.toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'success' }),
          )
        },
      )
    })

    describe('WHEN the response carries no payload', () => {
      it('THEN should resolve false', async () => {
        mockSetIntegrationDefault.mockResolvedValueOnce({ data: {} } as never)

        const result = setup()

        const succeeded = await result.current.setConnectionAsDefault({
          category: ConnectionCategory.Tax,
          connectionId: 'link-1',
        })

        expect(succeeded).toBe(false)
      })
    })
  })
})
