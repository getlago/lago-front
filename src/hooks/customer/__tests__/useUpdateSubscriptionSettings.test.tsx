import { renderHook } from '@testing-library/react'

import {
  ConnectionBehaviorEnum,
  PaymentMethodTypeEnum,
  useUpdateSubscriptionMutation,
} from '~/generated/graphql'

import { useUpdateSubscriptionSettings } from '../useUpdateSubscriptionSettings'

jest.mock('~/generated/graphql', () => ({
  LagoApiError: { UnprocessableEntity: 'unprocessable_entity' },
  ConnectionBehaviorEnum: { Inherit: 'inherit', Skip: 'skip' },
  PaymentMethodTypeEnum: { Provider: 'provider', Manual: 'manual' },
  useUpdateSubscriptionMutation: jest.fn(),
}))

jest.mock('~/core/apolloClient', () => ({ addToast: jest.fn() }))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const mockUpdate = jest.fn().mockResolvedValue({ data: { updateSubscription: { id: 'sub_1' } } })

describe('useUpdateSubscriptionSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useUpdateSubscriptionMutation as jest.Mock).mockReturnValue([mockUpdate, {}])
  })

  describe('GIVEN a payment connection choice from the overview', () => {
    it.each([
      { code: 'stripe_eu' },
      { behavior: ConnectionBehaviorEnum.Inherit },
      { behavior: ConnectionBehaviorEnum.Skip },
    ])(
      'THEN should persist %j and the method together without changing other categories',
      async (connection) => {
        const { result } = renderHook(() => useUpdateSubscriptionSettings('sub_1'))
        const paymentMethod = {
          paymentMethodId: null,
          paymentMethodType: PaymentMethodTypeEnum.Provider,
        }

        await result.current.savePayment({ connection, paymentMethod })
        expect(mockUpdate).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'sub_1',
              connections: { payment: connection },
              paymentMethod,
            },
          },
        })
      },
    )

    it('THEN should omit untouched routing even when a connection field is supplied', async () => {
      const { result } = renderHook(() => useUpdateSubscriptionSettings('sub_1'))

      await result.current.savePayment({ connection: undefined, paymentMethod: undefined })
      expect(mockUpdate).toHaveBeenCalledWith({
        variables: { input: { id: 'sub_1', paymentMethod: undefined } },
      })
    })

    it('THEN should reject an unsuccessful connection save so the drawer keeps its draft', async () => {
      mockUpdate.mockResolvedValueOnce({ data: { updateSubscription: null } })
      const { result } = renderHook(() => useUpdateSubscriptionSettings('sub_1'))

      await expect(
        result.current.savePayment({ connection: { code: 'stripe_eu' }, paymentMethod: undefined }),
      ).rejects.toThrow('Subscription update failed')
    })

    it('THEN should propagate a mutation rejection', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('Network unavailable'))
      const { result } = renderHook(() => useUpdateSubscriptionSettings('sub_1'))

      await expect(
        result.current.savePayment({ connection: { code: 'stripe_eu' }, paymentMethod: undefined }),
      ).rejects.toThrow('Network unavailable')
    })
  })

  it('savePayment sends the payment method on the subscription input', async () => {
    const { result } = renderHook(() => useUpdateSubscriptionSettings('sub_1'))

    await result.current.savePayment({
      paymentMethod: { paymentMethodId: 'pm_1', paymentMethodType: PaymentMethodTypeEnum.Provider },
    })

    expect(mockUpdate).toHaveBeenCalledWith({
      variables: {
        input: {
          id: 'sub_1',
          paymentMethod: {
            paymentMethodId: 'pm_1',
            paymentMethodType: PaymentMethodTypeEnum.Provider,
          },
        },
      },
    })
  })

  it('savePayment sends an undefined payment method when none is selected', async () => {
    const { result } = renderHook(() => useUpdateSubscriptionSettings('sub_1'))

    await result.current.savePayment({ paymentMethod: undefined })

    expect(mockUpdate).toHaveBeenCalledWith({
      variables: { input: { id: 'sub_1', paymentMethod: undefined } },
    })
  })

  it('saveInvoicing sends consolidation + custom-section reference', async () => {
    const { result } = renderHook(() => useUpdateSubscriptionSettings('sub_1'))

    await result.current.saveInvoicing({
      consolidateInvoice: false,
      invoiceCustomSection: {
        invoiceCustomSections: [{ id: 'cs_1', name: 'Bank details' }],
        skipInvoiceCustomSections: false,
      },
    })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({ id: 'sub_1', consolidateInvoice: false }),
        }),
      }),
    )
  })

  it('rejects when the mutation resolves without a subscription (so the drawer stays open)', async () => {
    mockUpdate.mockResolvedValueOnce({ data: { updateSubscription: null } })

    const { result } = renderHook(() => useUpdateSubscriptionSettings('sub_1'))

    await expect(result.current.savePayment({ paymentMethod: undefined })).rejects.toThrow()
  })
})
