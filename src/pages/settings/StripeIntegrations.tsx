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
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import {
  AddStripeDialog,
  AddStripeDialogRef,
} from '~/components/settings/integrations/AddStripeDialog'
import {
  DeleteStripeIntegrationDialog,
  DeleteStripeIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteStripeIntegrationDialog'
import { INTEGRATIONS_ROUTE, STRIPE_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddStripeProviderDialogFragmentDoc,
  DeleteStripeIntegrationDialogFragmentDoc,
  ProviderTypeEnum,
  StripeForCreateAndEditSuccessRedirectUrlFragmentDoc,
  StripeProvider,
  useGetStripeIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Stripe from '~/public/images/stripe.svg'
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
  fragment StripeIntegrations on StripeProvider {
    id
    name
    code
  }

  query getStripeIntegrationsList($limit: Int, $type: ProviderTypeEnum) {
    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on StripeProvider {
          id
          ...StripeIntegrations
          ...AddStripeProviderDialog
          ...DeleteStripeIntegrationDialog
        }
      }
    }
  }

  ${StripeForCreateAndEditSuccessRedirectUrlFragmentDoc}
  ${DeleteStripeIntegrationDialogFragmentDoc}
  ${AddStripeProviderDialogFragmentDoc}
`

const StripeIntegrations = () => {
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const addStripeDialogRef = useRef<AddStripeDialogRef>(null)
  const deleteDialogRef = useRef<DeleteStripeIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetStripeIntegrationsListQuery({
    variables: { limit: 1000, type: ProviderTypeEnum.Stripe },
  })
  const connections = data?.paymentProviders?.collection as StripeProvider[] | undefined
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
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_62b1edddbf5f461ab971277d')}
            </Typography>
          )}
        </HeaderBlock>

        {canCreateIntegration && (
          <Button
            variant="primary"
            onClick={() => {
              addStripeDialogRef.current?.openDialog()
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
              <Skeleton variant="text" width={200} height={12} marginBottom="22px" />
              <Skeleton variant="text" width={128} height={12} />
            </div>
          </>
        ) : (
          <>
            <StyledAvatar variant="connector" size="large">
              <Stripe />
            </StyledAvatar>
            <div>
              <Line>
                <Typography variant="headline">
                  {translate('text_62b1edddbf5f461ab971277d')}
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
                    <Skeleton variant="text" width={240} height={12} />
                  </ListItem>
                ))}
              </>
            ) : (
              <>
                {connections?.map((connection, index) => {
                  return (
                    <ItemContainer key={`stripe-connection-${index}`}>
                      <LocalListItemLink
                        tabIndex={0}
                        to={generatePath(STRIPE_INTEGRATION_DETAILS_ROUTE, {
                          integrationId: connection.id,
                        })}
                      >
                        <Stack direction="row" spacing={3} alignItems="center">
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
                                    addStripeDialogRef.current?.openDialog({
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

      <AddStripeDialog ref={addStripeDialogRef} />
      <DeleteStripeIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

const HeaderBlock = styled.div`
  display: flex;
  align-items: center;

  > *:first-child  {
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

const StyledAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(4)};
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

export default StripeIntegrations
