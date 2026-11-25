import { generatePath } from 'react-router'

import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, QUICKBOOKS_INTEGRATION_ROUTE, useNavigate } from '~/core/router'

// Enough connections to know whether another one is left once the current one is deleted.
export const QUICKBOOKS_CONNECTION_COUNT_LIMIT = 2

// After a delete: back to the QuickBooks connections while another one is left, else to the
// integrations list.
export const useQuickbooksAfterDeleteRedirect = (connectionCount: number) => {
  const navigate = useNavigate()

  return () => {
    const route =
      connectionCount >= QUICKBOOKS_CONNECTION_COUNT_LIMIT
        ? QUICKBOOKS_INTEGRATION_ROUTE
        : INTEGRATIONS_ROUTE

    navigate(generatePath(route, { integrationGroup: IntegrationsTabsOptionsEnum.Lago }))
  }
}
