import { Icon, tw } from 'lago-design-system'
import { FormEvent, useState } from 'react'

import { useAskFinanceAssistant } from '~/components/aiAgent/hooks/useAskFinanceAssistant'
import { AiBadge } from '~/components/designSystem/AiBadge'
import { Typography } from '~/components/designSystem/Typography'
import { FeatureFlags, isFeatureFlagActive } from '~/core/utils/featureFlags'
import { AiAgentTypeEnum, useAiAgent } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

export const FINANCE_ASSISTANT_CTA_TEST_ID = 'finance-assistant-cta'
export const FINANCE_ASSISTANT_CTA_INPUT_TEST_ID = 'finance-assistant-cta-input'
export const FINANCE_ASSISTANT_CTA_SUBMIT_BUTTON_TEST_ID = 'finance-assistant-cta-submit-button'

export const FinanceAssistantAnalyticsCta = () => {
  const { openPanelWithAgent, state } = useAiAgent()
  const { submitFinanceQuestion } = useAskFinanceAssistant()
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const [question, setQuestion] = useState('')
  const [isVisible, setIsVisible] = useState(true)

  const hasAccessToAiAgent =
    isFeatureFlagActive(FeatureFlags.AI_FINANCE_ASSISTANT) &&
    isPremium &&
    hasPermissions(['aiConversationsView', 'aiConversationsCreate'])

  if (!hasAccessToAiAgent) {
    return null
  }

  const canSubmit = !!question.trim() && !state.isLoading

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSubmit) return

    openPanelWithAgent(AiAgentTypeEnum.finance)
    submitFinanceQuestion(question.trim())
    setQuestion('')
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="sticky bottom-6 z-10 mx-auto mt-[-24px] flex w-full max-w-[500px] justify-center">
      {/* The page-level wrapper is pointer-events-none (full-width overlay strip); only the visible card may catch clicks */}
      <form
        onSubmit={handleSubmit}
        className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl bg-white px-7 py-6 shadow-xl"
        data-test={FINANCE_ASSISTANT_CTA_TEST_ID}
      >
        <AiBadge className="shrink-0" iconSize={16}>
          <Typography variant="captionHl" color="infoMain">
            {translate('text_17805629795197990fik8a0f')}
          </Typography>
        </AiBadge>

        <input
          className="bg-transparent min-w-0 flex-1 border-none text-sm text-grey-700 outline-none placeholder:text-grey-500"
          placeholder={translate('text_17805629795209jls35q0dyn')}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          data-test={FINANCE_ASSISTANT_CTA_INPUT_TEST_ID}
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="shrink-0"
          data-test={FINANCE_ASSISTANT_CTA_SUBMIT_BUTTON_TEST_ID}
        >
          <Icon
            name="arrow-indent"
            className={tw('-scale-x-100', canSubmit ? 'text-grey-600' : 'text-grey-400')}
            size="medium"
          />
        </button>
      </form>
    </div>
  )
}
