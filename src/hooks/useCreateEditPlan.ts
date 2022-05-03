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
} from '~/generated/graphql'
import { ERROR_404_ROUTE, PLANS_ROUTE } from '~/core/router'
import { addToast } from '~/core/apolloClient'
import { PlanFormInput } from '~/components/plans/types'

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
    vatRate
    trialPeriod
    canBeDeleted
    charges {
      id
      billableMetric {
        id
        name
        code
      }
      amountCents
      amountCurrency
      chargeModel
      vatRate
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
`

type UseCreateEditPlanReturn = {
  loading: boolean
  isEdition: boolean
  isCreated: boolean
  plan?: EditPlanFragment
  resetIsCreated: () => void
  onSave: (values: PlanFormInput) => Promise<void>
}

const formatPlanInput = (values: PlanFormInput) => {
  const { amountCents, trialPeriod, vatRate, charges, ...otherValues } = values

  return {
    amountCents: Number(amountCents),
    trialPeriod: Number(trialPeriod),
    vatRate: Number(vatRate),
    charges: charges.map(
      ({ billableMetric, amountCents: chargeAmountCents, vatRate: chargeVatRate, ...charge }) => {
        return {
          amountCents: Number(chargeAmountCents),
          vatRate: Number(chargeVatRate),
          billableMetricId: billableMetric.id,
          ...charge,
        }
      }
    ),
    ...otherValues,
  }
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
                input: { id, ...formatPlanInput(values) },
              },
            })
          }
        : async (values) => {
            await create({
              variables: {
                input: formatPlanInput(values),
              },
            })
          },
    }),
    [loading, id, data, isCreated, setIsCreated, update, create]
  )
}
