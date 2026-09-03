import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  AggregationTypeEnum,
  CurrencyEnum,
  GetPricingUnitsForRateCardDrawerDocument,
  GetProductFiltersForRateCardDrawerDocument,
  ProductTypeEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render, TestMocksType } from '~/test-utils'

import { RATE_CARD_FORM_DEFAULTS, RateCardFormValues } from '../constants'
import {
  RATE_CARD_DRAWER_AVAILABLE_MODEL_CHIP_TEST_ID,
  RATE_CARD_DRAWER_AVAILABLE_MODELS_ALERT_TEST_ID,
  RATE_CARD_DRAWER_DESCRIPTION_TEST_ID,
  RATE_CARD_DRAWER_REMOVE_DESCRIPTION_TEST_ID,
  RATE_CARD_DRAWER_REMOVE_PRICING_UNIT_TEST_ID,
  RATE_CARD_DRAWER_SHOW_DESCRIPTION_TEST_ID,
  RATE_CARD_DRAWER_SHOW_PRICING_UNIT_TEST_ID,
  RateCardDrawerContent,
  RateCardProductSeed,
} from '../RateCardDrawerContent'

// `translate` must echo the key: the available-models memo excludes it from its
// deps, so the real hook would cache the labels of the untranslated first render.
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

// jsdom has no scrollIntoView, and `scrollToAndClickElement` calls it before the click that
// opens the pricing unit combobox.
Element.prototype.scrollIntoView = jest.fn()

const DESCRIPTION_PROBE_TEST_ID = 'description-probe'
const DIRTY_PROBE_TEST_ID = 'dirty-probe'
const PRICING_UNIT_PROBE_TEST_ID = 'pricing-unit-probe'

const DYNAMIC_MODEL_KEY = 'text_1727711520232zpp50zgnam5'
const STANDARD_MODEL_KEY = 'text_624aa732d6af4e0103d40e6f'
const GRADUATED_MODEL_KEY = 'text_62793bbb599f1c01522e919f'
const PACKAGE_MODEL_KEY = 'text_6282085b4f283b0102655868'
const PERCENTAGE_MODEL_KEY = 'text_62a0b7107afa2700a65ef6e2'
const VOLUME_MODEL_KEY = 'text_6304e74aab6dbc18d615f386'
const GRADUATED_PERCENTAGE_MODEL_KEY = 'text_64de472463e2da6b31737db0'

const PRODUCT_ID = 'product-1'

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
    result: { data: { productFilters: { collection: [] } } },
  },
]

const mocks = buildMocks()
const mocksWithPricingUnits = buildMocks([{ id: 'pu-1', name: 'Credits', code: 'credits' }])

const buildUsageSeed = (aggregationType: AggregationTypeEnum): RateCardProductSeed => ({
  value: PRODUCT_ID,
  label: 'Metered API',
  productType: ProductTypeEnum.Usage,
  aggregationType,
  recurring: false,
})

type HarnessProps = {
  values?: Partial<RateCardFormValues>
  productSeed?: RateCardProductSeed
}

const Harness = ({ values, productSeed = null }: HarnessProps): JSX.Element => {
  const form = useAppForm({ defaultValues: { ...RATE_CARD_FORM_DEFAULTS, ...values } })

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
      <RateCardDrawerContent
        form={form}
        isEdit={false}
        isLocked={false}
        disableCodeInput={false}
        productSeed={productSeed}
        productFilterSeed={null}
      />
    </>
  )
}

const renderContent = (
  props: HarnessProps = {},
  testMocks: TestMocksType = mocks,
): ReturnType<typeof render> => render(<Harness {...props} />, { mocks: testMocks })

const renderWithPricingUnits = (
  values: Partial<RateCardFormValues> = {},
): ReturnType<typeof render> =>
  renderContent({ values: { currency: CurrencyEnum.Usd, ...values } }, mocksWithPricingUnits)

const queryPricingUnitInput = (): HTMLInputElement | null =>
  document.querySelector<HTMLInputElement>('input[name="pricingUnit"]')

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
})
