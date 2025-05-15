import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { ComboBoxField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import {
  CurrencyEnum,
  EditBillingEntityDefaultCurrencyForDialogFragment,
  UpdateBillingEntityInput,
  useUpdateBillingEntityDefaultCurrencyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

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

  const formikProps = useFormik<Pick<UpdateBillingEntityInput, 'defaultCurrency'>>({
    initialValues: {
      defaultCurrency: localData?.billingEntity?.defaultCurrency || CurrencyEnum.Usd,
    },
    validationSchema: object().shape({
      defaultCurrency: string()
        .test({
          test: function (defaultCurrency) {
            return Object.values(CurrencyEnum).includes(defaultCurrency as CurrencyEnum)
          },
        })
        .required(''),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await updateBillingEntity({
        variables: {
          input: {
            id: localData?.billingEntity?.id as string,
            ...values,
          },
        },
      })
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      dialogRef.current?.closeDialog()
    },
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate('text_6543ca0fdebf76a18e159294')}
      description={translate('text_6543ca0fdebf76a18e159298')}
      onClose={() => {
        formikProps.resetForm()
      }}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_62bb10ad2a10bd182d002031')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || !formikProps.dirty}
            onClick={async () => {
              await formikProps.submitForm()
              closeDialog()
              formikProps.resetForm()
              setLocalData(null)
            }}
          >
            {translate('text_17432414198706rdwf76ek3u')}
          </Button>
        </>
      )}
    >
      <div className="mb-8 flex flex-col gap-3">
        <ComboBoxField
          disableClearable
          name="defaultCurrency"
          label={translate('text_6543ca0fdebf76a18e15929c')}
          data={Object.values(CurrencyEnum).map((currencyType) => ({
            value: currencyType,
          }))}
          PopperProps={{ displayInDialog: true }}
          formikProps={formikProps}
        />
      </div>
    </Dialog>
  )
})

EditDefaultCurrencyDialog.displayName = 'forwardRef'
