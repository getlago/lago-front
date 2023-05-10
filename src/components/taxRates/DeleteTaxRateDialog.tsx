import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Typography, DialogRef } from '~/components/designSystem'
import { DeleteTaxRateFragment, useDeleteTaxRateMutation } from '~/generated/graphql'
import { WarningDialog } from '~/components/WarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { addToast } from '~/core/apolloClient'

gql`
  fragment DeleteTaxRate on TaxRate {
    id
    name
    customersCount
  }

  mutation deleteTaxRate($input: DestroyTaxRateInput!) {
    destroyTaxRate(input: $input) {
      id
    }
  }
`

export interface DeleteTaxRateDialogRef {
  openDialog: (taxRate: DeleteTaxRateFragment) => unknown
  closeDialog: () => unknown
}

export const DeleteTaxRateDialog = forwardRef<DeleteTaxRateDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [taxRate, setTaxRate] = useState<DeleteTaxRateFragment | undefined>(undefined)
  const [deleteTaxRate] = useDeleteTaxRateMutation({
    onCompleted(data) {
      if (data && data.destroyTaxRate) {
        addToast({
          message: translate('text_645bb193927b375079d28b5a'),
          severity: 'success',
        })
      }
    },
    update(cache, { data }) {
      if (!data?.destroyTaxRate) return
      const cacheId = cache.identify({
        id: data?.destroyTaxRate.id,
        __typename: 'TaxRate',
      })

      cache.evict({ id: cacheId })
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setTaxRate(data)
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
        name: taxRate?.name,
      })}
      description={
        <Typography>
          {!!taxRate?.customersCount
            ? translate('text_645bb193927b375079d28b0c', { count: taxRate?.customersCount })
            : translate('text_645cb766cca2dd00e2956271')}
        </Typography>
      }
      onContinue={async () =>
        await deleteTaxRate({
          variables: { input: { id: taxRate?.id || '' } },
        })
      }
      continueText={translate('text_645bb193927b375079d28b34')}
    />
  )
})

DeleteTaxRateDialog.displayName = 'DeleteTaxRateDialog'
