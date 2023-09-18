import { makeVar, useReactiveVar } from '@apollo/client'

import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { StatusTypeEnum } from '~/generated/graphql'

import { getItemFromLS, setItemFromLS } from '../cacheUtils'

export const DUPLICATE_PLAN_LS_KEY = 'duplicatePlan'

export type PLAN_FORM_TYPE = keyof typeof FORM_TYPE_ENUM

export type SubscriptionUpdateInfo = {
  subscriptionId?: string
  subscriptionExternalId?: string
  periodEndDate?: string
  startDate?: string
  endDate?: string
  status?: StatusTypeEnum | null
}

type DuplicatePlanVar = {
  type: PLAN_FORM_TYPE
  parentId?: string
  updateInfo?: SubscriptionUpdateInfo
}

const initial = {
  type: FORM_TYPE_ENUM.creation,
  parentId: undefined,
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
