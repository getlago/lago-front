import { BasicComboBoxData } from '~/components/form'
import { stringifyOptionValue } from '~/pages/settings/integrations/XeroIntegrationMapItemDrawer/stringifyOptionValue'

type QuickbooksOptionSource = {
  externalId: string
  externalName?: string | null
}

// QuickBooks items and accounts synced by Nango carry no account code, unlike Xero's.
export const toQuickbooksOption = ({
  externalId,
  externalName,
}: QuickbooksOptionSource): BasicComboBoxData => ({
  label: externalName || externalId,
  description: externalId,
  value: stringifyOptionValue({
    externalId,
    externalName: externalName || '',
    externalAccountCode: '',
  }),
})
