import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  GetCustomerInvoicesDocument,
  GetInvoicesListDocument,
  useDeleteInvoiceMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation deleteInvoice($input: DeleteInvoiceInput!) {
    deleteInvoice(input: $input) {
      id
    }
  }
`

export const useDeleteInvoiceDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [deleteInvoice] = useDeleteInvoiceMutation()

  const openDeleteInvoiceDialog = (
    invoice: { id: string } | null | undefined,
    callback?: () => void,
  ) => {
    centralizedDialog.open({
      title: translate('text_17848001862071abwcvd3b3p'),
      description: translate('text_1784800186207jjeqsv1d0rd'),
      actionText: translate('text_17848001862070vhaaoyut3y'),
      colorVariant: 'danger',
      cancelOrCloseText: 'cancel',
      onAction: async () => {
        const result = await deleteInvoice({
          variables: { input: { id: invoice?.id || '' } },
        })

        if (result.data?.deleteInvoice?.id) {
          evictFromCache(client, {
            id: result.data.deleteInvoice.id,
            __typename: 'Invoice',
            listFieldName: ['invoices', 'customerInvoices'],
            listQueryDocument: [GetInvoicesListDocument, GetCustomerInvoicesDocument],
          })

          addToast({
            message: translate('text_1784800186207ionjr7ey3jq'),
            severity: 'success',
          })

          callback?.()
        }
      },
    })
  }

  return { openDeleteInvoiceDialog }
}
