import { generatePath } from 'react-router'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import AgentStorefront from '~/public/images/agentic-storefront.svg'

const AgentStorefrontIntegrations = (): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <MainHeader.Configure
      breadcrumb={[
        {
          label: translate('text_62b1edddbf5f461ab9712750'),
          path: generatePath(INTEGRATIONS_ROUTE, {
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        },
      ]}
      entity={{
        viewName: translate('text_1795083825203aqsrrdi5tii'),
        metadata: translate('text_1795083825204u0cvlpt2mav'),
        icon: <AgentStorefront />,
      }}
    />
  )
}

export default AgentStorefrontIntegrations
