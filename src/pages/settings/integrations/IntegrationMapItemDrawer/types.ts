import type { ReactNode } from 'react'

import type { BillingEntityForIntegrationMapping } from '~/pages/settings/integrations/common/types'

export type IntegrationMapItemDrawerContentProps = {
  title: string
  description: string
  billingEntities: Array<BillingEntityForIntegrationMapping>
  renderForm: (billingEntityKey: string) => ReactNode
}
