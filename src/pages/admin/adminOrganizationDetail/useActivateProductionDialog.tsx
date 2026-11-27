import { gql } from '@apollo/client'
import NiceModal from '@ebay/nice-modal-react'
import { GraphQLFormattedError } from 'graphql'

import { REASON_MODAL_NAME } from '~/components/admin/const'
import { ReasonModalProps } from '~/components/admin/ReasonModal'
import { addToast, getGraphQLErrorCode, hasDefinedGQLError } from '~/core/apolloClient'
import { LagoApiError, useAdminActivateOrganizationMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation adminActivateOrganization($input: AdminActivateOrganizationInput!) {
    adminActivateOrganization(input: $input) {
      id
      activationStatus
    }
  }
`

const ACTIVATE_SILENT_ERROR_CODES: LagoApiError[] = [
  LagoApiError.OrganizationNotSelfServeProduction,
  LagoApiError.SelfServeDisabled,
  LagoApiError.NotFound,
  LagoApiError.UnprocessableEntity,
]

const getActivateErrorMessageKey = (errors: readonly GraphQLFormattedError[]): string | null => {
  if (hasDefinedGQLError('NotFound', errors, 'organization')) {
    return 'text_1795796505802z103l5kthw9'
  }

  const errorCode = getGraphQLErrorCode(errors[0].extensions)

  if (errorCode === LagoApiError.OrganizationNotSelfServeProduction) {
    return 'text_1795796505801xnldd1batza'
  }

  if (errorCode === LagoApiError.SelfServeDisabled) return 'text_1795796505801omkv0m0deui'

  if (!ACTIVATE_SILENT_ERROR_CODES.some((silentCode) => silentCode === errorCode)) return null

  return 'text_1795796505802i85frah4ogj'
}

export const useActivateProductionDialog = (): {
  openActivateProductionDialog: (organization: { id: string; name: string }) => void
} => {
  const { translate } = useInternationalization()
  const [activateOrganization] = useAdminActivateOrganizationMutation()

  const confirmActivation = async (organizationId: string, reason: string): Promise<void> => {
    const result = await activateOrganization({
      variables: { input: { organizationId, reason } },
      context: { silentErrorCodes: ACTIVATE_SILENT_ERROR_CODES },
      errorPolicy: 'all',
    })

    if (result.errors?.length) {
      const messageKey = getActivateErrorMessageKey(result.errors)

      if (messageKey) addToast({ severity: 'danger', message: translate(messageKey) })

      return
    }

    addToast({ severity: 'success', message: translate('text_1795796505801y82a7xs98or') })
  }

  const openActivateProductionDialog = (organization: { id: string; name: string }): void => {
    void NiceModal.show<void, ReasonModalProps>(REASON_MODAL_NAME, {
      title: translate('text_17957965058011hxk7hvivk8'),
      description: translate('text_1795796505801yxcwr6uspw2', {
        organizationName: organization.name,
      }),
      showNotifyCheckbox: false,
      onConfirm: (reason) => confirmActivation(organization.id, reason),
    })
  }

  return { openActivateProductionDialog }
}
