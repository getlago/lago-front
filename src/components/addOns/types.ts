import { CreateAddOnInput, TaxOnAddOnEditCreateFragment } from '~/generated/graphql'

export interface AddOnFormInput extends Omit<CreateAddOnInput, 'clientMutationId'> {
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxOnAddOnEditCreateFragment[]
}
