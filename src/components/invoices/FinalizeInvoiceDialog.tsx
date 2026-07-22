import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast, LagoGQLError } from '~/core/apolloClient'
import {
  AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc,
  InvoiceForFinalizeInvoiceFragment,
  InvoiceStatusTypeEnum,
  LagoApiError,
  useFinalizeInvoiceMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useFormatterDateHelper } from '~/hooks/helpers/useFormatterDateHelper'

gql`
  fragment InvoiceForFinalizeInvoice on Invoice {
    id
    issuingDate
    customer {
      id
      applicableTimezone
    }
  }

  mutation finalizeInvoice($input: FinalizeInvoiceInput!) {
    finalizeInvoice(input: $input) {
      id
      ...AllInvoiceDetailsForCustomerInvoiceDetails
    }
  }

  ${AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc}
`

type FinalizeInvoiceDialogData = {
  invoice: InvoiceForFinalizeInvoiceFragment | null | undefined
  callback?: () => void
}

export const useFinalizeInvoiceDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const { formattedDateWithTimezone } = useFormatterDateHelper()
  const client = useApolloClient()

  const [finalizeInvoice] = useFinalizeInvoiceMutation({
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity, LagoApiError.InternalError],
    },
    onError: ({ graphQLErrors }) => {
      graphQLErrors.forEach((graphQLError) => {
        const { extensions } = graphQLError as LagoGQLError

        if (extensions.details?.taxError?.length) {
          addToast({
            severity: 'danger',
            translateKey: 'text_1724438705077s7oxv5be87m',
          })
        }
      })
    },
  })

  const openFinalizeInvoiceDialog = (
    invoice: InvoiceForFinalizeInvoiceFragment | null | undefined,
    callback?: () => void,
  ) => {
    const data: FinalizeInvoiceDialogData = { invoice, callback }

    centralizedDialog.open({
      title: translate('text_63a4269f72ead1bda4bed106'),
      description: translate('text_63a4269f72ead1bda4bed108', {
        issuingDate: data.invoice?.issuingDate
          ? formattedDateWithTimezone(data.invoice.issuingDate)
          : '-',
      }),
      actionText: translate('text_63a4269f72ead1bda4bed10c'),
      onAction: async () => {
        const result = await finalizeInvoice({
          variables: { input: { id: data.invoice?.id || '' } },
        })

        const finalizeInvoiceRes = result.data?.finalizeInvoice
        const isClosed = finalizeInvoiceRes?.status === InvoiceStatusTypeEnum.Closed

        client.refetchQueries({
          include: isClosed
            ? ['getCustomerInvoices']
            : ['getCustomerInvoices', 'getInvoiceDetails'],
        })

        if (finalizeInvoiceRes?.id) {
          addToast({
            message: translate('text_63a41b3a01db40c7fff551e1'),
            severity: 'success',
          })
        }

        if (isClosed) {
          data.callback?.()
        }
      },
    })
  }

  return { openFinalizeInvoiceDialog }
}
