import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import styled from 'styled-components'
import { number, object } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import {
  UpdateOrganizationInput,
  useUpdateOrganizationGracePeriodMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  mutation updateOrganizationGracePeriod($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      billingConfiguration {
        id
        invoiceGracePeriod
      }
    }
  }
`

export interface EditOrganizationGracePeriodDialogRef extends DialogRef {}

interface EditOrganizationGracePeriodDialogProps {
  invoiceGracePeriod: number
}

export const EditOrganizationGracePeriodDialog = forwardRef<
  DialogRef,
  EditOrganizationGracePeriodDialogProps
>(({ invoiceGracePeriod }: EditOrganizationGracePeriodDialogProps, ref) => {
  const { translate } = useInternationalization()
  const [updateOrganizationGracePeriod] = useUpdateOrganizationGracePeriodMutation({
    onCompleted(res) {
      if (res?.updateOrganization) {
        addToast({
          severity: 'success',
          translateKey: 'text_638dc196fb209d551f3d81ba',
        })
      }
    },
  })
  const formikProps = useFormik<UpdateOrganizationInput>({
    initialValues: {
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
      await updateOrganizationGracePeriod({
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
            {translate('text_638dc196fb209d551f3d8159')}
          </Button>
        </>
      )}
    >
      <Content>
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
      </Content>
    </Dialog>
  )
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

EditOrganizationGracePeriodDialog.displayName = 'forwardRef'
