import { forwardRef, useRef, useState, useImperativeHandle } from 'react'
import { gql } from '@apollo/client'

import { DialogRef } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { addToast } from '~/core/apolloClient'
import { CurrencyEnum, useVoidCreditNoteMutation } from '~/generated/graphql'
import { WarningDialog } from '~/components/WarningDialog'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'

gql`
  mutation voidCreditNote($input: VoidCreditNoteInput!) {
    voidCreditNote(input: $input) {
      id
    }
  }
`

type CreditNoteForVoid = {
  id: string
  totalAmountCents: number
  totalAmountCurrency: CurrencyEnum
}

export interface VoidCreditNoteDialogRef {
  openDialog: (creditNoteInfos: CreditNoteForVoid) => unknown
  closeDialog: () => unknown
}

export const VoidCreditNoteDialog = forwardRef<VoidCreditNoteDialogRef>((_, ref) => {
  const dialogRef = useRef<DialogRef>(null)
  const [voidCreditNote] = useVoidCreditNoteMutation({
    onCompleted({ voidCreditNote: voidedCreditNote }) {
      if (!!voidedCreditNote) {
        addToast({
          severity: 'success',
          translateKey: 'text_63720bd734e1344aea75b85d',
        })
      }
    },
  })
  const [creditNote, seCreditNote] = useState<CreditNoteForVoid | undefined>(undefined)
  const { translate } = useInternationalization()

  useImperativeHandle(ref, () => ({
    openDialog: (infos) => {
      seCreditNote(infos)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_63720bd734e1344aea75b7db')}
      description={translate('text_63720bd734e1344aea75b7e1', {
        amount: intlFormatNumber(
          deserializeAmount(
            creditNote?.totalAmountCents || 0,
            creditNote?.totalAmountCurrency || CurrencyEnum.Usd
          ),
          {
            currencyDisplay: 'symbol',
            currency: creditNote?.totalAmountCurrency || CurrencyEnum.Usd,
          }
        ),
      })}
      onContinue={async () =>
        await voidCreditNote({
          variables: { input: { id: creditNote?.id as string } },
          refetchQueries: ['getCustomer', 'getCreditNote'],
        })
      }
      continueText={translate('text_63720bd734e1344aea75b7e9')}
    />
  )
})

VoidCreditNoteDialog.displayName = 'VoidCreditNoteDialog'
