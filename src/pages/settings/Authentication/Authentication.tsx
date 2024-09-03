import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { Avatar, Chip, Selector, SelectorSkeleton, Typography } from '~/components/designSystem'
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
  IntegrationTypeEnum,
  OktaIntegration,
  useGetAuthIntegrationsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import Okta from '~/public/images/okta.svg'
import { theme } from '~/styles'
import { SettingsHeaderNameWrapper, SettingsPageContentWrapper } from '~/styles/settingsPage'

gql`
  query GetAuthIntegrations($limit: Int!) {
    integrations(limit: $limit) {
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
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()
  const navigate = useNavigate()

  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const addOktaDialogRef = useRef<AddOktaDialogRef>(null)
  const deleteOktaDialogRef = useRef<DeleteOktaIntegrationDialogRef>(null)

  const { data, loading } = useGetAuthIntegrationsQuery({ variables: { limit: 10 } })

  const hasAccessTOktaPremiumIntegration = !!premiumIntegrations?.includes(IntegrationTypeEnum.Okta)

  const oktaIntegration = data?.integrations?.collection.find(
    (integration) => integration.__typename === 'OktaIntegration',
  ) as OktaIntegration | undefined

  const shouldSeeOktaIntegration = hasAccessTOktaPremiumIntegration && isPremium

  return (
    <>
      <SettingsHeaderNameWrapper>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_664c732c264d7eed1c74fd96')}
        </Typography>
      </SettingsHeaderNameWrapper>

      <SettingsPageContentWrapper>
        <Title variant="headline">{translate('text_664c732c264d7eed1c74fd96')}</Title>
        <Subtitle>{translate('text_664c732c264d7eed1c74fd9c')}</Subtitle>

        {loading ? (
          <LoadingContainer>
            {[0].map((i) => (
              <SelectorSkeleton fullWidth key={`skeleton-${i}`} />
            ))}
          </LoadingContainer>
        ) : (
          <Selector
            title={translate('text_664c732c264d7eed1c74fda2')}
            subtitle={translate('text_664c732c264d7eed1c74fda8')}
            icon={
              <Avatar size="big" variant="connector">
                <Okta />
              </Avatar>
            }
            endIcon={
              shouldSeeOktaIntegration ? (
                oktaIntegration?.id ? (
                  <Chip label={translate('text_634ea0ecc6147de10ddb662d')} />
                ) : undefined
              ) : (
                'sparkles'
              )
            }
            onClick={() => {
              if (!shouldSeeOktaIntegration) {
                return premiumWarningDialogRef.current?.openDialog()
              }

              if (oktaIntegration?.id) {
                return navigate(
                  generatePath(OKTA_AUTHENTICATION_ROUTE, {
                    integrationId: oktaIntegration.id,
                  }),
                )
              }

              return addOktaDialogRef.current?.openDialog({
                integration: oktaIntegration,
                callback: (id) =>
                  navigate(generatePath(OKTA_AUTHENTICATION_ROUTE, { integrationId: id })),
              })
            }}
          />
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
