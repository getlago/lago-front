import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { gql } from '@apollo/client'

import {
  useGetSingleBillableMetricQuery,
  EditBillableMetricFragment,
  CreateBillableMetricInput,
  useCreateBillableMetricMutation,
  BillableMetricItemFragmentDoc,
  DeleteBillableMetricDialogFragmentDoc,
  UpdateBillableMetricInput,
  useUpdateBillableMetricMutation,
} from '~/generated/graphql'
import { ERROR_404_ROUTE, BILLABLE_METRICS_ROUTE } from '~/core/router'
import { addToast } from '~/core/apolloClient'

gql`
  fragment EditBillableMetric on BillableMetricDetail {
    id
    name
    code
    description
    aggregationType
    canBeDeleted
    fieldName
  }

  query getSingleBillableMetric($id: ID!) {
    billableMetric(id: $id) {
      ...EditBillableMetric
    }
  }

  mutation createBillableMetric($input: CreateBillableMetricInput!) {
    createBillableMetric(input: $input) {
      id
    }
  }

  mutation updateBillableMetric($input: UpdateBillableMetricInput!) {
    updateBillableMetric(input: $input) {
      ...BillableMetricItem
      ...DeleteBillableMetricDialog
    }
  }

  ${BillableMetricItemFragmentDoc}
  ${DeleteBillableMetricDialogFragmentDoc}
`

type UseCreateEditBillableMetricReturn = {
  loading: boolean
  isEdition: boolean
  billableMetric?: EditBillableMetricFragment
  isCreated: boolean
  resetIsCreated: () => void
  onSave: (value: CreateBillableMetricInput | UpdateBillableMetricInput) => Promise<void>
}

export const useCreateEditBillableMetric: () => UseCreateEditBillableMetricReturn = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [isCreated, setIsCreated] = useState<boolean>(false)
  const { data, loading, error } = useGetSingleBillableMetricQuery({
    // @ts-ignore
    variables: { id },
    skip: !id,
  })
  const [create] = useCreateBillableMetricMutation({
    onCompleted({ createBillableMetric }) {
      if (!!createBillableMetric) {
        setIsCreated(true)
      }
    },
  })
  const [update] = useUpdateBillableMetricMutation({
    onCompleted({ updateBillableMetric }) {
      if (!!updateBillableMetric) {
        addToast({
          severity: 'success',
          translateKey: 'text_62583bbb86abcf01654f697d',
        })
        navigate(BILLABLE_METRICS_ROUTE)
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
      billableMetric: !data?.billableMetric ? undefined : data?.billableMetric,
      isCreated,
      resetIsCreated: () => setIsCreated(false),
      onSave: !!id
        ? async (values) => {
            await update({
              variables: {
                input: { id, ...values },
              },
            })
          }
        : async (values) => {
            await create({
              variables: {
                input: values,
              },
            })
          },
    }),
    [loading, id, data, isCreated, setIsCreated, update, create]
  )
}
