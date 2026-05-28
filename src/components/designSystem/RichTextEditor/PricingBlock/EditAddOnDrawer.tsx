import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

export const editAddOnDrawerDefaultValues = {
  name: '',
  description: '',
  fromDatetime: '',
  toDatetime: '',
}

const EditAddOnDrawer = withForm({
  defaultValues: editAddOnDrawerDefaultValues,
  render: function EditAddOnDrawer({ form }) {
    const { translate } = useInternationalization()

    return (
      <div className="flex flex-col gap-6">
        <form.AppField name="name">
          {(field) => (
            <field.TextInputField
              label={translate('text_17799807173225rg0day57r6')}
              placeholder={translate('text_17799807173225rg0day57r6')}
            />
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => (
            <field.TextInputField
              label={translate('text_1779980717322yv9i0606bn2')}
              placeholder={translate('text_1779980717322yv9i0606bn2')}
              rows={3}
            />
          )}
        </form.AppField>

        <form.AppField name="fromDatetime">
          {(field) => (
            <field.DatePickerField
              label={translate('text_1779980717322k58g8b65e2i')}
              placement="auto"
            />
          )}
        </form.AppField>

        <form.AppField name="toDatetime">
          {(field) => (
            <field.DatePickerField
              label={translate('text_1779980717322igk4qqvn301')}
              placement="auto"
            />
          )}
        </form.AppField>
      </div>
    )
  },
})

export default EditAddOnDrawer
