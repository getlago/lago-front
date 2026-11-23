import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { ComboBoxProps } from '~/components/form/ComboBox/types'
import {
  AggregationTypeEnum,
  CreatePlanAppliedRateCardDocument,
  CurrencyEnum,
  GetProductFiltersForAppliedRateCardDrawerDocument,
  GetProductsForAppliedRateCardDrawerDocument,
  GetRateCardsForAppliedRateCardDrawerDocument,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import {
  APPLIED_RATE_CARD_DRAWER_PRODUCT_TEST_ID,
  APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID,
  APPLIED_RATE_CARD_DRAWER_UNITS_TEST_ID,
} from '../AppliedRateCardDrawerContent'
import { useAppliedRateCardDrawer } from '../useAppliedRateCardDrawer'

type CapturedDrawerArgs = {
  children?: ReactNode
  form?: { id: string; submit: () => void | Promise<void> }
}

let lastDrawerArgs: CapturedDrawerArgs | null = null
const mockClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({
    open: (args: CapturedDrawerArgs) => {
      lastDrawerArgs = args
    },
    close: mockClose,
  }),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => jest.fn(),
}))

jest.mock('~/pages/catalog/drawers/rateCard/useRateCardDrawer', () => ({
  useRateCardDrawer: () => ({ openDrawer: jest.fn() }),
}))

// `react-window` virtualization never renders rows in jsdom.
jest.mock('~/components/form/ComboBox/ComboBox', () => {
  const { ComboBox } = jest.requireActual('~/components/form/ComboBox/ComboBox')

  return { ComboBox: (props: ComboBoxProps) => <ComboBox {...props} virtualized={false} /> }
})

const PRODUCT = {
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

const FIXED_PRODUCT = {
  __typename: 'Product',
  id: 'product-fixed-1',
  code: 'prod-fixed-1',
  name: 'Setup fee',
  invoiceDisplayName: null,
  productType: ProductTypeEnum.Fixed,
  productCategory: null,
  billableMetric: null,
}

const RATE_CARD = {
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

const queryMocks: MockedResponse[] = [
  {
    request: { query: GetProductsForAppliedRateCardDrawerDocument },
    variableMatcher: () => true,
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        products: {
          collection: [PRODUCT, FIXED_PRODUCT],
          metadata: { currentPage: 1, totalPages: 1 },
        },
      },
    },
  },
  {
    request: { query: GetProductFiltersForAppliedRateCardDrawerDocument },
    variableMatcher: () => true,
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data: { productFilters: { collection: [] } } },
  },
  {
    request: { query: GetRateCardsForAppliedRateCardDrawerDocument },
    variableMatcher: () => true,
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data: { rateCards: { collection: [RATE_CARD] } } },
  },
]

const Host = (): JSX.Element => {
  const { openDrawer } = useAppliedRateCardDrawer()

  return (
    <button
      type="button"
      onClick={() => openDrawer({ context: 'plan', planId: 'plan-1', currency: CurrencyEnum.Usd })}
    >
      open
    </button>
  )
}

const pickOption = async (comboboxTestId: string, optionLabel: string): Promise<void> => {
  const input = (await screen.findByTestId(comboboxTestId)).querySelector(
    'input',
  ) as HTMLInputElement

  await userEvent.click(input)
  await userEvent.click(await screen.findByText(optionLabel))
}

