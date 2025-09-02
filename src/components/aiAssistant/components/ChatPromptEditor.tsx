import { FormikConfig, useFormik } from 'formik'
import { Icon, tw } from 'lago-design-system'
import { FC } from 'react'

import { TextInputField } from '~/components/form'
import { CreateAiConversationInput } from '~/generated/graphql'

interface ChatPromptEditorProps {
  onSubmit: FormikConfig<CreateAiConversationInput>['onSubmit']
}

export const ChatPromptEditor: FC<ChatPromptEditorProps> = ({ onSubmit: handleSubmit }) => {
  const formikProps = useFormik<CreateAiConversationInput>({
    initialValues: {
      inputData: '',
    },
    onSubmit: (values, props) => {
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

  return (
    <form
      className="relative flex w-full shrink-0 flex-col gap-4"
      onSubmit={formikProps.handleSubmit}
    >
      <div className="h-24 w-full" />
      <div className="absolute inset-x-0 bottom-0">
        <TextInputField
          onKeyDown={handleKeyDown}
          multiline
          rows={1.5}
          id="inputData"
          name="inputData"
          formikProps={formikProps}
          placeholder="What's next?"
          inputProps={{
            className: '!resize-none w-full !pr-9',
          }}
        />

        <button
          type="submit"
          className="absolute right-4 top-3 flex size-6 items-center justify-center"
          disabled={!formikProps.values.inputData}
        >
          <Icon
            name="arrow-right"
            className={tw(!formikProps.values.inputData ? 'text-grey-300' : 'text-grey-600')}
          />
        </button>
      </div>
    </form>
  )
}
