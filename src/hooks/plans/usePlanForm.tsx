import { useEffect, useMemo } from 'react'
import { gql } from '@apollo/client'
import { useParams, useNavigate, generatePath } from 'react-router-dom'
import _omit from 'lodash/omit'

import { PlanFormInput } from '~/components/plans/types'
import {
  EditPlanFragment,
  EditPlanFragmentDoc,
  DeletePlanDialogFragmentDoc,
  PlanItemFragmentDoc,
  useGetSinglePlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  LagoApiError,
} from '~/generated/graphql'
import {
  useOverwritePlanVar,
  addToast,
  updateOverwritePlanVar,
  hasDefinedGQLError,
  PLAN_FORM_TYPE_ENUM,
  resetOverwritePlanVar,
} from '~/core/apolloClient'
import { ERROR_404_ROUTE, PLANS_ROUTE, CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { serializePlanInput } from '~/core/serializers'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'

gql`
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
  ${EditPlanFragmentDoc}
`

export type PLAN_FORM_TYPE = keyof typeof PLAN_FORM_TYPE_ENUM

export interface UsePlanFormReturn {
  loading: boolean
  type: keyof typeof PLAN_FORM_TYPE_ENUM
  parentPlanName?: string
  errorCode?: string
  plan?: Omit<EditPlanFragment, 'name' | 'code'> & { name?: string; code?: string }
  onSave: (values: PlanFormInput) => Promise<void>
  onClose: () => void
}

export const usePlanForm: () => UsePlanFormReturn = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { parentId, subscriptionInput, customerId, type: actionType } = useOverwritePlanVar()
  const { data, loading, error } = useGetSinglePlanQuery({
    context: { silentError: LagoApiError.NotFound },
    variables: { id: (id as string) || (parentId as string) },
    skip: !id && !parentId,
  })
  const isOverride = actionType === 'override' && !!parentId
  const isDuplicate = actionType === 'duplicate' && !!parentId
  const type = !!id ? 'edition' : isDuplicate ? 'duplicate' : isOverride ? 'override' : 'creation'
  const [create, { error: createError }] = useCreatePlanMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ createPlan }) {
      if (!!createPlan) {
        if (type === PLAN_FORM_TYPE_ENUM.override) {
          addToast({
            severity: 'success',
            translateKey: 'text_632b3780e409ac86609cbd05',
          })
          updateOverwritePlanVar({
            type: 'override',
            subscriptionInput: { ...subscriptionInput, planId: createPlan?.id },
          })
          navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id: customerId as string }))
        } else if (type === PLAN_FORM_TYPE_ENUM.duplicate) {
          addToast({
            severity: 'success',
            translateKey: 'text_64fa176933e3b8008e3f15eb',
          })
          navigate(PLANS_ROUTE)
        } else {
          addToast({
            severity: 'success',
            translateKey: 'text_633336532bdf72cb62dc0694',
          })
          navigate(PLANS_ROUTE)
        }
      }
    },
  })
  const [update, { error: updateError }] = useUpdatePlanMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
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

  useEffect(() => {
    if (hasDefinedGQLError('NotFound', error, 'plan')) {
      navigate(ERROR_404_ROUTE)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  // Clear duplicate plan var when leaving the page
  useEffect(() => {
    return () => {
      if (type === PLAN_FORM_TYPE_ENUM.duplicate) {
        resetOverwritePlanVar()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const errorCode = useMemo(() => {
    if (hasDefinedGQLError('ValueAlreadyExist', createError || updateError)) {
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
        type === PLAN_FORM_TYPE_ENUM.override || type === PLAN_FORM_TYPE_ENUM.duplicate
          ? _omit(data?.plan || undefined, ['name', 'code'])
          : data?.plan || undefined,
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
          navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id: customerId as string }))
        } else {
          navigate(PLANS_ROUTE)
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, id, customerId, parentId, type, data?.plan, errorCode, update, create]
  )
}
