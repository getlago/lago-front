import { gql } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteCashfreeIntegrationDialogFragment,
  useDeleteCashfreeMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteCashfreeIntegrationDialog on CashfreeProvider {
    id
    name
  }

  mutation deleteCashfree($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

type OpenDeleteCashfreeIntegrationDialogData = {
  provider: DeleteCashfreeIntegrationDialogFragment | null
  callback?: () => void
}

export const useDeleteCashfreeIntegrationDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const [deleteCashfree] = useDeleteCashfreeMutation({
    refetchQueries: ['getCashfreeIntegrationsList'],
  })

  const openDeleteCashfreeIntegrationDialog = (data: OpenDeleteCashfreeIntegrationDialogData) => {
    const provider = data.provider

    centralizedDialog.open({
      title: translate('text_658461066530343fe1808cd7', { name: provider?.name }),
      description: translate('text_1727621816788cygs13tsdyv'),
      actionText: translate('text_659d5de7c9b7f51394f7f3fd'),
      colorVariant: 'danger',
      onAction: async () => {
        const res = await deleteCashfree({
          variables: { input: { id: provider?.id as string } },
          update(cache) {
            cache.evict({ id: `CashfreeProvider:${provider?.id}` })
          },
        })

        if (res.data?.destroyPaymentProvider) {
          data.callback?.()
          addToast({
            message: translate('text_1727621949511zk6kkl99pzk'),
            severity: 'success',
          })
        }
      },
    })
  }

  return { openDeleteCashfreeIntegrationDialog }
}
