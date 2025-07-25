import {
  CreateCustomerWalletInput,
  UpdateCustomerWalletInput,
  WalletForScopeSectionFragment,
} from '~/generated/graphql'

export type TWalletDataForm = Omit<CreateCustomerWalletInput, 'customerId'> &
  Omit<UpdateCustomerWalletInput, 'id'> & {
    appliesTo?: WalletForScopeSectionFragment['appliesTo']
  }
