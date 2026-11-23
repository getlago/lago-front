import { BasicComboBoxData } from '~/components/form'

import { stringifyOptionValue } from './stringifyOptionValue'

type XeroOptionSource = {
  externalId: string
  externalName?: string | null
  externalAccountCode?: string | null
}

export const toXeroOption = ({
  externalId,
  externalName,
  externalAccountCode,
}: XeroOptionSource): BasicComboBoxData => ({
  label: `${externalName} (${externalAccountCode})`,
  description: externalId,
  value: stringifyOptionValue({
    externalId,
    externalName: externalName || '',
    externalAccountCode: externalAccountCode || '',
  }),
})
