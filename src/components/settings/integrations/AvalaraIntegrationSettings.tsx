import { gql } from '@apollo/client'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { Typography } from '~/components/designSystem'
import { useGetAvalaraIntegrationSettingsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment AvalaraIntegrationSettings on AvalaraIntegration {
    id
    name
    code
    accountId
  }

  query getAvalaraIntegrationSettings($id: ID!) {
    integration(id: $id) {
      ... on AvalaraIntegration {
        id
        ...AvalaraIntegrationSettings
      }
    }
  }
`

const AvalaraIntegrationSettings = () => {
  const { integrationId = '' } = useParams()
  const { translate } = useInternationalization()
  const [isApiKeyVisible, setIsApiKeyVisible] = useState<boolean>(false)
  const { data, loading } = useGetAvalaraIntegrationSettingsQuery({
    variables: {
      id: integrationId,
    },
    skip: !integrationId,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="subhead">{translate('text_avalara_account_settings')}</Typography>
        <div className="mt-4 grid gap-4 md:grid-cols-2"></div>
      </div>
      <div>
        <Typography variant="subhead">{translate('text_miscellaneous')}</Typography>
        <div className="mt-4 grid gap-4 md:grid-cols-2">TODO:</div>
      </div>
    </div>
  )
}

export default AvalaraIntegrationSettings
