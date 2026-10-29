import { renderHook } from '@testing-library/react'

import { RateCardForRatePhaseFields } from '~/components/appliedRateCards/drawers/ratePhase/types'
import { AppliedRateCardContext } from '~/components/appliedRateCards/types'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RatePhaseForDrawerFragment,
} from '~/generated/graphql'

import {
  RATE_PHASE_ACTION_COPY_TEST_ID,
  RATE_PHASE_ACTION_DELETE_TEST_ID,
  RATE_PHASE_ACTION_EDIT_TEST_ID,
  RATE_PHASE_ACTION_RESET_TEST_ID,
  RatePhaseAction,
  RatePhaseActionKey,
  useRatePhaseActions,
  UseRatePhaseActionsParams,
} from '../useRatePhaseActions'

const mockHasPermissions = jest.fn()
const mockOpenDrawer = jest.fn()
const mockOpenDeleteDialog = jest.fn()
const mockOpenResetDialog = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

jest.mock('~/components/appliedRateCards/drawers/ratePhase/useRatePhaseDrawer', () => ({
  useRatePhaseDrawer: () => ({ openDrawer: mockOpenDrawer }),
}))

jest.mock('~/components/appliedRateCards/dialogs/useDeleteRatePhaseDialog', () => ({
  useDeleteRatePhaseDialog: () => ({ openDeleteRatePhaseDialog: mockOpenDeleteDialog }),
}))

jest.mock('~/components/appliedRateCards/dialogs/useResetRatePhaseOverrideDialog', () => ({
  useResetRatePhaseOverrideDialog: () => ({
    openResetRatePhaseOverrideDialog: mockOpenResetDialog,
  }),
}))

jest.mock('~/core/utils/copyToClipboard', () => ({ copyToClipboard: jest.fn() }))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const APPLIED_RATE_CARD_ID = 'applied-1'

const RATE_CARD: RateCardForRatePhaseFields = {
  productType: ProductTypeEnum.Fixed,
  currency: CurrencyEnum.Usd,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  appliedPricingUnitCode: null,
  proration: false,
  activeRate: null,
}

const RATE_OVERRIDE: NonNullable<RatePhaseForDrawerFragment['rateOverride']> = {
  rateModel: RateCardRateModelEnum.Standard,
  rateProperties: { amount: '10' },
  billingIntervalCount: 1,
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
  minAmountCents: 0,
  pricingUnitConversionRate: null,
}

const FIRST_PHASE: RatePhaseForDrawerFragment = {
  id: 'phase-1',
  code: 'ramp_up',
  name: 'Ramp up',
  position: 1,
  billingIntervalCycleCount: 3,
  rateOverride: RATE_OVERRIDE,
}

const MIDDLE_PHASE: RatePhaseForDrawerFragment = {
  id: 'phase-2',
  code: 'steady',
  name: 'Steady',
  position: 2,
  billingIntervalCycleCount: 6,
  rateOverride: RATE_OVERRIDE,
}

const FOREVER_PHASE: RatePhaseForDrawerFragment = {
  id: 'phase-3',
  code: 'forever',
  name: null,
  position: 3,
  billingIntervalCycleCount: null,
  rateOverride: null,
}

const PHASES = [FIRST_PHASE, MIDDLE_PHASE, FOREVER_PHASE]

const renderActions = (
  params: Partial<UseRatePhaseActionsParams> = {},
): ReturnType<typeof useRatePhaseActions> =>
  renderHook(() =>
    useRatePhaseActions({
      context: 'plan',
      appliedRateCardId: APPLIED_RATE_CARD_ID,
      rateCard: RATE_CARD,
      phases: PHASES,
      isLocked: false,
      ...params,
    }),
  ).result.current

const getAction = (actions: RatePhaseAction[], key: RatePhaseActionKey): RatePhaseAction => {
  const action = actions.find((candidate) => candidate.key === key)

  if (!action) throw new Error(`Action ${key} was not returned`)

  return action
}

