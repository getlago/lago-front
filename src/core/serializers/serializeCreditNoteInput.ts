import {
  CreditNoteItemInput,
  CreateCreditNoteInput,
  CreditNoteReasonEnum,
} from '~/generated/graphql'
import {
  CreditNoteForm,
  FromFee,
  CreditTypeEnum,
  FeesPerInvoice,
  GroupedFee,
} from '~/components/creditNote/types'

export const serializeCreditNoteInput: (
  invoiceId: string,
  formValues: CreditNoteForm
) => CreateCreditNoteInput = (invoiceId, formValues) => {
  const { reason, description, payBack, fees = [] } = formValues

  return {
    invoiceId: invoiceId as string,
    reason: reason as CreditNoteReasonEnum,
    description: description,
    creditAmountCents: !payBack
      ? 0
      : Math.round((payBack.find((p) => p.type === CreditTypeEnum.credit)?.value || 0) * 100 || 0),
    refundAmountCents: !payBack
      ? 0
      : Math.round((payBack.find((p) => p.type === CreditTypeEnum.refund)?.value || 0) * 100 || 0),
    items: Object.keys(fees).reduce<CreditNoteItemInput[]>((subAcc, subKey) => {
      const subChild = (fees as FeesPerInvoice)[subKey]

      return [
        ...subAcc,
        ...Object.keys(subChild?.fees).reduce<CreditNoteItemInput[]>((groupAcc, groupKey) => {
          const child = subChild?.fees[groupKey] as FromFee

          if (typeof child.checked === 'boolean') {
            return !child.checked
              ? groupAcc
              : [
                  ...groupAcc,
                  {
                    feeId: child?.id,
                    amountCents: Math.round(Number(child.value) * 100),
                  },
                ]
          }

          const grouped = (child as unknown as GroupedFee)?.grouped

          return [
            ...groupAcc,
            ...Object.keys(grouped).reduce<CreditNoteItemInput[]>((feeAcc, feeKey) => {
              const fee = grouped[feeKey]

              return !fee.checked
                ? feeAcc
                : [
                    ...feeAcc,
                    {
                      feeId: fee.id,
                      amountCents: Math.round(Number(fee.value) * 100),
                    },
                  ]
            }, []),
          ]
        }, []),
      ]
    }, []),
  }
}
