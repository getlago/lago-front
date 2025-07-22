import { gql } from '@apollo/client'
import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button, ButtonLink, Popper, Skeleton, Typography } from '~/components/designSystem'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { AddOktaDialog, AddOktaDialogRef } from '~/components/settings/authentication/AddOktaDialog'
import {
  DeleteOktaIntegrationDialog,
  DeleteOktaIntegrationDialogRef,
} from '~/components/settings/authentication/DeleteOktaIntegrationDialog'
import { AUTHENTICATION_ROUTE } from '~/core/router'
import {
  AddOktaIntegrationDialogFragmentDoc,
  AuthenticationMethodsEnum,
  DeleteOktaIntegrationDialogFragmentDoc,
  LagoApiError,
  OktaIntegration,
  useGetOktaIntegrationQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import Okta from '~/public/images/okta.svg'
import { MenuPopper, PageHeader } from '~/styles'

gql`
  fragment OktaIntegrationDetails on OktaIntegration {
    id
    clientId
    clientSecret
    code
    organizationName
    domain
    name
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
  const { translate } = useInternationalization()
  const { integrationId } = useParams()
  const { organization } = useOrganizationInfos()
  const navigate = useNavigate()

  const addOktaDialogRef = useRef<AddOktaDialogRef>(null)
  const deleteOktaDialogRef = useRef<DeleteOktaIntegrationDialogRef>(null)

  const { data, loading, refetch } = useGetOktaIntegrationQuery({
    variables: { id: integrationId },
    skip: !integrationId,
    context: {
      silentErrorCodes: [LagoApiError.NotFound],
    },
  })

  const integration = data?.integration as OktaIntegration | null

  const hasOtherAuthenticationMethodsThanOkta = organization?.authenticationMethods.some(
    (method) => method !== AuthenticationMethodsEnum.Okta,
  )

  const onDeleteCallback = () => {
    navigate(AUTHENTICATION_ROUTE)
  }

  const onEditCallback = () => {
    refetch()
  }

  if (!integration) {
    navigate(AUTHENTICATION_ROUTE)
    return null
  }

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <ButtonLink
            to={AUTHENTICATION_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_664c732c264d7eed1c74fda2')}
            </Typography>
          )}
        </PageHeader.Group>
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={
            <Button endIcon="chevron-down">{translate('text_626162c62f790600f850b6fe')}</Button>
          }
        >
          {({ closePopper }) => (
            <MenuPopper>
              <Button
                variant="quaternary"
                fullWidth
                align="left"
                onClick={() => {
                  closePopper()
                  addOktaDialogRef.current?.openDialog({
                    integration,
                    callback: onEditCallback,
                    deleteModalRef: deleteOktaDialogRef,
                    deleteDialogCallback: onDeleteCallback,
                  })
                }}
              >
                {translate('text_664c732c264d7eed1c74fdaa')}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                fullWidth
                disabled={!hasOtherAuthenticationMethodsThanOkta}
                onClick={() => {
                  closePopper()
                  deleteOktaDialogRef.current?.openDialog({
                    integration,
                    callback: onDeleteCallback,
                  })
                }}
              >
                {translate('text_664c732c264d7eed1c74fdb0')}
              </Button>
            </MenuPopper>
          )}
        </Popper>
      </PageHeader.Wrapper>
      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<Okta />}
        integrationName={translate('text_664c732c264d7eed1c74fda2')}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
        integrationDescription={translate('text_664c732c264d7eed1c74fdbd')}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_664c732c264d7eed1c74fdc5')}>
            <Button
              variant="inline"
              disabled={loading}
              onClick={() =>
                addOktaDialogRef.current?.openDialog({
                  integration,
                  callback: onEditCallback,
                  deleteModalRef: deleteOktaDialogRef,
                  deleteDialogCallback: onDeleteCallback,
                })
              }
            >
              {translate('text_62b1edddbf5f461ab9712787')}
            </Button>
          </IntegrationsPage.Headline>

          <>
            {loading ? (
              [0, 1, 2, 3].map((i) => (
                <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />
              ))
            ) : (
              <>
                <IntegrationsPage.DetailsItem
                  icon="globe"
                  label={translate('text_664c732c264d7eed1c74fd94')}
                  value={integration.domain}
                />
                <IntegrationsPage.DetailsItem
                  icon="key"
                  label={translate('text_664c732c264d7eed1c74fda6')}
                  value={integration.clientId || 'N/A'}
                />
                <IntegrationsPage.DetailsItem
                  icon="key"
                  label={translate('text_664c732c264d7eed1c74fdb2')}
                  value={integration.clientSecret || 'N/A'}
                />
                <IntegrationsPage.DetailsItem
                  icon="text"
                  label={translate('text_664c732c264d7eed1c74fdbb')}
                  value={integration.organizationName}
                />
              </>
            )}
          </>
        </section>
      </IntegrationsPage.Container>
      <AddOktaDialog ref={addOktaDialogRef} />
      <DeleteOktaIntegrationDialog ref={deleteOktaDialogRef} />
    </>
  )
}

export default OktaAuthenticationDetails
