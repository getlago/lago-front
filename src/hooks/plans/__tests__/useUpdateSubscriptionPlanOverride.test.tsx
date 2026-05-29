import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { CurrencyEnum, UpdateSubscriptionDocument } from '~/generated/graphql'

import { useUpdateSubscriptionPlanOverride } from '../useUpdateSubscriptionPlanOverride'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (k: string) => k }),
}))

const SUB_ID = 'sub_1'

const wrapper = (mocks: MockedResponse[]) =>
  function W({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    )
  }

describe('useUpdateSubscriptionPlanOverride', () => {
  it('fires updateSubscription with planOverrides and no charges array', async () => {
    let captured: Record<string, unknown> | undefined
    const mock: MockedResponse = {
      request: { query: UpdateSubscriptionDocument },
      variableMatcher: (vars) => {
        captured = vars?.input
        return vars?.input?.id === SUB_ID
      },
      result: () => ({ data: { updateSubscription: { id: SUB_ID } } }),
    }

    const { result } = renderHook(
      () =>
        useUpdateSubscriptionPlanOverride({ subscriptionId: SUB_ID, currency: CurrencyEnum.Usd }),
      { wrapper: wrapper([mock]) },
    )

    await act(async () => {
      await result.current.updatePlanOverride({ description: 'Edited' })
    })

    await waitFor(() => expect(captured).toBeDefined())
    expect(
      (captured as { planOverrides?: { description?: string } }).planOverrides?.description,
    ).toBe('Edited')
    expect(
      (captured as { planOverrides?: { charges?: unknown } }).planOverrides?.charges,
    ).toBeUndefined()
  })
})
