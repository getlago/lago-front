import { MockedResponse } from '@apollo/client/testing'
import { render as rtlRender, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { APPLIED_RATE_CARD_CONTEXT_CONFIG } from '~/components/appliedRateCards/appliedRateCardContextConfig'
import { ComboBoxProps } from '~/components/form/ComboBox/types'
import {
  AggregationTypeEnum,
  CurrencyEnum,
  GetContractAppliedRateCardSlicesForAppliedRateCardDrawerDocument,
  GetPlanAppliedRateCardSlicesForAppliedRateCardDrawerDocument,
  GetProductFiltersForAppliedRateCardDrawerDocument,
  GetProductsForAppliedRateCardDrawerDocument,
  GetRateCardsForAppliedRateCardDrawerDocument,
  ProductForAppliedRateCardDrawerFragment,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID } from '../../../RatePhaseRateEffectiveDate'
import {
  getRatePhaseActionsTestId,
  getRatePhaseToggleTestId,
  RATE_PHASE_REVERT_ACTION_TEST_ID,
} from '../../../RatePhaseTable'
import { RATE_PHASE_FORM_DEFAULTS } from '../../ratePhase/ratePhaseFormSchema'
import {
  APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID,
  APPLIED_RATE_CARD_DRAWER_PRODUCT_FILTER_TEST_ID,
  APPLIED_RATE_CARD_DRAWER_PRODUCT_TEST_ID,
  APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID,
  APPLIED_RATE_CARD_DRAWER_REMOVE_FILTER_TEST_ID,
  APPLIED_RATE_CARD_DRAWER_SHOW_FILTER_TEST_ID,
  AppliedRateCardDrawerContent,
} from '../AppliedRateCardDrawerContent'
import { AppliedRateCardParent } from '../usePricedProductFilterIds'
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

const mockOpenRatePhaseLocalDrawer = jest.fn()

jest.mock('~/components/appliedRateCards/drawers/ratePhase/useRatePhaseLocalDrawer', () => ({
  useRatePhaseLocalDrawer: () => ({ openDrawer: mockOpenRatePhaseLocalDrawer }),
}))

const PRODUCT: ProductForAppliedRateCardDrawerFragment = {
  __typename: 'Product',
  id: 'product-1',
  code: 'prod-1',
  name: 'Metered API',
  invoiceDisplayName: null,
  productType: ProductTypeEnum.Metered,
  productCategory: null,
  billableMetric: {
    __typename: 'BillableMetric',
    id: 'bm-1',
    aggregationType: AggregationTypeEnum.SumAgg,
    recurring: false,
  },
}
const CATEGORIZED_PRODUCT: ProductForAppliedRateCardDrawerFragment = {
  ...PRODUCT,
  id: 'product-2',
  code: 'prod-2',
  name: 'Storage',
  productCategory: {
    __typename: 'ProductCategory',
    id: 'category-1',
    name: 'Infrastructure',
    code: 'infra',
    invoiceDisplayName: null,
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
  productFilter: { __typename: string; id: string } | null
  activeRate: {
    __typename: string
    id: string
    effectiveFrom: string
    rateModel: RateCardRateModelEnum
    rateProperties: Record<string, unknown>
    billingIntervalCount: number
    billingIntervalUnit: RateCardRateBillingIntervalUnitEnum
    minAmountCents: number
    appliedPricingUnitConversionRate: number | null
  } | null
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
  productFilter: null,
  activeRate: {
    __typename: 'RateCardRate',
    id: 'rate-1',
    effectiveFrom: '2026-01-01T00:00:00Z',
    rateModel: RateCardRateModelEnum.Standard,
    rateProperties: { __typename: 'RateProperties', amount: '10' },
    billingIntervalCount: 1,
    billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
    minAmountCents: 0,
    appliedPricingUnitConversionRate: null,
  },
}

const productsMock = (
  collection: ProductForAppliedRateCardDrawerFragment[] = [PRODUCT],
): MockedResponse => ({
  request: {
    query: GetProductsForAppliedRateCardDrawerDocument,
    variables: { page: 1, limit: 20 },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: {
    data: { products: { collection, metadata: { currentPage: 1, totalPages: 1 } } },
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

const PLAN_PARENT: AppliedRateCardParent = { context: 'plan', planId: 'plan-1' }
const CONTRACT_PARENT: AppliedRateCardParent = { context: 'contract', contractId: 'contract-1' }

const pricedSlicesMock = (
  parent: AppliedRateCardParent,
  pricedFilterIds: Array<string | null> = [],
): MockedResponse => {
  const collection = pricedFilterIds.map((filterId, index) => ({
    __typename: parent.context === 'plan' ? 'PlanAppliedRateCard' : 'ContractAppliedRateCard',
    id: `applied-${index}`,
    rateCard: {
      __typename: 'RateCard',
      id: `priced-rate-card-${index}`,
      productFilter: filterId ? { __typename: 'ProductFilter', id: filterId } : null,
    },
  }))

  return parent.context === 'plan'
    ? {
        request: { query: GetPlanAppliedRateCardSlicesForAppliedRateCardDrawerDocument },
        variableMatcher: () => true,
        maxUsageCount: Number.POSITIVE_INFINITY,
        result: { data: { planAppliedRateCards: { collection } } },
      }
    : {
        request: { query: GetContractAppliedRateCardSlicesForAppliedRateCardDrawerDocument },
        variableMatcher: () => true,
        maxUsageCount: Number.POSITIVE_INFINITY,
        result: { data: { contractAppliedRateCards: { collection } } },
      }
}

const BASE_TRANSLATIONS: Record<string, string> = jest.requireActual(
  '../../../../../../translations/base.json',
)

const RATE_CARD_ID_PROBE_TEST_ID = 'rate-card-id-probe'
const PRODUCT_FILTER_ID_PROBE_TEST_ID = 'product-filter-id-probe'
const RATE_PHASES_LENGTH_PROBE_TEST_ID = 'rate-phases-length-probe'
const RATE_PHASE_CODES_PROBE_TEST_ID = 'rate-phase-codes-probe'

const Host = ({ parent }: { parent: AppliedRateCardParent }): JSX.Element => {
  const form = useAppForm({ defaultValues: APPLIED_RATE_CARD_FORM_DEFAULTS })

  return (
    <>
      <button type="button" onClick={() => form.setFieldValue('productId', PRODUCT.id)}>
        select product
      </button>
      <form.Subscribe selector={(state) => state.values.rateCardId}>
        {(rateCardId) => <output data-test={RATE_CARD_ID_PROBE_TEST_ID}>{rateCardId}</output>}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.values.productFilterId}>
        {(productFilterId) => (
          <output data-test={PRODUCT_FILTER_ID_PROBE_TEST_ID}>{productFilterId}</output>
        )}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.values.ratePhases.length}>
        {(length) => <output data-test={RATE_PHASES_LENGTH_PROBE_TEST_ID}>{length}</output>}
      </form.Subscribe>
      <form.Subscribe
        selector={(state) => state.values.ratePhases.map((phase) => phase.code).join(',')}
      >
        {(codes) => <output data-test={RATE_PHASE_CODES_PROBE_TEST_ID}>{codes}</output>}
      </form.Subscribe>
      <AppliedRateCardDrawerContent
        form={form}
        parent={parent}
        currency={CurrencyEnum.Usd}
        openRateCardDrawer={mockOpenRateCardDrawer}
        organizationSlug="acme"
      />
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
  parent: AppliedRateCardParent = PLAN_PARENT,
): ReturnType<typeof rtlRender> =>
  rtlRender(<Host parent={parent} />, {
    wrapper: ({ children }) => (
      <AllTheProviders forceTypenames mocks={[...mocks, pricedSlicesMock(parent)]}>
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

    expect(screen.queryByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)).not.toBeInTheDocument()
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

  it('GIVEN a product is selected THEN the rate cards are queried in the drawer currency, under a label naming it', async () => {
    let capturedVars: Record<string, unknown> = {}

    renderContent([productsMock(), rateCardsMock((vars) => (capturedVars = vars))])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)

    expect(screen.getByText('Rate card in USD')).toBeInTheDocument()
    await waitFor(() =>
      expect(capturedVars).toMatchObject({ currency: CurrencyEnum.Usd, limit: 50 }),
    )
  })

  it('GIVEN a rate card search THEN it stays scoped to the drawer currency', async () => {
    let capturedVars: Record<string, unknown> = {}

    renderContent([productsMock(), rateCardsMock((vars) => (capturedVars = vars))])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))

    const rateCardInput = (
      await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)
    ).querySelector('input') as HTMLInputElement

    await userEvent.click(rateCardInput)
    await userEvent.type(rateCardInput, 'premium')

    await waitFor(
      () =>
        expect(capturedVars).toMatchObject({ searchTerm: 'premium', currency: CurrencyEnum.Usd }),
      { timeout: 3000 },
    )
  })

  it('GIVEN "+ Add filter" is clicked THEN the product filter combobox reveals', async () => {
    renderContent([productsMock(), productFiltersMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_SHOW_FILTER_TEST_ID))

    expect(screen.getByTestId(APPLIED_RATE_CARD_DRAWER_PRODUCT_FILTER_TEST_ID)).toBeInTheDocument()
  })

  it('GIVEN a product filter is picked AND its trash is clicked THEN the filter combobox hides and productFilterId resets', async () => {
    renderContent([productsMock(), productFiltersMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_SHOW_FILTER_TEST_ID))

    const filterInput = screen
      .getByTestId(APPLIED_RATE_CARD_DRAWER_PRODUCT_FILTER_TEST_ID)
      .querySelector('input') as HTMLInputElement

    await userEvent.click(filterInput)
    await userEvent.type(filterInput, 'EU')
    await userEvent.click(await screen.findByText(PRODUCT_FILTER.name))

    await waitFor(() =>
      expect(screen.getByTestId(PRODUCT_FILTER_ID_PROBE_TEST_ID)).toHaveTextContent(
        PRODUCT_FILTER.id,
      ),
    )

    await userEvent.click(screen.getByTestId(APPLIED_RATE_CARD_DRAWER_REMOVE_FILTER_TEST_ID))

    expect(
      screen.queryByTestId(APPLIED_RATE_CARD_DRAWER_PRODUCT_FILTER_TEST_ID),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId(APPLIED_RATE_CARD_DRAWER_SHOW_FILTER_TEST_ID)).toBeInTheDocument()
    expect(screen.getByTestId(PRODUCT_FILTER_ID_PROBE_TEST_ID)).toBeEmptyDOMElement()
  })

  it('GIVEN products with and without a category THEN the options are grouped under a category header and a standalone header', async () => {
    renderContent([productsMock([PRODUCT, CATEGORIZED_PRODUCT])])

    const productInput = screen
      .getByTestId(APPLIED_RATE_CARD_DRAWER_PRODUCT_TEST_ID)
      .querySelector('input') as HTMLInputElement

    await userEvent.click(productInput)

    expect(await screen.findByText('Infrastructure')).toBeInTheDocument()
    expect(screen.getByText('infra')).toBeInTheDocument()
    expect(screen.getByText('No product category attached')).toBeInTheDocument()

    await userEvent.click(screen.getByText(CATEGORIZED_PRODUCT.name))

    expect(productInput).toHaveValue('Storage from Infrastructure')
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

    const addValueItem = await screen.findByTestId('combobox-item-Create rate card')

    await userEvent.click(within(addValueItem).getByRole('option'))

    expect(mockOpenRateCardDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: CurrencyEnum.Usd,
        attachToProduct: expect.objectContaining({ id: PRODUCT.id }),
        onCreated: expect.any(Function),
      }),
    )
  })

  it('GIVEN rate cards are listed THEN the "Create rate card" row still shows', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))

    const rateCardInput = (
      await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)
    ).querySelector('input') as HTMLInputElement

    await userEvent.click(rateCardInput)

    expect(await screen.findByText(RATE_CARD.name)).toBeInTheDocument()
    expect(screen.getByTestId('combobox-item-Create rate card')).toBeInTheDocument()
  })

  it('GIVEN the stacked drawer calls onCreated THEN this drawer sets its rateCardId field to the new code, and the stacked drawer is already closed', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined, [])])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))

    const rateCardInput = (
      await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)
    ).querySelector('input') as HTMLInputElement

    await userEvent.click(rateCardInput)

    const addValueItem = await screen.findByTestId('combobox-item-Create rate card')

    await userEvent.click(within(addValueItem).getByRole('option'))

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

  it('GIVEN a product but no rate card selected THEN the rate phases section does not render', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined, [])])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))

    expect(
      await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID),
    ).toBeInTheDocument()
    expect(screen.queryByText('Rate phases')).not.toBeInTheDocument()
    expect(screen.queryByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN a rate card with no phase and no active rate THEN the add action renders', async () => {
    renderContent([
      productsMock(),
      rateCardsMock(() => undefined, [{ ...RATE_CARD, activeRate: null }]),
    ])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await selectRateCard()

    expect(await screen.findByText('Rate phases')).toBeInTheDocument()
    expect(screen.getByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID)).toBeInTheDocument()
  })

  it('GIVEN a rate card selected AND "Add a phase" clicked THEN the local rate-phase drawer opens with the current phases as positions', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await selectRateCard()

    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID))

    expect(mockOpenRatePhaseLocalDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ otherPhases: [], onSave: expect.any(Function) }),
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

  it('GIVEN an overridden phase WHEN reverted from its actions THEN it runs on the active rate again', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await selectRateCard()
    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID))

    const onSave = mockOpenRatePhaseLocalDrawer.mock.calls.at(-1)?.[0]?.onSave

    onSave(
      {
        ...RATE_PHASE_FORM_DEFAULTS,
        code: 'intro',
        name: 'Intro',
        overrideEnabled: true,
        billingIntervalCount: '14',
        billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Day,
      },
      {},
    )

    expect(await screen.findByText('Overridden')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId(getRatePhaseActionsTestId(0)))
    await userEvent.click(screen.getByTestId(RATE_PHASE_REVERT_ACTION_TEST_ID))

    expect(await screen.findByText('Active rate')).toBeInTheDocument()
    expect(screen.queryByText('Overridden')).not.toBeInTheDocument()
  })

  it('GIVEN a phase on the active rate THEN "See rate history" links to the rate card in the current organization', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await selectRateCard()
    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID))

    const onSave = mockOpenRatePhaseLocalDrawer.mock.calls.at(-1)?.[0]?.onSave

    onSave({ ...RATE_PHASE_FORM_DEFAULTS, code: 'main', name: 'Main' }, {})

    await userEvent.click(await screen.findByTestId(getRatePhaseToggleTestId(0)))

    const link = screen
      .getAllByTestId(RATE_PHASE_DETAILS_RATE_HISTORY_LINK_TEST_ID)
      .find((element) => element.tagName === 'A')

    expect(link).toHaveAttribute('href', '/acme/product-catalog/rate-cards/rc-1/rates')
  })

  it('GIVEN a phase saved before an existing one THEN it is inserted at that position', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await selectRateCard()

    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID))
    mockOpenRatePhaseLocalDrawer.mock.calls
      .at(-1)?.[0]
      ?.onSave({ code: 'standard', name: 'Standard', durationType: 'forever' }, {})

    await waitFor(() =>
      expect(screen.getByTestId(RATE_PHASE_CODES_PROBE_TEST_ID)).toHaveTextContent('standard'),
    )

    await userEvent.click(screen.getByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID))

    const { otherPhases, onSave } = mockOpenRatePhaseLocalDrawer.mock.calls.at(-1)?.[0] ?? {}

    expect(otherPhases).toEqual([{ code: 'standard', name: 'Standard' }])

    onSave(
      {
        code: 'trial',
        name: 'Trial',
        positionMode: 'before',
        positionReferenceCode: 'standard',
        durationType: 'finite',
        durationCycleCount: '1',
      },
      {},
    )

    await waitFor(() =>
      expect(screen.getByTestId(RATE_PHASE_CODES_PROBE_TEST_ID)).toHaveTextContent(
        'trial,standard',
      ),
    )
  })

  it('GIVEN a forever phase is not the last one THEN the only-last-forever warning renders', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await selectRateCard()

    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID))
    mockOpenRatePhaseLocalDrawer.mock.calls
      .at(-1)?.[0]
      ?.onSave({ code: 'standard', name: 'Standard', durationType: 'forever' }, {})
    await waitFor(() =>
      expect(screen.getByTestId(RATE_PHASES_LENGTH_PROBE_TEST_ID)).toHaveTextContent('1'),
    )

    await userEvent.click(screen.getByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID))
    mockOpenRatePhaseLocalDrawer.mock.calls.at(-1)?.[0]?.onSave(
      {
        code: 'extra',
        name: 'Extra',
        positionMode: 'after',
        positionReferenceCode: 'standard',
        durationType: 'forever',
      },
      {},
    )

    expect(
      await screen.findByText(
        'Only the last phase can run forever. Set a duration on the other phases to continue.',
      ),
    ).toBeInTheDocument()
  })

  it('GIVEN the product changes through the combobox THEN the rate card and phases reset', async () => {
    renderContent([productsMock([PRODUCT, CATEGORIZED_PRODUCT]), rateCardsMock(() => undefined)])

    const productInput = screen
      .getByTestId(APPLIED_RATE_CARD_DRAWER_PRODUCT_TEST_ID)
      .querySelector('input') as HTMLInputElement

    await userEvent.click(productInput)
    await userEvent.click(await screen.findByText(PRODUCT.name))
    await selectRateCard()

    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID))
    mockOpenRatePhaseLocalDrawer.mock.calls
      .at(-1)?.[0]
      ?.onSave({ code: 'standard', name: 'Standard', durationType: 'forever' }, {})
    await waitFor(() =>
      expect(screen.getByTestId(RATE_PHASES_LENGTH_PROBE_TEST_ID)).toHaveTextContent('1'),
    )

    await userEvent.click(productInput)
    await userEvent.click(await screen.findByText(CATEGORIZED_PRODUCT.name))

    await waitFor(() =>
      expect(screen.getByTestId(RATE_PHASES_LENGTH_PROBE_TEST_ID)).toHaveTextContent('0'),
    )
    expect(screen.getByTestId(RATE_CARD_ID_PROBE_TEST_ID)).toBeEmptyDOMElement()
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

  it('GIVEN phases were added WHEN a rate card search misses the selected card THEN the selection and the phases stay', async () => {
    const otherRateCard: RateCardFixture = {
      ...RATE_CARD,
      id: 'rc-other',
      name: 'Other card',
      code: 'other-card',
    }

    renderContent([
      productsMock(),
      {
        ...rateCardsMock(() => undefined),
        result: (vars: Record<string, unknown>) => ({
          data: { rateCards: { collection: vars.searchTerm ? [otherRateCard] : [RATE_CARD] } },
        }),
      },
    ])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await selectRateCard()
    await userEvent.click(await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID))

    const onSave = mockOpenRatePhaseLocalDrawer.mock.calls.at(-1)?.[0]?.onSave

    onSave({ ...RATE_PHASE_FORM_DEFAULTS, code: 'phase-1', name: 'Phase 1' }, {})

    await waitFor(() =>
      expect(screen.getByTestId(RATE_PHASES_LENGTH_PROBE_TEST_ID)).toHaveTextContent('1'),
    )

    const rateCardInput = screen
      .getByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)
      .querySelector('input') as HTMLInputElement

    await userEvent.click(rateCardInput)
    await userEvent.type(rateCardInput, 'other')

    expect(await screen.findByText(otherRateCard.name, undefined, { timeout: 3000 })).toBeVisible()
    await userEvent.tab()

    expect(screen.getByTestId(RATE_CARD_ID_PROBE_TEST_ID)).toHaveTextContent(RATE_CARD.code)
    expect(screen.getByTestId(RATE_PHASES_LENGTH_PROBE_TEST_ID)).toHaveTextContent('1')
  })

  it('GIVEN a product picked WHEN a product search misses it THEN the product and the rate card stay', async () => {
    renderContent([
      {
        ...productsMock(),
        request: { query: GetProductsForAppliedRateCardDrawerDocument },
        variableMatcher: () => true,
        result: (vars: Record<string, unknown>) => ({
          data: {
            products: {
              collection: vars.searchTerm ? [CATEGORIZED_PRODUCT] : [PRODUCT],
              metadata: { currentPage: 1, totalPages: 1 },
            },
          },
        }),
      },
      rateCardsMock(() => undefined),
    ])

    const productInput = screen
      .getByTestId(APPLIED_RATE_CARD_DRAWER_PRODUCT_TEST_ID)
      .querySelector('input') as HTMLInputElement

    await userEvent.click(productInput)
    await userEvent.click(await screen.findByText(PRODUCT.name))
    await selectRateCard()

    await userEvent.click(productInput)
    await userEvent.type(productInput, 'storage')

    expect(
      await screen.findByText(CATEGORIZED_PRODUCT.name, undefined, { timeout: 3000 }),
    ).toBeVisible()
    await userEvent.tab()

    expect(screen.getByTestId(RATE_CARD_ID_PROBE_TEST_ID)).toHaveTextContent(RATE_CARD.code)
  })

  it('GIVEN "Create rate card" is clicked on an unknown search THEN the typed text is never selected', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined, [])])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))

    const rateCardInput = (
      await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)
    ).querySelector('input') as HTMLInputElement

    await userEvent.click(rateCardInput)
    await userEvent.type(rateCardInput, 'unknown-card')

    const addValueItem = await screen.findByTestId('combobox-item-Create rate card', undefined, {
      timeout: 3000,
    })

    await userEvent.click(within(addValueItem).getByRole('option'))

    expect(mockOpenRateCardDrawer).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId(RATE_CARD_ID_PROBE_TEST_ID)).toBeEmptyDOMElement()
  })

  it('GIVEN a rate card is created via the stacked escape hatch THEN the rate phase section still appears once the newly created rate card resolves', async () => {
    const newRateCard: RateCardFixture = {
      ...RATE_CARD,
      id: 'new-rc-id',
      code: 'new-code',
      name: 'New card',
    }

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

    const addValueItem = await screen.findByTestId('combobox-item-Create rate card')

    await userEvent.click(within(addValueItem).getByRole('option'))

    const onCreated = mockOpenRateCardDrawer.mock.calls.at(-1)?.[0]?.onCreated

    onCreated({ id: newRateCard.id, name: newRateCard.name, code: newRateCard.code })

    await waitFor(() =>
      expect(screen.getByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID)).toBeInTheDocument(),
    )
  })

  it('GIVEN a search that the created rate card does not match THEN it still resolves and gets selected', async () => {
    const newRateCard: RateCardFixture = {
      ...RATE_CARD,
      id: 'new-rc-id',
      code: 'new-code',
      name: 'New card',
    }
    let lastVars: Record<string, unknown> = {}

    renderContent([
      productsMock(),
      {
        ...rateCardsMock((vars) => (lastVars = vars)),
        result: (vars: Record<string, unknown>) => {
          if (vars.code === newRateCard.code) {
            return { data: { rateCards: { collection: [newRateCard] } } }
          }

          return { data: { rateCards: { collection: vars.searchTerm ? [] : [RATE_CARD] } } }
        },
      },
    ])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))

    const rateCardInput = (
      await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)
    ).querySelector('input') as HTMLInputElement

    await userEvent.click(rateCardInput)
    await userEvent.type(rateCardInput, 'premium')
    await waitFor(() => expect(lastVars.searchTerm).toBe('premium'), { timeout: 3000 })

    await userEvent.click(
      within(await screen.findByTestId('combobox-item-Create rate card')).getByRole('option'),
    )

    mockOpenRateCardDrawer.mock.calls
      .at(-1)?.[0]
      ?.onCreated({ id: newRateCard.id, name: newRateCard.name, code: newRateCard.code })

    await waitFor(() =>
      expect(screen.getByTestId(APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID)).toBeInTheDocument(),
    )
    expect(lastVars).toMatchObject({ code: newRateCard.code, productIds: [PRODUCT.id] })
    expect(lastVars.searchTerm).toBeUndefined()
  })
})

