import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

export type CascadeUpdatesFieldDefaultValues = {
  cascadeUpdates: boolean
}

export const cascadeUpdatesFieldDefaultValues: CascadeUpdatesFieldDefaultValues = {
  cascadeUpdates: true,
}

export const CascadeUpdatesField = withForm({
  defaultValues: cascadeUpdatesFieldDefaultValues,
  render: function Render({ form }) {
    const { translate } = useInternationalization()

    return (
      <form.AppField name="cascadeUpdates">
        {(field) => (
          <field.SwitchField
            label={translate('text_1779289915866s3gisblcite')}
            subLabel={translate('text_1779289915866itrqeyj7658')}
          />
        )}
      </form.AppField>
    )
  },
})
