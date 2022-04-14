import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { gql } from '@apollo/client'

import {
  useGetSingleBillableMetricQuery,
  EditBillableMetricFragment,
  AggregationTypeEnum,
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
  fragment EditBillableMetric on BillableMetric {
    id
    name
    code
    description
    aggregationType
    canBeDeleted
  }

  query getSingleBillableMetric($ids: Int) {
    billableMetrics(ids: $ids) {
      collection {
        ...EditBillableMetric
      }
    }
  }

  mutation createBillableMetric($input: CreateBillableMetricInput!) {
    createBillableMetric(input: $input) {
      id
    }
  }

  mutation updateBillableMetric($input: UpdateBillableMetricInput!) {
    updateBillableMetric(input: $input) {
      ...EditBillableMetric
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
  const { data, loading, error } = useGetSingleBillableMetricQuery({
    variables: {
      // @ts-ignore
      ids: id,
    },
    skip: !id,
  })

  if (error) {
    navigate(ERROR_404_ROUTE)
  }

  return {
    loading,
    isEdition: !!id,
    billableMetric: !data?.billableMetrics?.collection
      ? {
          id: 'f55abcf6-d376-4029-b3d1-e079c42e3003',
          name: 'Machinchose',
          code: 'machin-chose',
          description: 'coucou',
          aggregationType: AggregationTypeEnum.CountAgg,
          canBeDeleted: false,
        }
      : data?.billableMetrics?.collection[0],
    isCreated,
    resetIsCreated: () => setIsCreated(false),
    onSave: !!id
      ? async ({ name, code, description, aggregationType }) => {
          await update({
            variables: {
              input: {
                id,
                name,
                code,
                description,
                aggregationType,
              },
            },
          })
        }
      : async ({ name, code, description, aggregationType }) => {
          await create({
            variables: {
              input: {
                name,
                code,
                description,
                aggregationType,
              },
            },
          })
        },
  }
}
