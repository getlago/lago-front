import getPropertyShape from '~/core/serializers/getPropertyShape'
import {
  AddOnForFixedChargesSectionFragment,
  FixedChargeChargeModelEnum,
  PropertiesInput,
  TaxForTaxesSelectorSectionFragment,
} from '~/generated/graphql'

// Backend "code already exists" message, surfaced under the Code input on save
// and cleared when the user edits the code (so submit re-enables).
export const EXISTING_CODE_ERROR_MESSAGE = 'text_632a2d437e341dcc76817556'

export interface FixedChargeDrawerFormValues {
  addOnId: string
  addOn: AddOnForFixedChargesSectionFragment
  applyUnitsImmediately: boolean
  chargeModel: FixedChargeChargeModelEnum
  code: string
  id?: string
  invoiceDisplayName: string
  payInAdvance: boolean
  properties: PropertiesInput
  prorated: boolean
  taxes: TaxForTaxesSelectorSectionFragment[]
  units: string
}

export const DEFAULT_VALUES: FixedChargeDrawerFormValues = {
  addOnId: '',
  addOn: { id: '', name: '', code: '' },
  applyUnitsImmediately: false,
  chargeModel: FixedChargeChargeModelEnum.Standard,
  code: '',
  id: undefined,
  invoiceDisplayName: '',
  payInAdvance: false,
  properties: getPropertyShape({}),
  prorated: false,
  taxes: [],
  units: '',
}
