import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { Button, Typography } from '~/components/designSystem'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import {
  AddFlutterwaveDialog,
  AddFlutterwaveDialogRef,
} from '~/components/settings/integrations/AddFlutterwaveDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Flutterwave from '~/public/images/flutterwave.svg'
import { PageHeader } from '~/styles'

const FlutterwaveIntegrations = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const addDialogRef = useRef<AddFlutterwaveDialogRef>(null)

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
            onClick={() => addDialogRef.current?.openDialog()}
          >
            {translate('text_1749725331374clf07sez01f')}
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col items-center justify-center p-12">
        <Typography variant="subhead" className="mb-4">
          {translate('text_1749725331374vcsmw7mp5gt')}
        </Typography>
        <Typography color="grey600" className="text-center max-w-md">
          {translate('text_174972533137460li1pvmw34')}
        </Typography>
      </div>

      <AddFlutterwaveDialog ref={addDialogRef} />
    </IntegrationsPage>
  )
}

export default FlutterwaveIntegrations
