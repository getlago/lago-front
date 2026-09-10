import { render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { ComboBoxProps } from '~/components/form/ComboBox/types'
import {
  AggregationTypeEnum,
  CurrencyEnum,
  GetPricingUnitsForRateCardDrawerDocument,
  GetProductFiltersForRateCardDrawerDocument,
  GetProductsForRateCardDrawerDocument,
  GetProductsForRateCardDrawerQuery,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { AllTheProviders, render, TestMocksType } from '~/test-utils'

import { RATE_CARD_FORM_DEFAULTS, RateCardFormValues } from '../constants'
import {
  RATE_CARD_DRAWER_AVAILABLE_MODEL_CHIP_TEST_ID,
  RATE_CARD_DRAWER_AVAILABLE_MODELS_ALERT_TEST_ID,
  RATE_CARD_DRAWER_CODE_TEST_ID,
  RATE_CARD_DRAWER_DESCRIPTION_TEST_ID,
  RATE_CARD_DRAWER_REMOVE_DESCRIPTION_TEST_ID,
  RATE_CARD_DRAWER_REMOVE_PRICING_UNIT_TEST_ID,
  RATE_CARD_DRAWER_SHOW_DESCRIPTION_TEST_ID,
  RATE_CARD_DRAWER_SHOW_PRICING_UNIT_TEST_ID,
  RateCardDrawerContent,
  RateCardProductSeed,
} from '../RateCardDrawerContent'

let mockTranslationSuffix = ''
let mockIsPremium = false

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

jest.mock('~/components/form/ComboBox/ComboBox', () => {
  const { ComboBox } = jest.requireActual('~/components/form/ComboBox/ComboBox')

  return {
    ComboBox: (props: ComboBoxProps) => (
      <ComboBox {...props} virtualized={props.name === 'productId' ? false : props.virtualized} />
    ),
  }
})

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => `${key}${mockTranslationSuffix}`,
  }),
}))

// jsdom has no scrollIntoView, and `scrollToAndClickElement` calls it before the click that
// opens the pricing unit combobox.
Element.prototype.scrollIntoView = jest.fn()

const DESCRIPTION_PROBE_TEST_ID = 'description-probe'
const DIRTY_PROBE_TEST_ID = 'dirty-probe'
const PRICING_UNIT_PROBE_TEST_ID = 'pricing-unit-probe'
const PRODUCT_ID_PROBE_TEST_ID = 'product-id-probe'
const PRORATION_PROBE_TEST_ID = 'proration-probe'
const INVOICING_STRATEGY_PROBE_TEST_ID = 'invoicing-strategy-probe'

const DYNAMIC_MODEL_KEY = 'text_1727711520232zpp50zgnam5'
const STANDARD_MODEL_KEY = 'text_624aa732d6af4e0103d40e6f'
const GRADUATED_MODEL_KEY = 'text_62793bbb599f1c01522e919f'
const PACKAGE_MODEL_KEY = 'text_6282085b4f283b0102655868'
const PERCENTAGE_MODEL_KEY = 'text_62a0b7107afa2700a65ef6e2'
const VOLUME_MODEL_KEY = 'text_6304e74aab6dbc18d615f386'
const GRADUATED_PERCENTAGE_MODEL_KEY = 'text_64de472463e2da6b31737db0'

const PRODUCT_ID = 'product-1'
const INVOICING_SETTINGS_TITLE = 'text_17423672025282dl7iozy1ru'

const buildMocks = (
  pricingUnits: Array<{ id: string; name: string; code: string }> = [],
): TestMocksType => [
  {
    request: {
      query: GetPricingUnitsForRateCardDrawerDocument,
      variables: { page: 1, limit: 100 },
    },
    result: { data: { pricingUnits: { collection: pricingUnits } } },
  },
  {
    request: {
      query: GetProductFiltersForRateCardDrawerDocument,
      variables: { productId: PRODUCT_ID },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data: { productFilters: { collection: [] } } },
  },
]

const mocks = buildMocks()
const mocksWithPricingUnits = buildMocks([{ id: 'pu-1', name: 'Credits', code: 'credits' }])

