import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  DeleteX402IntegrationDialogFragment,
  GetX402IntegrationsListDocument,
  useDeleteX402ConnectionMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteX402IntegrationDialog on X402ConnectionObject {
    id
    name
  }

  mutation deleteX402Connection($input: DestroyX402ConnectionInput!) {
    destroyX402Connection(input: $input) {
      id
    }
  }
`

type TDeleteX402IntegrationDialogProps = {
  connection: DeleteX402IntegrationDialogFragment
  callback?: () => void
}

export const useDeleteX402IntegrationDialog = (): {
  openDeleteX402IntegrationDialog: (props: TDeleteX402IntegrationDialogProps) => void
} => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [deleteConnection] = useDeleteX402ConnectionMutation()

  const openDeleteX402IntegrationDialog = ({
    connection,
    callback,
  }: TDeleteX402IntegrationDialogProps): void => {
    void centralizedDialog.open({
      title: translate('text_658461066530343fe1808cd7', { name: connection.name }),
      description: translate('text_1793132394870zqu6a6vy2ps'),
      colorVariant: 'danger',
      actionText: translate('text_645d071272418a14c1c76a81'),
      // A network failure rejects the mutation, and the error link only reports GraphQL errors:
      // keep the dialog open and say it failed.
      closeOnError: false,
      onError: () => {
        addToast({ message: translate('text_62d7ffcb1c57d7e6d15bdce3'), severity: 'danger' })
      },
      onAction: async () => {
        const result = await deleteConnection({
          variables: { input: { id: connection.id } },
        })

        const destroyedId = result.data?.destroyX402Connection?.id

        if (destroyedId) {
          evictFromCache(client, {
            id: destroyedId,
            __typename: 'X402ConnectionObject',
            listFieldName: 'x402Connections',
            listQueryDocument: GetX402IntegrationsListDocument,
          })

          callback?.()

          addToast({
            message: translate('text_179313239487072s887mb0gb'),
            severity: 'success',
          })
        }
      },
    })
  }

  return { openDeleteX402IntegrationDialog }
}
