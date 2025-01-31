import { gql } from '@apollo/client'
import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  ButtonLink,
  Chip,
  Popper,
  Skeleton,
  Typography,
} from '~/components/designSystem'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { AddOktaDialog, AddOktaDialogRef } from '~/components/settings/authentication/AddOktaDialog'
import {
  DeleteOktaIntegrationDialog,
  DeleteOktaIntegrationDialogRef,
} from '~/components/settings/authentication/DeleteOktaIntegrationDialog'
import { AUTHENTICATION_ROUTE } from '~/core/router'
import {
  AddOktaIntegrationDialogFragmentDoc,
  DeleteOktaIntegrationDialogFragmentDoc,
  OktaIntegration,
  useGetOktaIntegrationQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  PropertyListItem,
  SkeletonPropertyListItem,
} from '~/pages/settings/Authentication/components/PropertyListItem'
import Okta from '~/public/images/okta.svg'
import { MenuPopper, NAV_HEIGHT, PageHeader, theme } from '~/styles'

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
  const navigate = useNavigate()

  const addOktaDialogRef = useRef<AddOktaDialogRef>(null)
  const deleteOktaDialogRef = useRef<DeleteOktaIntegrationDialogRef>(null)

  const { data, loading, refetch } = useGetOktaIntegrationQuery({
    variables: { id: integrationId },
  })

  const integration = data?.integration as OktaIntegration | null

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
      <Settings>
      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<Okta />}
        integrationName={translate('text_664c732c264d7eed1c74fda2')}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
        integrationDescription={translate('text_664c732c264d7eed1c74fdbd')}
      />

        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_664c732c264d7eed1c74fdc5')}</Typography>
            <Button
              variant="quaternary"
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
          </InlineTitle>

          <>
            {loading ? (
              [0, 1, 2, 3].map((i) => <SkeletonPropertyListItem key={`item-skeleton-item-${i}`} />)
            ) : (
              <>
                <PropertyListItem
                  icon="globe"
                  label={translate('text_664c732c264d7eed1c74fd94')}
                  value={integration.domain}
                />
                <PropertyListItem
                  icon="key"
                  label={translate('text_664c732c264d7eed1c74fda6')}
                  value={integration.clientId || 'N/A'}
                />
                <PropertyListItem
                  icon="key"
                  label={translate('text_664c732c264d7eed1c74fdb2')}
                  value={integration.clientSecret || 'N/A'}
                />
                <PropertyListItem
                  icon="text"
                  label={translate('text_664c732c264d7eed1c74fdbb')}
                  value={integration.organizationName}
                />
              </>
            )}
          </>
        </section>
      </Settings>
      <AddOktaDialog ref={addOktaDialogRef} />
      <DeleteOktaIntegrationDialog ref={deleteOktaDialogRef} />
    </>
  )
}

const Settings = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(8)};
  padding: 0 ${theme.spacing(12)};
  box-sizing: border-box;
  max-width: ${theme.spacing(168)};

  ${theme.breakpoints.down('md')} {
    padding: 0 ${theme.spacing(4)};
  }
`

const InlineTitle = styled.div`
  position: relative;
  height: ${NAV_HEIGHT}px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export default OktaAuthenticationDetails
