import { MockedResponse } from '@apollo/client/testing'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ComboBoxProps } from '~/components/form/ComboBox/types'
import {
  AggregationTypeEnum,
  GetProductFiltersForAppliedRateCardDrawerDocument,
  GetProductsForAppliedRateCardDrawerDocument,
  GetRateCardsForAppliedRateCardDrawerDocument,
  ProductTypeEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render, TestMocksType } from '~/test-utils'

import {
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

const PRODUCT = {
  id: 'product-1',
  code: 'prod-1',
  name: 'Metered API',
  productType: ProductTypeEnum.Metered,
  billableMetric: { id: 'bm-1', aggregationType: AggregationTypeEnum.SumAgg, recurring: false },
}
const PRODUCT_FILTER = { id: 'filter-1', name: 'EU only', code: 'eu-only' }
const RATE_CARD = { id: 'rc-1', name: 'Standard card', code: 'standard-card' }

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
  collection: Array<{ id: string; name: string; code: string }> = [RATE_CARD],
): MockedResponse => ({
  request: { query: GetRateCardsForAppliedRateCardDrawerDocument },
  variableMatcher: (vars) => {
    captureVars(vars)
    return true
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { rateCards: { collection } } },
})

const RATE_CARD_ID_PROBE_TEST_ID = 'rate-card-id-probe'

const Host = (): JSX.Element => {
  const form = useAppForm({ defaultValues: APPLIED_RATE_CARD_FORM_DEFAULTS })

  return (
    <>
      <button type="button" onClick={() => form.setFieldValue('productId', PRODUCT.id)}>
        select product
      </button>
      <form.Subscribe selector={(state) => state.values.rateCardId}>
        {(rateCardId) => <output data-test={RATE_CARD_ID_PROBE_TEST_ID}>{rateCardId}</output>}
      </form.Subscribe>
      <AppliedRateCardDrawerContent form={form} />
    </>
  )
}

const renderContent = (mocks: TestMocksType = []): ReturnType<typeof render> =>
  render(<Host />, { mocks })

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
