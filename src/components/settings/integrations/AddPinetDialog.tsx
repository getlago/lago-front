import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import { useNavigate } from 'react-router'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { PINET_INTEGRATION_ROUTE } from '~/core/router'
import {
  AddPinetPaymentProviderInput,
  PinetIntegrationFragmentDoc,
  useAddPinetApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  mutation addPinetApiKey($input: AddPinetPaymentProviderInput!) {
    addPinetPaymentProvider(input: $input) {
      id
      ...PinetIntegration
    }
  }

  ${PinetIntegrationFragmentDoc}
`

export interface AddPinetDialogRef extends DialogRef {}

interface AddPinetDialog {
  isEdition?: boolean
}

export const AddPinetDialog = forwardRef<AddPinetDialogRef, AddPinetDialog>(
  ({ isEdition }: AddPinetDialog, ref) => {
    const { translate } = useInternationalization()

    const navigate = useNavigate()
    const formikProps = useFormik<AddPinetPaymentProviderInput>({
      initialValues: {
        keyId: '',
        privateKey: '',
      },
      validationSchema: object().shape({
        keyId: string().required(''),
        privateKey: string().required(''),
      }),
      onSubmit: async (values) => {
        await addApiKey({
          variables: {
            input: values,
          },
          refetchQueries: ['PinetIntegrationsSetting'],
        })
      },
      validateOnMount: true,
      enableReinitialize: true,
    })
    const [addApiKey] = useAddPinetApiKeyMutation({
      onCompleted({ addPinetPaymentProvider }) {
        if (addPinetPaymentProvider?.id) {
          if (!isEdition) {
            navigate(PINET_INTEGRATION_ROUTE)
          }
          addToast({
            message: translate(
              isEdition
                ? 'Pinet API secret key successfully edited'
                : 'Pinet API secret key successfully added',
            ),
            severity: 'success',
          })
        }
      },
    })

    return (
      <Dialog
        ref={ref}
        title={translate(isEdition ? 'Edit Pinet API certificate' : 'Connect to PINET')}
        description={translate(
          isEdition
            ? 'By editing the API certificate, upcoming data will not be synchronised to the connected PINET account.'
            : 'To connect to PINET, please enter the API certificate from your PINET account.',
        )}
        onClose={() => {
          formikProps.resetForm()
        }}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_62b1edddbf5f461ab971276d')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid}
              onClick={async () => {
                await formikProps.submitForm()
                closeDialog()
              }}
            >
              {translate(isEdition ? 'Edit API certificate' : 'Connect to PINET')}
            </Button>
          </>
        )}
      >
        <Content>
          <TextInputField
            name="keyId"
            label="Key ID"
            placeholder="Type a Key ID"
            formikProps={formikProps}
          />

          <TextArea
            name="privateKey"
            label="Private Key"
            multiline
            rows="3"
            placeholder="Type a Private Key"
            formikProps={formikProps}
          />
        </Content>
      </Dialog>
    )
  },
)

const Content = styled.div`
  width: 100%;
  margin-bottom: ${theme.spacing(8)};
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const TextArea = styled(TextInputField)`
  textarea:first-child {
    white-space: pre;
    overflow-y: auto;
    padding: ${theme.spacing(2)};
    scrollbar-width: thin;
  }
`

AddPinetDialog.displayName = 'AddPinetDialog'
