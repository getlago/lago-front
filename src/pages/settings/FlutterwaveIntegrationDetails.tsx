import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import {
  Avatar,
  Button,
  Chip,
  Icon,
  Skeleton,
  Tab,
  Tabs,
  Typography,
} from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  AddFlutterwaveDialog,
  AddFlutterwaveDialogRef,
} from '~/components/settings/integrations/AddFlutterwaveDialog'
import {
  DeleteFlutterwaveIntegrationDialog,
  DeleteFlutterwaveIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteFlutterwaveIntegrationDialog'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  DeleteFlutterwaveIntegrationMutation,
  FlutterwaveIntegrationDetailsFragment,
  useDeleteFlutterwaveIntegrationMutation,
  useFlutterwaveIntegrationDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import Flutterwave from '~/public/images/flutterwave.svg'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment FlutterwaveIntegrationDetails on FlutterwaveProvider {
    id
    name
    code
    publicKey
    secretKey
    encryptionKey
    production
  }

  query flutterwaveIntegrationDetails($id: ID!, $limit: Int, $type: ProviderTypeEnum) {
    paymentProvider(id: $id) {
      ... on FlutterwaveProvider {
        id
        ...FlutterwaveIntegrationDetails
        ...DeleteFlutterwaveIntegrationDialog
      }
    }

    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on FlutterwaveProvider {
          id
        }
      }
    }
  }

  mutation deleteFlutterwaveIntegration($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

const FlutterwaveIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId } = useParams()
  const { translate } = useInternationalization()
  const addFlutterwaveDialogRef = useRef<AddFlutterwaveDialogRef>(null)
  const deleteDialogRef = useRef<DeleteFlutterwaveIntegrationDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  const { data, loading } = useFlutterwaveIntegrationDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
    },
    skip: !integrationId,
  })

  const [deleteFlutterwaveIntegration] = useDeleteFlutterwaveIntegrationMutation({
    onCompleted(data: DeleteFlutterwaveIntegrationMutation) {
      if (data && data.destroyPaymentProvider) {
        navigate(
          generatePath(INTEGRATIONS_ROUTE, {
            integrationGroup: IntegrationsTabsOptionsEnum.Community,
          }),
        )
      }
    },
  })

  const flutterwavePaymentProvider = data?.paymentProvider as FlutterwaveIntegrationDetailsFragment
  const deleteDialogCallback = () => {
    deleteFlutterwaveIntegration({
      variables: {
        input: {
          id: integrationId as string,
        },
      },
    })
  }

  if (!integrationId) return null

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Typography variant="bodyHl" color="textSecondary" className="mb-1">
            {translate('text_1749724395108m0swrna0zt4')}
          </Typography>
          <Typography variant="headline">
            {flutterwavePaymentProvider?.name || translate('text_1749724395108m0swrna0zt4')}
          </Typography>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="quaternary"
            disabled={loading}
            onClick={() => {
              addFlutterwaveDialogRef.current?.openDialog({
                provider: flutterwavePaymentProvider,
                deleteModalRef: deleteDialogRef,
                deleteDialogCallback,
              })
            }}
          >
            {translate('text_65845f35d7d69c3ab4793dac')}
          </Button>
          <Button
            variant="quaternary"
            disabled={loading}
            onClick={() => {
              deleteDialogRef.current?.openDialog({
                provider: flutterwavePaymentProvider,
                callback: deleteDialogCallback,
              })
            }}
          >
            {translate('text_645d071272418a14c1c76a81')}
          </Button>
        </div>
      </div>

      <div className="mb-8 flex items-center gap-3 rounded-xl border border-solid border-grey-300 bg-grey-100 p-4">
        <Avatar variant="connector">
          <Flutterwave />
        </Avatar>
        <div>
          <Typography variant="caption" color="grey600">
            {translate('text_62b1edddbf5f461ab971276d')}
          </Typography>
          <Typography variant="body" color="grey700">
            {flutterwavePaymentProvider?.name}
          </Typography>
        </div>
        <div className="ml-auto">
          <Chip label={translate('text_62b1edddbf5f461ab97127ad')} />
        </div>
      </div>

      <div>
        <Tabs
          tabs={[
            {
              title: translate('text_62b1edddbf5f461ab971277f'),
              link: generatePath(INTEGRATIONS_ROUTE, {
                integrationGroup: IntegrationsTabsOptionsEnum.Community,
              }),
              component: (
                <div className="container">
                  {loading ? (
                    <>
                      {[0, 1, 2].map((i) => (
                        <div key={`item-skeleton-item-${i}`} className="flex h-18 items-center">
                          <Skeleton variant="connectorAvatar" size="big" className="mr-4" />
                          <Skeleton variant="text" />
                        </div>
                      ))}
                    </>
                  ) : (
                    <div>
                      <div className="mb-8">
                        <Typography variant="subhead" className="mb-4">
                          {translate('text_634ea0ecc6147de10ddb6625')}
                        </Typography>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Typography variant="caption" color="grey600">
                              {translate('text_6584550dc4cec7adf861504d')}
                            </Typography>
                            <Typography variant="body">
                              {flutterwavePaymentProvider?.name}
                            </Typography>
                          </div>
                          <div>
                            <Typography variant="caption" color="grey600">
                              {translate('text_6584550dc4cec7adf8615051')}
                            </Typography>
                            <Typography variant="body">
                              {flutterwavePaymentProvider?.code}
                            </Typography>
                          </div>
                          <div>
                            <Typography variant="caption" color="grey600">
                              {translate('text_1749725287668wpbctffw2gv')}
                            </Typography>
                            <Typography variant="body">
                              {flutterwavePaymentProvider?.publicKey ? '••••••••••••' : '-'}
                            </Typography>
                          </div>
                          <div>
                            <Typography variant="caption" color="grey600">
                              {translate('text_17497252876688ai900wowoc')}
                            </Typography>
                            <Typography variant="body">
                              {flutterwavePaymentProvider?.secretKey ? '••••••••••••' : '-'}
                            </Typography>
                          </div>
                          <div>
                            <Typography variant="caption" color="grey600">
                              {translate('text_17497253313741h3qgmvlmie')}
                            </Typography>
                            <Typography variant="body">
                              {flutterwavePaymentProvider?.encryptionKey ? '••••••••••••' : '-'}
                            </Typography>
                          </div>
                          <div>
                            <Typography variant="caption" color="grey600">
                              {translate('text_1749731835360j494r9wkd0k')}
                            </Typography>
                            <div className="flex items-center gap-2">
                              <Icon
                                name={
                                  flutterwavePaymentProvider?.production ? 'checkmark' : 'close'
                                }
                                color={flutterwavePaymentProvider?.production ? 'success' : 'error'}
                              />
                              <Typography variant="body">
                                {flutterwavePaymentProvider?.production
                                  ? translate('text_634ea0ecc6147de10ddb6631')
                                  : translate('text_634ea0ecc6147de10ddb6632')}
                              </Typography>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <AddFlutterwaveDialog ref={addFlutterwaveDialogRef} />
      <DeleteFlutterwaveIntegrationDialog ref={deleteDialogRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </div>
  )
}

export default FlutterwaveIntegrationDetails
