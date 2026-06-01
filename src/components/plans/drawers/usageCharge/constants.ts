import { LocalChargeFilterInput, LocalPricingUnitInput } from '~/components/plans/types'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import {
  AggregationTypeEnum,
  BillableMetricForPlanFragment,
  ChargeModelEnum,
  PropertiesInput,
  TaxForTaxesSelectorSectionFragment,
} from '~/generated/graphql'

// Backend "code already exists" message, surfaced under the Code input on save
// and cleared when the user edits the code (so submit re-enables).
export const EXISTING_CODE_ERROR_MESSAGE = 'text_632a2d437e341dcc76817556'

export interface UsageChargeDrawerFormValues {
  billableMetricId: string
  billableMetric: BillableMetricForPlanFragment
  appliedPricingUnit?: LocalPricingUnitInput
  chargeModel: ChargeModelEnum
  code: string
  id?: string
  invoiceDisplayName: string
  invoiceable: boolean
  minAmountCents: string
  payInAdvance: boolean
  prorated: boolean
  properties?: PropertiesInput
  filters?: LocalChargeFilterInput[]
  regroupPaidFees: string | null
  taxes: TaxForTaxesSelectorSectionFragment[]
}

export const DEFAULT_VALUES: UsageChargeDrawerFormValues = {
  billableMetricId: '',
  billableMetric: {
    id: '',
    name: '',
    code: '',
    aggregationType: AggregationTypeEnum.CountAgg,
    recurring: false,
  },
  appliedPricingUnit: undefined,
  chargeModel: ChargeModelEnum.Standard,
  code: '',
  id: undefined,
  invoiceDisplayName: '',
  invoiceable: true,
  minAmountCents: '',
  payInAdvance: false,
  prorated: false,
  properties: getPropertyShape({}),
  filters: [],
  regroupPaidFees: null,
  taxes: [],
}
