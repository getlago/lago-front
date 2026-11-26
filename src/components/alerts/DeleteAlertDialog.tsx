import { gql } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import {
  useDestroyContractAlertMutation,
  useDestroySubscriptionAlertMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation destroySubscriptionAlert($input: DestroySubscriptionAlertInput!) {
    destroySubscriptionAlert(input: $input) {
      id
    }
  }

  mutation destroyContractAlert($input: DestroyContractAlertInput!) {
    destroyContractAlert(input: $input) {
      id
    }
  }
`

type OpenDeleteAlertDialogArgs = {
  alertKind: 'subscription' | 'contract'
  id: string
}

type UseDeleteAlertDialogReturn = {
  openDeleteAlertDialog: (args: OpenDeleteAlertDialogArgs) => void
}

export const useDeleteAlertDialog = (): UseDeleteAlertDialogReturn => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const [destroySubscriptionAlert] = useDestroySubscriptionAlertMutation({
    refetchQueries: ['getAlertsOfSubscription'],
  })
  const [destroyContractAlert] = useDestroyContractAlertMutation({
    refetchQueries: ['getContractAlertsForAlertsSection', 'getContractAlertsCountForOverviewNav'],
  })

  const destroyAlert = async ({ alertKind, id }: OpenDeleteAlertDialogArgs): Promise<boolean> => {
    if (alertKind === 'contract') {
      const result = await destroyContractAlert({ variables: { input: { id } } })

      return !!result.data?.destroyContractAlert?.id
    }

    const result = await destroySubscriptionAlert({ variables: { input: { id } } })

    return !!result.data?.destroySubscriptionAlert?.id
  }

  const openDeleteAlertDialog = (args: OpenDeleteAlertDialogArgs): void => {
    const isContract = args.alertKind === 'contract'

    centralizedDialog.open({
      title: translate('text_1746611635509m6xkucwbclx'),
      description: translate(
        isContract ? 'text_17957029944428x4cu34cga9' : 'text_1746611635509rkns7krj9zq',
      ),
      colorVariant: 'danger',
      actionText: translate(
        isContract ? 'text_17465469243924wwxl5pgoxi' : 'text_6271200984178801ba8bdf0c',
      ),
      onAction: async () => {
        const isDeleted = await destroyAlert(args)

        if (isDeleted) {
          addToast({
            message: translate('text_1746611635508k9cmy2th6r1'),
            severity: 'success',
          })
        }
      },
    })
  }

  return { openDeleteAlertDialog }
}
