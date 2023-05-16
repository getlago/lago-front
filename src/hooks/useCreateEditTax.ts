import { useMemo, useEffect } from 'react'
import { gql } from '@apollo/client'
import { useParams, useNavigate } from 'react-router-dom'

import {
  useCreateTaxMutation,
  useGetSingleTaxQuery,
  LagoApiError,
  useUpdateTaxMutation,
  TaxFormFragment,
} from '~/generated/graphql'
import { ERROR_404_ROUTE, TAXES_SETTINGS_ROUTE } from '~/core/router'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { TaxFormInput } from '~/components/taxes/types'
import { FORM_ERRORS_ENUM } from '~/core/formErrors'

gql`
  fragment TaxForm on Tax {
    id
    code
    description
    name
    rate
    customersCount
  }

  query getSingleTax($id: ID!) {
    tax(id: $id) {
      id
      ...TaxForm
    }
  }

  mutation createTax($input: TaxCreateInput!) {
    createTax(input: $input) {
      id
      ...TaxForm
    }
  }

  mutation updateTax($input: TaxUpdateInput!) {
    updateTax(input: $input) {
      ...TaxForm
    }
  }
`

type useCreateEditTaxReturn = {
  errorCode?: string
  loading: boolean
  isEdition: boolean
  tax?: TaxFormFragment
  onSave: (value: TaxFormInput) => Promise<void>
  onClose: () => void
}

const formatTaxInput = (values: TaxFormInput) => {
  const { code, name, rate, ...others } = values

  return {
    code: code || '',
    name: name || '',
    rate: Number(rate) || 0,
    ...others,
  }
}

export const useCreateEditTax: () => useCreateEditTaxReturn = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data, loading, error } = useGetSingleTaxQuery({
    context: { silentError: LagoApiError.NotFound },
    variables: { id: id as string },
    skip: !id,
  })
  const [update, { error: createError }] = useUpdateTaxMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ updateTax }) {
      if (!!updateTax) {
        addToast({
          severity: 'success',
          translateKey: 'text_645bb193927b375079d28b71',
        })
        navigate(TAXES_SETTINGS_ROUTE)
      }
    },
  })

  const [create, { error: updateError }] = useCreateTaxMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ createTax }) {
      if (!!createTax) {
        addToast({
          severity: 'success',
          translateKey: 'text_645bb193927b375079d28bc1',
        })
        navigate(TAXES_SETTINGS_ROUTE)
      }
    },
  })

  useEffect(() => {
    if (hasDefinedGQLError('NotFound', error, 'tax')) {
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
      tax: data?.tax || undefined,
      onClose: () => {
        navigate(TAXES_SETTINGS_ROUTE)
      },
      onSave: !!id
        ? async (values) => {
            await update({
              variables: {
                input: {
                  id,
                  ...formatTaxInput(values),
                },
              },
            })
          }
        : async (values) => {
            await create({
              variables: {
                input: { ...formatTaxInput(values) },
              },
            })
          },
    }),
    [id, create, data, errorCode, loading, navigate, update]
  )
}
