import { TextInputProps } from '~/components/form/TextInput/TextInput'
import { EXISTING_CODE_ERROR_MESSAGE } from '~/core/form/existingCodeError'
import { formatCodeFromName } from '~/core/utils/formatCodeFromName'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'

type NameAndCodeGroupValues = {
  code: string
  name: string
}

type NameAndCodeGroupProps = {
  disableCodeInput?: boolean
  disableAutoGenerateCode?: boolean
  nameProps?: Partial<TextInputProps>
  codeProps?: Partial<TextInputProps>
}

const defaultValues: NameAndCodeGroupValues = {
  code: '',
  name: '',
}

const defaultProps: NameAndCodeGroupProps = {
  disableCodeInput: false,
  disableAutoGenerateCode: false,
}

const NameAndCodeGroup = withFieldGroup({
  defaultValues,
  props: defaultProps,
  render: function Render({
    group,
    disableCodeInput,
    disableAutoGenerateCode,
    nameProps,
    codeProps,
  }) {
    const { translate } = useInternationalization()

    const handleNameChange = ({ value }: { value: string }) => {
      const isCodeBlurred = group.getFieldMeta('code')?.isBlurred

      if (isCodeBlurred || disableCodeInput || disableAutoGenerateCode) return

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
        <group.AppField
          name="code"
          listeners={{
            // Clear the server "code already exists" error once the user edits
            // the code so the submit button re-enables. Gated by the message so
            // the zod required-check isn't wiped.
            onChange: () => {
              const meta = group.getFieldMeta('code')

              if (meta?.errorMap?.onDynamic?.message === EXISTING_CODE_ERROR_MESSAGE) {
                group.setFieldMeta('code', (current) => ({
                  ...current,
                  errorMap: { ...current.errorMap, onDynamic: undefined },
                }))
              }
            },
          }}
        >
          {(field) => (
            <field.TextInputField
              label={translate('text_629728388c4d2300e2d380b7')}
              beforeChangeFormatter="code"
              placeholder={translate('text_629728388c4d2300e2d380d9')}
              disabled={disableCodeInput}
              {...codeProps}
            />
          )}
        </group.AppField>
      </div>
    )
  },
})

export default NameAndCodeGroup
