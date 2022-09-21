import { useMemo, useState } from 'react'
import { gql } from '@apollo/client'
import { useParams, useNavigate, generatePath } from 'react-router-dom'
import _omit from 'lodash/omit'

import { PlanFormInput } from '~/components/plans/types'
import {
  EditPlanFragment,
  VolumeRangesFragmentDoc,
  DeletePlanDialogFragmentDoc,
  PlanItemFragmentDoc,
  useGetSinglePlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  Lago_Api_Error,
} from '~/generated/graphql'
import {
  useOverwritePlanVar,
  addToast,
  updateOverwritePlanVar,
  LagoGQLError,
} from '~/core/apolloClient'
import { ERROR_404_ROUTE, PLANS_ROUTE, CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { serializePlanInput } from '~/core/serializers'

export enum FORM_ERRORS_ENUM {
  existingCode = 'existingCome',
}

gql`
  fragment EditPlan on PlanDetails {
    id
    name
    code
    description
    interval
    payInAdvance
    amountCents
    amountCurrency
    trialPeriod
    canBeDeleted
    billChargesMonthly
    charges {
      id
      billableMetric {
        id
        name
        code
      }
      graduatedRanges {
        flatAmount
        fromValue
        perUnitAmount
        toValue
      }
      ...VolumeRanges
      amount
      chargeModel
      freeUnits
      packageSize
      rate
      fixedAmount
      freeUnitsPerEvents
      freeUnitsPerTotalAggregation
    }
  }

  query getSinglePlan($id: ID!) {
    plan(id: $id) {
      ...EditPlan
    }
  }

  mutation createPlan($input: CreatePlanInput!) {
    createPlan(input: $input) {
      id
    }
  }

  mutation updatePlan($input: UpdatePlanInput!) {
    updatePlan(input: $input) {
      ...PlanItem
      ...DeletePlanDialog
    }
  }

  ${PlanItemFragmentDoc}
  ${DeletePlanDialogFragmentDoc}
  ${VolumeRangesFragmentDoc}
`

export enum PLAN_FORM_TYPE_ENUM {
  creation = 'creation',
  edition = 'edition',
  override = 'override',
}

export type PLAN_FORM_TYPE = keyof typeof PLAN_FORM_TYPE_ENUM

export interface UsePlanFormReturn {
  loading: boolean
  type: keyof typeof PLAN_FORM_TYPE_ENUM
  isCreated: boolean
  parentPlanName?: string
  errorCode?: string
  plan?: Omit<EditPlanFragment, 'name' | 'code'> & { name?: string; code?: string }
  resetIsCreated: () => void
  onSave: (values: PlanFormInput) => Promise<void>
  onClose: () => void
}

export const usePlanForm: () => UsePlanFormReturn = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { parentId, subscriptionInput, customerId } = useOverwritePlanVar()
  const [isCreated, setIsCreated] = useState<boolean>(false)
  const { data, loading, error } = useGetSinglePlanQuery({
    variables: { id: (id as string) || (parentId as string) },
    skip: !id && !parentId,
  })
  const isOverride = !!parentId
  const type = !!id ? 'edition' : isOverride ? 'override' : 'creation'
  const [create, { error: createError }] = useCreatePlanMutation({
    context: { silentErrorCodes: [Lago_Api_Error.UnprocessableEntity] },
    onCompleted({ createPlan }) {
      if (!!createPlan) {
        if (type === PLAN_FORM_TYPE_ENUM.override) {
          addToast({
            severity: 'success',
            translateKey: 'text_632b3780e409ac86609cbd05',
          })
          updateOverwritePlanVar({
            subscriptionInput: { ...subscriptionInput, planId: createPlan?.id },
          })
          navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id: customerId }))
        } else {
          setIsCreated(true)
        }
      }
    },
  })
  const [update, { error: updateError }] = useUpdatePlanMutation({
    context: { silentErrorCodes: [Lago_Api_Error.UnprocessableEntity] },
    onCompleted({ updatePlan }) {
      if (!!updatePlan) {
        addToast({
          severity: 'success',
          translateKey: 'text_625fd165963a7b00c8f598a0',
        })
        navigate(PLANS_ROUTE)
      }
    },
  })

  if (
    (error?.graphQLErrors[0]?.extensions as LagoGQLError['extensions'])?.code ===
    Lago_Api_Error.PlanNotFound
  ) {
    navigate(ERROR_404_ROUTE)
  }

  const errorCode = useMemo(() => {
    const errorExtension = (createError || updateError)?.graphQLErrors[0]
      ?.extensions as LagoGQLError['extensions']

    if (
      errorExtension?.code === Lago_Api_Error?.UnprocessableEntity &&
      !!errorExtension?.details?.code
    ) {
      return FORM_ERRORS_ENUM.existingCode
    }

    return undefined
  }, [createError, updateError])

  return useMemo(
    () => ({
      loading,
      type,
      errorCode,
      parentPlanName: data?.plan?.name,
      plan:
        type === PLAN_FORM_TYPE_ENUM.override
          ? _omit(data?.plan || undefined, ['name', 'code'])
          : data?.plan || undefined,
      isCreated,
      resetIsCreated: () => setIsCreated(false),
      onSave:
        type === PLAN_FORM_TYPE_ENUM.edition
          ? async (values) => {
              await update({
                variables: {
                  input: { id: id as string, ...serializePlanInput(values) },
                },
              })
            }
          : async (values) => {
              await create({
                variables: {
                  input: {
                    ...(type === PLAN_FORM_TYPE_ENUM.override ? { parentId } : {}),
                    ...serializePlanInput(values),
                  },
                },
              })
            },
      onClose: () => {
        if (type === PLAN_FORM_TYPE_ENUM.override) {
          navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id: customerId }))
        } else {
          navigate(PLANS_ROUTE)
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, id, customerId, parentId, isCreated, type, data?.plan, errorCode, update, create]
  )
}
