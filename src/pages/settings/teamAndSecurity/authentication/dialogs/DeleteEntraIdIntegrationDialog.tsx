import { gql } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteEntraIdIntegrationDialogFragment,
  useDestroyIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteEntraIdIntegrationDialog on EntraIdIntegration {
    id
    name
  }
`

type DeleteEntraIdIntegrationDialogData = {
  integration: DeleteEntraIdIntegrationDialogFragment | undefined
  callback?: () => void
}

export const useDeleteEntraIdIntegrationDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const [deleteIntegration] = useDestroyIntegrationMutation()

  const openDeleteEntraIdIntegrationDialog = (data: DeleteEntraIdIntegrationDialogData) => {
    centralizedDialog.open({
      title: translate('text_1784307344255lgty3uwoghl'),
      description: translate('text_17843073442556cjrcl7drw6'),
      colorVariant: 'danger',
      actionText: translate('text_645d071272418a14c1c76a81'),
      onAction: async () => {
        const result = await deleteIntegration({
          variables: {
            input: {
              id: data.integration?.id ?? '',
            },
          },
          update(cache) {
            cache.evict({ id: `EntraIdIntegration:${data.integration?.id}` })
          },
        })

        if (result.data?.destroyIntegration) {
          data.callback?.()

          addToast({
            message: translate('text_17843073442557u380a217wd', {
              integration: translate('text_17843073442548zt904xoinv'),
            }),
            severity: 'success',
          })
        }
      },
    })
  }

  return { openDeleteEntraIdIntegrationDialog }
}
