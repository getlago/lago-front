import { useMemo, useEffect } from 'react'
import { gql } from '@apollo/client'
import { useParams, useNavigate } from 'react-router-dom'

import {
  useCreateTaxRateMutation,
  useGetSingleTaxRateQuery,
  LagoApiError,
  useUpdateTaxRateMutation,
} from '~/generated/graphql'
import { ERROR_404_ROUTE, TAXES_SETTINGS_ROUTE } from '~/core/router'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { TaxRateFormInput } from '~/components/taxRates/types'

export enum FORM_ERRORS_ENUM {
  existingCode = 'existingCode',
}

gql`
  fragment TaxRateForm on TaxRate {
    id
    code
    description
    name
    value
  }

  query getSingleTaxRate($id: ID!) {
    taxRate(id: $id) {
      id
      ...TaxRateForm
    }
  }

  mutation createTaxRate($input: TaxRateCreateInput!) {
    createTaxRate(input: $input) {
      id
      ...TaxRateForm
    }
  }

  mutation updateTaxRate($input: TaxRateUpdateInput!) {
    updateTaxRate(input: $input) {
      ...TaxRateForm
    }
  }
`

type useCreateEditTaxRateReturn = {
  errorCode?: string
  loading: boolean
  isEdition: boolean
  taxRate?: TaxRateFormInput
  onSave: (value: TaxRateFormInput) => Promise<void>
  onClose: () => void
}

const formatTaxRateInput = (values: TaxRateFormInput) => {
  const { code, name, value, ...others } = values

  return {
    code: code || '',
    name: name || '',
    value: Number(value) || 0,
    ...others,
  }
}

export const useCreateEditTaxRate: () => useCreateEditTaxRateReturn = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data, loading, error } = useGetSingleTaxRateQuery({
    context: { silentError: LagoApiError.NotFound },
    variables: { id: id as string },
    skip: !id,
  })
  const [update, { error: createError }] = useUpdateTaxRateMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ updateTaxRate }) {
      if (!!updateTaxRate) {
        addToast({
          severity: 'success',
          translateKey: 'text_645bb193927b375079d28b71',
        })
        navigate(TAXES_SETTINGS_ROUTE)
      }
    },
  })

  const [create, { error: updateError }] = useCreateTaxRateMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ createTaxRate }) {
      if (!!createTaxRate) {
        addToast({
          severity: 'success',
          translateKey: 'text_645bb193927b375079d28bc1',
        })
        navigate(TAXES_SETTINGS_ROUTE)
      }
    },
  })

  useEffect(() => {
    if (hasDefinedGQLError('NotFound', error, 'tax-rate')) {
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

  return useMemo(
    () => ({
      loading,
      errorCode,
      isEdition: !!id,
      taxRate: data?.taxRate || undefined,
      onClose: () => {
        navigate(TAXES_SETTINGS_ROUTE)
      },
      onSave: !!id
        ? async (values) => {
            await update({
              variables: {
                input: {
                  id,
                  ...formatTaxRateInput(values),
                },
              },
            })
          }
        : async (values) => {
            await create({
              variables: {
                input: { ...formatTaxRateInput(values) },
              },
            })
          },
    }),
    [id, create, data, errorCode, loading, navigate, update]
  )
}
