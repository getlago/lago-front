import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { DeleteTaxFragment, useDeleteTaxMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteTax on Tax {
    id
    name
    customersCount
  }

  mutation deleteTax($input: DestroyTaxInput!) {
    destroyTax(input: $input) {
      id
    }
  }
`

export interface DeleteTaxDialogRef {
  openDialog: (tax: DeleteTaxFragment) => unknown
  closeDialog: () => unknown
}

export const DeleteTaxDialog = forwardRef<DeleteTaxDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [tax, setTax] = useState<DeleteTaxFragment | undefined>(undefined)
  const [deleteTax] = useDeleteTaxMutation({
    onCompleted(data) {
      if (data && data.destroyTax) {
        addToast({
          message: translate('text_645bb193927b375079d28b5a'),
          severity: 'success',
        })
      }
    },
    update(cache, { data }) {
      if (!data?.destroyTax) return
      const cacheId = cache.identify({
        id: data?.destroyTax.id,
        __typename: 'Tax',
      })

      cache.evict({ id: cacheId })
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setTax(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      dialogRef.current?.closeDialog()
    },
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_645bb193927b375079d28af7', {
        name: tax?.name,
      })}
      description={
        <Typography>
          {!!tax?.customersCount
            ? translate(
                'text_645bb193927b375079d28b0c',
                { count: tax?.customersCount },
                tax?.customersCount,
              )
            : translate('text_645cb766cca2dd00e2956271')}
        </Typography>
      }
      onContinue={async () =>
        await deleteTax({
          variables: { input: { id: tax?.id || '' } },
        })
      }
      continueText={translate('text_645bb193927b375079d28b34')}
    />
  )
})

DeleteTaxDialog.displayName = 'DeleteTaxDialog'
