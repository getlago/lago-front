import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath } from 'react-router-dom'

import { Button, ButtonLink, Skeleton, Typography } from '~/components/designSystem'
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
import {
  DeleteFlutterwaveIntegrationDialogFragmentDoc,
  ProviderTypeEnum,
  useGetFlutterwaveIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Flutterwave from '~/public/images/flutterwave.svg'
import { PageHeader } from '~/styles'

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
          ...DeleteFlutterwaveIntegrationDialog
        }
      }
    }
  }

  ${DeleteFlutterwaveIntegrationDialogFragmentDoc}
`

const FlutterwaveIntegrations = () => {
  const { translate } = useInternationalization()
  const addDialogRef = useRef<AddFlutterwaveDialogRef>(null)
  const deleteDialogRef = useRef<DeleteFlutterwaveIntegrationDialogRef>(null)
  const { hasPermissions } = usePermissions()

  const { loading } = useGetFlutterwaveIntegrationsListQuery({
    variables: { limit: 1000, type: ProviderTypeEnum.Flutterwave },
  })

  const canCreateIntegration = hasPermissions(['organizationIntegrationsCreate'])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <ButtonLink
            to={generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Community,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-grey-100">
              <Flutterwave />
            </div>
            <div>
              <Typography variant="headline">
                {translate('text_1749724395108m0swrna0zt4')}
              </Typography>
              <Typography>{translate('text_17498039535197vam0ybv9qz')}</Typography>
            </div>
          </div>
        </PageHeader.Group>
        <PageHeader.Group>
          <Button
            variant="primary"
            disabled={!canCreateIntegration}
            onClick={() => addDialogRef.current?.openDialog()}
          >
            {translate('text_1749725331374clf07sez01f')}
          </Button>
        </PageHeader.Group>
      </PageHeader.Wrapper>

      <div className="container">
        <div className="flex flex-col items-center justify-center p-12">
          {loading ? (
            <Skeleton variant="text" />
          ) : (
            <>
              <Typography variant="subhead" className="mb-4">
                {translate('text_1749725331374vcsmw7mp5gt')}
              </Typography>
              <Typography color="grey600" className="max-w-md text-center">
                {translate('text_174972533137460li1pvmw34')}
              </Typography>
            </>
          )}
        </div>
      </div>

      <AddFlutterwaveDialog ref={addDialogRef} />
      <DeleteFlutterwaveIntegrationDialog ref={deleteDialogRef} />
    </>
  )
}

export default FlutterwaveIntegrations
