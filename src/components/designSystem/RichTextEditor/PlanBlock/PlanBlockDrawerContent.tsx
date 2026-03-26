import { usePlansQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { planBlockDefaultValues } from './const'

const PlanBlockDrawerContent = withForm({
  defaultValues: planBlockDefaultValues,
  render: function Render({ form }) {
    const { translate } = useInternationalization()

    const { data, loading } = usePlansQuery({
      variables: { limit: 100 },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    })

    const comboBoxData = (data?.plans?.collection ?? []).map((plan) => ({
      value: plan.id,
      label: `${plan.name} (${plan.code})`,
    }))

    return (
      <form.AppField name="planId">
        {(field) => (
          <field.ComboBoxField
            data={comboBoxData}
            loading={loading}
            label={translate('text_63d3a658c6d84a5843032145')}
            placeholder={translate('text_63d3a658c6d84a5843032147')}
          />
        )}
      </form.AppField>
    )
  },
})

export default PlanBlockDrawerContent
