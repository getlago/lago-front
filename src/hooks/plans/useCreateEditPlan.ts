import { useState, useMemo } from 'react'
import { gql } from '@apollo/client'
import { useParams, useNavigate } from 'react-router-dom'

import {
  PlanItemFragmentDoc,
  DeletePlanDialogFragmentDoc,
  EditPlanFragment,
  useGetSinglePlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  VolumeRangesFragmentDoc,
} from '~/generated/graphql'
import { ERROR_404_ROUTE, PLANS_ROUTE } from '~/core/router'
import { addToast } from '~/core/apolloClient'
import { PlanFormInput } from '~/components/plans/types'
import { serializePlanCreateInput } from '~/serializers/serializePlanInput'

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

type UseCreateEditPlanReturn = {
  loading: boolean
  isEdition: boolean
  isCreated: boolean
  plan?: EditPlanFragment
  resetIsCreated: () => void
  onSave: (values: PlanFormInput) => Promise<void>
}

export const useCreateEditPlan: () => UseCreateEditPlanReturn = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [isCreated, setIsCreated] = useState<boolean>(false)
  const { data, loading, error } = useGetSinglePlanQuery({
    // @ts-ignore
    variables: { id },
    skip: !id,
  })
  const [create] = useCreatePlanMutation({
    onCompleted({ createPlan }) {
      if (!!createPlan) {
        setIsCreated(true)
      }
    },
  })
  const [update] = useUpdatePlanMutation({
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

  if (error) {
    navigate(ERROR_404_ROUTE) // TODO on error "not_found"
  }

  return useMemo(
    () => ({
      loading,
      isEdition: !!id,
      plan: !data?.plan ? undefined : data?.plan,
      isCreated,
      resetIsCreated: () => setIsCreated(false),
      onSave: !!id
        ? async (values) => {
            await update({
              variables: {
                input: { id, ...serializePlanCreateInput(values) },
              },
            })
          }
        : async (values) => {
            await create({
              variables: {
                input: serializePlanCreateInput(values),
              },
            })
          },
    }),
    [loading, id, data, isCreated, setIsCreated, update, create]
  )
}
