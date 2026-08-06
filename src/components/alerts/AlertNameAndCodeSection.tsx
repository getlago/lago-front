import { Typography } from '~/components/designSystem/Typography'
import { formatCodeFromName } from '~/core/utils/formatCodeFromName'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'

export const ALERT_NAME_AND_CODE_GROUP_DEFAULT_VALUES = {
  name: '',
  code: '',
}

type AlertNameAndCodeSectionProps = {
  /** The name label differs per alert form, so it comes in already translated. */
  nameLabel: string
  /** True when the edited alert already has a code: it is never overwritten. */
  hasExistingCode: boolean
}

/**
 * The "alert name and code" section shared by the wallet and subscription
 * alert forms: same layout, same code placeholder, same name→code derivation.
 */
export const AlertNameAndCodeSection = withFieldGroup({
  defaultValues: ALERT_NAME_AND_CODE_GROUP_DEFAULT_VALUES,
  props: {
    nameLabel: '',
    hasExistingCode: false,
  } as AlertNameAndCodeSectionProps,
  render: function AlertNameAndCodeSectionRender({ group, nameLabel, hasExistingCode }) {
    const { translate } = useInternationalization()

    // The code is derived from the name until the user takes ownership of it,
    // and never on an alert that already had one (`updateNameAndMaybeCode` parity)
    const onNameChange = ({ value }: { value: string }) => {
      if (group.getFieldMeta('code')?.isBlurred || hasExistingCode) return

      group.setFieldValue('code', formatCodeFromName(value))
    }

    return (
      <section className="pb-12 shadow-b not-last-child:mb-6">
        <div className="not-last-child:mb-2">
          <Typography variant="subhead1">{translate('text_1746629929876zz4937djyc8')}</Typography>
          <Typography variant="caption">{translate('text_1746629929876gdgxt1v86eq')}</Typography>
        </div>
        <div className="flex gap-6 *:flex-1">
          <group.AppField name="name" listeners={{ onChange: onNameChange }}>
            {(field) => (
              <field.TextInputField
                label={nameLabel}
                placeholder={translate('text_62876e85e32e0300e1803121')}
              />
            )}
          </group.AppField>
          <group.AppField name="code">
            {(field) => (
              <field.TextInputField
                label={translate('text_62876e85e32e0300e1803127')}
                placeholder={translate('text_623b42ff8ee4e000ba87d0c4')}
              />
            )}
          </group.AppField>
        </div>
      </section>
    )
  },
})