const buildUsageSeed = (
  aggregationType: AggregationTypeEnum,
): NonNullable<RateCardProductSeed> => ({
  value: PRODUCT_ID,
  label: 'Metered API',
  productType: ProductTypeEnum.Usage,
  aggregationType,
  recurring: false,
})

type HarnessProps = {
  disableCodeInput?: boolean
  isAttached?: boolean
  isEdit?: boolean
  hasRates?: boolean
  values?: Partial<RateCardFormValues>
  productSeed?: RateCardProductSeed
}

const Harness = ({
  values,
  productSeed = null,
  disableCodeInput = false,
  isAttached = false,
  isEdit = false,
  hasRates = false,
}: HarnessProps): JSX.Element => {
  const form = useAppForm({ defaultValues: { ...RATE_CARD_FORM_DEFAULTS, ...values } })
  const { resetSignal, notifyReset } = useCreateMore()

  return (
    <>
      <form.Subscribe selector={(state) => state.values.description}>
        {(description) => <span data-test={DESCRIPTION_PROBE_TEST_ID}>{description}</span>}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.isDirty}>
        {(isDirty) => <span data-test={DIRTY_PROBE_TEST_ID}>{String(isDirty)}</span>}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.values.pricingUnit}>
        {(pricingUnit) => <span data-test={PRICING_UNIT_PROBE_TEST_ID}>{String(pricingUnit)}</span>}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.values.productId}>
        {(productId) => <span data-test={PRODUCT_ID_PROBE_TEST_ID}>{productId}</span>}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.values.proration}>
        {(proration) => <span data-test={PRORATION_PROBE_TEST_ID}>{String(proration)}</span>}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.values.invoicingStrategy}>
        {(strategy) => <span data-test={INVOICING_STRATEGY_PROBE_TEST_ID}>{strategy}</span>}
      </form.Subscribe>
      <button type="button" onClick={() => form.setFieldValue('productId', PRODUCT_ID)}>
        select product
      </button>
      <button type="button" onClick={() => form.setFieldValue('productId', '')}>
        clear product
      </button>
      <button
        type="button"
        onClick={() => {
          form.reset({ ...RATE_CARD_FORM_DEFAULTS, productId: productSeed?.value ?? '' })
          notifyReset()
        }}
      >
        reset for next create
      </button>
      <RateCardDrawerContent
        form={form}
        resetSignal={resetSignal}
        isEdit={isEdit}
        isAttached={isAttached}
        hasRates={hasRates}
        disableCodeInput={disableCodeInput}
        productSeed={productSeed}
        productFilterSeed={null}
      />
    </>
  )
}

const renderContent = (
  props: HarnessProps = {},
  testMocks: TestMocksType = mocks,
): ReturnType<typeof render> =>
  rtlRender(<Harness {...props} />, {
    wrapper: ({ children }) => (
      <AllTheProviders forceTypenames mocks={testMocks}>
        {children}
      </AllTheProviders>
    ),
  })

const renderWithPricingUnits = (
  values: Partial<RateCardFormValues> = {},
): ReturnType<typeof render> =>
  renderContent({ values: { currency: CurrencyEnum.Usd, ...values } }, mocksWithPricingUnits)

const queryPricingUnitInput = (): HTMLInputElement | null =>
  document.querySelector<HTMLInputElement>('input[name="pricingUnit"]')

const currencyInput = (): HTMLInputElement =>
  document.querySelector('input[name="currency"]') as HTMLInputElement

const codeInput = (): HTMLInputElement =>
  screen.getByTestId(RATE_CARD_DRAWER_CODE_TEST_ID).querySelector('input') as HTMLInputElement

const getDescriptionInput = (): HTMLTextAreaElement =>
  screen
    .getByTestId(RATE_CARD_DRAWER_DESCRIPTION_TEST_ID)
    .querySelector('textarea') as HTMLTextAreaElement

// The alert renders one Chip per model, so its `textContent` glues the labels
// together; read them off the chips instead.
const getAvailableModelLabels = (): string[] =>
  screen
    .getAllByTestId(RATE_CARD_DRAWER_AVAILABLE_MODEL_CHIP_TEST_ID)
    .map((chip) => chip.textContent ?? '')

