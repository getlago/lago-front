import { gql, useMutation } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { authenticationMethodsMapping } from '~/core/constants/authenticationMethodsMapping'
import { AuthenticationMethodsEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

const UPDATE_ORGANIZATION_AUTH_METHODS = gql`
  mutation updateOrganizationAuthenticationMethods($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      authenticationMethods
    }
  }
`

type UpdateOrganizationAuthenticationMethodsResult = {
  updateOrganization?: {
    id: string
    authenticationMethods?: string[] | null
  } | null
}

const ENTRA_ID_METHOD = 'entra_id' as const
type OrganizationAuthenticationMethod = AuthenticationMethodsEnum | typeof ENTRA_ID_METHOD

type UpdateLoginMethodDialogData = {
  method: OrganizationAuthenticationMethod
  type: 'enable' | 'disable'
}

export const useUpdateLoginMethodDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const { organization, refetchOrganizationInfos } = useOrganizationInfos()

  const [updateOrganizationAuthenticationMethods] =
    useMutation<UpdateOrganizationAuthenticationMethodsResult>(UPDATE_ORGANIZATION_AUTH_METHODS)

  const openUpdateLoginMethodDialog = (data: UpdateLoginMethodDialogData) => {
    const isDanger = data.type === 'disable'
    const methodLabel =
      data.method === ENTRA_ID_METHOD
        ? 'Entra ID'
        : translate(authenticationMethodsMapping[data.method])

    const getNewAuthMethods = () => {
      const currentAuthenticationMethods = (organization?.authenticationMethods || []) as string[]

      if (data.type === 'disable') {
        return currentAuthenticationMethods.filter((method) => method !== data.method)
      }

      if (data.type === 'enable') {
        return [...currentAuthenticationMethods, data.method]
      }

      return currentAuthenticationMethods
    }

    centralizedDialog.open({
      title: translate(
        isDanger ? 'text_1752157864305cyuembvqwls' : 'text_1752157864305roig666alyw',
        { method: methodLabel },
      ),
      description: translate(
        isDanger ? 'text_1752157864305wmeiff8xkih' : 'text_1752157864305uw22hplchmu',
        { method: methodLabel },
      ),
      colorVariant: isDanger ? 'danger' : 'info',
      actionText: translate(
        isDanger ? 'text_1752158016616mbk432yu9oz' : 'text_17521580166150wyrhvd2u56',
      ),
      onAction: async () => {
        const result = await updateOrganizationAuthenticationMethods({
          variables: {
            input: {
              authenticationMethods: getNewAuthMethods(),
            },
          },
        })

        if (result.data?.updateOrganization) {
          const isEnabled = result.data.updateOrganization.authenticationMethods?.includes(data.method)

          addToast({
            message: translate(
              isEnabled ? 'text_1752158380555fssagh1zpp1' : 'text_1752158380555al7jwgd0hfk',
              { method: methodLabel },
            ),
            severity: 'success',
          })

          refetchOrganizationInfos()
        }
      },
    })
  }

  return { openUpdateLoginMethodDialog }
}
