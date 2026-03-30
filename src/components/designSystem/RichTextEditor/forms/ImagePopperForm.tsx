import { revalidateLogic } from '@tanstack/react-form'
import { Editor } from '@tiptap/react'
import { z } from 'zod'

import { serializeUrl } from '~/core/serializers/serializeUrl'
import { zodOptionalUrl } from '~/formValidation/zodCustoms'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export const TOOLBAR_IMAGE_INPUT_TEST_ID = 'toolbar-image-input'
export const TOOLBAR_IMAGE_INSERT_BUTTON_TEST_ID = 'toolbar-image-insert-button'

type ImagePopperFormProps = {
  editor: Editor
  closePopper: () => void
}

const ImagePopperForm = ({ editor, closePopper }: ImagePopperFormProps) => {
  const { translate } = useInternationalization()

  const schemaValidation = z.object({
    url: zodOptionalUrl,
  })

  const form = useAppForm({
    defaultValues: { url: '' },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schemaValidation,
    },
    onSubmit: async ({ value, formApi }) => {
      if (!value.url) {
        return
      }
      const serializedUrl = serializeUrl(value.url)

      if (!serializedUrl) {
        formApi.setErrorMap({
          onDynamic: {
            fields: {
              url: {
                message: 'text_1764239804026ca61hwr3pp9',
                path: ['url'],
              },
            },
          },
        })
        return
      }

      editor.chain().focus().setImage({ src: serializedUrl }).run()

      form.reset()
      closePopper()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2 p-3">
        <form.AppField name="url">
          {(field) => (
            <field.TextInputField
              inputProps={{ 'data-test': TOOLBAR_IMAGE_INPUT_TEST_ID }}
              placeholder={translate('text_17744355868512phwom4fz1i')}
              label={translate('text_1774435622012yosb9iv7b29')}
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton dataTest={TOOLBAR_IMAGE_INSERT_BUTTON_TEST_ID}>
            {translate('text_1774434870566u3tjbykw5hp')}
          </form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  )
}

export default ImagePopperForm
