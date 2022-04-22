import { gql } from '@apollo/client'
import { forwardRef } from 'react'

import { Typography, DialogRef } from '~/components/designSystem'
import { DeleteCustomerDialogFragment, useDeleteCustomerMutation } from '~/generated/graphql'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { useI18nContext } from '~/core/I18nContext'
import { addToast } from '~/core/apolloClient'

gql`
  fragment DeleteCustomerDialog on Customer {
    id
    name
  }

  mutation deleteCustomer($input: DestroyCustomerInput!) {
    destroyCustomer(input: $input) {
      id
    }
  }
`

export interface DeleteCustomerDialogRef extends WarningDialogRef {}

interface DeleteCustomerDialogProps {
  customer: DeleteCustomerDialogFragment
  onDeleted?: () => void
}

export const DeleteCustomerDialog = forwardRef<DialogRef, DeleteCustomerDialogProps>(
  ({ customer, onDeleted }: DeleteCustomerDialogProps, ref) => {
    const [deleteCustomer] = useDeleteCustomerMutation({
      onCompleted(data) {
        if (data && data.destroyCustomer) {
          onDeleted && onDeleted()
          addToast({
            message: translate('text_626162c62f790600f850b814'),
            severity: 'success',
          })
        }
      },
      update(cache, { data }) {
        if (!data?.destroyCustomer) return
        const cacheId = cache.identify({
          id: data?.destroyCustomer.id,
          __typename: 'Customer',
        })

        const cacheIdDetails = cache.identify({
          id: data?.destroyCustomer.id,
          __typename: 'CustomerDetails',
        })

        cache.evict({ id: cacheId })
        cache.evict({ id: cacheIdDetails })
      },
    })
    const { translate } = useI18nContext()

    return (
      <WarningDialog
        ref={ref}
        title={translate('text_626162c62f790600f850b6e8', {
          customerFullName: customer?.name,
        })}
        description={<Typography html={translate('text_626162c62f790600f850b6f8')} />}
        onContinue={async () =>
          await deleteCustomer({
            variables: { input: { id: customer?.id } },
          })
        }
        continueText={translate('text_626162c62f790600f850b712')}
      />
    )
  }
)

DeleteCustomerDialog.displayName = 'DeleteCustomerDialog'
