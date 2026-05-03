import getPropertyShape from '~/core/serializers/getPropertyShape'
import {
  AddOnForFixedChargesSectionFragment,
  FixedChargeChargeModelEnum,
  PropertiesInput,
  TaxForTaxesSelectorSectionFragment,
} from '~/generated/graphql'

export interface FixedChargeDrawerFormValues {
  addOnId: string
  addOn: AddOnForFixedChargesSectionFragment
  applyUnitsImmediately: boolean
  chargeModel: FixedChargeChargeModelEnum
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
  id: undefined,
  invoiceDisplayName: '',
  payInAdvance: false,
  properties: getPropertyShape({}),
  prorated: false,
  taxes: [],
  units: '',
}
