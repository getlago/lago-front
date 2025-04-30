import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import { number, object } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import {
  UpdateBillingEntityInput,
  useUpdateBillingEntityGracePeriodMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation updateBillingEntityGracePeriod($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
      billingConfiguration {
        id
        invoiceGracePeriod
      }
    }
  }
`

export type EditBillingEntityGracePeriodDialogRef = DialogRef

interface EditBillingEntityGracePeriodDialogProps {
  id: string
  invoiceGracePeriod: number
}

export const EditBillingEntityGracePeriodDialog = forwardRef<
  DialogRef,
  EditBillingEntityGracePeriodDialogProps
>(({ id, invoiceGracePeriod }: EditBillingEntityGracePeriodDialogProps, ref) => {
  const { translate } = useInternationalization()
  const [updateBillingEntityGracePeriod] = useUpdateBillingEntityGracePeriodMutation({
    onCompleted(res) {
      if (res?.updateBillingEntity) {
        addToast({
          severity: 'success',
          translateKey: 'text_638dc196fb209d551f3d81ba',
        })
      }
    },
    refetchQueries: ['getBillingEntitySettings'],
  })
  const formikProps = useFormik<UpdateBillingEntityInput>({
    initialValues: {
      id,
      billingConfiguration: {
        invoiceGracePeriod,
      },
    },
    validationSchema: object().shape({
      billingConfiguration: object().shape({
        invoiceGracePeriod: number().required('').max(365, 'text_63bed78ae69de9cad5c348e4'),
      }),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async (values) => {
      await updateBillingEntityGracePeriod({
        variables: {
          input: {
            ...values,
          },
        },
      })
    },
  })

  return (
    <Dialog
      ref={ref}
      title={translate('text_638dc196fb209d551f3d8139')}
      description={translate('text_638dc196fb209d551f3d813b')}
      onClose={() => formikProps.resetForm()}
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
            }}
          >
            {translate('text_17432414198706rdwf76ek3u')}
          </Button>
        </>
      )}
    >
      <div className="mb-8">
        <TextInputField
          name="billingConfiguration.invoiceGracePeriod"
          beforeChangeFormatter={['positiveNumber', 'int']}
          label={translate('text_638dc196fb209d551f3d819d')}
          placeholder={translate('text_638dc196fb209d551f3d8147')}
          formikProps={formikProps}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {translate('text_638dc196fb209d551f3d814d')}
              </InputAdornment>
            ),
          }}
        />
      </div>
    </Dialog>
  )
})

EditBillingEntityGracePeriodDialog.displayName = 'forwardRef'
