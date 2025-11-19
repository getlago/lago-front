import { gql } from '@apollo/client'

import { useSubsidiariesListForExternalAppsAccordionQuery } from '~/generated/graphql'

gql`
  query subsidiariesListForExternalAppsAccordion($integrationId: ID) {
    integrationSubsidiaries(integrationId: $integrationId) {
      collection {
        externalId
        externalName
      }
    }
  }
`

export const useAccountingProvidersSubsidaries = (
  selectedNetsuiteIntegrationSettingsId?: string,
) => {
  const { data: subsidiariesData } = useSubsidiariesListForExternalAppsAccordionQuery({
    variables: { integrationId: selectedNetsuiteIntegrationSettingsId },
    skip: !selectedNetsuiteIntegrationSettingsId,
  })

  return {
    subsidiariesData,
  }
}
