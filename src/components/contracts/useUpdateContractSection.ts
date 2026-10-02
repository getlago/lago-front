import { gql } from '@apollo/client'

import { addToast } from '~/core/apolloClient'
import {
  ContractForContractDrawerFragmentDoc,
  LagoApiError,
  UpdateContractInput,
  useUpdateContractMutation,
} from '~/generated/graphql'

const CONTRACT_UPDATE_SUCCESS_KEY = 'text_1790280529941qgc3lu3ni4u'
const CONTRACT_UPDATE_ERROR_KEY = 'text_1790280529941yrthm7q5e68'

gql`
  mutation updateContract($input: UpdateContractInput!) {
    updateContract(input: $input) {
      id
      ...ContractForContractDrawer
    }
  }

  ${ContractForContractDrawerFragmentDoc}
`

/**
 * Shared by every section-scoped contract edit drawer (attached object, contract
 * settings, invoicing settings, payment settings): each submits its own partial
 * `UpdateContractInput` — `Contracts::UpdateService` only writes the keys it is sent.
 *
 * Throws on failure rather than returning a boolean, so a drawer's `await onSave()`
 * (own or the shared invoicing/payment drawers') never reaches its own `drawer.close()`
 * and the draft survives — the same contract `useUpdateSubscriptionSettings` uses.
 */
export const useUpdateContractSection = (): {
  updateContractSection: (input: UpdateContractInput) => Promise<void>
} => {
  const [updateContract] = useUpdateContractMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: [
      'getContractsList',
      'getCustomerContractsList',
      'getContractForDetails',
      'getContractForDetailsOverview',
    ],
  })

  const updateContractSection = async (input: UpdateContractInput): Promise<void> => {
    const result = await updateContract({ variables: { input } })

    // `silentErrorCodes` swallows the rejection, so without this the failed submit
    // would look like a no-op.
    if (!result.data?.updateContract || result.errors?.length) {
      addToast({ severity: 'danger', translateKey: CONTRACT_UPDATE_ERROR_KEY })
      throw new Error('Contract update failed')
    }

    addToast({ severity: 'success', translateKey: CONTRACT_UPDATE_SUCCESS_KEY })
  }

  return { updateContractSection }
}
