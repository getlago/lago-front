import { gql } from '@apollo/client'
import { forwardRef } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteCustomerDocumentLocaleFragment,
  useDeleteCustomerDocumentLocaleMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteCustomerDocumentLocale on Customer {
    id
    name
    displayName
    externalId
  }

  mutation deleteCustomerDocumentLocale($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      billingConfiguration {
        id
        documentLocale
      }
    }
  }
`

export type DeleteCustomerDocumentLocaleDialogRef = WarningDialogRef

interface DeleteCustomerDocumentLocaleDialogProps {
  customer: DeleteCustomerDocumentLocaleFragment
}

export const DeleteCustomerDocumentLocaleDialog = forwardRef<
  DialogRef,
  DeleteCustomerDocumentLocaleDialogProps
>(({ customer }: DeleteCustomerDocumentLocaleDialogProps, ref) => {
  const customerName = customer?.displayName
  const [deleteCustomerDocumentLocale] = useDeleteCustomerDocumentLocaleMutation({
    onCompleted(data) {
      if (data && data.updateCustomer) {
        addToast({
          message: translate('text_63ea0f84f400488553caa79b'),
          severity: 'success',
        })
      }
    },
  })
  const { translate } = useInternationalization()

  return (
    <WarningDialog
      ref={ref}
      title={translate('text_63ea0f84f400488553caa68a')}
      description={
        <Typography
          html={translate('text_63ea0f84f400488553caa691', {
            customerName,
          })}
        />
      }
      onContinue={async () =>
        await deleteCustomerDocumentLocale({
          variables: {
            input: {
              id: customer.id,
              billingConfiguration: { documentLocale: null },
              // NOTE: API should not require those fields on customer update
              // To be tackled as improvement
              externalId: customer.externalId,
              name: customer.name || '',
            },
          },
        })
      }
      continueText={translate('text_63ea0f84f400488553caa697')}
    />
  )
})

DeleteCustomerDocumentLocaleDialog.displayName = 'DeleteCustomerDocumentLocaleDialog'
