import { CreateCustomerWalletInput, UpdateCustomerWalletInput } from '~/generated/graphql'

export type TWalletDataForm = Omit<CreateCustomerWalletInput, 'customerId'> &
  Omit<UpdateCustomerWalletInput, 'id'>
