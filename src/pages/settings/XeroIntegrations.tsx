import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import {
  Button,
  ButtonLink,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { AddXeroDialog, AddXeroDialogRef } from '~/components/settings/integrations/AddXeroDialog'
import {
  DeleteXeroIntegrationDialog,
  DeleteXeroIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteXeroIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, XERO_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  DeleteXeroIntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  useGetXeroIntegrationsListQuery,
  XeroForCreateDialogDialogFragmentDoc,
  XeroIntegrationsFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Xero from '~/public/images/xero.svg'
import { MenuPopper, PageHeader, PopperOpener } from '~/styles'

import { XeroIntegrationDetailsTabs } from './XeroIntegrationDetails'

gql`
  fragment XeroIntegrations on XeroIntegration {
    id
    name
    code
    ...XeroForCreateDialogDialog
  }

  query getXeroIntegrationsList($limit: Int, $types: [IntegrationTypeEnum!]) {
    integrations(limit: $limit, types: $types) {
      collection {
        ... on XeroIntegration {
          id
          ...XeroIntegrations
          ...XeroForCreateDialogDialog
          ...DeleteXeroIntegrationDialog
        }
      }
    }
  }

  ${XeroForCreateDialogDialogFragmentDoc}
  ${DeleteXeroIntegrationDialogFragmentDoc}
`

const XeroIntegrations = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const addXeroDialogRef = useRef<AddXeroDialogRef>(null)
  const deleteDialogRef = useRef<DeleteXeroIntegrationDialogRef>(null)
  const { data, loading } = useGetXeroIntegrationsListQuery({
    variables: { limit: 1000, types: [IntegrationTypeEnum.Xero] },
  })
  const connections = data?.integrations?.collection as XeroIntegrationsFragment[] | undefined
  const deleteDialogCallback =
    connections && connections?.length === 1
      ? () =>
          navigate(
            generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
          )
      : undefined

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <ButtonLink
            to={generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_6672ebb8b1b50be550eccaf8')}
            </Typography>
          )}
        </PageHeader.Group>
        <Button
          variant="primary"
          onClick={() => {
            addXeroDialogRef.current?.openDialog()
          }}
        >
          {translate('text_65846763e6140b469140e235')}
        </Button>
      </PageHeader.Wrapper>

      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<Xero />}
        integrationName={translate('text_6672ebb8b1b50be550eccaf8')}
        integrationDescription={translate('text_6672ebb8b1b50be550ecca7e')}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_65846763e6140b469140e239')} />

          {loading &&
            [1, 2].map((i) => <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />)}

          {!loading &&
            connections?.map((connection, index) => {
              return (
                <IntegrationsPage.ListItem
                  key={`xero-connection-${index}`}
                  to={generatePath(XERO_INTEGRATION_DETAILS_ROUTE, {
                    integrationId: connection.id,
                    tab: XeroIntegrationDetailsTabs.Settings,
                    integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                  })}
                  label={connection.name}
                  subLabel={connection.code}
                >
                  <Popper
                    PopperProps={{ placement: 'bottom-end' }}
                    opener={({ isOpen }) => (
                      <PopperOpener className="right-0 md:right-0">
                        <Tooltip
                          placement="top-end"
                          disableHoverListener={isOpen}
                          title={translate('text_626162c62f790600f850b7b6')}
                        >
                          <Button
                            icon="dots-horizontal"
                            variant="quaternary"
                            data-test="plan-item-options"
                          />
                        </Tooltip>
                      </PopperOpener>
                    )}
                  >
                    {({ closePopper }) => (
                      <MenuPopper>
                        <Button
                          startIcon="pen"
                          variant="quaternary"
                          align="left"
                          onClick={() => {
                            addXeroDialogRef.current?.openDialog({
                              provider: connection,
                              deleteModalRef: deleteDialogRef,
                              deleteDialogCallback,
                            })
                            closePopper()
                          }}
                        >
                          {translate('text_65845f35d7d69c3ab4793dac')}
                        </Button>
                        <Button
                          startIcon="trash"
                          variant="quaternary"
                          align="left"
                          onClick={() => {
                            deleteDialogRef.current?.openDialog({
                              provider: connection,
                              callback: deleteDialogCallback,
                            })
                            closePopper()
                          }}
                        >
                          {translate('text_645d071272418a14c1c76a81')}
                        </Button>
                      </MenuPopper>
                    )}
                  </Popper>
                </IntegrationsPage.ListItem>
              )
            })}
        </section>
      </IntegrationsPage.Container>

      <AddXeroDialog ref={addXeroDialogRef} />
      <DeleteXeroIntegrationDialog ref={deleteDialogRef} />
    </>
  )
}

export default XeroIntegrations
