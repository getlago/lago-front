import { FormikConfig, useFormik } from 'formik'
import { Icon, tw } from 'lago-design-system'
import { FC } from 'react'

import { TextInputField } from '~/components/form'
import { CreateAiConversationInput } from '~/generated/graphql'
import { useAiAgent } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface ChatPromptEditorProps {
  onSubmit: FormikConfig<CreateAiConversationInput>['onSubmit']
}

export const ChatPromptEditor: FC<ChatPromptEditorProps> = ({ onSubmit: handleSubmit }) => {
  const { state } = useAiAgent()
  const { translate } = useInternationalization()

  const formikProps = useFormik({
    initialValues: {
      message: '',
    },
    onSubmit: (values, props) => {
      if (state.isLoading || state.isStreaming) return

      handleSubmit(values, props)
      formikProps.resetForm()
    },
  })

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      formikProps.handleSubmit()
    }
  }

  const canSubmit = !!formikProps.values.message && !state.isLoading && !state.isStreaming

  return (
    <form
      className="relative m-4 mt-0 flex w-[calc(100%-16px*2)] shrink-0 flex-col gap-4"
      onSubmit={formikProps.handleSubmit}
    >
      {state.messages.length > 0 && (
        <div className="absolute -inset-x-0.5 bottom-full h-8 w-[calc(100%+16px)] bg-gradient-to-b from-[transparent] to-white pt-1" />
      )}
      <div className="h-24 w-full" />
      <div className="absolute inset-x-0 bottom-0">
        <TextInputField
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          onKeyDown={handleKeyDown}
          multiline
          rows={1.5}
          id="message"
          name="message"
          formikProps={formikProps}
          placeholder={translate('text_1757417225851xkstj2u16q5')}
          inputProps={{
            className: '!resize-none w-full !pr-9',
          }}
          disabled={state.isLoading || state.isStreaming}
        />

        <button
          type="submit"
          className="absolute right-4 top-3 flex size-6 items-center justify-center"
          disabled={!canSubmit}
        >
          <Icon name="arrow-right" className={tw(!canSubmit ? 'text-grey-300' : 'text-grey-600')} />
        </button>
      </div>
    </form>
  )
}
