import { MockedResponse } from '@apollo/client/testing'
import { render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ComboBoxProps } from '~/components/form/ComboBox/types'
import {
  AggregationTypeEnum,
  CurrencyEnum,
  GetProductFiltersForAppliedRateCardDrawerDocument,
  GetProductsForAppliedRateCardDrawerDocument,
  GetRateCardsForAppliedRateCardDrawerDocument,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import {
  APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID,
  APPLIED_RATE_CARD_DRAWER_PRODUCT_FILTER_TEST_ID,
  APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID,
  APPLIED_RATE_CARD_DRAWER_SHOW_FILTER_TEST_ID,
  AppliedRateCardDrawerContent,
} from '../AppliedRateCardDrawerContent'
import { APPLIED_RATE_CARD_FORM_DEFAULTS } from '../validationSchema'

// jsdom has no scrollIntoView, and `scrollToAndClickElement` calls it before the click that
// reveals/focuses the product filter combobox.
Element.prototype.scrollIntoView = jest.fn()

// `react-window` virtualization never renders rows in jsdom (no real layout) - force it off,
// matching the established pattern in RateCardDrawerContent.test.tsx.
jest.mock('~/components/form/ComboBox/ComboBox', () => {
  const { ComboBox } = jest.requireActual('~/components/form/ComboBox/ComboBox')

  return { ComboBox: (props: ComboBoxProps) => <ComboBox {...props} virtualized={false} /> }
})

const mockOpenRateCardDrawer = jest.fn()

jest.mock('~/pages/catalog/drawers/rateCard/useRateCardDrawer', () => ({
  useRateCardDrawer: () => ({ openDrawer: mockOpenRateCardDrawer }),
}))

const mockOpenRatePhaseLocalDrawer = jest.fn()

jest.mock('~/components/appliedRateCards/drawers/ratePhase/useRatePhaseLocalDrawer', () => ({
  useRatePhaseLocalDrawer: () => ({ openDrawer: mockOpenRatePhaseLocalDrawer }),
}))

const PRODUCT = {
  __typename: 'Product',
  id: 'product-1',
  code: 'prod-1',
  name: 'Metered API',
  productType: ProductTypeEnum.Metered,
  billableMetric: {
    __typename: 'BillableMetric',
    id: 'bm-1',
    aggregationType: AggregationTypeEnum.SumAgg,
    recurring: false,
  },
}
const PRODUCT_FILTER = {
  __typename: 'ProductFilter',
  id: 'filter-1',
  name: 'EU only',
  code: 'eu-only',
}

type RateCardFixture = {
  __typename: string
  id: string
  name: string
  code: string
  currency: CurrencyEnum
  billingTiming: RateCardBillingTimingEnum
  appliedPricingUnitCode: string | null
  proration: boolean
  activeRate: {
    __typename: string
    rateModel: RateCardRateModelEnum
    rateProperties: Record<string, unknown>
    billingIntervalCount: number
    billingIntervalUnit: RateCardRateBillingIntervalUnitEnum
    minAmountCents: number
    appliedPricingUnitConversionRate: number | null
  }
}

const RATE_CARD: RateCardFixture = {
  __typename: 'RateCard',
  id: 'rc-1',
  name: 'Standard card',
  code: 'standard-card',
  currency: CurrencyEnum.Usd,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  appliedPricingUnitCode: null,
  proration: false,
  activeRate: {
    __typename: 'RateCardRate',
    rateModel: RateCardRateModelEnum.Standard,
    rateProperties: { __typename: 'RateProperties', amount: '10' },
    billingIntervalCount: 1,
    billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
    minAmountCents: 0,
    appliedPricingUnitConversionRate: null,
  },
}

const productsMock = (): MockedResponse => ({
  request: { query: GetProductsForAppliedRateCardDrawerDocument, variables: { page: 1, limit: 20 } },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: {
    data: { products: { collection: [PRODUCT], metadata: { currentPage: 1, totalPages: 1 } } },
  },
})

const productFiltersMock = (): MockedResponse => ({
  request: {
    query: GetProductFiltersForAppliedRateCardDrawerDocument,
    variables: { productId: PRODUCT.id },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { productFilters: { collection: [PRODUCT_FILTER] } } },
})

const rateCardsMock = (
  captureVars: (vars: Record<string, unknown>) => void,
  collection: RateCardFixture[] = [RATE_CARD],
  maxUsageCount: number = Number.POSITIVE_INFINITY,
): MockedResponse => ({
  request: { query: GetRateCardsForAppliedRateCardDrawerDocument },
  variableMatcher: (vars) => {
    captureVars(vars)
    return true
  },
  maxUsageCount,
  result: { data: { rateCards: { collection } } },
})

const RATE_CARD_ID_PROBE_TEST_ID = 'rate-card-id-probe'
const CURRENCY_PROBE_TEST_ID = 'currency-probe'
const RATE_PHASES_LENGTH_PROBE_TEST_ID = 'rate-phases-length-probe'

const Host = ({ context = 'plan' }: { context?: 'plan' | 'contract' }): JSX.Element => {
  const form = useAppForm({ defaultValues: APPLIED_RATE_CARD_FORM_DEFAULTS })

  return (
    <>
      <button type="button" onClick={() => form.setFieldValue('productId', PRODUCT.id)}>
        select product
      </button>
      <form.Subscribe selector={(state) => state.values.rateCardId}>
        {(rateCardId) => <output data-test={RATE_CARD_ID_PROBE_TEST_ID}>{rateCardId}</output>}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.values.currency}>
        {(currency) => <output data-test={CURRENCY_PROBE_TEST_ID}>{currency}</output>}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.values.ratePhases.length}>
        {(length) => <output data-test={RATE_PHASES_LENGTH_PROBE_TEST_ID}>{length}</output>}
      </form.Subscribe>
      <AppliedRateCardDrawerContent form={form} context={context} />
    </>
  )
}

