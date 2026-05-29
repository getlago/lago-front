import {
  ActivationRuleFormTypeEnum,
  DEFAULT_PAYMENT_ACTIVATION_RULE_TIMEOUT_HOURS,
} from '~/core/constants/subscriptionActivationRules'
import {
  ActivationRuleTypeEnum,
  Maybe,
  SubscriptionActivationRule,
  SubscriptionActivationRuleInput,
} from '~/generated/graphql'

type ActivationRuleFormValues = {
  activationRuleType?: ActivationRuleFormTypeEnum
  activationRuleTimeoutHours?: string | number | null
}

type ActivationRuleSource = Maybe<Array<Pick<SubscriptionActivationRule, 'type' | 'timeoutHours'>>>

export const serializeActivationRules = ({
  activationRuleType,
  activationRuleTimeoutHours,
}: ActivationRuleFormValues): SubscriptionActivationRuleInput[] => {
  if (activationRuleType !== ActivationRuleFormTypeEnum.OnPayment) return []

  const timeoutHours = Number(
    activationRuleTimeoutHours ?? DEFAULT_PAYMENT_ACTIVATION_RULE_TIMEOUT_HOURS,
  )

  return [
    {
      type: ActivationRuleTypeEnum.Payment,
      timeoutHours: Number.isFinite(timeoutHours)
        ? timeoutHours
        : Number(DEFAULT_PAYMENT_ACTIVATION_RULE_TIMEOUT_HOURS),
    },
  ]
}

export const deserializeActivationRules = (activationRules?: ActivationRuleSource) => {
  const paymentActivationRule = activationRules?.find(
    (activationRule) => activationRule.type === ActivationRuleTypeEnum.Payment,
  )

  if (!paymentActivationRule) {
    return {
      activationRuleType: ActivationRuleFormTypeEnum.Immediately,
      activationRuleTimeoutHours: DEFAULT_PAYMENT_ACTIVATION_RULE_TIMEOUT_HOURS,
    }
  }

  return {
    activationRuleType: ActivationRuleFormTypeEnum.OnPayment,
    activationRuleTimeoutHours: String(
      paymentActivationRule.timeoutHours ?? DEFAULT_PAYMENT_ACTIVATION_RULE_TIMEOUT_HOURS,
    ),
  }
}
