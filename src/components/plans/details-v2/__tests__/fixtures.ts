import { CurrencyEnum, PlanDetailsV2Fragment, PlanInterval } from '~/generated/graphql'

export const PLAN_DETAILS_V2_FIXTURE_ID = 'plan_1'

export const planDetailsV2Fixture: PlanDetailsV2Fragment & { __typename: 'Plan' } = {
  __typename: 'Plan',
  id: PLAN_DETAILS_V2_FIXTURE_ID,
  name: 'Pro',
  code: 'pro',
  description: null,
  interval: PlanInterval.Monthly,
  amountCurrency: CurrencyEnum.Usd,
  hasOverriddenPlans: false,
  billFixedChargesMonthly: false,
  billChargesMonthly: false,
  taxes: [],
  fixedCharges: [],
  charges: [],
}
