import { gql } from '@apollo/client'

import { ConnectionCategory } from '~/components/customerConnections/types'
import { addToast } from '~/core/apolloClient'
import {
  useSetCustomerIntegrationConnectionAsDefaultMutation,
  useSetCustomerPaymentConnectionAsDefaultMutation,
} from '~/generated/graphql'

gql`
  mutation setCustomerPaymentConnectionAsDefault(
    $input: SetPaymentProviderCustomerAsDefaultInput!
  ) {
    setPaymentProviderCustomerAsDefault(input: $input) {
      id
      isDefault
    }
  }

  mutation setCustomerIntegrationConnectionAsDefault(
    $input: SetIntegrationCustomerAsDefaultInput!
  ) {
    setIntegrationCustomerAsDefault(input: $input) {
      __typename
    }
  }
`

type SetConnectionAsDefaultArgs = {
  category: ConnectionCategory
  connectionId: string | undefined
}

type UseSetConnectionAsDefaultReturn = {
  setConnectionAsDefault: (args: SetConnectionAsDefaultArgs) => Promise<boolean>
}

/**
 * Set-as-default for a single customer connection, on the dedicated
 * mutations. Form-agnostic on purpose: the customer create/edit surface
 * defers its saves and has no customer fragment to refresh, so it cannot go
 * through `useCustomerConnectionsPersistence`.
 */
export const useSetConnectionAsDefault = (): UseSetConnectionAsDefaultReturn => {
  const [setPaymentConnectionAsDefault] = useSetCustomerPaymentConnectionAsDefaultMutation()
  const [setIntegrationConnectionAsDefault] = useSetCustomerIntegrationConnectionAsDefaultMutation()

  const setConnectionAsDefault = async ({
    category,
    connectionId,
  }: SetConnectionAsDefaultArgs): Promise<boolean> => {
    if (!connectionId) {
      addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })

      return false
    }

    const runPayment = async (): Promise<boolean> => {
      const { data, errors } = await setPaymentConnectionAsDefault({
        variables: { input: { id: connectionId } },
      })

      return !errors?.length && !!data?.setPaymentProviderCustomerAsDefault
    }

    const runIntegration = async (): Promise<boolean> => {
      const { data, errors } = await setIntegrationConnectionAsDefault({
        variables: { input: { id: connectionId } },
      })

      return !errors?.length && !!data?.setIntegrationCustomerAsDefault
    }

    // A network failure REJECTS mutate() even under errorPolicy 'all', and no
    // call site catches: without this it escapes as an unhandled rejection
    const succeeded = await (
      category === ConnectionCategory.Payment ? runPayment() : runIntegration()
    ).catch(() => false)

    if (succeeded) {
      addToast({ severity: 'success', translateKey: 'text_178851170779693if5ma3vv3' })
    }

    return succeeded
  }

  return { setConnectionAsDefault }
}
