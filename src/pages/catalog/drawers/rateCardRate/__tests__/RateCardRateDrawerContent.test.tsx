import { configure, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  AggregationTypeEnum,
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'

import { RATE_CARD_RATE_FORM_DEFAULTS } from '../constants'
import {
  RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_COUNT_TEST_ID,
  RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_UNIT_TEST_ID,
  RATE_CARD_RATE_DRAWER_CODE_TEST_ID,
  RATE_CARD_RATE_DRAWER_CONVERSION_RATE_TEST_ID,
  RATE_CARD_RATE_DRAWER_SPENDING_MINIMUM_TEST_ID,
  RateCardRateDrawerContent,
  RateCardRateDrawerRateCard,
} from '../RateCardRateDrawerContent'

configure({ testIdAttribute: 'data-test' })

const CODE_PROBE_TEST_ID = 'code-probe'
const SET_DATE_BUTTON_TEST_ID = 'set-date'
const SET_SECOND_DATE_BUTTON_TEST_ID = 'set-second-date'
const CHANGE_MODEL_BUTTON_TEST_ID = 'change-model'
const SET_SPENDING_MINIMUM_BUTTON_TEST_ID = 'clear-spending-minimum'
const mockChargeModelSelectorTestId = 'charge-model-selector'
const mockChargeWrapperSwitchTestId = 'charge-wrapper-switch'

const mockOpenPremiumWarningDialog = jest.fn()
let mockIsPremium = true
let mockChargeModelSelectorProps: Record<string, unknown> = {}
let mockChargeWrapperSwitchProps: Record<string, unknown> = {}

type ChargeModelUpdater = (field: string, value: unknown) => void

let mockHandleChargeModelUpdate: ChargeModelUpdater | undefined
let mockSpendingMinimumProps: Record<string, unknown> = {}

jest.mock('~/components/dialogs/PremiumWarningDialog', () => ({
  usePremiumWarningDialog: () => ({ open: mockOpenPremiumWarningDialog }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}|${Object.values(vars).join('|')}` : key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ timezone: 'TZ_UTC' }),
}))

jest.mock('~/hooks/plans/useCustomPricingUnits', () => ({
  useCustomPricingUnits: () => ({
    hasAnyPricingUnitConfigured: true,
    pricingUnits: [{ id: 'pu-1', name: 'Tokens', code: 'tokens', shortName: 'tok' }],
  }),
}))

jest.mock('~/components/plans/chargeAccordion/ChargeModelSelector', () => ({
  ChargeModelSelector: (props: Record<string, unknown>) => {
    mockChargeModelSelectorProps = props
    mockHandleChargeModelUpdate = props.handleUpdate as ChargeModelUpdater

    return <div data-test={mockChargeModelSelectorTestId} />
  },
}))

jest.mock('~/components/plans/chargeAccordion/ChargeWrapperSwitch', () => ({
  ChargeWrapperSwitch: (props: Record<string, unknown>) => {
    mockChargeWrapperSwitchProps = props

    return <div data-test={mockChargeWrapperSwitchTestId} />
  },
}))

jest.mock('~/components/plans/chargeAccordion/SpendingMinimumOptionSection', () => ({
  SpendingMinimumOptionSection: (props: Record<string, unknown>) => {
    mockSpendingMinimumProps = props

    return <div data-test="spending-minimum-option" />
  },
}))

const arrearsUsageCard: RateCardRateDrawerRateCard = {
  currency: CurrencyEnum.Usd,
  appliedPricingUnitCode: null,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  productType: ProductTypeEnum.Usage,
  aggregationType: AggregationTypeEnum.SumAgg,
}

const Host = ({
  rateCard = arrearsUsageCard,
  isEdit = false,
  isActiveRate = false,
  isCodeLocked = false,
  effectiveFromBoundary = null,
  initialMinAmountCents = '',
}: {
  rateCard?: RateCardRateDrawerRateCard
  isEdit?: boolean
  isActiveRate?: boolean
  isCodeLocked?: boolean
  effectiveFromBoundary?: string | null
  initialMinAmountCents?: string
}) => {
  const form = useAppForm({ defaultValues: RATE_CARD_RATE_FORM_DEFAULTS })

  return (
    <>
      <button
        data-test={SET_DATE_BUTTON_TEST_ID}
        onClick={() => form.setFieldValue('effectiveFrom', '2026-01-24T00:00:00.000Z')}
      >
        set date
      </button>
      <button
        data-test={SET_SECOND_DATE_BUTTON_TEST_ID}
        onClick={() => form.setFieldValue('effectiveFrom', '2026-02-05T00:00:00.000Z')}
      >
        set another date
      </button>
      <button
        data-test={CHANGE_MODEL_BUTTON_TEST_ID}
        onClick={() => mockHandleChargeModelUpdate?.('chargeModel', RateCardRateModelEnum.Package)}
      >
        change model
      </button>
      <button
        data-test={SET_SPENDING_MINIMUM_BUTTON_TEST_ID}
        onClick={() => form.setFieldValue('minAmountCents', '')}
      >
        clear spending minimum
      </button>
      <form.Subscribe selector={(state) => state.values.code}>
        {(code) => <span data-test={CODE_PROBE_TEST_ID}>{code}</span>}
      </form.Subscribe>
      <RateCardRateDrawerContent
        form={form}
        rateCard={rateCard}
        isEdit={isEdit}
        isActiveRate={isActiveRate}
        isCodeLocked={isCodeLocked}
        getEffectiveFromBoundary={() => effectiveFromBoundary}
        initialMinAmountCents={initialMinAmountCents}
      />
    </>
  )
}

const codeInput = () =>
  screen.getByTestId(RATE_CARD_RATE_DRAWER_CODE_TEST_ID).querySelector('input') as HTMLInputElement

describe('RateCardRateDrawerContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsPremium = true
    mockChargeModelSelectorProps = {}
    mockChargeWrapperSwitchProps = {}
    mockHandleChargeModelUpdate = undefined
    mockSpendingMinimumProps = {}
  })

  describe('GIVEN a rate is being created', () => {
    describe('WHEN an effective date is picked', () => {
      it('THEN seeds the code from that date', async () => {
        render(<Host />)

        await userEvent.click(screen.getByTestId(SET_DATE_BUTTON_TEST_ID))

        expect(screen.getByTestId(CODE_PROBE_TEST_ID)).toHaveTextContent('rate_01_24_2026')
      })

      it('THEN re-seeds the code when the date changes again', async () => {
        render(<Host />)

        await userEvent.click(screen.getByTestId(SET_DATE_BUTTON_TEST_ID))
        await userEvent.click(screen.getByTestId(SET_SECOND_DATE_BUTTON_TEST_ID))

        expect(screen.getByTestId(CODE_PROBE_TEST_ID)).toHaveTextContent('rate_02_05_2026')
      })
    })

    describe('WHEN the code has been edited by hand', () => {
      it('THEN a later date change no longer overwrites it', async () => {
        render(<Host />)

        await userEvent.click(screen.getByTestId(SET_DATE_BUTTON_TEST_ID))
        await userEvent.clear(codeInput())
        await userEvent.type(codeInput(), 'my_own_code')
        await userEvent.click(screen.getByTestId(SET_SECOND_DATE_BUTTON_TEST_ID))

        expect(screen.getByTestId(CODE_PROBE_TEST_ID)).toHaveTextContent('my_own_code')
      })
    })
  })

  describe('GIVEN an existing rate is being edited', () => {
    describe('WHEN the effective date changes', () => {
      it('THEN never touches the code, which is already the rate identity', async () => {
        render(<Host isEdit />)

        await userEvent.click(screen.getByTestId(SET_DATE_BUTTON_TEST_ID))

        expect(screen.getByTestId(CODE_PROBE_TEST_ID)).toBeEmptyDOMElement()
      })
    })
  })

  describe('GIVEN the rate model is switched', () => {
    describe('WHEN the user picks another model', () => {
      it('THEN forwards the new model to the pricing inputs', async () => {
        render(<Host />)

        await userEvent.click(screen.getByTestId(CHANGE_MODEL_BUTTON_TEST_ID))

        expect(
          (mockChargeWrapperSwitchProps.localCharge as { chargeModel: string }).chargeModel,
        ).toBe(RateCardRateModelEnum.Package)
      })
    })

    describe('WHEN a non premium user picks graduated percentage', () => {
      it('THEN opens the premium dialog and keeps the previous model', async () => {
        mockIsPremium = false

        render(<Host />)

        await userEvent.click(screen.getByTestId(CHANGE_MODEL_BUTTON_TEST_ID))
        mockHandleChargeModelUpdate?.('chargeModel', RateCardRateModelEnum.GraduatedPercentage)

        expect(mockOpenPremiumWarningDialog).toHaveBeenCalledTimes(1)
        expect(
          (mockChargeWrapperSwitchProps.localCharge as { chargeModel: string }).chargeModel,
        ).toBe(RateCardRateModelEnum.Package)
      })
    })
  })

  describe('GIVEN the pricing inputs', () => {
    describe('WHEN the parent product is a usage product', () => {
      it('THEN drives them in usage mode, with presentation group keys suppressed', () => {
        render(<Host />)

        expect(mockChargeWrapperSwitchProps.chargeType).toBe('usage')
        expect(mockChargeWrapperSwitchProps.showPresentationGroupKeys).toBe(false)
        expect(mockChargeWrapperSwitchProps.propertyCursor).toBe('properties')
      })
    })

    describe('WHEN the parent product is a fixed product', () => {
      it('THEN drives them in fixed mode', () => {
        render(<Host rateCard={{ ...arrearsUsageCard, productType: ProductTypeEnum.Fixed }} />)

        expect(mockChargeWrapperSwitchProps.chargeType).toBe('fixed')
      })
    })
  })

  describe('GIVEN the card prices in a custom pricing unit', () => {
    describe('WHEN the drawer body renders', () => {
      it('THEN shows the conversion rate row', () => {
        render(<Host rateCard={{ ...arrearsUsageCard, appliedPricingUnitCode: 'tokens' }} />)

        expect(
          screen.getByTestId(RATE_CARD_RATE_DRAWER_CONVERSION_RATE_TEST_ID),
        ).toBeInTheDocument()
      })

      // Resolved from the units query here, not baked in at open() time: the drawer captures
      // `children` once, so a name read before that query resolved would never self-correct.
      it('THEN labels the conversion rate with the unit short name, not its code', () => {
        render(<Host rateCard={{ ...arrearsUsageCard, appliedPricingUnitCode: 'tokens' }} />)

        expect(screen.getByText('1 tok')).toBeInTheDocument()
        expect(screen.queryByText('1 tokens')).not.toBeInTheDocument()
      })

      it('THEN prices the charge fields in that short name too', () => {
        render(<Host rateCard={{ ...arrearsUsageCard, appliedPricingUnitCode: 'tokens' }} />)

        expect(mockChargeWrapperSwitchProps.chargePricingUnitShortName).toBe('tok')
      })
    })
  })

  describe('GIVEN the card prices in the organization currency', () => {
    describe('WHEN the drawer body renders', () => {
      it('THEN hides the conversion rate row', () => {
        render(<Host />)

        expect(
          screen.queryByTestId(RATE_CARD_RATE_DRAWER_CONVERSION_RATE_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the billing timing of the card', () => {
    describe('WHEN it bills in arrears', () => {
      it('THEN offers the spending minimum', () => {
        render(<Host />)

        expect(
          screen.getByTestId(RATE_CARD_RATE_DRAWER_SPENDING_MINIMUM_TEST_ID),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN it bills in advance', () => {
      it('THEN hides the spending minimum, which the backend rejects there', () => {
        render(
          <Host
            rateCard={{ ...arrearsUsageCard, billingTiming: RateCardBillingTimingEnum.Advance }}
          />,
        )

        expect(
          screen.queryByTestId(RATE_CARD_RATE_DRAWER_SPENDING_MINIMUM_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the edited rate is already active', () => {
    describe('WHEN the drawer body renders', () => {
      it.each([
        ['code', RATE_CARD_RATE_DRAWER_CODE_TEST_ID],
        ['billing interval count', RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_COUNT_TEST_ID],
      ])('THEN disables the %s input', (_, testId) => {
        render(<Host isEdit isActiveRate />)

        expect(screen.getByTestId(testId).querySelector('input')).toBeDisabled()
      })

      it('THEN disables the billing interval unit', () => {
        render(<Host isEdit isActiveRate />)

        expect(
          screen
            .getByTestId(RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_UNIT_TEST_ID)
            .querySelector('input'),
        ).toBeDisabled()
      })

      it('THEN disables the rate model selector', () => {
        render(<Host isEdit isActiveRate />)

        expect(mockChargeModelSelectorProps.disabled).toBe(true)
      })

      it('THEN keeps the pricing inputs editable', () => {
        render(<Host isEdit isActiveRate />)

        expect(screen.getByTestId(mockChargeWrapperSwitchTestId)).toBeInTheDocument()
        expect(mockChargeWrapperSwitchProps.disabled).toBeUndefined()
      })
    })
  })

  describe('GIVEN the spending minimum is being typed into', () => {
    describe('WHEN the live value passes through a state that reads as no minimum', () => {
      // The section derives its reveal state from `initialLocalCharge`, so feeding it the live
      // value would collapse the input mid-edit (typing "0.5" passes through "0", clearing the
      // field passes through "").
      it('THEN the value it reveals from stays the one captured at open', async () => {
        render(<Host isEdit initialMinAmountCents="15" />)

        const initialBefore = (
          mockSpendingMinimumProps.initialLocalCharge as { minAmountCents: string }
        ).minAmountCents

        await userEvent.click(screen.getByTestId(SET_SPENDING_MINIMUM_BUTTON_TEST_ID))

        expect(
          (mockSpendingMinimumProps.initialLocalCharge as { minAmountCents: string })
            .minAmountCents,
        ).toBe(initialBefore)
        expect(
          (mockSpendingMinimumProps.localCharge as { minAmountCents: string }).minAmountCents,
        ).toBe('')
      })
    })
  })

  describe('GIVEN the parent card is already in a plan or a subscription', () => {
    describe('WHEN the drawer body renders', () => {
      it('THEN disables the code input, which the backend refuses to change', () => {
        render(<Host isEdit isCodeLocked />)

        expect(
          screen.getByTestId(RATE_CARD_RATE_DRAWER_CODE_TEST_ID).querySelector('input'),
        ).toBeDisabled()
      })

      it('THEN leaves the billing interval editable', () => {
        render(<Host isEdit isCodeLocked />)

        expect(
          screen
            .getByTestId(RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_COUNT_TEST_ID)
            .querySelector('input'),
        ).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN the edited rate is still pending', () => {
    describe('WHEN the drawer body renders', () => {
      it('THEN leaves the timeline fields editable', () => {
        render(<Host isEdit />)

        expect(
          screen.getByTestId(RATE_CARD_RATE_DRAWER_CODE_TEST_ID).querySelector('input'),
        ).not.toBeDisabled()
        expect(mockChargeModelSelectorProps.disabled).toBe(false)
      })
    })
  })
})
