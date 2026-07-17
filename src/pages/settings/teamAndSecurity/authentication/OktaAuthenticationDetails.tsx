import { gql } from '@apollo/client'
import { useParams } from 'react-router-dom'

import {
  AddOktaIntegrationDialogFragmentDoc,
  AuthenticationMethodsEnum,
  DeleteOktaIntegrationDialogFragmentDoc,
  LagoApiError,
  OktaIntegration,
  useGetOktaIntegrationQuery,
} from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import Okta from '~/public/images/okta.svg'

import { useAddOktaDialog } from './dialogs/AddOktaDialog'
import { useDeleteOktaIntegrationDialog } from './dialogs/DeleteOktaIntegrationDialog'
import { SSOAuthenticationDetails } from './SSOAuthenticationDetails'

gql`
  fragment OktaIntegrationDetails on OktaIntegration {
    id
    clientId
    clientSecret
    code
    organizationName
    domain
    name
    host
  }

  query GetOktaIntegration($id: ID) {
    integration(id: $id) {
      ... on OktaIntegration {
        ...OktaIntegrationDetails
        ...AddOktaIntegrationDialog
        ...DeleteOktaIntegrationDialog
      }
    }
  }

  ${AddOktaIntegrationDialogFragmentDoc}
  ${DeleteOktaIntegrationDialogFragmentDoc}
`

const OktaAuthenticationDetails = () => {
  const { integrationId } = useParams()
  const { organization } = useOrganizationInfos()

  const { openAddOktaDialog } = useAddOktaDialog()
  const { openDeleteOktaIntegrationDialog } = useDeleteOktaIntegrationDialog()

  const { data, loading, refetch } = useGetOktaIntegrationQuery({
    variables: { id: integrationId },
    skip: !integrationId,
    context: {
      silentErrorCodes: [LagoApiError.NotFound],
    },
  })

  const integration = data?.integration as OktaIntegration | null

  const hasOtherAuthenticationMethodsThanOkta = !!organization?.authenticationMethods.some(
    (method) => method !== AuthenticationMethodsEnum.Okta,
  )

  return (
    <SSOAuthenticationDetails
      integration={integration}
      loading={loading}
      refetch={refetch}
      hasOtherAuthenticationMethods={hasOtherAuthenticationMethodsThanOkta}
      icon={<Okta />}
      viewNameKey="text_664c732c264d7eed1c74fda2"
      metadataKey="text_664c732c264d7eed1c74fdbd"
      deleteMenuLabelKey="text_664c732c264d7eed1c74fdb0"
      openAddDialog={openAddOktaDialog}
      openDeleteDialog={openDeleteOktaIntegrationDialog}
      getDetailRows={(currentIntegration) => [
        {
          icon: 'globe',
          labelKey: 'text_664c732c264d7eed1c74fd94',
          value: currentIntegration.domain,
        },
        {
          icon: 'globe',
          labelKey: 'text_1763560144639jp40amfwhn5',
          value: currentIntegration.host || 'N/A',
        },
        {
          icon: 'key',
          labelKey: 'text_664c732c264d7eed1c74fda6',
          value: currentIntegration.clientId || 'N/A',
        },
        {
          icon: 'key',
          labelKey: 'text_664c732c264d7eed1c74fdb2',
          value: currentIntegration.clientSecret || 'N/A',
        },
        {
          icon: 'text',
          labelKey: 'text_664c732c264d7eed1c74fdbb',
          value: currentIntegration.organizationName,
        },
      ]}
    />
  )
}

export default OktaAuthenticationDetails
