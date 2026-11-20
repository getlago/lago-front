import { gql, useApolloClient } from '@apollo/client'

import { Alert } from '~/components/designSystem/Alert'
import {
  CentralizedDialogProps,
  useCentralizedDialog,
} from '~/components/dialogs/CentralizedDialog'
import { addToast, hasDefinedGQLError, onNetworkError } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  DeleteStripeIntegrationDialogFragment,
  FeatureFlagEnum,
  GetStripeIntegrationsListDocument,
  IntegrationTypeEnum,
  LagoApiError,
  PremiumIntegrationTypeEnum,
  useDeleteStripeMutation,
  useGetAgentStorefrontsForStripeDeletionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  fragment DeleteStripeIntegrationDialog on StripeProvider {
    id
    name
    code
  }

  mutation deleteStripe($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }

  query getAgentStorefrontsForStripeDeletion($limit: Int, $types: [IntegrationTypeEnum!]) {
    integrations(limit: $limit, types: $types) {
      collection {
        ... on AgentStorefrontIntegration {
          id
          name
          paymentProviderCode
        }
      }
    }
  }
`

const USED_BY_STOREFRONT_ERROR = 'text_1795155393899c6tjow98zc6'

type TDeleteStripeIntegrationDialogProps = {
  provider: DeleteStripeIntegrationDialogFragment | null
  callback?: () => void
}

type UseDeleteStripeIntegrationDialogReturn = {
  getDeleteStripeIntegrationDialogProps: (
    props: TDeleteStripeIntegrationDialogProps,
  ) => CentralizedDialogProps
  openDeleteStripeIntegrationDialog: (props: TDeleteStripeIntegrationDialogProps) => void
}

export const useDeleteStripeIntegrationDialog = (): UseDeleteStripeIntegrationDialogReturn => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()
  const { hasFeatureFlag, hasOrganizationPremiumAddon } = useOrganizationInfos()
  const { hasPermissions } = usePermissions()

  const isStorefrontEnabled =
    hasFeatureFlag(FeatureFlagEnum.AgentStorefront) &&
    hasOrganizationPremiumAddon(PremiumIntegrationTypeEnum.AgentStorefront)

  const [deleteStripe] = useDeleteStripeMutation()

  const { data: storefrontsData } = useGetAgentStorefrontsForStripeDeletionQuery({
    variables: { limit: 100, types: [IntegrationTypeEnum.AgentStorefront] },
    skip: !isStorefrontEnabled || !hasPermissions(['organizationIntegrationsView']),
  })

  const getUsingStorefrontName = (providerCode?: string): string | undefined => {
    if (!providerCode) return undefined

    const storefront = (storefrontsData?.integrations?.collection ?? []).find(
      (integration) =>
        integration.__typename === 'AgentStorefrontIntegration' &&
        integration.paymentProviderCode === providerCode,
    )

    return storefront?.__typename === 'AgentStorefrontIntegration' ? storefront.name : undefined
  }

  const getDeleteStripeIntegrationDialogProps = ({
    provider,
    callback,
  }: TDeleteStripeIntegrationDialogProps): CentralizedDialogProps => {
    const usingStorefrontName = getUsingStorefrontName(provider?.code)

    return {
      title: translate('text_658461066530343fe1808cd7', { name: provider?.name }),
      description: translate('text_658461066530343fe1808cdb'),
      children: usingStorefrontName ? (
        <Alert type="warning">
          {translate('text_17950964499736yn37b9ictq', { connectionName: usingStorefrontName })}
        </Alert>
      ) : undefined,
      colorVariant: 'danger',
      actionText: translate('text_645d071272418a14c1c76a81'),
      disableOnContinue: !!usingStorefrontName,
      closeOnError: false,
      onError: onNetworkError,
      onAction: async () => {
        const result = await deleteStripe({
          variables: { input: { id: provider?.id as string } },
          context: { silentErrorCodes: [LagoApiError.PaymentProviderUsedByAgentStorefront] },
        })

        if (hasDefinedGQLError('PaymentProviderUsedByAgentStorefront', result.errors)) {
          addToast({ severity: 'danger', translateKey: USED_BY_STOREFRONT_ERROR })

          return
        }

        const destroyedId = result.data?.destroyPaymentProvider?.id

        if (destroyedId) {
          evictFromCache(client, {
            id: destroyedId,
            __typename: 'StripeProvider',
            listFieldName: 'paymentProviders',
            listQueryDocument: GetStripeIntegrationsListDocument,
          })

          callback?.()

          addToast({
            message: translate('text_62b1edddbf5f461ab9712758'),
            severity: 'success',
          })
        }
      },
    }
  }

  const openDeleteStripeIntegrationDialog = (props: TDeleteStripeIntegrationDialogProps): void => {
    void centralizedDialog.open(getDeleteStripeIntegrationDialogProps(props))
  }

  return { getDeleteStripeIntegrationDialogProps, openDeleteStripeIntegrationDialog }
}
