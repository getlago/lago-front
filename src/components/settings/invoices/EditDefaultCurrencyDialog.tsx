import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { Dialog, DialogRef } from '~/components/designSystem/Dialog'
import { addToast } from '~/core/apolloClient'
import {
  CurrencyEnum,
  EditBillingEntityDefaultCurrencyForDialogFragment,
  useUpdateBillingEntityDefaultCurrencyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment EditBillingEntityDefaultCurrencyForDialog on BillingEntity {
    id
    defaultCurrency
  }

  mutation updateBillingEntityDefaultCurrency($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
      ...EditBillingEntityDefaultCurrencyForDialog
    }
  }
`

const EDIT_DEFAULT_CURRENCY_FORM_ID = 'edit-default-currency-form'

export const EDIT_DEFAULT_CURRENCY_DIALOG_SUBMIT_BUTTON_TEST_ID =
  'edit-default-currency-dialog-submit-button'
export const EDIT_DEFAULT_CURRENCY_DIALOG_CURRENCY_FIELD_TEST_ID =
  'edit-default-currency-dialog-currency-field'

const editDefaultCurrencyValidationSchema = z.object({
  defaultCurrency: z.enum(CurrencyEnum),
})

export interface EditDefaultCurrencyDialogRef {
  openDialog: (localData: EditDefaultCurrencyDialogImperativeProps) => unknown
  closeDialog: () => unknown
}

type EditDefaultCurrencyDialogImperativeProps = {
  billingEntity?: EditBillingEntityDefaultCurrencyForDialogFragment | null
}

export const EditDefaultCurrencyDialog = forwardRef<EditDefaultCurrencyDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<EditDefaultCurrencyDialogImperativeProps | null>(null)

  const [updateBillingEntity] = useUpdateBillingEntityDefaultCurrencyMutation({
    onCompleted(res) {
      if (res?.updateBillingEntity) {
        addToast({
          severity: 'success',
          translateKey: 'text_6543ca0fdebf76a18e159303',
        })
      }
    },
    refetchQueries: ['getBillingEntitySettings'],
  })

  const form = useAppForm({
    defaultValues: {
      defaultCurrency: CurrencyEnum.Usd,
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: editDefaultCurrencyValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await updateBillingEntity({
        variables: {
          input: {
            id: localData?.billingEntity?.id as string,
            ...value,
          },
        },
      })
      dialogRef.current?.closeDialog()
    },
  })

  const isDirty = useStore(form.store, (state) => state.isDirty)
  const canSubmit = useStore(form.store, (state) => state.canSubmit)

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      form.reset({
        defaultCurrency: data?.billingEntity?.defaultCurrency || CurrencyEnum.Usd,
      })
      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      dialogRef.current?.closeDialog()
    },
  }))

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  const actions = ({ closeDialog }: { closeDialog: () => void }) => (
    <>
      <Button variant="quaternary" onClick={closeDialog}>
        {translate('text_62bb10ad2a10bd182d002031')}
      </Button>
      <Button
        variant="primary"
        type="submit"
        disabled={!canSubmit || !isDirty}
        data-test={EDIT_DEFAULT_CURRENCY_DIALOG_SUBMIT_BUTTON_TEST_ID}
      >
        {translate('text_17432414198706rdwf76ek3u')}
      </Button>
    </>
  )

  return (
    <Dialog
      ref={dialogRef}
      title={translate('text_6543ca0fdebf76a18e159294')}
      description={translate('text_6543ca0fdebf76a18e159298')}
      onClose={() => form.reset()}
      formId={EDIT_DEFAULT_CURRENCY_FORM_ID}
      formSubmit={handleFormSubmit}
      actions={actions}
    >
      <div className="mb-8 flex flex-col gap-3">
        <form.AppField name="defaultCurrency">
          {(field) => (
            <field.ComboBoxField
              disableClearable
              label={translate('text_6543ca0fdebf76a18e15929c')}
              data={Object.values(CurrencyEnum).map((currencyType) => ({
                value: currencyType,
              }))}
              PopperProps={{ displayInDialog: true }}
              dataTest={EDIT_DEFAULT_CURRENCY_DIALOG_CURRENCY_FIELD_TEST_ID}
            />
          )}
        </form.AppField>
      </div>
    </Dialog>
  )
})

EditDefaultCurrencyDialog.displayName = 'forwardRef'
