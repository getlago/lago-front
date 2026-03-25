import { Editor } from '@tiptap/react'

import { Button } from '~/components/designSystem/Button'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export const TOOLBAR_LINK_INPUT_TEST_ID = 'toolbar-link-input'
export const TOOLBAR_LINK_APPLY_BUTTON_TEST_ID = 'toolbar-link-apply-button'
export const TOOLBAR_LINK_REMOVE_BUTTON_TEST_ID = 'toolbar-link-remove-button'

type LinkPopperFormProps = {
  editor: Editor
  closePopper: () => void
}

const LinkPopperForm = ({ editor, closePopper }: LinkPopperFormProps) => {
  const { translate } = useInternationalization()

  const form = useAppForm({
    defaultValues: { url: '' },
    onSubmit: async ({ value }) => {
      if (value.url) {
        editor
          .chain()
          .focus()
          .setLink({ href: value.url.startsWith('http') ? value.url : `https://${value.url}` })
          .run()
      } else {
        editor.chain().focus().unsetLink().run()
      }
      form.reset()
      closePopper()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  const removeLink = () => {
    editor.chain().focus().unsetLink().run()
    form.reset()
    closePopper()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2 p-3">
        <form.AppField name="url">
          {(field) => (
            <field.TextInputField
              inputProps={{ 'data-test': TOOLBAR_LINK_INPUT_TEST_ID }}
              placeholder={translate('text_641b15e7ac746900b68377f9')}
              label={translate('text_641b15b0df87eb00848944ea')}
            />
          )}
        </form.AppField>
        <div className="flex gap-2">
          <form.AppForm>
            <form.SubmitButton dataTest={TOOLBAR_LINK_APPLY_BUTTON_TEST_ID}>
              {translate('text_1774434870566faserfupihr')}
            </form.SubmitButton>
          </form.AppForm>
          {editor.isActive('link') && (
            <Button
              data-test={TOOLBAR_LINK_REMOVE_BUTTON_TEST_ID}
              variant="secondary"
              onClick={removeLink}
            >
              {translate('text_1774434870566l5w8yp6q7zx')}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

export default LinkPopperForm
