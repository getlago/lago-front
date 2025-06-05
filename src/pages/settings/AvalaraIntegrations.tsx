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
  AddAvalaraDialog,
  AddAvalaraDialogRef,
} from '~/components/settings/integrations/AddAvalaraDialog'
import {
  DeleteAvalaraIntegrationDialog,
  DeleteAvalaraIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteAvalaraIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { AVALARA_INTEGRATION_DETAILS_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import {
  AddAvalaraIntegrationDialogFragmentDoc,
  AvalaraIntegrationsFragment,
  DeleteAvalaraIntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  useGetAvalaraIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { AvalaraIntegrationDetailsTabs } from '~/pages/settings/AvalaraIntegrationDetails'
import Avalara from '~/public/images/avalara.svg'
import { MenuPopper, PageHeader, PopperOpener } from '~/styles'

// import { AvalaraIntegrationDetailsTabs } from './AvalaraIntegrationDetails'

gql`
  fragment AvalaraIntegrations on AvalaraIntegration {
    id
    name
    code
    ...AddAvalaraIntegrationDialog
  }

  query getAvalaraIntegrationsList($limit: Int, $types: [IntegrationTypeEnum!]) {
    integrations(limit: $limit, types: $types) {
      collection {
        ... on AvalaraIntegration {
          id
          ...AvalaraIntegrations
          ...AddAvalaraIntegrationDialog
          ...DeleteAvalaraIntegrationDialog
        }
      }
    }
  }

  ${AddAvalaraIntegrationDialogFragmentDoc}
  ${DeleteAvalaraIntegrationDialogFragmentDoc}
`

const AvalaraIntegrations = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const addAvalaraDialogRef = useRef<AddAvalaraDialogRef>(null)
  const deleteDialogRef = useRef<DeleteAvalaraIntegrationDialogRef>(null)
  const { data, loading } = useGetAvalaraIntegrationsListQuery({
    variables: { limit: 1000, types: [IntegrationTypeEnum.Avalara] },
  })
  const connections = data?.integrations?.collection as AvalaraIntegrationsFragment[] | undefined
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
              {translate('text_1744293609277s53zn6jcoq4')}
            </Typography>
          )}
        </PageHeader.Group>
        <Button
          variant="primary"
          onClick={() => {
            addAvalaraDialogRef.current?.openDialog()
          }}
        >
          {translate('text_65846763e6140b469140e235')}
        </Button>
      </PageHeader.Wrapper>

      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<Avalara />}
        integrationName={translate('text_1744293609277s53zn6jcoq4')}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
        integrationDescription={translate('text_6668821d94e4da4dfd8b3840')}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_65846763e6140b469140e239')} />

          {loading &&
            [1, 2].map((i) => <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />)}

          {!loading &&
            connections?.map((connection) => {
              return (
                <IntegrationsPage.ListItem
                  key={`avalara-connection-${connection.id}`}
                  to={generatePath(AVALARA_INTEGRATION_DETAILS_ROUTE, {
                    integrationId: connection.id,
                    tab: AvalaraIntegrationDetailsTabs.Settings,
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
                            addAvalaraDialogRef.current?.openDialog({
                              integration: connection,
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
      <AddAvalaraDialog ref={addAvalaraDialogRef} />
      <DeleteAvalaraIntegrationDialog ref={deleteDialogRef} />
    </>
  )
}

export default AvalaraIntegrations
