import { TextInputProps } from '~/components/form/TextInput/TextInput'
import { formatCodeFromName } from '~/core/utils/formatCodeFromName'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'

export type NameAndCodeGroupValues = {
  code: string
  name: string
}

export type NameAndCodeGroupProps = {
  isDisabled?: boolean
  nameProps?: Partial<TextInputProps>
  codeProps?: Partial<TextInputProps>
}

const defaultValues: NameAndCodeGroupValues = {
  code: '',
  name: '',
}

const defaultProps: NameAndCodeGroupProps = {
  isDisabled: false,
}

const NameAndCodeGroup = withFieldGroup({
  defaultValues,
  props: defaultProps,
  render: function Render({ group, isDisabled, nameProps, codeProps }) {
    const { translate } = useInternationalization()

    const handleNameChange = ({ value }: { value: string }) => {
      const isCodeBlurred = group.getFieldMeta('code')?.isBlurred

      // isDisabled mean we don't want to update the value. Be it directly or indirectly.
      if (isCodeBlurred || isDisabled) return

      group.setFieldValue('code', formatCodeFromName(value))
    }

    return (
      <div className="grid grid-cols-2 gap-6">
        <group.AppField name="name" listeners={{ onChange: handleNameChange }}>
          {(field) => (
            <field.TextInputField
              label={translate('text_629728388c4d2300e2d38091')}
              placeholder={translate('text_629728388c4d2300e2d380a5')}
              {...nameProps}
            />
          )}
        </group.AppField>
        <group.AppField name="code">
          {(field) => (
            <field.TextInputField
              label={translate('text_629728388c4d2300e2d380b7')}
              beforeChangeFormatter="code"
              placeholder={translate('text_629728388c4d2300e2d380d9')}
              disabled={isDisabled}
              {...codeProps}
            />
          )}
        </group.AppField>
      </div>
    )
  },
})

export default NameAndCodeGroup
