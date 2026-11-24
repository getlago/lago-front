import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  DeleteQuickbooksIntegrationDialogFragment,
  DestroyNangoIntegrationMutation,
  GetQuickbooksIntegrationsListDocument,
  LagoApiError,
  useDestroyNangoIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteQuickbooksIntegrationDialog on QuickbooksIntegration {
    id
    name
  }
`

// A delete error the error link already toasted: every GraphQL code but `forbidden`, which it silences.
class ReportedDeleteError extends Error {}

export const getDestroyedQuickbooksId = (result: {
  data?: DestroyNangoIntegrationMutation | null
  errors?: ReadonlyArray<{ extensions?: Record<string, unknown> }>
}): string => {
  const destroyedId = result.data?.destroyIntegration?.id

  if (destroyedId) return destroyedId

  const isReported = result.errors?.some(
    (error) => error.extensions?.code !== LagoApiError.Forbidden,
  )

  throw isReported ? new ReportedDeleteError('Delete failed') : new Error('Delete failed')
}

export const toastQuickbooksDeleteError = (error: Error) => {
  if (error instanceof ReportedDeleteError) return

  addToast({ severity: 'danger', translateKey: 'text_62b31e1f6a5b8b1b745ece48' })
}

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
      onError: toastQuickbooksDeleteError,
      onAction: async () => {
        const result = await deleteQuickbooks({
          variables: { input: { id: provider?.id as string } },
        })

        const destroyedId = getDestroyedQuickbooksId(result)

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
