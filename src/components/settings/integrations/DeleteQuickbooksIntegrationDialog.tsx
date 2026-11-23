import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  DeleteQuickbooksIntegrationDialogFragment,
  GetQuickbooksIntegrationsListDocument,
  useDestroyNangoIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteQuickbooksIntegrationDialog on QuickbooksIntegration {
    id
    name
  }
`

type TDeleteQuickbooksIntegrationDialogProps = {
  provider: DeleteQuickbooksIntegrationDialogFragment | null
  callback?: () => void
}

export const useDeleteQuickbooksIntegrationDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [deleteQuickbooks] = useDestroyNangoIntegrationMutation()

  const openDeleteQuickbooksIntegrationDialog = ({
    provider,
    callback,
  }: TDeleteQuickbooksIntegrationDialogProps) => {
    void centralizedDialog.open({
      title: translate('text_658461066530343fe1808cd7', { name: provider?.name }),
      description: translate('text_1795434241689o9cv2tkoxb2'),
      colorVariant: 'danger',
      actionText: translate('text_645d071272418a14c1c76a81'),
      closeOnError: false,
      onError: () => {
        addToast({ severity: 'danger', translateKey: 'text_62b31e1f6a5b8b1b745ece48' })
      },
      onAction: async () => {
        const result = await deleteQuickbooks({
          variables: { input: { id: provider?.id as string } },
        })

        const destroyedId = result.data?.destroyIntegration?.id

        // A refused delete resolves without an id: throw so `onError` shows the toast
        if (!destroyedId) throw new Error('Delete failed')

        evictFromCache(client, {
          id: destroyedId,
          __typename: 'QuickbooksIntegration',
          listFieldName: 'integrations',
          listQueryDocument: GetQuickbooksIntegrationsListDocument,
        })

        callback?.()

        addToast({
          message: translate('text_661ff6e56ef7e1b7c542b2f9'),
          severity: 'success',
        })
      },
    })
  }

  return { openDeleteQuickbooksIntegrationDialog }
}
