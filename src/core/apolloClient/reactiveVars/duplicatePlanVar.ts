import { makeVar, useReactiveVar } from '@apollo/client'

import { CreateSubscriptionInput, StatusTypeEnum } from '~/generated/graphql'

import { getItemFromLS, setItemFromLS } from '../cacheUtils'

export const DUPLICATE_PLAN_LS_KEY = 'duplicatePlan'

export const PLAN_FORM_TYPE_ENUM = {
  creation: 'creation',
  edition: 'edition',
  override: 'override', //  TODO: remove this type
  duplicate: 'duplicate',
} as const

export type PLAN_FORM_TYPE = keyof typeof PLAN_FORM_TYPE_ENUM

export type SubscriptionUpdateInfo = {
  subscriptionId?: string
  subscriptionExternalId?: string
  existingPlanId?: string
  periodEndDate?: string
  startDate?: string
  endDate?: string
  status: StatusTypeEnum
}

type DuplicatePlanVar = {
  type: PLAN_FORM_TYPE
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

export const duplicatePlanVar = makeVar<DuplicatePlanVar>(
  getItemFromLS(DUPLICATE_PLAN_LS_KEY) || initial
)

export const updateDuplicatePlanVar = (input: DuplicatePlanVar) => {
  const previousInfos = duplicatePlanVar()
  const updatedInfos = {
    ...previousInfos,
    ...input,
  }

  setItemFromLS(DUPLICATE_PLAN_LS_KEY, updatedInfos)
  duplicatePlanVar(updatedInfos)
}

export const resetDuplicatePlanVar = () => {
  setItemFromLS(DUPLICATE_PLAN_LS_KEY, initial)
  duplicatePlanVar(initial)
}

export const useDuplicatePlanVar = () => useReactiveVar(duplicatePlanVar)
