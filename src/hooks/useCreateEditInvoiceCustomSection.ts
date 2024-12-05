import { gql } from '@apollo/client'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { INVOICE_SETTINGS_ROUTE } from '~/core/router'
import {
  CreateInvoiceCustomSectionInput,
  InvoiceCustomSectionFormFragment,
  LagoApiError,
  useCreateInvoiceCustomSectionMutation,
} from '~/generated/graphql'

gql`
  fragment InvoiceCustomSectionForm on InvoiceCustomSection {
    name
    code
    description
    details
    displayName
    selected
  }

  mutation createInvoiceCustomSection($input: CreateInvoiceCustomSectionInput!) {
    createInvoiceCustomSection(input: $input) {
      id
      ...InvoiceCustomSectionForm
    }
  }
`

interface UseCreateEditInvoiceCustomSectionReturn {
  loading: boolean
  errorCode?: string
  isEdition: boolean
  invoiceCustomSection?: InvoiceCustomSectionFormFragment
  onSave: (value: CreateInvoiceCustomSectionInput) => Promise<void>
  onClose: () => void
}

export const useCreateEditInvoiceCustomSection = (): UseCreateEditInvoiceCustomSectionReturn => {
  const navigate = useNavigate()

  const [create, { error: createError }] = useCreateInvoiceCustomSectionMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ createInvoiceCustomSection }) {
      if (!!createInvoiceCustomSection) {
        addToast({
          severity: 'success',
          translateKey: '',
        })
      }
      navigate(INVOICE_SETTINGS_ROUTE)
    },
  })

  const errorCode = useMemo(() => {
    if (hasDefinedGQLError('ValueAlreadyExist', createError)) {
      return FORM_ERRORS_ENUM.existingCode
    }

    return undefined
  }, [createError])

  return useMemo(
    () => ({
      loading: false,
      isEdition: false,
      invoiceCustomSection: undefined,
      onClose: () => navigate(INVOICE_SETTINGS_ROUTE),
      errorCode,
      onSave: async (values) => {
        await create({
          variables: {
            input: {
              ...values,
            },
          },
        })
      },
    }),
    [create, errorCode, navigate],
  )
}
