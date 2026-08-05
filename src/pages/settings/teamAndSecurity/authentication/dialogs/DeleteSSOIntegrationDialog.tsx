import { gql } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { useDestroyIntegrationMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation DestroyIntegration($input: DestroyIntegrationInput!) {
    destroyIntegration(input: $input) {
      id
    }
  }
`

export type DeleteSSOIntegrationDialogData = {
  integration: { id: string } | undefined
  callback?: () => void
}

export type DeleteSSOIntegrationDialogConfig = {
  /** GraphQL __typename used to evict the deleted integration from the cache. */
  integrationTypename: 'OktaIntegration' | 'EntraIdIntegration'
  titleKey: string
  descriptionKey: string
  successToastKey: string
  integrationNameKey: string
}

export const useDeleteSSOIntegrationDialog = (config: DeleteSSOIntegrationDialogConfig) => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const [deleteIntegration] = useDestroyIntegrationMutation()

  const openDeleteSSOIntegrationDialog = (data: DeleteSSOIntegrationDialogData) => {
    centralizedDialog.open({
      title: translate(config.titleKey),
      description: translate(config.descriptionKey),
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
            cache.evict({ id: `${config.integrationTypename}:${data.integration?.id}` })
          },
        })

        if (result.data?.destroyIntegration) {
          data.callback?.()

          addToast({
            message: translate(config.successToastKey, {
              integration: translate(config.integrationNameKey),
            }),
            severity: 'success',
          })
        }
      },
    })
  }

  return { openDeleteSSOIntegrationDialog }
}
