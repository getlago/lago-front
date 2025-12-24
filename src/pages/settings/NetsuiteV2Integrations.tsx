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
import {
  AddNetsuiteV2Dialog,
  AddNetsuiteV2DialogRef,
} from '~/components/settings/integrations/AddNetsuiteV2Dialog'
import {
  DeleteNetsuiteV2IntegrationDialog,
  DeleteNetsuiteV2IntegrationDialogRef,
} from '~/components/settings/integrations/DeleteNetsuiteV2IntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, NETSUITE_V2_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  DeleteNetsuiteV2IntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  NetsuiteV2ForCreateDialogDialogFragmentDoc,
  NetsuiteV2IntegrationsFragment,
  useGetNetsuiteV2IntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Netsuite from '~/public/images/netsuite.svg'
import { MenuPopper, PageHeader, PopperOpener } from '~/styles'

import { NetsuiteV2IntegrationDetailsTabs } from './NetsuiteV2IntegrationDetails'

gql`
  fragment NetsuiteV2Integrations on NetsuiteV2Integration {
    id
    name
    code
    ...NetsuiteV2ForCreateDialogDialog
  }

  query getNetsuiteV2IntegrationsList($limit: Int, $types: [IntegrationTypeEnum!]) {
    integrations(limit: $limit, types: $types) {
      collection {
        ... on NetsuiteV2Integration {
          id
          ...NetsuiteV2Integrations
          ...NetsuiteV2ForCreateDialogDialog
          ...DeleteNetsuiteV2IntegrationDialog
        }
      }
    }
  }

  ${NetsuiteV2ForCreateDialogDialogFragmentDoc}
  ${DeleteNetsuiteV2IntegrationDialogFragmentDoc}
`

const NetsuiteV2Integrations = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const addNetsuiteV2DialogRef = useRef<AddNetsuiteV2DialogRef>(null)
  const deleteDialogRef = useRef<DeleteNetsuiteV2IntegrationDialogRef>(null)
  const { data, loading } = useGetNetsuiteV2IntegrationsListQuery({
    variables: { limit: 1000, types: [IntegrationTypeEnum.NetsuiteV2] },
  })
  const connections = data?.integrations?.collection as NetsuiteV2IntegrationsFragment[] | undefined
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
              {translate('text_1766068213462z5ia1fxaveh')}
            </Typography>
          )}
        </PageHeader.Group>
        <Button
          variant="primary"
          onClick={() => {
            addNetsuiteV2DialogRef.current?.openDialog()
          }}
        >
          {translate('text_65846763e6140b469140e235')}
        </Button>
      </PageHeader.Wrapper>

      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<Netsuite />}
        integrationName={translate('text_1766068213462z5ia1fxaveh')}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
        integrationDescription={`${translate('text_1766068213462z5ia1fxaveh')} • ${translate('text_661ff6e56ef7e1b7c542b245')}`}
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
                  key={`netsuite-connection-${index}`}
                  to={generatePath(NETSUITE_V2_INTEGRATION_DETAILS_ROUTE, {
                    integrationId: connection.id,
                    tab: NetsuiteV2IntegrationDetailsTabs.Settings,
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
                            addNetsuiteV2DialogRef.current?.openDialog({
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
      <AddNetsuiteV2Dialog ref={addNetsuiteV2DialogRef} />
      <DeleteNetsuiteV2IntegrationDialog ref={deleteDialogRef} />
    </>
  )
}

export default NetsuiteV2Integrations
