import { useFilterContext } from '~/components/designSystem/Filters/context'
import { ComboBox } from '~/components/form'
import { WebhookStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../types'

type FiltersItemStatusProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemWebhookStatus = ({ value, setFilterValue }: FiltersItemStatusProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilterContext()

  return (
    <ComboBox
      PopperProps={{
        displayInDialog,
      }}
      disableClearable
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={[
        {
          label: translate('text_1746621029319goh9pr7g67d'),
          value: WebhookStatusEnum.Succeeded,
        },
        {
          label: translate('text_637656ef3d876b0269edc7a1'),
          value: WebhookStatusEnum.Failed,
        },
      ]}
      onChange={(status) => setFilterValue(status)}
      value={value}
    />
  )
}
