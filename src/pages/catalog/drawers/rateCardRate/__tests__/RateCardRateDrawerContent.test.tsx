import { revalidateLogic } from '@tanstack/react-form'
import { act, configure, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { chargeModelLookupTranslation } from '~/core/constants/form'
import {
  AggregationTypeEnum,
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'

import { RATE_CARD_RATE_FORM_DEFAULTS, RateCardRateFormValues } from '../constants'
import {
  RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_COUNT_TEST_ID,
  RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_UNIT_TEST_ID,
  RATE_CARD_RATE_DRAWER_CODE_TEST_ID,
  RATE_CARD_RATE_DRAWER_CONVERSION_RATE_TEST_ID,
  RATE_CARD_RATE_DRAWER_SPENDING_MINIMUM_TEST_ID,
  RateCardRateDrawerContent,
  RateCardRateDrawerRateCard,
} from '../RateCardRateDrawerContent'
import { buildRateCardRateSchema } from '../schema'

configure({ testIdAttribute: 'data-test' })

const CODE_PROBE_TEST_ID = 'code-probe'
const DIRTY_PROBE_TEST_ID = 'dirty-probe'
const CUSTOM_PROPERTIES_PROBE_TEST_ID = 'custom-properties-probe'
const SET_DATE_BUTTON_TEST_ID = 'set-date'
const SET_SECOND_DATE_BUTTON_TEST_ID = 'set-second-date'
const CHANGE_MODEL_BUTTON_TEST_ID = 'change-model'
const SET_SPENDING_MINIMUM_BUTTON_TEST_ID = 'clear-spending-minimum'
const RATE_MODEL_PROBE_TEST_ID = 'rate-model-probe'
const RATE_AMOUNT_PROBE_TEST_ID = 'rate-amount-probe'
const mockChargeWrapperSwitchTestId = 'charge-wrapper-switch'

const mockOpenPremiumWarningDialog = jest.fn()
let mockIsPremium = true
let mockTranslationSuffix = ''
let mockTranslations: Record<string, string> = {}
let mockChargeModelSelectorProps: Record<string, unknown> = {}
let mockChargeWrapperSwitchProps: Record<string, unknown> = {}

type ChargeModelUpdater = (field: string, value: unknown) => void

let mockHandleChargeModelUpdate: ChargeModelUpdater | undefined
let mockSpendingMinimumProps: Record<string, unknown> = {}
let mockCustomChargeOnSave: ((customProperties: string) => void) | undefined
const mockOpenCustomChargeDrawer = jest.fn()

jest.mock('~/components/plans/drawers/common/useCustomChargeDrawer', () => ({
  useCustomChargeDrawer: ({ onSave }: { onSave: (customProperties: string) => void }) => {
    mockCustomChargeOnSave = onSave

    return { openCustomChargeDrawer: mockOpenCustomChargeDrawer }
  },
}))

jest.mock('~/components/dialogs/PremiumWarningDialog', () => ({
  usePremiumWarningDialog: () => ({ open: mockOpenPremiumWarningDialog }),
}))

// The drawer stack uses `import.meta`, which jest cannot parse.
jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

jest.mock('~/components/form/ComboBox/ComboBox', () => {
  const { ComboBox } = jest.requireActual('~/components/form/ComboBox/ComboBox')

  return { ComboBox: (props: ComboBoxProps) => <ComboBox {...props} virtualized={false} /> }
})

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars
        ? `${key}|${Object.values(vars).join('|')}`
        : `${mockTranslations[key] ?? key}${mockTranslationSuffix}`,
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

    const { ChargeModelSelector } = jest.requireActual(
      '~/components/plans/chargeAccordion/ChargeModelSelector',
    )

    return <ChargeModelSelector {...props} />
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
  recurring: false,
  proration: false,
}

const Host = ({
  rateCard = arrearsUsageCard,
  isEdit = false,
  isActiveRate = false,
  isCodeLocked = false,
  effectiveFromBoundary = null,
  initialMinAmountCents = '',
  initialValues,
  onSubmit,
}: {
  rateCard?: RateCardRateDrawerRateCard
  isEdit?: boolean
  isActiveRate?: boolean
  isCodeLocked?: boolean
  effectiveFromBoundary?: string | null
  initialMinAmountCents?: string
  initialValues?: Partial<RateCardRateFormValues>
  onSubmit?: () => void
}) => {
  const form = useAppForm({
    defaultValues: { ...RATE_CARD_RATE_FORM_DEFAULTS, ...initialValues },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: buildRateCardRateSchema(() => ({
        requiresConversionRate: false,
        effectiveFromBoundary,
        rateModelConfiguration: rateCard,
      })),
    },
    onSubmit: () => onSubmit?.(),
  })

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
      <form.Subscribe selector={(state) => state.isDirty}>
        {(isDirty) => <span data-test={DIRTY_PROBE_TEST_ID}>{String(isDirty)}</span>}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.values.rateModel}>
        {(rateModel) => <span data-test={RATE_MODEL_PROBE_TEST_ID}>{rateModel}</span>}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.values.properties?.amount}>
        {(amount) => <span data-test={RATE_AMOUNT_PROBE_TEST_ID}>{amount}</span>}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.values.properties?.customProperties}>
        {(customProperties) => (
          <span data-test={CUSTOM_PROPERTIES_PROBE_TEST_ID}>{String(customProperties)}</span>
        )}
      </form.Subscribe>
      {onSubmit && (
        <>
          <form.AppField name="properties.amount">
            {(field) => <field.TextInputField label="Test rate amount" />}
          </form.AppField>
          <button type="button" onClick={() => form.handleSubmit()}>
            submit rate
          </button>
        </>
      )}
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
    mockTranslationSuffix = ''
    mockChargeModelSelectorProps = {}
    mockChargeWrapperSwitchProps = {}
    mockHandleChargeModelUpdate = undefined
    mockSpendingMinimumProps = {}
    mockCustomChargeOnSave = undefined
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

    describe('WHEN the form already carried unsaved input', () => {
      // Resetting the whole form on a model switch cleared `isDirty`, so closing afterwards
      // discarded the input with no prompt.
      it('THEN keeps the form dirty so the unsaved-changes prompt still fires', async () => {
        render(<Host />)

        await userEvent.click(screen.getByTestId(SET_DATE_BUTTON_TEST_ID))
        expect(screen.getByTestId(DIRTY_PROBE_TEST_ID)).toHaveTextContent('true')

        await userEvent.click(screen.getByTestId(CHANGE_MODEL_BUTTON_TEST_ID))

        expect(screen.getByTestId(DIRTY_PROBE_TEST_ID)).toHaveTextContent('true')
      })

      it('THEN keeps the values the user already entered', async () => {
        render(<Host />)

        await userEvent.click(screen.getByTestId(SET_DATE_BUTTON_TEST_ID))
        await userEvent.click(screen.getByTestId(CHANGE_MODEL_BUTTON_TEST_ID))

        expect(screen.getByTestId(CODE_PROBE_TEST_ID)).toHaveTextContent('rate_01_24_2026')
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

      // `children` is captured once at open(), so a name read before the query resolved would
      // never self-correct.
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
      it('THEN disables the billing interval count input', () => {
        render(<Host isEdit isActiveRate />)

        expect(
          screen
            .getByTestId(RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_COUNT_TEST_ID)
            .querySelector('input'),
        ).toBeDisabled()
      })

      // `code` is not in `FROZEN_ON_ACTIVE`; only the parent card's attachment freezes it.
      it('THEN keeps the code input editable while the parent card is unattached', () => {
        render(<Host isEdit isActiveRate />)

        expect(codeInput()).toBeEnabled()
      })

      it('THEN disables the code input once the parent card is attached', () => {
        render(<Host isEdit isActiveRate isCodeLocked />)

        expect(codeInput()).toBeDisabled()
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
      // The reveal state comes from `initialLocalCharge`; the live value would collapse the
      // input mid-edit (typing "0.5" passes through "0").
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

  describe('GIVEN the Custom rate model is selected', () => {
    describe('WHEN the drawer body renders', () => {
      // `CustomCharge` gives its JSON editor no `onChange`, so without this a Custom rate
      // can never be saved.
      it('THEN ChargeWrapperSwitch receives the expand callback that opens the editor', () => {
        render(<Host />)

        expect(mockChargeWrapperSwitchProps.onExpandCustomCharge).toBe(mockOpenCustomChargeDrawer)
      })
    })

    describe('WHEN the custom charge sub-drawer saves', () => {
      it('THEN the edited JSON lands on properties.customProperties', async () => {
        render(<Host />)

        await act(async () => {
          mockCustomChargeOnSave?.('{"foo":"bar"}')
        })

        expect(screen.getByTestId(CUSTOM_PROPERTIES_PROBE_TEST_ID)).toHaveTextContent(
          '{"foo":"bar"}',
        )
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

describe('rate editor compatibility', () => {
  afterEach(() => {
    mockIsPremium = true
    mockTranslationSuffix = ''
    mockTranslations = {}
  })

  const advanceCard: RateCardRateDrawerRateCard = {
    ...arrearsUsageCard,
    billingTiming: RateCardBillingTimingEnum.Advance,
  }
  const modelInput = (): HTMLInputElement =>
    document.querySelector('input[name="chargeModel"]') as HTMLInputElement

  it('offers the same single model as a prorated advance card', async () => {
    render(<Host rateCard={{ ...advanceCard, recurring: true, proration: true }} />)

    await userEvent.click(modelInput())
    await userEvent.keyboard('{ArrowDown}')

    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option')).toHaveTextContent('text_624aa732d6af4e0103d40e6f')
  })

  it('keeps an incompatible existing model and pricing when the options change', async () => {
    const initialValues: Partial<RateCardRateFormValues> = {
      rateModel: RateCardRateModelEnum.Volume,
      properties: { amount: '42' },
    }
    const view = render(<Host isEdit initialValues={initialValues} />)

    view.rerender(<Host isEdit initialValues={initialValues} rateCard={advanceCard} />)

    expect(modelInput()).toHaveValue('text_6304e74aab6dbc18d615f386')
    expect(screen.getByTestId(RATE_MODEL_PROBE_TEST_ID)).toHaveTextContent('volume')
    expect(screen.getByTestId(RATE_AMOUNT_PROBE_TEST_ID)).toHaveTextContent('42')
    await userEvent.click(modelInput())
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { name: /text_6304e74aab6dbc18d615f386/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  describe('with an incompatible Graduated Percentage model', () => {
    beforeEach(async () => {
      mockIsPremium = false
      mockTranslations = {
        text_62793bbb599f1c01522e919f: 'Graduated',
        text_64de472463e2da6b31737db0: 'Graduated Percentage',
        text_65201b8216455901fe273e32: 'Graduated Percentage',
        text_624aa732d6af4e0103d40e6f: 'Standard',
        text_6304e74aab6dbc18d615f386: 'Volume',
      }

      render(
        <Host
          isEdit
          rateCard={{
            ...arrearsUsageCard,
            aggregationType: AggregationTypeEnum.SumAgg,
            recurring: true,
            proration: true,
          }}
          initialValues={{ rateModel: RateCardRateModelEnum.GraduatedPercentage }}
        />,
      )

      await userEvent.click(modelInput())
      await userEvent.keyboard('{ArrowDown}')
    })

    it('keeps the retained option in alphabetical order', () => {
      expect(
        screen
          .getAllByRole('option')
          .map((option) => within(option).getByRole('radio').getAttribute('value')),
      ).toEqual(['graduated', 'graduated_percentage', 'standard', 'volume'])
    })

    it("preserves the disabled retained option's premium rendering", () => {
      const option = screen.getByRole('option', { name: /Graduated Percentage/ })

      expect(option).toHaveAttribute('aria-disabled', 'true')
      expect(within(option).getByTitle('sparkles/medium')).toBeInTheDocument()
    })
  })

  it('rejects attempts to select an ineligible model without resetting pricing', async () => {
    render(<Host rateCard={advanceCard} initialValues={{ properties: { amount: '42' } }} />)

    await act(async () => {
      mockHandleChargeModelUpdate?.('chargeModel', RateCardRateModelEnum.Volume)
    })

    expect(screen.getByTestId(RATE_MODEL_PROBE_TEST_ID)).toHaveTextContent('standard')
    expect(screen.getByTestId(RATE_AMOUNT_PROBE_TEST_ID)).toHaveTextContent('42')
  })

  it('lets a pending rate replace an incompatible model explicitly', async () => {
    render(
      <Host
        isEdit
        rateCard={advanceCard}
        initialValues={{ rateModel: RateCardRateModelEnum.Volume }}
      />,
    )

    await userEvent.click(modelInput())
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(screen.getByRole('option', { name: /text_624aa732d6af4e0103d40e6f/ }))

    expect(screen.getByTestId(RATE_MODEL_PROBE_TEST_ID)).toHaveTextContent('standard')
    expect(mockChargeModelSelectorProps.alreadyUsedChargeAlertMessage).toBeUndefined()
  })

  it('explains a resolved empty set and keeps the default model disabled', async () => {
    render(<Host rateCard={{ ...advanceCard, aggregationType: AggregationTypeEnum.MaxAgg }} />)

    expect(mockChargeModelSelectorProps.alreadyUsedChargeAlertMessage).toBeTruthy()
    await userEvent.click(modelInput())
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option')).toHaveAttribute('aria-disabled', 'true')
  })

  it('keeps metadata loading distinct from incompatible settings', () => {
    render(
      <Host rateCard={{ ...arrearsUsageCard, aggregationType: undefined, recurring: undefined }} />,
    )

    expect(modelInput()).toBeDisabled()
    expect(modelInput()).toHaveValue(chargeModelLookupTranslation.standard)
    expect(mockChargeModelSelectorProps.alreadyUsedChargeAlertMessage).toBeUndefined()
  })

  it('updates translated model options while the configuration stays the same', () => {
    const view = render(<Host />)

    mockTranslationSuffix = '-translated'
    view.rerender(<Host />)

    expect(modelInput()).toHaveValue('text_624aa732d6af4e0103d40e6f-translated')
  })
})

describe('correcting an incompatible rate', () => {
  it('allows saving again after the user chooses a valid model and enters its price', async () => {
    const onSubmit = jest.fn()

    render(
      <Host
        isEdit
        onSubmit={onSubmit}
        rateCard={{ ...arrearsUsageCard, billingTiming: RateCardBillingTimingEnum.Advance }}
        initialValues={{
          effectiveFrom: '2026-01-24',
          code: 'saved-volume',
          rateModel: RateCardRateModelEnum.Volume,
          properties: {
            volumeRanges: [{ fromValue: 0, toValue: null, perUnitAmount: '12', flatAmount: '0' }],
          },
        }}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'submit rate' }))
    expect(onSubmit).not.toHaveBeenCalled()

    await userEvent.click(document.querySelector('input[name="chargeModel"]') as HTMLElement)
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(screen.getByRole('option', { name: /text_624aa732d6af4e0103d40e6f/ }))
    await userEvent.type(screen.getByLabelText('Test rate amount'), '12')
    await userEvent.click(screen.getByRole('button', { name: 'submit rate' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
  })
})
