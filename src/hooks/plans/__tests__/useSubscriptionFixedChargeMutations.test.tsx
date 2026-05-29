import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { LocalFixedChargeInput } from '~/components/plans/types'
import { FixedChargeChargeModelEnum, UpdateSubscriptionFixedChargeDocument } from '~/generated/graphql'

import { useSubscriptionFixedChargeMutations } from '../useSubscriptionFixedChargeMutations'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (k: string) => k }),
}))

const SUB_ID = 'sub_1'

const buildCharge = (overrides: Partial<LocalFixedChargeInput> = {}): LocalFixedChargeInput =>
  ({
    id: 'fc_1',
    code: 'onboarding',
    chargeModel: FixedChargeChargeModelEnum.Standard,
    invoiceDisplayName: 'Onboarding',
    payInAdvance: false,
    prorated: false,
    properties: {},
    units: '2',
    taxes: [],
    applyUnitsImmediately: false,
    addOn: { __typename: 'AddOn', id: 'addon_1', name: 'Onboarding', code: 'onboarding' },
    ...overrides,
  }) as unknown as LocalFixedChargeInput

const wrapper = (mocks: MockedResponse[]) =>
  function W({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    )
  }

describe('useSubscriptionFixedChargeMutations', () => {
  it('fires updateSubscriptionFixedCharge with subscriptionId + fixedChargeCode', async () => {
    let called = false
    const updateMock: MockedResponse = {
      request: { query: UpdateSubscriptionFixedChargeDocument },
      variableMatcher: (vars) =>
        vars?.input?.subscriptionId === SUB_ID && vars?.input?.fixedChargeCode === 'onboarding',
      result: () => {
        called = true
        return {
          data: {
            updateSubscriptionFixedCharge: { __typename: 'FixedCharge', id: 'fc_override_1' },
          },
        }
      },
    }

    const { result } = renderHook(
      () => useSubscriptionFixedChargeMutations({ subscriptionId: SUB_ID }),
      { wrapper: wrapper([updateMock]) },
    )

    await act(async () => {
      await result.current.handleSaveCharge(buildCharge(), 0)
    })

    await waitFor(() => expect(called).toBe(true))
  })
})
