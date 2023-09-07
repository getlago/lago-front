import { makeVar, useReactiveVar } from '@apollo/client'

import { CreateSubscriptionInput, StatusTypeEnum } from '~/generated/graphql'

import { getItemFromLS, setItemFromLS } from '../cacheUtils'

export const OVERWRITE_PLAN_LS_KEY = 'overwritePlan'

export enum PLAN_FORM_TYPE_ENUM {
  creation = 'creation',
  edition = 'edition',
  override = 'override',
  duplicate = 'duplicate',
}

export type SubscriptionUpdateInfo = {
  subscriptionId?: string
  subscriptionExternalId?: string
  existingPlanId?: string
  periodEndDate?: string
  startDate?: string
  status: StatusTypeEnum
}

type OverwritePlanVar = {
  type: keyof typeof PLAN_FORM_TYPE_ENUM
  parentId?: string
  customerId?: string
  subscriptionInput?: Partial<CreateSubscriptionInput>
  updateInfo?: SubscriptionUpdateInfo
}

const initial = {
  type: PLAN_FORM_TYPE_ENUM.creation,
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
