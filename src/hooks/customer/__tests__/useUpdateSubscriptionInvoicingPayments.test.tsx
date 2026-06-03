import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import {
  BillingTimeEnum,
  PaymentMethodTypeEnum,
  PlanInterval,
  StatusTypeEnum,
  SubscriptionForSubscriptionEditFormFragment,
  UpdateSubscriptionDocument,
} from '~/generated/graphql'

import { useUpdateSubscriptionInvoicingPayments } from '../useUpdateSubscriptionInvoicingPayments'

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const subscription = {
  id: 'sub-1',
  name: 'My subscription',
  externalId: 'ext-1',
  subscriptionAt: '2026-01-01',
  endingAt: null,
  billingTime: BillingTimeEnum.Calendar,
  periodEndDate: null,
  status: StatusTypeEnum.Active,
  startedAt: '2026-01-01',
  paymentMethodType: PaymentMethodTypeEnum.Provider,
  paymentMethod: { id: 'pm-1' },
  consolidateInvoice: true,
  skipInvoiceCustomSections: false,
  selectedInvoiceCustomSections: [{ id: 'ics-1', name: 'Bank details', code: 'bank' }],
  plan: { id: 'plan-1', parent: null, name: 'P', code: 'p', interval: PlanInterval.Monthly },
} as unknown as SubscriptionForSubscriptionEditFormFragment

// Only the invoicing & payments fields are submitted; the builder defaults the
// payment method + ICS selection from the subscription and they serialize to
// the mutation's reference inputs (ids only).
const expectedInput = {
  id: 'sub-1',
  paymentMethod: {
    paymentMethodId: 'pm-1',
    paymentMethodType: PaymentMethodTypeEnum.Provider,
  },
  invoiceCustomSection: {
    invoiceCustomSectionIds: ['ics-1'],
    skipInvoiceCustomSections: false,
  },
}

const renderUpdateHook = (
  mocks: MockedResponse[],
  onSuccess: () => void,
  sub: SubscriptionForSubscriptionEditFormFragment = subscription,
) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  )

  return renderHook(
    () => useUpdateSubscriptionInvoicingPayments({ subscription: sub, onSuccess }),
    { wrapper },
  )
}

describe('useUpdateSubscriptionInvoicingPayments', () => {
  beforeEach(() => {
    mockAddToast.mockClear()
  })

  it('updates the subscription invoicing & payments fields and fires a success toast', async () => {
    let capturedVariables: Record<string, unknown> | undefined
    const onSuccess = jest.fn()

    const mocks = [
      {
        request: { query: UpdateSubscriptionDocument },
        variableMatcher: (variables: Record<string, unknown>) => {
          capturedVariables = variables

          return true
        },
        result: {
          data: {
            updateSubscription: {
              id: 'sub-1',
              status: StatusTypeEnum.Active,
              startedAt: '2026-01-01',
              subscriptionAt: '2026-01-01',
              endingAt: null,
              name: 'My subscription',
              externalId: 'ext-1',
              paymentMethodType: PaymentMethodTypeEnum.Provider,
              paymentMethod: { id: 'pm-1' },
              consolidateInvoice: true,
              skipInvoiceCustomSections: false,
              selectedInvoiceCustomSections: [{ id: 'ics-1', name: 'Bank details' }],
              customer: { id: 'cust-1', activeSubscriptionsCount: 1 },
              plan: { id: 'plan-1', name: 'P', code: 'p', interval: PlanInterval.Monthly },
            },
          },
        },
      },
    ]

    const { result } = renderUpdateHook(mocks, onSuccess)

    await act(async () => {
      await result.current.form.handleSubmit()
    })

    await waitFor(() => expect(mockAddToast).toHaveBeenCalledTimes(1))

    expect(capturedVariables).toEqual({ input: expectedInput })
    expect(mockAddToast).toHaveBeenCalledWith({
      severity: 'success',
      message: 'text_65118a52df984447c186962e',
    })
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('serializes a cleared payment method and skipped invoice custom sections', async () => {
    let capturedVariables: Record<string, unknown> | undefined
    const onSuccess = jest.fn()

    const clearedSubscription = {
      ...subscription,
      paymentMethodType: PaymentMethodTypeEnum.Manual,
      paymentMethod: null,
      selectedInvoiceCustomSections: [],
      skipInvoiceCustomSections: true,
    } as unknown as SubscriptionForSubscriptionEditFormFragment

    const mocks = [
      {
        request: { query: UpdateSubscriptionDocument },
        variableMatcher: (variables: Record<string, unknown>) => {
          capturedVariables = variables

          return true
        },
        result: {
          data: {
            updateSubscription: {
              id: 'sub-1',
              status: StatusTypeEnum.Active,
              startedAt: '2026-01-01',
              subscriptionAt: '2026-01-01',
              endingAt: null,
              name: 'My subscription',
              externalId: 'ext-1',
              paymentMethodType: PaymentMethodTypeEnum.Manual,
              paymentMethod: null,
              consolidateInvoice: true,
              skipInvoiceCustomSections: true,
              selectedInvoiceCustomSections: [],
              customer: { id: 'cust-1', activeSubscriptionsCount: 1 },
              plan: { id: 'plan-1', name: 'P', code: 'p', interval: PlanInterval.Monthly },
            },
          },
        },
      },
    ]

    const { result } = renderUpdateHook(mocks, onSuccess, clearedSubscription)

    await act(async () => {
      await result.current.form.handleSubmit()
    })

    await waitFor(() => expect(mockAddToast).toHaveBeenCalledTimes(1))

    // paymentMethodId is absent (cleared); only the type carries over. ICS is
    // skipped with an empty id list — never undefined, so the clear persists.
    expect(capturedVariables).toEqual({
      input: {
        id: 'sub-1',
        paymentMethod: { paymentMethodType: PaymentMethodTypeEnum.Manual },
        invoiceCustomSection: { invoiceCustomSectionIds: [], skipInvoiceCustomSections: true },
      },
    })
  })

  it('does not toast or call onSuccess when the mutation errors', async () => {
    const onSuccess = jest.fn()

    const mocks = [
      {
        request: { query: UpdateSubscriptionDocument },
        variableMatcher: () => true,
        result: { errors: [new GraphQLError('boom')] },
      },
    ]

    const { result } = renderUpdateHook(mocks, onSuccess)

    await act(async () => {
      await result.current.form.handleSubmit().catch(() => {})
    })

    expect(mockAddToast).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
