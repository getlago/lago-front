import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { LagoApiError, UpdatePlanMutation, useUpdatePlanMutation } from '~/generated/graphql'

type UpdatePlanResult = NonNullable<UpdatePlanMutation['updatePlan']>

type UsePlanUpdateOptions = {
  onSuccess?: (updatePlan: UpdatePlanResult) => void
}

export const usePlanUpdate = ({ onSuccess }: UsePlanUpdateOptions = {}) => {
  const [update, { error }] = useUpdatePlanMutation({
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity, LagoApiError.PlanSoldByAgentStorefront],
    },
    onCompleted({ updatePlan }) {
      if (updatePlan) {
        addToast({ severity: 'success', translateKey: 'text_625fd165963a7b00c8f598a0' })
        onSuccess?.(updatePlan)
      }
    },
  })

  const updateWithSoldPlanGuard: typeof update = async (options) => {
    const result = await update(options)

    if (hasDefinedGQLError('PlanSoldByAgentStorefront', result.errors)) {
      addToast({ severity: 'danger', translateKey: 'text_1795096449974kc0hhrdmonw' })
    }

    return result
  }

  return { update: updateWithSoldPlanGuard, error }
}