describe('AppliedRateCardDrawerContent, contract lifecycle dates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GIVEN a product is picked THEN neither a billing anchor date nor an effective date field renders', async () => {
    renderContent([productsMock(), rateCardsMock(() => undefined)])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)

    expect(screen.queryByText('Billing anchor date')).not.toBeInTheDocument()
    expect(screen.queryByText(/effective date/i)).not.toBeInTheDocument()
  })
})

describe('AppliedRateCardDrawerContent, already priced slices', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const FILTERED_RATE_CARD: RateCardFixture = {
    ...RATE_CARD,
    id: 'rc-eu',
    name: 'EU card',
    code: 'eu-card',
    productFilter: { __typename: 'ProductFilter', id: PRODUCT_FILTER.id },
  }

  it.each([
    { parent: PLAN_PARENT, scenario: 'plan' },
    { parent: CONTRACT_PARENT, scenario: 'contract' },
  ])(
    'GIVEN the $scenario already prices the product without filter THEN only the card without filter is disabled, with the reason',
    async ({ parent }) => {
      renderContent(
        [
          productsMock(),
          rateCardsMock(() => {}, [RATE_CARD, FILTERED_RATE_CARD]),
          pricedSlicesMock(parent, [null]),
        ],
        parent,
      )

      await userEvent.click(screen.getByRole('button', { name: 'select product' }))
      await userEvent.click(
        (await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)).querySelector(
          'input',
        ) as HTMLInputElement,
      )

      await waitFor(() =>
        expect(within(screen.getByTestId(RATE_CARD.code)).getByRole('radio')).toBeDisabled(),
      )
      expect(screen.getByTestId(RATE_CARD.code)).toHaveTextContent(
        BASE_TRANSLATIONS[
          APPLIED_RATE_CARD_CONTEXT_CONFIG[parent.context].alreadyPricedTranslationKey
        ],
      )
      expect(within(screen.getByTestId(FILTERED_RATE_CARD.code)).getByRole('radio')).toBeEnabled()
    },
  )

  it('GIVEN the plan already prices the product with a filter THEN only the card for that filter is disabled', async () => {
    renderContent([
      productsMock(),
      rateCardsMock(() => {}, [RATE_CARD, FILTERED_RATE_CARD]),
      pricedSlicesMock(PLAN_PARENT, [PRODUCT_FILTER.id]),
    ])

    await userEvent.click(screen.getByRole('button', { name: 'select product' }))
    await userEvent.click(
      (await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID)).querySelector(
        'input',
      ) as HTMLInputElement,
    )

    await waitFor(() =>
      expect(within(screen.getByTestId(FILTERED_RATE_CARD.code)).getByRole('radio')).toBeDisabled(),
    )
    expect(within(screen.getByTestId(RATE_CARD.code)).getByRole('radio')).toBeEnabled()
  })
})
