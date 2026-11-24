import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { Checkbox } from '~/components/form'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import {
  ALWAYS_SYNCED_OBJECT_KEYS,
  DEFAULT_QUICKBOOKS_FORM_VALUES,
  OPTIONAL_SYNCED_OBJECTS,
} from './quickbooksIntegrationForm'

export const QuickbooksSyncLabel = ({ objectKey }: { objectKey: string }) => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-row flex-wrap items-center gap-1">
      <Typography variant="body" color="grey700">
        {translate('text_17954342416897g8is3qrydn')}
      </Typography>
      <Chip size="small" label={translate(objectKey)} color="danger600" />
      <Typography variant="body" color="grey700">
        {translate('text_661ff6e56ef7e1b7c542b29e')}
      </Typography>
    </div>
  )
}

type QuickbooksIntegrationFormContentProps = {
  isEdition: boolean
}

const quickbooksIntegrationFormContentDefaultProps: QuickbooksIntegrationFormContentProps = {
  isEdition: false,
}

export const QuickbooksIntegrationFormContent = withForm({
  defaultValues: DEFAULT_QUICKBOOKS_FORM_VALUES,
  props: quickbooksIntegrationFormContentDefaultProps,
  render: function QuickbooksIntegrationFormContentRender({ form, isEdition }) {
    const { translate } = useInternationalization()

    return (
      <div className="flex flex-col gap-8 p-8">
        <NameAndCodeGroup
          form={form}
          fields={{ name: 'name', code: 'code' }}
          disableAutoGenerateCode={isEdition}
          nameProps={{
            label: translate('text_6419c64eace749372fc72b0f'),
            placeholder: translate('text_6584550dc4cec7adf861504f'),
          }}
          codeProps={{
            label: translate('text_62876e85e32e0300e1803127'),
            placeholder: translate('text_6584550dc4cec7adf8615053'),
          }}
        />

        <form.AppField name="sandbox">
          {(field) => (
            <field.SwitchField
              disabled={isEdition}
              label={translate('text_1795434241689f1hpeds18j4')}
              subLabel={translate('text_1795434241689jpvife1j8z1')}
            />
          )}
        </form.AppField>

        <div className="flex flex-col gap-6">
          <div>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_1795434241689erqzal40vl2')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_661ff6e56ef7e1b7c542b28e')}
            </Typography>
          </div>

          <div className="flex flex-col gap-4">
            {ALWAYS_SYNCED_OBJECT_KEYS.map((objectKey) => (
              <Checkbox
                key={objectKey}
                disabled
                label={<QuickbooksSyncLabel objectKey={objectKey} />}
                value={true}
              />
            ))}
            {OPTIONAL_SYNCED_OBJECTS.map(({ name, objectKey }) => (
              <form.AppField key={name} name={name}>
                {(field) => (
                  <field.CheckboxField label={<QuickbooksSyncLabel objectKey={objectKey} />} />
                )}
              </form.AppField>
            ))}
          </div>
        </div>
      </div>
    )
  },
})
