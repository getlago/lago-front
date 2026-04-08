import { gql, useMutation } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation DestroyIntegration($input: DestroyIntegrationInput!) {
    destroyIntegration(input: $input) {
      id
    }
  }
`

type EntraIdIntegrationLite = {
  id: string
  name?: string | null
}

type DeleteEntraIdIntegrationDialogData = {
  integration: EntraIdIntegrationLite | undefined
  callback?: () => void
}

export const useDeleteEntraIdIntegrationDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const [deleteIntegration] = useMutation<{ destroyIntegration?: { id: string } }>(gql`
    mutation DestroyIntegration($input: DestroyIntegrationInput!) {
      destroyIntegration(input: $input) {
        id
      }
    }
  `)

  const openDeleteEntraIdIntegrationDialog = (data: DeleteEntraIdIntegrationDialogData) => {
    centralizedDialog.open({
      title: translate('text_664c900d2d312a01546bd84b'),
      description: translate('text_664c900d2d312a01546bd84c'),
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
            message: translate('text_664c732c264d7eed1c74fdb4', {
              integration: 'Entra ID',
            }),
            severity: 'success',
          })
        }
      },
    })
  }

  return { openDeleteEntraIdIntegrationDialog }
}