const selectRateCard = async (): Promise<void> => {
  const rateCardInput = (
    await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)
  ).querySelector('input') as HTMLInputElement

  await userEvent.click(rateCardInput)
  await userEvent.click(await screen.findByText(RATE_CARD.name))
}

// The widened rate-card query spreads named fragments (`RateCardForAppliedRateCardDrawer`,
// `PropertiesForRateCardRate`); Apollo's cache needs real `__typename`s to resolve a fragment's
// type condition when reading a mocked response back out - `~/test-utils`'s own `render` always
// passes `addTypename={false}`, so this file renders directly like RateCardDrawerContent.test.tsx.
const renderContent = (
  mocks: TestMocksType = [],
  context: 'plan' | 'contract' = 'plan',
): ReturnType<typeof rtlRender> =>
  rtlRender(<Host context={context} />, {
    wrapper: ({ children }) => (
      <AllTheProviders forceTypenames mocks={mocks}>
        {children}
      </AllTheProviders>
    ),
  })

describe('AppliedRateCardDrawerContent, product/filter/rate-card cascade', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GIVEN no product selected THEN only the product combobox renders', () => {
    renderContent([productsMock()])

    expect(
      screen.queryByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId(APPLIED_RATE_CARD_DRAWER_SHOW_FILTER_TEST_ID),
    ).not.toBeInTheDocument()
  })

  it('GIVEN a product is selected THEN the rate-card query runs with productIds: [productId] and no productFilterIds', async () => {
    let capturedVars: Record<string, unknown> = {}

    renderContent([productsMock(), rateCardsMock((vars) => (capturedVars = vars))])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))

    await waitFor(() => expect(capturedVars).toMatchObject({ productIds: [PRODUCT.id] }))
    expect(capturedVars.productFilterIds).toBeUndefined()
  })

  it('GIVEN "+ Add filter" is clicked THEN the product filter combobox reveals', async () => {
    renderContent([productsMock(), productFiltersMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_SHOW_FILTER_TEST_ID))

    expect(screen.getByTestId(APPLIED_RATE_CARD_DRAWER_PRODUCT_FILTER_TEST_ID)).toBeInTheDocument()
  })

  it('GIVEN both product and product filter are selected THEN the rate-card query includes both ids', async () => {
    let capturedVars: Record<string, unknown> = {}

    renderContent([
      productsMock(),
      productFiltersMock(),
      rateCardsMock((vars) => (capturedVars = vars)),
    ])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_SHOW_FILTER_TEST_ID))

    const filterInput = screen
      .getByTestId(APPLIED_RATE_CARD_DRAWER_PRODUCT_FILTER_TEST_ID)
      .querySelector('input') as HTMLInputElement

    await userEvent.click(filterInput)
    await userEvent.type(filterInput, 'EU')
    await userEvent.click(await screen.findByText(PRODUCT_FILTER.name))

    await waitFor(() =>
      expect(capturedVars).toMatchObject({
        productIds: [PRODUCT.id],
        productFilterIds: [PRODUCT_FILTER.id],
      }),
    )
  })

  it('GIVEN the rate-card combobox has no matches and the user clicks "add value" THEN the stacked useRateCardDrawer opens seeded with the picked product', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined, [])])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))

    const rateCardInput = (
      await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)
    ).querySelector('input') as HTMLInputElement

    await userEvent.click(rateCardInput)

    const addValueItem = await screen.findByTestId(
      'combobox-item-text_17951541055448xojz4p5i90',
    )

    await userEvent.click(addValueItem.querySelector('button') as HTMLElement)

    expect(mockOpenRateCardDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        attachToProduct: expect.objectContaining({ id: PRODUCT.id }),
        onCreated: expect.any(Function),
      }),
    )
  })

  it("GIVEN the stacked drawer calls onCreated THEN this drawer sets its rateCardId field to the new code, and the stacked drawer is already closed", async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined, [])])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))

    const rateCardInput = (
      await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)
    ).querySelector('input') as HTMLInputElement

    await userEvent.click(rateCardInput)

    const addValueItem = await screen.findByTestId(
      'combobox-item-text_17951541055448xojz4p5i90',
    )

    await userEvent.click(addValueItem.querySelector('button') as HTMLElement)

    const onCreated = mockOpenRateCardDrawer.mock.calls.at(-1)?.[0]?.onCreated

    onCreated({ id: 'new-rc-id', name: 'New card', code: 'new-code' })

    await waitFor(() =>
      expect(screen.getByTestId(RATE_CARD_ID_PROBE_TEST_ID)).toHaveTextContent('new-code'),
    )
  })
})

