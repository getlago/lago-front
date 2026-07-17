import { CreateCustomerWalletTransactionInput } from '~/generated/graphql'

// The form never holds walletId — it is injected at submit time from the
// resolved wallet (route param or active-wallet lookup).
export type TWalletTopUpDataForm = Omit<CreateCustomerWalletTransactionInput, 'walletId'>
