import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { PlanFormInput } from '~/components/plans/types'
import {
  CreateSubscriptionDocument,
  CreateSubscriptionInput,
  GetSubscriptionForCreateSubscriptionQuery,
  PlanInterval,
  StatusTypeEnum,
  UpdateSubscriptionDocument,
} from '~/generated/graphql'

import { useAddSubscription } from '../useAddSubscription'

// `useAddSubscription` derives its form type from the pathname, so the router
// entry is what selects the create vs. update branch.
const EDITION_PATHNAME = '/update/subscription/sub-1'
const CREATION_PATHNAME = '/create/subscription'

const mockPathname = { current: EDITION_PATHNAME }

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useIframeConfig', () => ({
  useIframeConfig: () => ({
    emitIframeMessage: jest.fn(),
    emitSalesForceEvent: jest.fn(),
    isRunningInIframeContext: false,
    isRunningInSalesForceIframe: false,
  }),
}))

type ExistingSubscription = GetSubscriptionForCreateSubscriptionQuery['subscription']

const existingSubscription = {
  id: 'sub-1',
  status: StatusTypeEnum.Active,
  startedAt: '2026-01-01',
  externalId: 'ext-1',
  plan: { id: 'plan-1', name: 'P', code: 'p', interval: PlanInterval.Monthly },
} as unknown as ExistingSubscription

const formValues = {
  planId: 'plan-1',
  purchaseOrderNumber: 'PO-123',
  name: 'My subscription',
  subscriptionAt: '2026-01-01',
} as unknown as Omit<CreateSubscriptionInput, 'customerId'>

const planValues = {} as PlanFormInput

const captureMock = (
  query: typeof UpdateSubscriptionDocument,
  capture: (variables: Record<string, unknown>) => void,
): MockedResponse[] => [
  {
    request: { query },
    variableMatcher: (variables: Record<string, unknown>) => {
      capture(variables)

      return true
    },
    result: { data: null },
  },
]

const renderAddSubscriptionHook = (mocks: MockedResponse[], subscription: ExistingSubscription) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[mockPathname.current]}>
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    </MemoryRouter>
  )

  return renderHook(() => useAddSubscription({ existingSubscription: subscription }), { wrapper })
}

const submitAndCaptureInput = async (
  query: typeof UpdateSubscriptionDocument,
  subscription: ExistingSubscription,
): Promise<Record<string, unknown>> => {
  let capturedVariables: Record<string, unknown> | undefined

  const { result } = renderAddSubscriptionHook(
    captureMock(query, (variables) => {
      capturedVariables = variables
    }),
    subscription,
  )

  await act(async () => {
    await result.current.onSave('cust-1', formValues, planValues, false)
  })

  await waitFor(() => expect(capturedVariables).toBeDefined())

  return (capturedVariables as { input: Record<string, unknown> }).input
}

describe('useAddSubscription', () => {
  afterEach(() => {
    mockPathname.current = EDITION_PATHNAME
  })

  // The API rejects the `purchaseOrderNumber` only when the value actually
  // changes on a subscription that is neither pending nor active
  // (`purchase_order_number_not_editable`, 405), so the client always sends the
  // key and lets the API decide.
  describe('GIVEN the subscription edition form is submitted', () => {
    describe.each([
      ['pending', StatusTypeEnum.Pending],
      ['active', StatusTypeEnum.Active],
      ['terminated', StatusTypeEnum.Terminated],
      ['canceled', StatusTypeEnum.Canceled],
    ])('WHEN the subscription is %s', (_, status) => {
      it('THEN should send the purchaseOrderNumber in the update input', async () => {
        const input = await submitAndCaptureInput(UpdateSubscriptionDocument, {
          ...existingSubscription,
          status,
        } as ExistingSubscription)

        expect(input).toMatchObject({
          id: 'sub-1',
          name: 'My subscription',
          purchaseOrderNumber: 'PO-123',
        })
      })
    })
  })

  describe('GIVEN the subscription creation form is submitted', () => {
    describe('WHEN the subscription does not exist yet', () => {
      it('THEN should send the purchaseOrderNumber in the create input', async () => {
        mockPathname.current = CREATION_PATHNAME

        const input = await submitAndCaptureInput(CreateSubscriptionDocument, undefined)

        expect(input).toMatchObject({ purchaseOrderNumber: 'PO-123' })
      })
    })
  })
})
