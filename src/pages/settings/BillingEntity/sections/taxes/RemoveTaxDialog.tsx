import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Typography } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { Tax, useRemoveBillingEntityTaxesMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation removeBillingEntityTaxes($input: RemoveTaxesInput!) {
    billingEntityRemoveTaxes(input: $input) {
      __typename
    }
  }
`

export type RemoveTaxDialogRef = {
  openDialog: (billingEntityId: string, tax: Tax) => unknown
  closeDialog: () => unknown
}

export const RemoveTaxDialog = forwardRef<RemoveTaxDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<WarningDialogRef>(null)

  const [tax, setTax] = useState<Tax | null>(null)
  const [billingEntityId, setBillingEntityId] = useState<string | null>(null)

  const [removeTax] = useRemoveBillingEntityTaxesMutation({
    onCompleted(data) {
      if (data) {
        addToast({
          message: translate('text_1743600025133mbqa82o5m39'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getBillingEntityTaxes'],
  })

  useImperativeHandle(ref, () => ({
    openDialog: (_billingEntityId, _tax) => {
      setBillingEntityId(_billingEntityId)
      setTax(_tax)

      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      dialogRef.current?.closeDialog()
    },
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_1743241419871l3utqcy1e3h')}
      description={<Typography>{translate('text_1743241419871xs0wuhvffq9')}</Typography>}
      onContinue={async () => {
        if (billingEntityId && tax) {
          await removeTax({
            variables: {
              input: {
                billingEntityId,
                taxCodes: [tax.code],
              },
            },
          })
        }
      }}
      continueText={translate('text_645bb193927b375079d28b34')}
    />
  )
})

RemoveTaxDialog.displayName = 'RemoveTaxDialog'
