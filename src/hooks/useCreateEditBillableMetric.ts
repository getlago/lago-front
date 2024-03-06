import { gql } from '@apollo/client'
import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { BILLABLE_METRICS_ROUTE, ERROR_404_ROUTE } from '~/core/router'
import {
  AggregationTypeEnum,
  BillableMetricItemFragmentDoc,
  CreateBillableMetricInput,
  DeleteBillableMetricDialogFragmentDoc,
  EditBillableMetricFragment,
  EditBillableMetricFragmentDoc,
  LagoApiError,
  UpdateBillableMetricInput,
  useCreateBillableMetricMutation,
  useGetSingleBillableMetricQuery,
  useUpdateBillableMetricMutation,
  WeightedIntervalEnum,
} from '~/generated/graphql'

gql`
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
  ${EditBillableMetricFragmentDoc}
`

type UseCreateEditBillableMetricReturn = {
  loading: boolean
  isEdition: boolean
  billableMetric?: EditBillableMetricFragment
  errorCode?: string
  onSave: (value: CreateBillableMetricInput | UpdateBillableMetricInput) => Promise<void>
}

export const useCreateEditBillableMetric: () => UseCreateEditBillableMetricReturn = () => {
  const navigate = useNavigate()
  const { billableMetricId } = useParams()
  const { data, loading, error } = useGetSingleBillableMetricQuery({
    context: { silentError: LagoApiError.NotFound },
    variables: { id: billableMetricId as string },
    skip: !billableMetricId,
  })
  const [create, { error: createError }] = useCreateBillableMetricMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ createBillableMetric }) {
      if (!!createBillableMetric) {
        addToast({
          severity: 'success',
          translateKey: 'text_633336532bdf72cb62dc0696',
        })
        navigate(BILLABLE_METRICS_ROUTE)
      }
    },
  })
  const [update, { error: updateError }] = useUpdateBillableMetricMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
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

  useEffect(() => {
    if (hasDefinedGQLError('NotFound', error, 'billableMetric')) {
      navigate(ERROR_404_ROUTE)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  const errorCode = useMemo(() => {
    if (hasDefinedGQLError('ValueAlreadyExist', createError || updateError)) {
      return FORM_ERRORS_ENUM.existingCode
    }

    return undefined
  }, [createError, updateError])

  const mutationInput = (values: CreateBillableMetricInput | UpdateBillableMetricInput) => {
    return {
      ...values,
      weightedInterval:
        values.aggregationType === AggregationTypeEnum.WeightedSumAgg
          ? WeightedIntervalEnum.Seconds
          : null,
    }
  }

  return useMemo(
    () => ({
      loading,
      isEdition: !!billableMetricId,
      errorCode,
      billableMetric: !data?.billableMetric ? undefined : data?.billableMetric,
      onSave: !!billableMetricId
        ? async (values) => {
            await update({
              variables: {
                input: {
                  id: billableMetricId,
                  ...mutationInput(values),
                },
              },
            })
          }
        : async (values) => {
            await create({
              variables: {
                input: {
                  ...mutationInput(values),
                },
              },
            })
          },
    }),
    [loading, billableMetricId, errorCode, data?.billableMetric, update, create],
  )
}
