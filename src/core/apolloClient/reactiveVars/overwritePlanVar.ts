import { makeVar, useReactiveVar } from '@apollo/client'

import { CreateSubscriptionInput, StatusTypeEnum } from '~/generated/graphql'

import { getItemFromLS, setItemFromLS } from '../cacheUtils'

export const OVERWRITE_PLAN_LS_KEY = 'overwritePlan'

export type SubscriptionUpdateInfo = {
  subscriptionId?: string
  existingPlanId?: string
  periodEndDate?: string
  startDate?: string
  status: StatusTypeEnum
}

interface OverwritePlanVar {
  parentId?: string
  customerId?: string
  subscriptionInput?: Partial<CreateSubscriptionInput>
  updateInfo?: SubscriptionUpdateInfo
}

const initial = {
  parentId: undefined,
  subscriptionInput: undefined,
  customerId: undefined,
  updateInfo: undefined,
}

export const overwritePlanVar = makeVar<OverwritePlanVar>(
  getItemFromLS(OVERWRITE_PLAN_LS_KEY) || initial
)

export const updateOverwritePlanVar = (input: OverwritePlanVar) => {
  const previousInfos = overwritePlanVar()
  const updatedInfos = {
    ...previousInfos,
    ...input,
  }

  setItemFromLS(OVERWRITE_PLAN_LS_KEY, updatedInfos)
  overwritePlanVar(updatedInfos)
}

export const resetOverwritePlanVar = () => {
  setItemFromLS(OVERWRITE_PLAN_LS_KEY, initial)
  overwritePlanVar(initial)
}

export const useOverwritePlanVar = () => useReactiveVar(overwritePlanVar)