describe('useAppliedRateCardDrawer, select then submit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  it('GIVEN a product and a rate card picked through their comboboxes THEN the mutation receives the plan id, the rate card code, and the seeded default phase', async () => {
    let capturedInput: Record<string, unknown> | undefined
    const mutationMock: MockedResponse = {
      request: { query: CreatePlanAppliedRateCardDocument },
      variableMatcher: (vars) => {
        capturedInput = vars?.input
        return true
      },
      result: {
        data: {
          createPlanAppliedRateCard: {
            __typename: 'PlanAppliedRateCard',
            id: 'applied-rc-1',
            rateCard: { __typename: 'RateCard', id: 'rc-1', name: 'Standard card' },
          },
        },
      },
    }

    rtlRender(
      <AllTheProviders>
        <MockedProvider mocks={[mutationMock]} defaultOptions={{ mutate: { errorPolicy: 'all' } }}>
          <Host />
        </MockedProvider>
      </AllTheProviders>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'open' }))

    rtlRender(<>{lastDrawerArgs?.children}</>, {
      wrapper: ({ children }) => (
        <AllTheProviders forceTypenames mocks={queryMocks}>
          {children}
        </AllTheProviders>
      ),
    })

    await pickOption(APPLIED_RATE_CARD_DRAWER_PRODUCT_TEST_ID, PRODUCT.name)
    await pickOption(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID, RATE_CARD.name)

    await act(async () => {
      await lastDrawerArgs?.form?.submit()
    })

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))
    expect(capturedInput).toEqual({
      planId: 'plan-1',
      rateCardCode: RATE_CARD.code,
      ratePhases: [{ code: 'default', name: null, position: 1, billingIntervalCycleCount: null }],
    })
  })

  it('GIVEN a fixed product picked WHEN units is left blank AND the form is submitted THEN the mutation never fires', async () => {
    const mutationSpy = jest.fn()
    const mutationMock: MockedResponse = {
      request: { query: CreatePlanAppliedRateCardDocument },
      variableMatcher: (vars) => {
        mutationSpy(vars)
        return true
      },
      result: {
        data: {
          createPlanAppliedRateCard: {
            __typename: 'PlanAppliedRateCard',
            id: 'applied-rc-2',
            rateCard: { __typename: 'RateCard', id: 'rc-1', name: 'Standard card' },
          },
        },
      },
    }

    rtlRender(
      <AllTheProviders>
        <MockedProvider mocks={[mutationMock]} defaultOptions={{ mutate: { errorPolicy: 'all' } }}>
          <Host />
        </MockedProvider>
      </AllTheProviders>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'open' }))

    rtlRender(<>{lastDrawerArgs?.children}</>, {
      wrapper: ({ children }) => (
        <AllTheProviders forceTypenames mocks={queryMocks}>
          {children}
        </AllTheProviders>
      ),
    })

    await pickOption(APPLIED_RATE_CARD_DRAWER_PRODUCT_TEST_ID, FIXED_PRODUCT.name)
    await pickOption(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID, RATE_CARD.name)

    await act(async () => {
      await lastDrawerArgs?.form?.submit()
    })

    expect(mutationSpy).not.toHaveBeenCalled()
    expect(mockClose).not.toHaveBeenCalled()
  })

  it('GIVEN a fixed product picked AND units filled in THEN the mutation receives it as a number', async () => {
    let capturedInput: Record<string, unknown> | undefined
    const mutationMock: MockedResponse = {
      request: { query: CreatePlanAppliedRateCardDocument },
      variableMatcher: (vars) => {
        capturedInput = vars?.input
        return true
      },
      result: {
        data: {
          createPlanAppliedRateCard: {
            __typename: 'PlanAppliedRateCard',
            id: 'applied-rc-3',
            rateCard: { __typename: 'RateCard', id: 'rc-1', name: 'Standard card' },
          },
        },
      },
    }

    rtlRender(
      <AllTheProviders>
        <MockedProvider mocks={[mutationMock]} defaultOptions={{ mutate: { errorPolicy: 'all' } }}>
          <Host />
        </MockedProvider>
      </AllTheProviders>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'open' }))

    rtlRender(<>{lastDrawerArgs?.children}</>, {
      wrapper: ({ children }) => (
        <AllTheProviders forceTypenames mocks={queryMocks}>
          {children}
        </AllTheProviders>
      ),
    })

    await pickOption(APPLIED_RATE_CARD_DRAWER_PRODUCT_TEST_ID, FIXED_PRODUCT.name)
    await pickOption(APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID, RATE_CARD.name)

    const unitsInput = (
      await screen.findByTestId(APPLIED_RATE_CARD_DRAWER_UNITS_TEST_ID)
    ).querySelector('input') as HTMLInputElement

    await userEvent.type(unitsInput, '5')

    await act(async () => {
      await lastDrawerArgs?.form?.submit()
    })

    await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))
    expect(capturedInput).toEqual({
      planId: 'plan-1',
      rateCardCode: RATE_CARD.code,
      units: 5,
      ratePhases: [{ code: 'default', name: null, position: 1, billingIntervalCycleCount: null }],
    })
  })
})
