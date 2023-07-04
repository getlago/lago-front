import { useMemo, useEffect } from 'react'
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
  LagoApiError,
  EditBillableMetricFragmentDoc,
} from '~/generated/graphql'
import { ERROR_404_ROUTE, BILLABLE_METRICS_ROUTE } from '~/core/router'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'

gql`
  query getSingleBillableMetric($id: ID!) {
    billableMetric(id: $id) {
      ...EditBillableMetric
    }
  }

  mutation createBillableMetric($input: CreateBillableMetricInput!) {
    createBillableMetric(input: $input) {
      id
      group
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
  const { id } = useParams()
  const { data, loading, error } = useGetSingleBillableMetricQuery({
    context: { silentError: LagoApiError.NotFound },
    variables: { id: id as string },
    skip: !id,
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
    } else if (hasDefinedGQLError('ValueIsInvalid', createError || updateError)) {
      return FORM_ERRORS_ENUM.invalidGroupValue
    }

    return undefined
  }, [createError, updateError])

  return useMemo(
    () => ({
      loading,
      isEdition: !!id,
      errorCode,
      billableMetric: !data?.billableMetric ? undefined : data?.billableMetric,
      onSave: !!id
        ? async (values) => {
            await update({
              variables: {
                input: { id, ...values, group: JSON.parse(values.group || '{}') },
              },
            })
          }
        : async (values) => {
            await create({
              variables: {
                input: { ...values, group: JSON.parse(values.group || '{}') },
              },
            })
          },
    }),
    [loading, id, data, errorCode, update, create]
  )
}
