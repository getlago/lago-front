import { gql } from '@apollo/client'
import { useParams } from 'react-router-dom'

import {
  AddEntraIdIntegrationDialogFragmentDoc,
  AuthenticationMethodsEnum,
  DeleteEntraIdIntegrationDialogFragmentDoc,
  EntraIdIntegration,
  LagoApiError,
  useGetEntraIdIntegrationQuery,
} from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import MicrosoftEntraId from '~/public/images/microsoft-entra-id.svg'

import { useAddEntraIdDialog } from './dialogs/AddEntraIdDialog'
import { useDeleteEntraIdIntegrationDialog } from './dialogs/DeleteEntraIdIntegrationDialog'
import { SSOAuthenticationDetails } from './SSOAuthenticationDetails'

gql`
  fragment EntraIdIntegrationDetails on EntraIdIntegration {
    id
    clientId
    clientSecret
    code
    tenantId
    domain
    name
    host
  }

  query GetEntraIdIntegration($id: ID) {
    integration(id: $id) {
      ... on EntraIdIntegration {
        ...EntraIdIntegrationDetails
        ...AddEntraIdIntegrationDialog
        ...DeleteEntraIdIntegrationDialog
      }
    }
  }

  ${AddEntraIdIntegrationDialogFragmentDoc}
  ${DeleteEntraIdIntegrationDialogFragmentDoc}
`

const EntraIdAuthenticationDetails = () => {
  const { integrationId } = useParams()
  const { organization } = useOrganizationInfos()

  const { openAddEntraIdDialog } = useAddEntraIdDialog()
  const { openDeleteEntraIdIntegrationDialog } = useDeleteEntraIdIntegrationDialog()

  const { data, loading, refetch } = useGetEntraIdIntegrationQuery({
    variables: { id: integrationId },
    skip: !integrationId,
    context: {
      silentErrorCodes: [LagoApiError.NotFound],
    },
  })

  const integration = data?.integration as EntraIdIntegration | null

  const hasOtherAuthenticationMethodsThanEntraId = !!organization?.authenticationMethods.some(
    (method) => method !== AuthenticationMethodsEnum.EntraId,
  )

  return (
    <SSOAuthenticationDetails
      integration={integration}
      loading={loading}
      refetch={refetch}
      hasOtherAuthenticationMethods={hasOtherAuthenticationMethodsThanEntraId}
      icon={<MicrosoftEntraId />}
      viewNameKey="text_17843073442548zt904xoinv"
      metadataKey="text_1784307344255xnl91ujbf4g"
      deleteMenuLabelKey="text_17843073442559jjt3vfrvmk"
      openAddDialog={openAddEntraIdDialog}
      openDeleteDialog={openDeleteEntraIdIntegrationDialog}
      getDetailRows={(currentIntegration) => [
        {
          icon: 'globe',
          labelKey: 'text_1784307344255m1d8phj5f9r',
          value: currentIntegration.domain,
        },
        {
          icon: 'globe',
          labelKey: 'text_1784307344255fan2blwpos6',
          value: currentIntegration.host || 'N/A',
        },
        {
          icon: 'key',
          labelKey: 'text_17843073442552x8gcpunesv',
          value: currentIntegration.clientId || 'N/A',
        },
        {
          icon: 'key',
          labelKey: 'text_17843073442551xjnrw1h4bc',
          value: currentIntegration.clientSecret || 'N/A',
        },
        {
          icon: 'text',
          labelKey: 'text_1784307344255tyzraziy4d1',
          value: currentIntegration.tenantId,
        },
      ]}
    />
  )
}

export default EntraIdAuthenticationDetails
