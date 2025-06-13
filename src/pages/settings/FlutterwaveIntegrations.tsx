import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { Button, Typography } from '~/components/designSystem'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import {
  AddFlutterwaveDialog,
  AddFlutterwaveDialogRef,
} from '~/components/settings/integrations/AddFlutterwaveDialog'
import {
  DeleteFlutterwaveIntegrationDialog,
  DeleteFlutterwaveIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteFlutterwaveIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import { ProviderTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Flutterwave from '~/public/images/flutterwave.svg'
import { MenuPopper, PageHeader, PopperOpener } from '~/styles'

gql`
  fragment FlutterwaveIntegrations on FlutterwaveProvider {
    id
    name
    code
  }

  query getFlutterwaveIntegrationsList($limit: Int, $type: ProviderTypeEnum) {
    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on FlutterwaveProvider {
          id
          ...FlutterwaveIntegrations
        }
      }
    }
  }

  ${AddFlutterwaveProviderDialogFragmentDoc}
  ${DeleteFlutterwaveIntegrationDialogFragmentDoc}
`

const FlutterwaveIntegrations = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const addDialogRef = useRef<AddFlutterwaveDialogRef>(null)
  const deleteDialogRef = useRef<DeleteFlutterwaveIntegrationDialogRef>(null)
  const { hasPermissions } = usePermissions()

  const { data, loading } = useGetFlutterwaveIntegrationsListQuery({
    variables: { limit: 1000, type: ProviderTypeEnum.Flutterwave },
  })
  const connections = data?.paymentProviders?.collection as FlutterwaveProvider[] | undefined
  const deleteDialogCallback = () => {
    refetch()
  }

  return (
    <IntegrationsPage
      title={translate('text_1749724395108m0swrna0zt4')}
      icon={<Flutterwave />}
      onClickBack={() =>
        navigate(
          generatePath(INTEGRATIONS_ROUTE, {
            integrationGroup: IntegrationsTabsOptionsEnum.Community,
          }),
        )
      }
    >
      <PageHeader $withSide>
        <div className="flex flex-col gap-1">
          <Typography variant="headline">{translate('text_1749724395108m0swrna0zt4')}</Typography>
          <Typography>{translate('text_1749725287667detsc3i7jv5')}</Typography>
        </div>
        <div className="flex">
          <Button
            variant="primary"
            disabled={!hasPermissions(['organizationIntegrationsUpdate'])}
            onClick={() => addDialogRef.current?.openDialog()}
          >
            {translate('text_1749725331374clf07sez01f')}
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col items-center justify-center p-12">
        {loading ? (
          <Skeleton variant="text" height={12} width={240} />
        ) : (
          <>
            <Typography variant="subhead" className="mb-4">
              {connections?.length
                ? translate('text_integration_connected')
                : translate('text_1749725331374vcsmw7mp5gt')}
            </Typography>
            <Typography color="grey600" className="text-center max-w-md">
              {translate('text_174972533137460li1pvmw34')}
            </Typography>
          </>
        )}
      </div>

      <AddFlutterwaveDialog ref={addDialogRef} />
      <DeleteFlutterwaveIntegrationDialog ref={deleteDialogRef} />
    </IntegrationsPage>
  )
}

export default FlutterwaveIntegrations
