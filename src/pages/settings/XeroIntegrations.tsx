import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  ButtonLink,
  Chip,
  Icon,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { AddXeroDialog, AddXeroDialogRef } from '~/components/settings/integrations/AddXeroDialog'
import {
  DeleteXeroIntegrationDialog,
  DeleteXeroIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteXeroIntegrationDialog'
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
import {
  ItemContainer,
  ListItemLink,
  MenuPopper,
  NAV_HEIGHT,
  PageHeader,
  PopperOpener,
  theme,
} from '~/styles'

import { XeroIntegrationDetailsTabs } from './XeroIntegrationDetails'

gql`
  fragment XeroIntegrations on XeroIntegration {
    id
    name
    code
    ...XeroForCreateDialogDialog
  }

  query getXeroIntegrationsList($limit: Int, $type: IntegrationTypeEnum) {
    integrations(limit: $limit, type: $type) {
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
    variables: { limit: 1000, type: IntegrationTypeEnum.Xero },
  })
  const connections = data?.integrations?.collection as XeroIntegrationsFragment[] | undefined
  const deleteDialogCallback =
    connections && connections?.length === 1 ? () => navigate(INTEGRATIONS_ROUTE) : undefined

  return (
    <>
      <PageHeader $withSide>
        <HeaderBlock>
          <ButtonLink
            to={INTEGRATIONS_ROUTE}
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
        </HeaderBlock>
        <Button
          variant="primary"
          onClick={() => {
            addXeroDialogRef.current?.openDialog()
          }}
        >
          {translate('text_65846763e6140b469140e235')}
        </Button>
      </PageHeader>
      <MainInfos>
        {loading ? (
          <>
            <Skeleton variant="connectorAvatar" size="large" className="mr-4" />
            <div>
              <Skeleton variant="text" className="mb-5 w-50" />
              <Skeleton variant="text" className="w-32" />
            </div>
          </>
        ) : (
          <>
            <Avatar className="mr-4" variant="connector-full" size="large">
              <Xero />
            </Avatar>
            <div>
              <Line>
                <Typography variant="headline">
                  {translate('text_6672ebb8b1b50be550eccaf8')}
                </Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </Line>
              <Typography>{translate('text_6672ebb8b1b50be550ecca7e')}</Typography>
            </div>
          </>
        )}
      </MainInfos>
      <ListWrapper>
        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_65846763e6140b469140e239')}</Typography>
          </InlineTitle>

          <>
            {loading ? (
              <>
                {[1, 2].map((i) => (
                  <ListItem key={`item-skeleton-item-${i}`}>
                    <Skeleton variant="connectorAvatar" size="big" className="mr-4" />
                    <Skeleton variant="text" className="w-60" />
                  </ListItem>
                ))}
              </>
            ) : (
              <>
                {connections?.map((connection) => {
                  return (
                    <ItemContainer key={`xero-connection-${connection.id}`}>
                      <LocalListItemLink
                        tabIndex={0}
                        to={generatePath(XERO_INTEGRATION_DETAILS_ROUTE, {
                          integrationId: connection.id,
                          tab: XeroIntegrationDetailsTabs.Settings,
                        })}
                      >
                        <Stack direction="row" alignItems="center" spacing={3}>
                          <Avatar variant="connector" size="big">
                            <Icon name="plug" color="dark" />
                          </Avatar>
                          <div>
                            <Typography variant="body" color="grey700">
                              {connection.name}
                            </Typography>
                            <Typography variant="caption" color="grey600">
                              {connection.code}
                            </Typography>
                          </div>
                          <ButtonMock />
                        </Stack>
                      </LocalListItemLink>
                      <Popper
                        PopperProps={{ placement: 'bottom-end' }}
                        opener={({ isOpen }) => (
                          <LocalPopperOpener>
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
                          </LocalPopperOpener>
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
                    </ItemContainer>
                  )
                })}
              </>
            )}
          </>
        </section>
      </ListWrapper>
      <AddXeroDialog ref={addXeroDialogRef} />
      <DeleteXeroIntegrationDialog ref={deleteDialogRef} />
    </>
  )
}

const HeaderBlock = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const MainInfos = styled.div`
  display: flex;
  align-items: center;
  padding: ${theme.spacing(8)} ${theme.spacing(12)};

  ${theme.breakpoints.down('md')} {
    padding: ${theme.spacing(8)} ${theme.spacing(4)};
  }
`

const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(8)};
  padding: 0 ${theme.spacing(12)};
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

const LocalListItemLink = styled(ListItemLink)`
  padding: 0;
`

const ListItem = styled.div`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const Line = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(2)};
  }
`

const ButtonMock = styled.div`
  width: 40px;
  min-width: 40px;
`

const LocalPopperOpener = styled(PopperOpener)`
  right: 0;
`

export default XeroIntegrations
