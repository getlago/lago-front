import type { AnyFormApi } from '@tanstack/react-form'
import type { ReactNode } from 'react'

import type { BillingEntityForIntegrationMapping } from '~/pages/settings/integrations/common/types'

export type IntegrationMapItemDrawerContentProps = {
  title: string
  description: string
  billingEntities: Array<BillingEntityForIntegrationMapping>
  form: AnyFormApi
  formId: string
  renderForm: (billingEntityKey: string) => ReactNode
}
