import { CreateSubscriptionInput } from '~/generated/graphql'

export type SubscriptionFormInput = Omit<CreateSubscriptionInput, 'customerId'>
