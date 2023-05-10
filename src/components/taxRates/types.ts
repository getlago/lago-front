import { TaxRateCreateInput, TaxRateUpdateInput } from '~/generated/graphql'

export type TaxRateFormInput = TaxRateCreateInput | Omit<TaxRateUpdateInput, 'id'>