describe('RateCardDrawerContent', () => {
  describe('GIVEN the product selection', () => {
    it('WHEN no product is selected THEN hides invoicing settings', () => {
      renderContent()

      expect(screen.queryByText(INVOICING_SETTINGS_TITLE)).not.toBeInTheDocument()
    })

    it('WHEN a product is selected and cleared THEN shows and hides invoicing settings', async () => {
      renderContent()

      await userEvent.click(screen.getByRole('button', { name: 'select product' }))

      expect(screen.getByText(INVOICING_SETTINGS_TITLE)).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'clear product' }))

      expect(screen.queryByText(INVOICING_SETTINGS_TITLE)).not.toBeInTheDocument()
    })

    it('WHEN attach mode is prefilled before product metadata loads THEN shows invoicing settings', () => {
      renderContent({
        isAttached: true,
        values: { productId: PRODUCT_ID },
        productSeed: { value: PRODUCT_ID, label: 'Metered API' },
      })

      expect(screen.getByText(INVOICING_SETTINGS_TITLE)).toBeInTheDocument()
    })

    it('WHEN edit mode is prefilled with a product THEN shows invoicing settings', () => {
      renderContent({
        isEdit: true,
        values: { productId: PRODUCT_ID },
        productSeed: buildUsageSeed(AggregationTypeEnum.SumAgg),
      })

      expect(screen.getByText(INVOICING_SETTINGS_TITLE)).toBeInTheDocument()
    })
  })

  describe('GIVEN a rate card without a description', () => {
    describe('WHEN the content renders', () => {
      it('THEN shows the add-description button only', () => {
        renderContent()

        expect(screen.getByTestId(RATE_CARD_DRAWER_SHOW_DESCRIPTION_TEST_ID)).toBeInTheDocument()
        expect(
          screen.queryByTestId(RATE_CARD_DRAWER_REMOVE_DESCRIPTION_TEST_ID),
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId(RATE_CARD_DRAWER_DESCRIPTION_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the user adds a description then removes it', () => {
      it('THEN clears the field and restores the add-description button', async () => {
        renderContent()

        await userEvent.click(screen.getByTestId(RATE_CARD_DRAWER_SHOW_DESCRIPTION_TEST_ID))
        await userEvent.type(getDescriptionInput(), 'Metered API rate card')

        expect(screen.getByTestId(DESCRIPTION_PROBE_TEST_ID)).toHaveTextContent(
          'Metered API rate card',
        )

        await userEvent.click(screen.getByTestId(RATE_CARD_DRAWER_REMOVE_DESCRIPTION_TEST_ID))

        expect(screen.getByTestId(DESCRIPTION_PROBE_TEST_ID)).toBeEmptyDOMElement()
        expect(screen.getByTestId(RATE_CARD_DRAWER_SHOW_DESCRIPTION_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(RATE_CARD_DRAWER_DESCRIPTION_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the user reveals the description then removes it without typing', () => {
      it('THEN leaves the form pristine', async () => {
        renderContent()

        await userEvent.click(screen.getByTestId(RATE_CARD_DRAWER_SHOW_DESCRIPTION_TEST_ID))
        await userEvent.click(screen.getByTestId(RATE_CARD_DRAWER_REMOVE_DESCRIPTION_TEST_ID))

        expect(screen.getByTestId(DIRTY_PROBE_TEST_ID)).toHaveTextContent('false')
      })
    })
  })

  describe('GIVEN a rate card with a description', () => {
    describe('WHEN the content renders', () => {
      it('THEN shows the description input and its remove button', () => {
        renderContent({ values: { description: 'Existing description' } })

        expect(screen.getByTestId(RATE_CARD_DRAWER_REMOVE_DESCRIPTION_TEST_ID)).toBeInTheDocument()
        expect(
          screen.queryByTestId(RATE_CARD_DRAWER_SHOW_DESCRIPTION_TEST_ID),
        ).not.toBeInTheDocument()
        expect(getDescriptionInput()).toHaveValue('Existing description')
      })
    })
  })

  describe('GIVEN no attached product', () => {
    describe('WHEN the content renders', () => {
      it('THEN hides the available-models alert', () => {
        renderContent()

        expect(
          screen.queryByTestId(RATE_CARD_DRAWER_AVAILABLE_MODELS_ALERT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an attach-mode seed carrying no product type', () => {
    describe('WHEN the content renders', () => {
      it('THEN hides the available-models alert', () => {
        renderContent({
          values: { productId: PRODUCT_ID },
          productSeed: { value: PRODUCT_ID, label: 'Metered API' },
        })

        expect(
          screen.queryByTestId(RATE_CARD_DRAWER_AVAILABLE_MODELS_ALERT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an attached fixed product', () => {
    describe('WHEN the content renders', () => {
      it('THEN lists the fixed rate models only', () => {
        renderContent({
          values: { productId: PRODUCT_ID },
          productSeed: {
            value: PRODUCT_ID,
            label: 'Seat',
            productType: ProductTypeEnum.Fixed,
            aggregationType: null,
            recurring: null,
          },
        })

        expect(getAvailableModelLabels()).toEqual([
          GRADUATED_MODEL_KEY,
          STANDARD_MODEL_KEY,
          VOLUME_MODEL_KEY,
        ])
      })
    })
  })

  describe('GIVEN an attached usage product aggregating a sum', () => {
    describe('WHEN the content renders', () => {
      it('THEN lists the usage rate models including the dynamic one', () => {
        renderContent({
          values: { productId: PRODUCT_ID },
          productSeed: buildUsageSeed(AggregationTypeEnum.SumAgg),
        })

        expect(getAvailableModelLabels()).toEqual([
          DYNAMIC_MODEL_KEY,
          STANDARD_MODEL_KEY,
          GRADUATED_MODEL_KEY,
          PACKAGE_MODEL_KEY,
          PERCENTAGE_MODEL_KEY,
          VOLUME_MODEL_KEY,
          GRADUATED_PERCENTAGE_MODEL_KEY,
        ])
      })
    })
  })

  describe('GIVEN an attached usage product aggregating a latest value', () => {
    describe('WHEN the content renders', () => {
      it('THEN drops the percentage-based rate models', () => {
        renderContent({
          values: { productId: PRODUCT_ID },
          productSeed: buildUsageSeed(AggregationTypeEnum.LatestAgg),
        })

        expect(getAvailableModelLabels()).toEqual([
          STANDARD_MODEL_KEY,
          GRADUATED_MODEL_KEY,
          PACKAGE_MODEL_KEY,
          VOLUME_MODEL_KEY,
        ])
      })
    })
  })

  describe('GIVEN no currency selected', () => {
    describe('WHEN the content renders', () => {
      it('THEN hides both the pricing unit combobox and its add action', async () => {
        renderContent({}, mocksWithPricingUnits)

        expect(
          await screen.findByTestId(RATE_CARD_DRAWER_SHOW_DESCRIPTION_TEST_ID),
        ).toBeInTheDocument()
        expect(
          screen.queryByTestId(RATE_CARD_DRAWER_SHOW_PRICING_UNIT_TEST_ID),
        ).not.toBeInTheDocument()
        expect(queryPricingUnitInput()).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a currency but no pricing unit defined on the organization', () => {
    describe('WHEN the content renders', () => {
      it('THEN hides both the pricing unit combobox and its add action', () => {
        renderContent({ values: { currency: CurrencyEnum.Usd } })

        expect(
          screen.queryByTestId(RATE_CARD_DRAWER_SHOW_PRICING_UNIT_TEST_ID),
        ).not.toBeInTheDocument()
        expect(queryPricingUnitInput()).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a currency and available pricing units, on a rate card without one', () => {
    describe('WHEN the content renders', () => {
      it('THEN shows the add-pricing-unit action only', async () => {
        renderWithPricingUnits()

        expect(
          await screen.findByTestId(RATE_CARD_DRAWER_SHOW_PRICING_UNIT_TEST_ID),
        ).toBeInTheDocument()
        expect(queryPricingUnitInput()).not.toBeInTheDocument()
      })
    })

    describe('WHEN the user clicks the add-pricing-unit action', () => {
      it('THEN reveals the combobox, focuses it and drops its options open', async () => {
        renderWithPricingUnits()

        await userEvent.click(await screen.findByTestId(RATE_CARD_DRAWER_SHOW_PRICING_UNIT_TEST_ID))

        expect(queryPricingUnitInput()).toBeInTheDocument()
        expect(
          screen.queryByTestId(RATE_CARD_DRAWER_SHOW_PRICING_UNIT_TEST_ID),
        ).not.toBeInTheDocument()

        await waitFor(() => expect(queryPricingUnitInput()).toHaveFocus())
        expect(await screen.findByRole('listbox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a rate card already priced in a pricing unit', () => {
    describe('WHEN the content renders', () => {
      it('THEN shows the combobox and its remove button', async () => {
        renderWithPricingUnits({ pricingUnit: 'credits' })

        expect(
          await screen.findByTestId(RATE_CARD_DRAWER_REMOVE_PRICING_UNIT_TEST_ID),
        ).toBeInTheDocument()
        expect(queryPricingUnitInput()).toBeInTheDocument()
        expect(
          screen.queryByTestId(RATE_CARD_DRAWER_SHOW_PRICING_UNIT_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN leaves the combobox closed and unfocused', async () => {
        renderWithPricingUnits({ pricingUnit: 'credits' })

        expect(
          await screen.findByTestId(RATE_CARD_DRAWER_REMOVE_PRICING_UNIT_TEST_ID),
        ).toBeVisible()
        expect(queryPricingUnitInput()).not.toHaveFocus()
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })

    describe('WHEN the user removes the pricing unit', () => {
      it('THEN hides the combobox and clears the value', async () => {
        renderWithPricingUnits({ pricingUnit: 'credits' })

        await userEvent.click(
          await screen.findByTestId(RATE_CARD_DRAWER_REMOVE_PRICING_UNIT_TEST_ID),
        )

        expect(queryPricingUnitInput()).not.toBeInTheDocument()
        expect(screen.getByTestId(PRICING_UNIT_PROBE_TEST_ID)).toHaveTextContent('undefined')
        expect(screen.getByTestId(RATE_CARD_DRAWER_SHOW_PRICING_UNIT_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the code lock', () => {
    it('WHEN unlocked THEN the code input stays editable', () => {
      renderContent()

      expect(codeInput()).toBeEnabled()
    })

    it('WHEN locked THEN the code input is disabled', () => {
      renderContent({ disableCodeInput: true })

      expect(codeInput()).toBeDisabled()
    })
  })

  // `RateCards::UpdateService`: `LOCKED_WITH_RATES` freezes on `rate_card.rates.exists?`,
  // and the currency freezes on that OR on `attached_to_plan_or_subscription?`.
  describe('GIVEN the billing-semantic fields', () => {
    it('WHEN the card has neither rates nor attachments THEN they stay editable', () => {
      renderContent({ values: { productId: PRODUCT_ID } })

      expect(currencyInput()).toBeEnabled()
    })

    it('WHEN the card has a rate THEN they freeze', () => {
      renderContent({ hasRates: true, values: { productId: PRODUCT_ID } })

      expect(currencyInput()).toBeDisabled()
    })

    it('WHEN the card is attached but has no rate THEN only the currency freezes', () => {
      renderContent({ isAttached: true, values: { productId: PRODUCT_ID } })

      expect(currencyInput()).toBeDisabled()
    })
  })
})

type QueriedProduct = NonNullable<
  GetProductsForRateCardDrawerQuery['products']
>['collection'][number]

const alphaProduct: QueriedProduct = {
  __typename: 'Product',
  id: PRODUCT_ID,
  name: 'Alpha seats',
  code: 'alpha',
  productType: ProductTypeEnum.Fixed,
  billableMetric: null,
}
const betaProduct: QueriedProduct = {
  __typename: 'Product',
  id: 'product-2',
  name: 'Beta API',
  code: 'beta',
  productType: ProductTypeEnum.Usage,
  billableMetric: {
    __typename: 'BillableMetric',
    id: 'metric-2',
    aggregationType: AggregationTypeEnum.SumAgg,
    recurring: false,
  },
}

const productQueryMock = (
  collection: QueriedProduct[],
  searchTerm?: string,
): TestMocksType[number] => ({
  request: {
    query: GetProductsForRateCardDrawerDocument,
    variables: { page: 1, limit: 20, ...(searchTerm ? { searchTerm } : {}) },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { products: { collection, metadata: { currentPage: 1, totalPages: 2 } } } },
})

const filterQueryMock: TestMocksType[number] = {
  request: {
    query: GetProductFiltersForRateCardDrawerDocument,
    variables: { productId: betaProduct.id },
  },
  result: { data: { productFilters: { collection: [] } } },
}

const productInput = (): HTMLInputElement =>
  document.querySelector('input[name="productId"]') as HTMLInputElement

const prorationSwitch = (): HTMLElement | null =>
  screen.queryByRole('checkbox', { name: 'proration' })

describe('rate card model compatibility', () => {
  afterEach(() => {
    mockTranslationSuffix = ''
  })

  it('updates chips when billing timing and proration change', async () => {
    renderContent({
      values: { productId: PRODUCT_ID },
      productSeed: { value: PRODUCT_ID, label: 'Seats', productType: ProductTypeEnum.Fixed },
    })

    await userEvent.click(
      document.querySelector('input[name="billingTiming"][value="advance"]') as HTMLElement,
    )
    expect(getAvailableModelLabels()).toEqual([GRADUATED_MODEL_KEY, STANDARD_MODEL_KEY])

    await userEvent.click(prorationSwitch() as HTMLElement)
    expect(getAvailableModelLabels()).toEqual([STANDARD_MODEL_KEY])
  })

  it('updates translated chips without changing the selected product', () => {
    const props: HarnessProps = {
      values: { productId: PRODUCT_ID },
      productSeed: { value: PRODUCT_ID, label: 'Seats', productType: ProductTypeEnum.Fixed },
    }
    const view = renderContent(props)

    mockTranslationSuffix = '-translated'
    view.rerender(<Harness {...props} />)

    expect(getAvailableModelLabels()).toEqual([
      `${GRADUATED_MODEL_KEY}-translated`,
      `${STANDARD_MODEL_KEY}-translated`,
      `${VOLUME_MODEL_KEY}-translated`,
    ])
  })

  it('explains a resolved empty model set without advertising Standard', () => {
    renderContent({
      values: { productId: PRODUCT_ID, billingTiming: RateCardBillingTimingEnum.Advance },
      productSeed: buildUsageSeed(AggregationTypeEnum.MaxAgg),
    })

    expect(screen.getByTestId(RATE_CARD_DRAWER_AVAILABLE_MODELS_ALERT_TEST_ID)).toBeInTheDocument()
    expect(screen.queryAllByTestId(RATE_CARD_DRAWER_AVAILABLE_MODEL_CHIP_TEST_ID)).toHaveLength(0)
  })

  it('does not claim model availability when recurrence is unresolved', () => {
    renderContent({
      values: { productId: PRODUCT_ID },
      productSeed: { ...buildUsageSeed(AggregationTypeEnum.SumAgg), recurring: undefined },
    })

    expect(
      screen.queryByTestId(RATE_CARD_DRAWER_AVAILABLE_MODELS_ALERT_TEST_ID),
    ).not.toBeInTheDocument()
  })

  it('retains the selected option and metadata through a search, then selects the new product explicitly', async () => {
    renderContent({}, [
      ...buildMocks(),
      productQueryMock([alphaProduct]),
      productQueryMock([betaProduct], 'Beta'),
      filterQueryMock,
    ])

    await userEvent.click(productInput())
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(
      await screen.findByRole('option', { name: new RegExp(alphaProduct.name) }),
    )
    expect(getAvailableModelLabels()).toEqual([
      GRADUATED_MODEL_KEY,
      STANDARD_MODEL_KEY,
      VOLUME_MODEL_KEY,
    ])

    await userEvent.tripleClick(productInput())
    await userEvent.keyboard('Beta')
    await screen.findByRole('option', { name: new RegExp(betaProduct.name) })

    expect(screen.getByTestId(PRODUCT_ID_PROBE_TEST_ID)).toHaveTextContent(PRODUCT_ID)
    expect(screen.getByRole('option', { name: new RegExp(alphaProduct.name) })).toBeInTheDocument()
    expect(getAvailableModelLabels()).toEqual([
      GRADUATED_MODEL_KEY,
      STANDARD_MODEL_KEY,
      VOLUME_MODEL_KEY,
    ])

    await userEvent.click(screen.getByRole('option', { name: new RegExp(betaProduct.name) }))
    expect(screen.getByTestId(PRODUCT_ID_PROBE_TEST_ID)).toHaveTextContent(betaProduct.id)
    expect(productInput()).toHaveValue(betaProduct.name)
    expect(getAvailableModelLabels()).toContain(DYNAMIC_MODEL_KEY)
  })

  it('uses attached metadata when the product is absent from the initial page', async () => {
    renderContent(
      {
        isAttached: true,
        values: { productId: PRODUCT_ID },
        productSeed: {
          value: PRODUCT_ID,
          label: alphaProduct.name,
          productType: ProductTypeEnum.Fixed,
        },
      },
      [...buildMocks(), productQueryMock([betaProduct])],
    )

    await userEvent.click(productInput())
    await userEvent.keyboard('{ArrowDown}')
    await screen.findByRole('option', { name: new RegExp(betaProduct.name) })
    expect(getAvailableModelLabels()).toEqual([
      GRADUATED_MODEL_KEY,
      STANDARD_MODEL_KEY,
      VOLUME_MODEL_KEY,
    ])
    expect(screen.getByTestId(PRODUCT_ID_PROBE_TEST_ID)).toHaveTextContent(PRODUCT_ID)
  })

  it.each([
    { aggregationType: AggregationTypeEnum.SumAgg, recurring: false },
    { aggregationType: AggregationTypeEnum.WeightedSumAgg, recurring: true },
  ])(
    'resets hidden proration after selecting $aggregationType with recurring=$recurring',
    async (metric) => {
      const nextProduct: QueriedProduct = {
        ...betaProduct,
        billableMetric: { __typename: 'BillableMetric', id: 'metric-2', ...metric },
      }

      renderContent(
        {
          values: { productId: PRODUCT_ID, proration: true },
          productSeed: {
            value: PRODUCT_ID,
            label: alphaProduct.name,
            productType: ProductTypeEnum.Fixed,
          },
        },
        [...buildMocks(), productQueryMock([nextProduct]), filterQueryMock],
      )

      await userEvent.click(productInput())
      await userEvent.keyboard('{ArrowDown}')
      await userEvent.click(
        await screen.findByRole('option', { name: new RegExp(nextProduct.name) }),
      )

      expect(screen.getByTestId(PRORATION_PROBE_TEST_ID)).toHaveTextContent('false')
      expect(prorationSwitch()).not.toBeInTheDocument()
      expect(getAvailableModelLabels().length).toBeGreaterThan(0)
    },
  )

  it.each([
    { aggregationType: AggregationTypeEnum.SumAgg, recurring: false },
    { aggregationType: AggregationTypeEnum.WeightedSumAgg, recurring: true },
  ])('lets unsupported saved proration be turned off for $aggregationType', async (metric) => {
    renderContent({
      isEdit: true,
      values: { productId: PRODUCT_ID, proration: true },
      productSeed: { ...buildUsageSeed(metric.aggregationType), recurring: metric.recurring },
    })

    const savedProrationSwitch = screen.getByRole('checkbox', { name: 'proration' })

    expect(screen.getByTestId(PRORATION_PROBE_TEST_ID)).toHaveTextContent('true')
    expect(screen.getByTestId(DIRTY_PROBE_TEST_ID)).toHaveTextContent('false')
    expect(savedProrationSwitch).toBeChecked()
    expect(savedProrationSwitch).toBeEnabled()
    expect(screen.queryAllByTestId(RATE_CARD_DRAWER_AVAILABLE_MODEL_CHIP_TEST_ID)).toHaveLength(0)
    expect(screen.getByTestId(RATE_CARD_DRAWER_AVAILABLE_MODELS_ALERT_TEST_ID)).toBeInTheDocument()

    await userEvent.click(savedProrationSwitch)

    expect(screen.getByTestId(PRORATION_PROBE_TEST_ID)).toHaveTextContent('false')
    expect(prorationSwitch()).not.toBeInTheDocument()
    expect(getAvailableModelLabels().length).toBeGreaterThan(0)
  })

  it('keeps unsupported saved proration locked when the card already has rates', () => {
    renderContent({
      isEdit: true,
      hasRates: true,
      values: { productId: PRODUCT_ID, proration: true },
      productSeed: { ...buildUsageSeed(AggregationTypeEnum.WeightedSumAgg), recurring: true },
    })

    expect(screen.getByRole('checkbox', { name: 'proration' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'proration' })).toBeDisabled()
  })
})

describe('invoicing strategy selection', () => {
  beforeEach(() => {
    mockIsPremium = true
  })

  afterEach(() => {
    mockIsPremium = false
  })

  it('preserves the saved strategy, updates all choices, and resets it after switching to arrears', async () => {
    renderContent({
      isEdit: true,
      values: {
        productId: PRODUCT_ID,
        billingTiming: RateCardBillingTimingEnum.Advance,
        invoicingStrategy: 'regroupPaidFees',
      },
      productSeed: { value: PRODUCT_ID, label: 'Seats', productType: ProductTypeEnum.Fixed },
    })

    expect(
      screen
        .getByRole('radio', { name: 'text_6687b0081931407697975945' })
        .closest('label')
        ?.querySelector('circle[r="4"]'),
    ).toBeInTheDocument()
    expect(screen.getByTestId(DIRTY_PROBE_TEST_ID)).toHaveTextContent('false')

    await userEvent.click(screen.getByRole('radio', { name: 'text_6687b0081931407697975947' }))
    expect(screen.getByTestId(INVOICING_STRATEGY_PROBE_TEST_ID)).toHaveTextContent('none')

    await userEvent.click(screen.getByRole('radio', { name: 'text_6687b0081931407697975943' }))
    expect(screen.getByTestId(INVOICING_STRATEGY_PROBE_TEST_ID)).toHaveTextContent('invoiceable')

    await userEvent.click(screen.getByRole('radio', { name: 'text_6687b0081931407697975945' }))
    expect(screen.getByTestId(INVOICING_STRATEGY_PROBE_TEST_ID)).toHaveTextContent(
      'regroupPaidFees',
    )

    const [arrearsRadio, advanceRadio] = screen.getAllByRole('radio', { name: 'billingTiming' })

    await userEvent.click(arrearsRadio)
    expect(screen.getByTestId(INVOICING_STRATEGY_PROBE_TEST_ID)).toHaveTextContent('invoiceable')

    await userEvent.click(advanceRadio)
    expect(
      screen
        .getByRole('radio', { name: 'text_6687b0081931407697975943' })
        .closest('label')
        ?.querySelector('circle[r="4"]'),
    ).toBeInTheDocument()
  })
})

describe('selected product reset lifecycle', () => {
  it.each([false, true])(
    'resets retained metadata for create-more with attachment=%s',
    async (isSeeded) => {
      renderContent(
        {
          values: { productId: isSeeded ? PRODUCT_ID : '' },
          productSeed: isSeeded
            ? { value: PRODUCT_ID, label: alphaProduct.name, productType: ProductTypeEnum.Fixed }
            : null,
        },
        [...buildMocks(), productQueryMock([betaProduct]), filterQueryMock],
      )

      await userEvent.click(productInput())
      await userEvent.keyboard('{ArrowDown}')
      await userEvent.click(
        await screen.findByRole('option', { name: new RegExp(betaProduct.name) }),
      )
      expect(getAvailableModelLabels()).toContain(DYNAMIC_MODEL_KEY)

      await userEvent.click(screen.getByRole('button', { name: 'reset for next create' }))

      if (isSeeded) {
        expect(screen.getByTestId(PRODUCT_ID_PROBE_TEST_ID)).toHaveTextContent(PRODUCT_ID)
        expect(productInput()).toHaveValue(alphaProduct.name)
        expect(getAvailableModelLabels()).toEqual([
          GRADUATED_MODEL_KEY,
          STANDARD_MODEL_KEY,
          VOLUME_MODEL_KEY,
        ])
      } else {
        expect(screen.getByTestId(PRODUCT_ID_PROBE_TEST_ID)).toBeEmptyDOMElement()
        expect(productInput()).toHaveValue('')
        expect(
          screen.queryByTestId(RATE_CARD_DRAWER_AVAILABLE_MODELS_ALERT_TEST_ID),
        ).not.toBeInTheDocument()
      }
    },
  )
})
