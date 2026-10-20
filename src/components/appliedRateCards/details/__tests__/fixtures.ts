import {
  AggregationTypeEnum,
  ContractAppliedRateCardForDetailsFragment,
  ContractStatusEnum,
  CurrencyEnum,
  PlanAppliedRateCardForDetailsFragment,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RatePhaseForDrawerFragment,
} from '~/generated/graphql'

export const APPLIED_RATE_CARD_ID = 'applied-rate-card-1'
export const CATALOG_PLAN_ID = 'catalog-plan-1'
export const CONTRACT_ID = 'contract-1'

export const FINITE_PHASE: RatePhaseForDrawerFragment = {
  __typename: 'RatePhase',
  id: 'rate-phase-1',
  code: 'ramp_up',
  name: 'Ramp up',
  position: 1,
  billingIntervalCycleCount: 3,
  rateOverride: null,
}

export const FOREVER_PHASE: RatePhaseForDrawerFragment = {
  __typename: 'RatePhase',
  id: 'rate-phase-2',
  code: 'steady',
  name: 'Steady',
  position: 2,
  billingIntervalCycleCount: null,
  rateOverride: null,
}

const PRODUCT: PlanAppliedRateCardForDetailsFragment['product'] = {
  __typename: 'Product',
  id: 'product-1',
  name: 'API calls',
  invoiceDisplayName: null,
  code: 'api_calls',
  productType: ProductTypeEnum.Metered,
  productCategory: {
    __typename: 'ProductCategory',
    id: 'product-category-1',
    name: 'Platform',
    invoiceDisplayName: null,
    code: 'platform',
  },
  billableMetric: {
    __typename: 'BillableMetric',
    id: 'billable-metric-1',
    aggregationType: AggregationTypeEnum.SumAgg,
    recurring: false,
  },
}

const RATE_CARD: PlanAppliedRateCardForDetailsFragment['rateCard'] = {
  __typename: 'RateCard',
  id: 'rate-card-1',
  name: 'Standard rate card',
  code: 'standard_rate_card',
  currency: CurrencyEnum.Usd,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  appliedPricingUnitCode: null,
  proration: false,
  productFilter: {
    __typename: 'ProductFilter',
    id: 'product-filter-1',
    name: 'EU region',
    invoiceDisplayName: null,
  },
  activeRate: null,
}

export const buildPlanAppliedRateCard = (
  overrides: Partial<PlanAppliedRateCardForDetailsFragment> = {},
): PlanAppliedRateCardForDetailsFragment => ({
  __typename: 'PlanAppliedRateCard',
  id: APPLIED_RATE_CARD_ID,
  units: 12,
  ratePhasesCount: 2,
  catalogPlan: {
    __typename: 'CatalogPlan',
    id: CATALOG_PLAN_ID,
    name: 'Enterprise plan',
    attachedToContracts: false,
  },
  product: PRODUCT,
  rateCard: RATE_CARD,
  ratePhases: [FINITE_PHASE, FOREVER_PHASE],
  ...overrides,
})

export const buildContractAppliedRateCard = (
  overrides: Partial<ContractAppliedRateCardForDetailsFragment> = {},
): ContractAppliedRateCardForDetailsFragment => ({
  __typename: 'ContractAppliedRateCard',
  id: APPLIED_RATE_CARD_ID,
  units: 12,
  effectiveDate: '2026-03-01T00:00:00Z',
  ratePhasesCount: 2,
  contract: {
    __typename: 'Contract',
    id: CONTRACT_ID,
    name: 'Acme contract',
    externalId: 'acme_contract',
    status: ContractStatusEnum.Pending,
    plan: { __typename: 'CatalogPlan', id: CATALOG_PLAN_ID, name: 'Enterprise plan' },
  },
  product: PRODUCT,
  rateCard: RATE_CARD,
  ratePhases: [FINITE_PHASE, FOREVER_PHASE],
  ...overrides,
})
