import {
  ActivationRuleTypeEnum,
  CreateSubscriptionInput,
  SubscriptionActivationRule,
} from '~/generated/graphql'
import { ActivationRuleFormEnum } from '~/pages/subscriptions/types'

export const deserializeActivationRules = (
  activationRules?: Pick<SubscriptionActivationRule, 'type' | 'timeoutHours'>[] | null,
): { activationRuleType: ActivationRuleFormEnum; activationRuleTimeoutHours: string } => {
  const paymentRule = activationRules?.find((r) => r.type === ActivationRuleTypeEnum.Payment)

  return {
    activationRuleType: paymentRule
      ? ActivationRuleFormEnum.OnPayment
      : ActivationRuleFormEnum.Immediately,
    activationRuleTimeoutHours: paymentRule?.timeoutHours?.toString() || '24',
  }
}

export const serializeActivationRules = (
  activationRuleType: ActivationRuleFormEnum,
  activationRuleTimeoutHours: string,
): CreateSubscriptionInput['activationRules'] => {
  // "Activate immediately" is the default BE behavior — no activation rule needed.
  // Only ActivationRuleTypeEnum.Payment exists in the GraphQL schema.
  if (activationRuleType !== ActivationRuleFormEnum.OnPayment) return undefined

  return [
    {
      type: ActivationRuleTypeEnum.Payment,
      timeoutHours: activationRuleTimeoutHours ? Number(activationRuleTimeoutHours) : undefined,
    },
  ]
}