describe('AppliedRateCardDrawerContent, rate phases section', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GIVEN no rate card selected THEN the rate phase section does not render', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined, [])])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))

    expect(
      screen.queryByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID),
    ).not.toBeInTheDocument()
  })

  it('GIVEN a rate card selected AND "Add phase" clicked THEN the local rate-phase drawer opens with isLastPosition true', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await selectRateCard()

    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID))

    expect(mockOpenRatePhaseLocalDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ isLastPosition: true, onSave: expect.any(Function) }),
    )
  })

  it("GIVEN the local drawer calls onSave THEN the phase is appended to the form's ratePhases array", async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await selectRateCard()

    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID))

    const onSave = mockOpenRatePhaseLocalDrawer.mock.calls.at(-1)?.[0]?.onSave

    onSave({ code: 'phase-1', name: 'Phase 1', durationType: 'forever' }, {})

    await waitFor(() =>
      expect(screen.getByTestId(RATE_PHASES_LENGTH_PROBE_TEST_ID)).toHaveTextContent('1'),
    )
    expect(screen.getByText('Phase 1')).toBeInTheDocument()
  })

  it("GIVEN the local array's last phase is finite THEN the warning alert renders", async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await selectRateCard()

    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID))

    const onSave = mockOpenRatePhaseLocalDrawer.mock.calls.at(-1)?.[0]?.onSave

    onSave({ code: 'phase-1', durationType: 'finite', durationCycleCount: '3' }, {})

    await waitFor(() => expect(screen.getByTestId('alert-type-warning')).toBeInTheDocument())
  })

  it('GIVEN the local array is empty or its last phase is forever THEN the warning alert does not render', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await selectRateCard()

    expect(screen.queryByTestId('alert-type-warning')).not.toBeInTheDocument()

    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID))

    const onSave = mockOpenRatePhaseLocalDrawer.mock.calls.at(-1)?.[0]?.onSave

    onSave({ code: 'phase-1', durationType: 'forever' }, {})

    await waitFor(() =>
      expect(screen.getByTestId(RATE_PHASES_LENGTH_PROBE_TEST_ID)).toHaveTextContent('1'),
    )
    expect(screen.queryByTestId('alert-type-warning')).not.toBeInTheDocument()
  })

  it("GIVEN the selected rate card changes THEN the form's currency field is set to the rate card's currency", async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await selectRateCard()

    await waitFor(() =>
      expect(screen.getByTestId(CURRENCY_PROBE_TEST_ID)).toHaveTextContent(CurrencyEnum.Usd),
    )
  })

  it('GIVEN a rate card is created via the stacked escape hatch THEN the rate phase section still appears once the newly created rate card resolves', async () => {
    const newRateCard: RateCardFixture = { ...RATE_CARD, id: 'new-rc-id', code: 'new-code', name: 'New card' }

    renderContent([
      productsMock(),
      rateCardsMock(() => undefined, [], 1),
      rateCardsMock(() => undefined, [newRateCard]),
    ])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))

    const rateCardInput = (
      await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)
    ).querySelector('input') as HTMLInputElement

    await userEvent.click(rateCardInput)

    const addValueItem = await screen.findByTestId(
      'combobox-item-text_17951541055448xojz4p5i90',
    )

    await userEvent.click(addValueItem.querySelector('button') as HTMLElement)

    const onCreated = mockOpenRateCardDrawer.mock.calls.at(-1)?.[0]?.onCreated

    onCreated({ id: newRateCard.id, name: newRateCard.name, code: newRateCard.code })

    await waitFor(() =>
      expect(screen.getByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID)).toBeInTheDocument(),
    )
  })
})

describe('AppliedRateCardDrawerContent, contract-only billing anchor date', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GIVEN context contract THEN the billing anchor date field renders', () => {
    renderContent([productsMock()], 'contract')

    expect(screen.getByText('Billing anchor date')).toBeInTheDocument()
  })

  it('GIVEN context plan THEN the billing anchor date field does not render', () => {
    renderContent([productsMock()], 'plan')

    expect(screen.queryByText('Billing anchor date')).not.toBeInTheDocument()
  })

  it('GIVEN context contract THEN no effective date field renders anywhere in the drawer', () => {
    renderContent([productsMock()], 'contract')

    expect(screen.queryByText(/effective date/i)).not.toBeInTheDocument()
  })
})
