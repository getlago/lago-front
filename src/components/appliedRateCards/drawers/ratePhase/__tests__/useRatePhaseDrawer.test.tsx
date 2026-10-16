import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import {
  CreateRatePhaseDocument,
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RatePhaseForDrawerFragment,
  UpdateContractRatePhaseDocument,
  UpdateRatePhaseDocument,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { RATE_PHASE_OVERRIDE_TOGGLE_TEST_ID } from '../RatePhaseFormFields'
import { RateCardForRatePhaseFields, RatePhaseDrawerProps } from '../types'
import { useRatePhaseDrawer } from '../useRatePhaseDrawer'

const mockOpen = jest.fn()
const mockClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

const rateCard: RateCardForRatePhaseFields = {
  productType: ProductTypeEnum.Fixed,
  currency: CurrencyEnum.Usd,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  appliedPricingUnitCode: null,
  proration: false,
  activeRate: null,
}

type OpenedDrawerArgs = {
  children: ReactNode
  form: { id: string; submit: () => void | Promise<void> }
}

const Host = ({ params }: { params: RatePhaseDrawerProps }) => {
  const { openDrawer } = useRatePhaseDrawer()

  return <button onClick={() => openDrawer(params)}>open</button>
}

const openAndRender = async (
  mocks: MockedResponse[],
  params: RatePhaseDrawerProps,
): Promise<{ opened: OpenedDrawerArgs; unmount: () => void }> => {
  const hostRender = render(
    <MockedProvider
      mocks={mocks}
      addTypename={false}
      defaultOptions={{ mutate: { errorPolicy: 'all' } }}
    >
      <Host params={params} />
    </MockedProvider>,
  )

  await userEvent.click(screen.getByText('open'))

  const opened = mockOpen.mock.calls.at(-1)?.[0] as OpenedDrawerArgs
  const bodyRender = render(
    <MockedProvider mocks={[]} addTypename={false}>
      {opened.children}
    </MockedProvider>,
  )

  return {
    opened,
    unmount: () => {
      bodyRender.unmount()
      hostRender.unmount()
    },
  }
}

describe('useRatePhaseDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GIVEN context plan mode create THEN submitting calls createRatePhase with planAppliedRateCardId', async () => {
    let captured: Record<string, unknown> | undefined
    const mock: MockedResponse = {
      request: { query: CreateRatePhaseDocument },
      variableMatcher: (vars) => {
        captured = vars
        return true
      },
      result: { data: { createRatePhase: { id: 'rp-1', code: 'phase-1' } } },
    }

    const { opened } = await openAndRender([mock], {
      context: 'plan',
      mode: 'create',
      planAppliedRateCardId: 'plan-rc-1',
      otherPhases: [],
      rateCard,
    })

    await userEvent.type(screen.getByLabelText(/code/i), 'phase-1')
    await opened.form.submit()

    expect(captured).toMatchObject({
      input: { planAppliedRateCardId: 'plan-rc-1', code: 'phase-1', position: 1 },
    })
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('GIVEN the backend rejects the mutation THEN the drawer stays open with the input', async () => {
    const mock: MockedResponse = {
      request: { query: CreateRatePhaseDocument },
      variableMatcher: () => true,
      result: { errors: [new GraphQLError('code_already_exists')] },
    }

    const { opened } = await openAndRender([mock], {
      context: 'plan',
      mode: 'create',
      planAppliedRateCardId: 'plan-rc-1',
      otherPhases: [],
      rateCard,
    })

    await userEvent.type(screen.getByLabelText(/code/i), 'phase-1')
    await opened.form.submit()

    expect(mockClose).not.toHaveBeenCalled()
  })

  it('GIVEN an override identical to the active rate THEN it is sent as null', async () => {
    const rateCardWithActiveRate: RateCardForRatePhaseFields = {
      ...rateCard,
      activeRate: {
        id: 'active-rate',
        effectiveFrom: '2026-01-01T00:00:00.000Z',
        rateModel: RateCardRateModelEnum.Standard,
        billingIntervalCount: 1,
        billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
        minAmountCents: '0',
        appliedPricingUnitConversionRate: null,
        rateProperties: { amount: '10' },
      },
    }
    const sameAsActivePhase: RatePhaseForDrawerFragment = {
      id: 'rp-4',
      code: 'phase-4',
      name: 'Phase 4',
      position: 1,
      billingIntervalCycleCount: null,
      rateOverride: {
        rateModel: RateCardRateModelEnum.Standard,
        rateProperties: { amount: '10' },
        billingIntervalCount: 1,
        billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
        minAmountCents: 0,
        pricingUnitConversionRate: null,
      },
    }

    let captured: Record<string, unknown> | undefined
    const mock: MockedResponse = {
      request: { query: UpdateRatePhaseDocument },
      variableMatcher: (vars) => {
        captured = vars
        return true
      },
      result: { data: { updateRatePhase: { id: 'rp-4', code: 'phase-4' } } },
    }

    const { opened } = await openAndRender([mock], {
      context: 'plan',
      mode: 'edit',
      planAppliedRateCardId: 'plan-rc-1',
      phase: sameAsActivePhase,
      otherPhases: [],
      rateCard: rateCardWithActiveRate,
    })

    await opened.form.submit()

    expect(captured?.input).toHaveProperty('rateOverride', null)
  })

  it('GIVEN the name is cleared on edit THEN it is sent as null so the backend clears it', async () => {
    const namedPhase: RatePhaseForDrawerFragment = {
      id: 'rp-3',
      code: 'phase-3',
      name: 'Phase 3',
      position: 1,
      billingIntervalCycleCount: null,
      rateOverride: null,
    }

    let captured: Record<string, unknown> | undefined
    const mock: MockedResponse = {
      request: { query: UpdateRatePhaseDocument },
      variableMatcher: (vars) => {
        captured = vars
        return true
      },
      result: { data: { updateRatePhase: { id: 'rp-3', code: 'phase-3' } } },
    }

    const { opened } = await openAndRender([mock], {
      context: 'plan',
      mode: 'edit',
      planAppliedRateCardId: 'plan-rc-1',
      phase: namedPhase,
      otherPhases: [],
      rateCard,
    })

    await userEvent.clear(screen.getByDisplayValue('Phase 3'))
    await opened.form.submit()

    expect(captured?.input).toMatchObject({ code: 'phase-3', name: null })
  })

  it('GIVEN context contract mode edit THEN submitting calls updateContractRatePhase with contractAppliedRateCardId and newCode when the code changed, and omits newCode when unchanged', async () => {
    const editPhase: RatePhaseForDrawerFragment = {
      id: 'rp-1',
      code: 'old-code',
      name: 'Phase A',
      position: 1,
      billingIntervalCycleCount: null,
      rateOverride: null,
    }

    let capturedChanged: Record<string, unknown> | undefined
    const changedCodeMock: MockedResponse = {
      request: { query: UpdateContractRatePhaseDocument },
      variableMatcher: (vars) => {
        capturedChanged = vars
        return true
      },
      result: { data: { updateContractRatePhase: { id: 'rp-1', code: 'new-code' } } },
    }

    const { opened, unmount } = await openAndRender([changedCodeMock], {
      context: 'contract',
      mode: 'edit',
      contractAppliedRateCardId: 'contract-rc-1',
      phase: editPhase,
      otherPhases: [],
      rateCard,
    })

    const codeInput = screen.getByLabelText(/code/i)

    await userEvent.clear(codeInput)
    await userEvent.type(codeInput, 'new-code')
    await opened.form.submit()

    expect(capturedChanged).toMatchObject({
      input: { contractAppliedRateCardId: 'contract-rc-1', code: 'old-code', newCode: 'new-code' },
    })

    unmount()

    let capturedUnchanged: Record<string, unknown> | undefined
    const unchangedCodeMock: MockedResponse = {
      request: { query: UpdateContractRatePhaseDocument },
      variableMatcher: (vars) => {
        capturedUnchanged = vars
        return true
      },
      result: { data: { updateContractRatePhase: { id: 'rp-1', code: 'old-code' } } },
    }

    const { opened: reopened } = await openAndRender([unchangedCodeMock], {
      context: 'contract',
      mode: 'edit',
      contractAppliedRateCardId: 'contract-rc-1',
      phase: editPhase,
      otherPhases: [],
      rateCard,
    })

    await reopened.form.submit()

    expect(capturedUnchanged).toMatchObject({
      input: { contractAppliedRateCardId: 'contract-rc-1', code: 'old-code' },
    })
    expect(capturedUnchanged?.input as Record<string, unknown>).not.toHaveProperty('newCode')
  })

  it('GIVEN override toggled off on edit THEN rateOverride is sent as null, not omitted', async () => {
    const overriddenPhase: RatePhaseForDrawerFragment = {
      id: 'rp-2',
      code: 'phase-2',
      name: 'Phase 2',
      position: 1,
      billingIntervalCycleCount: null,
      rateOverride: {
        rateModel: RateCardRateModelEnum.Standard,
        rateProperties: { amount: '10' },
        billingIntervalCount: 1,
        billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
        minAmountCents: 100,
        pricingUnitConversionRate: null,
      },
    }

    let captured: Record<string, unknown> | undefined
    const mock: MockedResponse = {
      request: { query: UpdateRatePhaseDocument },
      variableMatcher: (vars) => {
        captured = vars
        return true
      },
      result: { data: { updateRatePhase: { id: 'rp-2', code: 'phase-2' } } },
    }

    const { opened } = await openAndRender([mock], {
      context: 'plan',
      mode: 'edit',
      planAppliedRateCardId: 'plan-rc-1',
      phase: overriddenPhase,
      otherPhases: [],
      rateCard,
    })

    await userEvent.click(screen.getByTestId(RATE_PHASE_OVERRIDE_TOGGLE_TEST_ID))
    await opened.form.submit()

    expect(captured?.input).toHaveProperty('rateOverride', null)
  })

  it('GIVEN billingTiming advance and a stale minAmountCents from when the phase was arrears THEN the seed drops it instead of leaving the form permanently invalid', async () => {
    const staleMinAmountPhase: RatePhaseForDrawerFragment = {
      id: 'rp-3',
      code: 'phase-3',
      name: 'Phase 3',
      position: 1,
      billingIntervalCycleCount: null,
      rateOverride: {
        rateModel: RateCardRateModelEnum.Standard,
        rateProperties: { amount: '10' },
        billingIntervalCount: 1,
        billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
        minAmountCents: 500,
        pricingUnitConversionRate: null,
      },
    }

    let captured: Record<string, unknown> | undefined
    const mock: MockedResponse = {
      request: { query: UpdateRatePhaseDocument },
      variableMatcher: (vars) => {
        captured = vars
        return true
      },
      result: { data: { updateRatePhase: { id: 'rp-3', code: 'phase-3' } } },
    }

    const { opened } = await openAndRender([mock], {
      context: 'plan',
      mode: 'edit',
      planAppliedRateCardId: 'plan-rc-1',
      phase: staleMinAmountPhase,
      otherPhases: [],
      rateCard: { ...rateCard, billingTiming: RateCardBillingTimingEnum.Advance },
    })

    expect(screen.queryByTestId('rate-phase-min-amount')).not.toBeInTheDocument()

    await opened.form.submit()

    expect(captured?.input).not.toHaveProperty('minAmountCents')
  })
})
