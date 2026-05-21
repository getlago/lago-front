import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import NiceModal from '@ebay/nice-modal-react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { FORM_DIALOG_NAME } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { addToast } from '~/core/apolloClient'
import { CurrencyEnum, PlanInterval, UpdatePlanDocument } from '~/generated/graphql'

import { useUpdatePlanWithCascade } from '../useUpdatePlanWithCascade'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

jest.mock('~/core/apolloClient', () => {
  const actual = jest.requireActual('~/core/apolloClient')
  return { ...actual, addToast: jest.fn() }
})

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const basePlan = {
  __typename: 'Plan' as const,
  id: 'plan_1',
  name: 'Pro',
  code: 'pro',
  description: null,
  interval: PlanInterval.Monthly,
  amountCurrency: CurrencyEnum.Usd,
  hasOverriddenPlans: false,
  billFixedChargesMonthly: false,
  billChargesMonthly: false,
  taxes: [],
  fixedCharges: [],
  charges: [],
}

const updateMock: MockedResponse = {
  request: { query: UpdatePlanDocument },
  variableMatcher: (vars) => vars?.input?.id === basePlan.id,
  result: { data: { updatePlan: { ...basePlan, name: 'Pro Renamed' } } },
}

const wrapper = (mocks: MockedResponse[]) =>
  function MockedWrapper({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        <NiceModal.Provider>{children}</NiceModal.Provider>
      </MockedProvider>
    )
  }

describe('useUpdatePlanWithCascade', () => {
  beforeEach(() => {
    ;(addToast as jest.Mock).mockClear()
  })

  it('seeds the form with plan-settings values from the plan', () => {
    const { result } = renderHook(() => useUpdatePlanWithCascade({ plan: basePlan }), {
      wrapper: wrapper([]),
    })

    expect(result.current.form.state.values.name).toBe('Pro')
    expect(result.current.form.state.values.code).toBe('pro')
    expect(result.current.form.state.values.interval).toBe(PlanInterval.Monthly)
  })

  it('runs updatePlan + onSuccess directly when the plan has no overrides', async () => {
    const onSuccess = jest.fn()
    const { result } = renderHook(() => useUpdatePlanWithCascade({ plan: basePlan, onSuccess }), {
      wrapper: wrapper([updateMock]),
    })

    act(() => {
      result.current.form.setFieldValue('name', 'Pro Renamed')
    })

    await act(async () => {
      await result.current.submit()
    })

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    expect(addToast).toHaveBeenCalledWith({
      severity: 'success',
      translateKey: 'text_625fd165963a7b00c8f598a0',
    })
  })

  it('opens the cascade dialog when the plan has overridden subs', async () => {
    const { result } = renderHook(
      () =>
        useUpdatePlanWithCascade({
          plan: { ...basePlan, hasOverriddenPlans: true },
        }),
      { wrapper: wrapper([updateMock]) },
    )

    act(() => {
      result.current.form.setFieldValue('name', 'Pro Renamed')
    })

    act(() => {
      result.current.submit()
    })

    await waitFor(() => {
      expect(document.body.textContent).toContain('text_1729604107534r3hsj7i64gp')
    })
  })
})
