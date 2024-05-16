import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { AddOktaDialog, AddOktaDialogRef } from '~/components/settings/authentication/AddOktaDialog'
import {
  DeleteOktaIntegrationDialog,
  DeleteOktaIntegrationDialogRef,
} from '~/components/settings/authentication/DeleteOktaIntegrationDialog'
import { OKTA_AUTHENTICATION_ROUTE } from '~/core/router'
import {
  AddOktaIntegrationDialogFragmentDoc,
  DeleteOktaIntegrationDialogFragmentDoc,
  OktaIntegration,
  useGetAuthIntegrationsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import {
  OktaListItem,
  SkeletonOktaListItem,
} from '~/pages/settings/Authentication/components/OktaListItem'
import { theme } from '~/styles'
import { SettingsHeaderNameWrapper, SettingsPageContentWrapper } from '~/styles/settingsPage'

gql`
  query GetAuthIntegrations {
    integrations {
      collection {
        ... on OktaIntegration {
          id
          ...AddOktaIntegrationDialog
          ...DeleteOktaIntegrationDialog
        }
      }
    }
  }

  ${AddOktaIntegrationDialogFragmentDoc}
  ${DeleteOktaIntegrationDialogFragmentDoc}
`

const Authentication = () => {
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const addOktaDialogRef = useRef<AddOktaDialogRef>(null)
  const deleteOktaDialogRef = useRef<DeleteOktaIntegrationDialogRef>(null)

  const { data, loading, refetch } = useGetAuthIntegrationsQuery()

  const oktaIntegration = data?.integrations?.collection.find(
    (integration) => integration.__typename === 'OktaIntegration',
  ) as OktaIntegration | undefined

  return (
    <>
      <SettingsHeaderNameWrapper>
        <Typography variant="bodyHl" color="grey700">
          {translate('TODO: Authentication')}
        </Typography>
      </SettingsHeaderNameWrapper>

      <SettingsPageContentWrapper>
        <Title variant="headline">{translate('TODO: Authentication')}</Title>
        <Subtitle>
          {translate('TODO: Manage how to authenticate to your Lago organization.')}
        </Subtitle>

        {loading ? (
          <LoadingContainer>
            {[0].map((i) => (
              <SkeletonOktaListItem key={`skeleton-${i}`} />
            ))}
          </LoadingContainer>
        ) : (
          <>
            <OktaListItem
              integrationId={oktaIntegration?.id}
              onConfigure={() =>
                isPremium
                  ? addOktaDialogRef.current?.openDialog({
                      integration: oktaIntegration,
                      callback: refetch,
                      deleteModalRef: deleteOktaDialogRef,
                      deleteDialogCallback: refetch,
                    })
                  : premiumWarningDialogRef.current?.openDialog()
              }
              onGoDetails={
                oktaIntegration
                  ? () =>
                      navigate(
                        generatePath(OKTA_AUTHENTICATION_ROUTE, {
                          integrationId: oktaIntegration.id,
                        }),
                      )
                  : undefined
              }
              onDelete={() =>
                deleteOktaDialogRef.current?.openDialog({
                  integration: oktaIntegration,
                  callback: refetch,
                })
              }
            />
          </>
        )}

        <PremiumWarningDialog ref={premiumWarningDialogRef} />
        <AddOktaDialog ref={addOktaDialogRef} />
        <DeleteOktaIntegrationDialog ref={deleteOktaDialogRef} />
      </SettingsPageContentWrapper>
    </>
  )
}

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(2)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const LoadingContainer = styled.div`
  > * {
    margin-bottom: ${theme.spacing(4)};
  }
`

export default Authentication