describe('useRatePhaseActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  describe.each([
    { context: 'plan' as const, permission: 'plansUpdate' },
    { context: 'contract' as const, permission: 'contractsUpdate' },
  ])('GIVEN the $context context', ({ context, permission }) => {
    it('THEN checks its own update permission', () => {
      renderActions({ context })

      expect(mockHasPermissions).toHaveBeenCalledWith([permission])
    })

    it('THEN edit opens the drawer in edit mode keyed by its own applied rate card id', () => {
      const { getPhaseActions } = renderActions({ context })

      getAction(getPhaseActions(MIDDLE_PHASE), 'edit').onAction()

      expect(mockOpenDrawer).toHaveBeenCalledWith({
        context,
        mode: 'edit',
        ...(context === 'plan'
          ? { planAppliedRateCardId: APPLIED_RATE_CARD_ID }
          : { contractAppliedRateCardId: APPLIED_RATE_CARD_ID }),
        phase: MIDDLE_PHASE,
        otherPhases: [
          { code: FIRST_PHASE.code, name: 'Ramp up' },
          { code: FOREVER_PHASE.code, name: '' },
        ],
        rateCard: RATE_CARD,
      })
    })

    it('THEN create opens the drawer in create mode with every phase in otherPhases', () => {
      const { createPhase } = renderActions({ context })

      createPhase.open()

      expect(mockOpenDrawer).toHaveBeenCalledWith({
        context,
        mode: 'create',
        ...(context === 'plan'
          ? { planAppliedRateCardId: APPLIED_RATE_CARD_ID }
          : { contractAppliedRateCardId: APPLIED_RATE_CARD_ID }),
        otherPhases: [
          { code: FIRST_PHASE.code, name: 'Ramp up' },
          { code: MIDDLE_PHASE.code, name: 'Steady' },
          { code: FOREVER_PHASE.code, name: '' },
        ],
        rateCard: RATE_CARD,
      })
    })
  })

  it('GIVEN an unlocked card and a deletable overridden phase THEN every action is returned in order with its test id', () => {
    const { getPhaseActions } = renderActions()
    const actions = getPhaseActions(MIDDLE_PHASE)

    expect(actions.map(({ key, dataTest, disabled }) => ({ key, dataTest, disabled }))).toEqual([
      { key: 'copy', dataTest: RATE_PHASE_ACTION_COPY_TEST_ID, disabled: false },
      { key: 'edit', dataTest: RATE_PHASE_ACTION_EDIT_TEST_ID, disabled: false },
      { key: 'reset', dataTest: RATE_PHASE_ACTION_RESET_TEST_ID, disabled: false },
      { key: 'delete', dataTest: RATE_PHASE_ACTION_DELETE_TEST_ID, disabled: false },
    ])
  })

  it('GIVEN no update permission THEN only copy is returned and create is hidden', () => {
    mockHasPermissions.mockReturnValue(false)

    const { getPhaseActions, createPhase } = renderActions()

    expect(getPhaseActions(MIDDLE_PHASE).map(({ key }) => key)).toEqual(['copy'])
    expect(getAction(getPhaseActions(MIDDLE_PHASE), 'copy').disabled).toBe(false)
    expect(createPhase.hidden).toBe(true)
  })

  it('GIVEN update permission THEN create is not hidden', () => {
    const { createPhase } = renderActions()

    expect(createPhase.hidden).toBe(false)
  })

  describe.each([
    {
      condition: 'a locked parent',
      params: { isLocked: true },
      expectedActions: [
        { key: 'copy', disabled: false },
        { key: 'edit', disabled: true },
        { key: 'reset', disabled: true },
        { key: 'delete', disabled: true },
      ],
    },
    {
      condition: 'a rate card that is not loaded',
      params: { rateCard: undefined },
      expectedActions: [
        { key: 'copy', disabled: false },
        { key: 'edit', disabled: true },
        { key: 'reset', disabled: false },
        { key: 'delete', disabled: false },
      ],
    },
  ])('GIVEN $condition', ({ params, expectedActions }) => {
    it('THEN only the actions it blocks are disabled', () => {
      const { getPhaseActions } = renderActions(params)
      const actions = getPhaseActions(MIDDLE_PHASE)

      expect(actions.map(({ key, disabled }) => ({ key, disabled }))).toEqual(expectedActions)
    })

    it('THEN create is disabled but not hidden', () => {
      const { createPhase } = renderActions(params)

      expect(createPhase).toMatchObject({ hidden: false, disabled: true })
    })
  })

  it('GIVEN a locked parent THEN the inline edit is visible but disabled', () => {
    const { getEditPhase } = renderActions({ isLocked: true })

    expect(getEditPhase(MIDDLE_PHASE)).toMatchObject({ hidden: false, disabled: true })
  })

  it('GIVEN no update permission THEN the inline edit is hidden', () => {
    mockHasPermissions.mockReturnValue(false)

    const { getEditPhase } = renderActions()

    expect(getEditPhase(MIDDLE_PHASE)).toMatchObject({ hidden: true })
  })

  it('GIVEN an unlocked card THEN the inline edit is visible and enabled', () => {
    const { getEditPhase } = renderActions()

    expect(getEditPhase(MIDDLE_PHASE)).toMatchObject({ hidden: false, disabled: false })
  })

  it('GIVEN an unlocked card WHEN the inline edit is opened THEN the drawer opens in edit mode for that phase', () => {
    const { getEditPhase } = renderActions()

    getEditPhase(MIDDLE_PHASE).open()

    expect(mockOpenDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'edit', phase: MIDDLE_PHASE }),
    )
  })

  it('GIVEN an unlocked card THEN create is enabled', () => {
    const { createPhase } = renderActions()

    expect(createPhase.disabled).toBe(false)
  })

  it('GIVEN a phase without override THEN reset is not returned', () => {
    const phaseWithoutOverride: RatePhaseForDrawerFragment = {
      ...MIDDLE_PHASE,
      rateOverride: null,
    }
    const { getPhaseActions } = renderActions({
      phases: [FIRST_PHASE, phaseWithoutOverride, FOREVER_PHASE],
    })

    expect(getPhaseActions(phaseWithoutOverride).map(({ key }) => key)).toEqual([
      'copy',
      'edit',
      'delete',
    ])
  })

  it('GIVEN the last phase runs forever THEN delete is disabled', () => {
    const { getPhaseActions } = renderActions({ phases: [FIRST_PHASE, FOREVER_PHASE] })

    expect(getAction(getPhaseActions(FOREVER_PHASE), 'delete').disabled).toBe(true)
  })

  it('GIVEN the last phase runs forever THEN edit stays enabled', () => {
    const { getPhaseActions } = renderActions({ phases: [FIRST_PHASE, FOREVER_PHASE] })

    expect(getAction(getPhaseActions(FOREVER_PHASE), 'edit').disabled).toBe(false)
  })

  it('GIVEN a single finite phase THEN delete is disabled', () => {
    const { getPhaseActions } = renderActions({ phases: [FIRST_PHASE] })

    expect(getAction(getPhaseActions(FIRST_PHASE), 'delete').disabled).toBe(true)
  })

  it('GIVEN a phase WHEN copy is triggered THEN its code is copied and the user is notified', () => {
    const { getPhaseActions } = renderActions()

    getAction(getPhaseActions(MIDDLE_PHASE), 'copy').onAction()

    expect(copyToClipboard).toHaveBeenCalledWith(MIDDLE_PHASE.code)
    expect(addToast).toHaveBeenCalledWith({
      severity: 'info',
      translateKey: 'text_1775559630554ourrtpgddty',
    })
  })

  it.each<AppliedRateCardContext>(['plan', 'contract'])(
    'GIVEN the %s context WHEN reset is triggered THEN the reset dialog opens for that phase',
    (context) => {
      const { getPhaseActions } = renderActions({ context })

      getAction(getPhaseActions(MIDDLE_PHASE), 'reset').onAction()

      expect(mockOpenResetDialog).toHaveBeenCalledWith({
        context,
        appliedRateCardId: APPLIED_RATE_CARD_ID,
        phase: { code: MIDDLE_PHASE.code, name: 'Steady' },
      })
    },
  )

  it('GIVEN an unnamed phase WHEN reset or delete is triggered THEN the dialog gets a display name, never null', () => {
    const unnamedPhase: RatePhaseForDrawerFragment = {
      ...MIDDLE_PHASE,
      name: null,
      billingIntervalCycleCount: 6,
    }
    const { getPhaseActions } = renderActions({
      phases: [FIRST_PHASE, unnamedPhase, FOREVER_PHASE],
    })

    getAction(getPhaseActions(unnamedPhase), 'reset').onAction()
    getAction(getPhaseActions(unnamedPhase), 'delete').onAction()

    expect(mockOpenResetDialog).toHaveBeenCalledWith(
      expect.objectContaining({ phase: { code: unnamedPhase.code, name: expect.any(String) } }),
    )
    expect(mockOpenDeleteDialog).toHaveBeenCalledWith(
      expect.objectContaining({ phase: { code: unnamedPhase.code, name: expect.any(String) } }),
    )
  })

  it.each<AppliedRateCardContext>(['plan', 'contract'])(
    'GIVEN the %s context WHEN delete is triggered and confirmed THEN the dialog opens and reports the deleted phase',
    (context) => {
      const onPhaseDeleted = jest.fn()
      const { getPhaseActions } = renderActions({ context, onPhaseDeleted })

      getAction(getPhaseActions(MIDDLE_PHASE), 'delete').onAction()

      expect(mockOpenDeleteDialog).toHaveBeenCalledWith({
        context,
        appliedRateCardId: APPLIED_RATE_CARD_ID,
        phase: { code: MIDDLE_PHASE.code, name: 'Steady' },
        onDeleted: expect.any(Function),
      })

      mockOpenDeleteDialog.mock.calls[0][0].onDeleted()

      expect(onPhaseDeleted).toHaveBeenCalledWith(MIDDLE_PHASE)
    },
  )
})
