import { gql, useApolloClient } from '@apollo/client'

import { Alert } from '~/components/designSystem/Alert'
import {
  CentralizedDialogProps,
  useCentralizedDialog,
} from '~/components/dialogs/CentralizedDialog'
import { addToast, onNetworkError } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  DeleteAgentStorefrontIntegrationDialogFragment,
  GetAgentStorefrontIntegrationsListDocument,
  useDestroyAgentStorefrontIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteAgentStorefrontIntegrationDialog on AgentStorefrontIntegration {
    id
    name
    hasEnrolledAgents
  }

  mutation destroyAgentStorefrontIntegration($input: DestroyIntegrationInput!) {
    destroyIntegration(input: $input) {
      id
    }
  }
`

type DeleteAgentStorefrontIntegrationDialogData = {
  integration: DeleteAgentStorefrontIntegrationDialogFragment
  callback?: () => void
}

type UseDeleteAgentStorefrontIntegrationDialogReturn = {
  getDeleteAgentStorefrontIntegrationDialogProps: (
    data: DeleteAgentStorefrontIntegrationDialogData,
  ) => CentralizedDialogProps
  openDeleteAgentStorefrontIntegrationDialog: (
    data: DeleteAgentStorefrontIntegrationDialogData,
  ) => void
}

export const useDeleteAgentStorefrontIntegrationDialog =
  (): UseDeleteAgentStorefrontIntegrationDialogReturn => {
    const centralizedDialog = useCentralizedDialog()
    const { translate } = useInternationalization()
    const client = useApolloClient()

    const [destroyIntegration] = useDestroyAgentStorefrontIntegrationMutation()

    const getDeleteAgentStorefrontIntegrationDialogProps = ({
      integration,
      callback,
    }: DeleteAgentStorefrontIntegrationDialogData): CentralizedDialogProps => ({
      title: translate('text_658461066530343fe1808cd7', { name: integration.name }),
      description: translate('text_1795096449972k3dsyax1fn8'),
      children: integration.hasEnrolledAgents ? (
        <Alert type="danger">{translate('text_1795096449972iwzgdt7925i')}</Alert>
      ) : undefined,
      colorVariant: 'danger',
      actionText: translate('text_645d071272418a14c1c76a81'),
      disableOnContinue: integration.hasEnrolledAgents,
      closeOnError: false,
      onError: onNetworkError,
      onAction: async () => {
        const result = await destroyIntegration({
          variables: { input: { id: integration.id } },
        })

        const destroyedId = result.data?.destroyIntegration?.id

        if (!destroyedId) return

        evictFromCache(client, {
          id: destroyedId,
          __typename: 'AgentStorefrontIntegration',
          listFieldName: 'integrations',
          listQueryDocument: GetAgentStorefrontIntegrationsListDocument,
        })

        callback?.()

        addToast({ severity: 'success', translateKey: 'text_1795096449972uv4txwn48zm' })
      },
    })

    const openDeleteAgentStorefrontIntegrationDialog = (
      data: DeleteAgentStorefrontIntegrationDialogData,
    ): void => {
      void centralizedDialog.open(getDeleteAgentStorefrontIntegrationDialogProps(data))
    }

    return {
      getDeleteAgentStorefrontIntegrationDialogProps,
      openDeleteAgentStorefrontIntegrationDialog,
    }
  }
