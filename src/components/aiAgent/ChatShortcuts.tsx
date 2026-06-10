import { Button } from '~/components/designSystem/Button'
import { CreateAiConversationInput } from '~/generated/graphql'
import { AiAgentTypeEnum } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const billingShortcuts = [
  {
    id: 'revenue-insights',
    label: 'text_1757425256010tqrmn1nv7hv',
    value: 'text_1757425256010w5kf0uv78o0',
  },
  {
    id: 'promotions-adjustments',
    label: 'text_1757425256010vk3j5uvsv8j',
    value: 'text_17574252560106dd3b4zgpor',
  },
  {
    id: 'customer-management',
    label: 'text_1757425256010rkgdjdrjk6m',
    value: 'text_1757425256010xzjeae40r11',
  },
  {
    id: 'pricing-packages',
    label: 'text_1757425256010ibchc292e3s',
    value: 'text_1757425256010x3su3naky6p',
  },
  {
    id: 'billing-collections',
    label: 'text_1757425256010zsl6bjv4hyi',
    value: 'text_175742525601015r0mf0b8a4',
  },
  {
    id: 'subscriptions-usage',
    label: 'text_1757425256010fv461mpya3w',
    value: 'text_1757425256010h97y71qmabf',
  },
]

const financeShortcuts = [
  {
    id: 'monthly-account-receivables',
    label: 'text_1780562979519l80fg3hw8vr',
    value: 'text_178056297951921ab6s78tyd',
  },
  {
    id: 'failed-payments',
    label: 'text_1780562979519tql0u8vj8jc',
    value: 'text_1780562979519w1jzin2neht',
  },
  {
    id: 'mrr-insights',
    label: 'text_17805629795193l9jdves1do',
    value: 'text_1780562979520xo965xzoajx',
  },
  {
    id: 'revenue-streams',
    label: 'text_178056297951987g2jljb0u1',
    value: 'text_1780562979520b8worhtqufx',
  },
  {
    id: 'overdue-invoices',
    label: 'text_17805629795190zq3i9f9fzz',
    value: 'text_1780562979520jx3625rmwtf',
  },
  {
    id: 'daily-usages-by-product',
    label: 'text_1780562979519etwltnpuka9',
    value: 'text_17805629795204i5o89ggf48',
  },
]

export const ChatShortcuts = ({
  agentType,
  onSubmit,
}: {
  agentType: AiAgentTypeEnum
  onSubmit: (values: CreateAiConversationInput) => void
}) => {
  const { translate } = useInternationalization()
  const shortcuts = agentType === AiAgentTypeEnum.finance ? financeShortcuts : billingShortcuts

  return (
    <div className="flex flex-wrap gap-2">
      {shortcuts.map((shortcut) => (
        <Button
          className="bg-white"
          key={shortcut.id}
          variant="tertiary"
          size="small"
          onClick={() => onSubmit({ message: translate(shortcut.value) })}
        >
          {translate(shortcut.label)}
        </Button>
      ))}
    </div>
  )
}
