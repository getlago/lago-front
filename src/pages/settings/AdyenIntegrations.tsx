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
import {
  AddAdyenDialog,
  AddAdyenDialogRef,
} from '~/components/settings/integrations/AddAdyenDialog'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import {
  DeleteAdyenIntegrationDialog,
  DeleteAdyenIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteAdyenIntegrationDialog'
import { ADYEN_INTEGRATION_DETAILS_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import {
  AddAdyenProviderDialogFragmentDoc,
  AdyenForCreateAndEditSuccessRedirectUrlFragmentDoc,
  AdyenProvider,
  DeleteAdyenIntegrationDialogFragmentDoc,
  ProviderTypeEnum,
  useGetAdyenIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Adyen from '~/public/images/adyen.svg'
import {
  ItemContainer,
  ListItemLink,
  MenuPopper,
  NAV_HEIGHT,
  PageHeader,
  PopperOpener,
  theme,
} from '~/styles'

gql`
  fragment AdyenIntegrations on AdyenProvider {
    id
    name
    code
  }

  query getAdyenIntegrationsList($limit: Int, $type: ProviderTypeEnum) {
    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on AdyenProvider {
          id
          ...AdyenIntegrations
          ...AddAdyenProviderDialog
          ...DeleteAdyenIntegrationDialog
        }
      }
    }
  }

  ${AdyenForCreateAndEditSuccessRedirectUrlFragmentDoc}
  ${DeleteAdyenIntegrationDialogFragmentDoc}
  ${AddAdyenProviderDialogFragmentDoc}
`

const AdyenIntegrations = () => {
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const addAdyenDialogRef = useRef<AddAdyenDialogRef>(null)
  const deleteDialogRef = useRef<DeleteAdyenIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetAdyenIntegrationsListQuery({
    variables: { limit: 1000, type: ProviderTypeEnum.Adyen },
  })
  const connections = data?.paymentProviders?.collection as AdyenProvider[] | undefined
  const deleteDialogCallback =
    connections && connections.length === 1 ? () => navigate(INTEGRATIONS_ROUTE) : undefined

  const canCreateIntegration = hasPermissions(['organizationIntegrationsCreate'])
  const canEditIntegration = hasPermissions(['organizationIntegrationsUpdate'])
  const canDeleteIntegration = hasPermissions(['organizationIntegrationsDelete'])

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
            <Skeleton variant="text" width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_645d071272418a14c1c76a6d')}
            </Typography>
          )}
        </HeaderBlock>

        {canCreateIntegration && (
          <Button
            variant="primary"
            onClick={() => {
              addAdyenDialogRef.current?.openDialog()
            }}
          >
            {translate('text_65846763e6140b469140e235')}
          </Button>
        )}
      </PageHeader>
      <MainInfos>
        {loading ? (
          <>
            <Skeleton variant="connectorAvatar" size="large" marginRight="16px" />
            <div>
              <Skeleton variant="text" width={200} marginBottom="22px" />
              <Skeleton variant="text" width={128} />
            </div>
          </>
        ) : (
          <>
            <Avatar className="mr-4" variant="connector-full" size="large">
              <Adyen />
            </Avatar>
            <div>
              <Line>
                <Typography variant="headline">
                  {translate('text_645d071272418a14c1c76a6d')}
                </Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </Line>
              <Typography>{translate('text_62b1edddbf5f461ab971271f')}</Typography>
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
                    <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
                    <Skeleton variant="text" width={240} />
                  </ListItem>
                ))}
              </>
            ) : (
              <>
                {connections?.map((connection, index) => {
                  return (
                    <ItemContainer key={`adyen-connection-${index}`}>
                      <LocalListItemLink
                        tabIndex={0}
                        to={generatePath(ADYEN_INTEGRATION_DETAILS_ROUTE, {
                          integrationId: connection.id,
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
                      {(canEditIntegration || canDeleteIntegration) && (
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
                              {canEditIntegration && (
                                <Button
                                  startIcon="pen"
                                  variant="quaternary"
                                  align="left"
                                  onClick={() => {
                                    addAdyenDialogRef.current?.openDialog({
                                      provider: connection,
                                      deleteModalRef: deleteDialogRef,
                                      deleteDialogCallback,
                                    })
                                    closePopper()
                                  }}
                                >
                                  {translate('text_65845f35d7d69c3ab4793dac')}
                                </Button>
                              )}

                              {canDeleteIntegration && (
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
                              )}
                            </MenuPopper>
                          )}
                        </Popper>
                      )}
                    </ItemContainer>
                  )
                })}
              </>
            )}
          </>
        </section>
      </ListWrapper>
      <AddAdyenDialog ref={addAdyenDialogRef} />
      <DeleteAdyenIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
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

export default AdyenIntegrations
