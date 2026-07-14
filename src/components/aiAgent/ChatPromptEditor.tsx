import { FormikConfig, useFormik } from 'formik'
import { Icon, tw } from 'lago-design-system'
import { FC } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { TextInputField } from '~/components/form'
import { CreateAiConversationInput } from '~/generated/graphql'
import { AGENT_TYPE_LABELS, AiAgentTypeEnum, useAiAgent } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'

interface ChatPromptEditorProps {
  disabled?: boolean
  onSubmit: FormikConfig<CreateAiConversationInput>['onSubmit']
}

export const ChatPromptEditor: FC<ChatPromptEditorProps> = ({
  disabled,
  onSubmit: handleSubmit,
}) => {
  const { agentType, setAgentType, state } = useAiAgent()
  const { translate } = useInternationalization()

  const formikProps = useFormik({
    initialValues: {
      message: '',
    },
    onSubmit: (values, props) => {
      if (!values.message || state.isLoading || state.isStreaming) return

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

  const isWaitingForResponse = state.isLoading || state.isStreaming
  const canSubmit = !!formikProps.values.message && !isWaitingForResponse && !disabled

  const agentOptions = Object.values(AiAgentTypeEnum).map((value) => ({
    value,
    label: translate(AGENT_TYPE_LABELS[value]),
  }))
  const selectedAgentLabel = agentOptions.find((option) => option.value === agentType)?.label

  return (
    <form
      className="relative mx-6 mb-6 mt-0 flex w-[calc(100%-16px*3)] shrink-0 flex-col gap-4"
      onSubmit={formikProps.handleSubmit}
    >
      <div className="pointer-events-none absolute bottom-full h-16 w-full bg-[linear-gradient(180deg,rgba(243,244,246,0)_0%,#F3F4F6_100%)] pt-1" />

      <div className="h-30 w-full" />
      <div className="absolute inset-x-0 bottom-0">
        <TextInputField
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          className="rounded-xl bg-white"
          onKeyDown={handleKeyDown}
          multiline
          id="message"
          name="message"
          formikProps={formikProps}
          placeholder={translate('text_1757417225851xkstj2u16q5')}
          InputProps={{
            // Bottom padding on the non-scrolling root reserves the agent selector + submit row,
            // so scrolled text clips above it instead of sliding underneath (120px → 428px total)
            className: '!px-0 !pb-13 !pt-3',
          }}
          inputProps={{
            className:
              '!resize-none w-full !px-4 !py-0 !min-h-14 !max-h-[364px] !overflow-y-auto text-sm',
          }}
          disabled={isWaitingForResponse || disabled}
        />

        <div className="absolute bottom-3 right-4 flex items-center gap-2">
          <Popper
            PopperProps={{
              placement: 'top-end',
              modifiers: [
                {
                  name: 'offset',
                  enabled: true,
                  options: {
                    offset: [0, 8],
                  },
                },
              ],
            }}
            opener={
              <div className="px-3">
                <Button
                  className="disabled:!bg-transparent !text-grey-600 disabled:!text-grey-400"
                  variant="inline"
                  endIcon="chevron-down"
                  endIconSize="small"
                  size="small"
                  disabled={isWaitingForResponse}
                >
                  <Typography variant="caption" color="grey600">
                    {selectedAgentLabel}
                  </Typography>
                </Button>
              </div>
            }
          >
            {({ closePopper }) => (
              <MenuPopper className="w-50">
                {agentOptions.map((option) => (
                  <Button
                    align="left"
                    key={option.value}
                    variant={agentType === option.value ? 'secondary' : 'quaternary'}
                    onClick={() => {
                      setAgentType(option.value)
                      closePopper()
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </MenuPopper>
            )}
          </Popper>

          <button
            type="submit"
            className={tw(
              'flex size-8 items-center justify-center rounded-lg bg-grey-100',
              canSubmit && 'bg-blue-600',
            )}
            disabled={!canSubmit}
          >
            <Icon
              name="arrow-right"
              className={tw('-rotate-90', !canSubmit ? 'text-grey-400' : 'text-white')}
            />
          </button>
        </div>
      </div>
    </form>
  )
}
