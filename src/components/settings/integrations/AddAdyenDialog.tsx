import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import { useNavigate } from 'react-router'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { ADYEN_INTEGRATION_ROUTE } from '~/core/router'
import {
  AddAdyenPaymentProviderInput,
  AdyenIntegrationFragmentDoc,
  useAddAdyenApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  mutation addAdyenApiKey($input: AddAdyenPaymentProviderInput!) {
    addAdyenPaymentProvider(input: $input) {
      id
      apiKey
      hmacKey
      livePrefix
      merchantAccount

      ...AdyenIntegration
    }
  }

  ${AdyenIntegrationFragmentDoc}
`

export interface AddAdyenDialogRef extends DialogRef {}

interface AddStripDialog {
  isEdition?: boolean
}

export const AddAdyenDialog = forwardRef<AddAdyenDialogRef, AddStripDialog>(
  ({ isEdition }: AddStripDialog, ref) => {
    const { translate } = useInternationalization()
    const navigate = useNavigate()
    const formikProps = useFormik<AddAdyenPaymentProviderInput>({
      initialValues: {
        apiKey: '',
        hmacKey: undefined,
        livePrefix: undefined,
        merchantAccount: '',
      },
      validationSchema: object().shape({
        apiKey: string().required(''),
        hmacKey: string(),
        livePrefix: string(),
        merchantAccount: string().required(''),
      }),
      onSubmit: async (values) => {
        await addApiKey({
          variables: {
            input: values,
          },
          refetchQueries: ['AdyenIntegrationsSetting'],
        })
      },
      validateOnMount: true,
      enableReinitialize: true,
    })
    const [addApiKey] = useAddAdyenApiKeyMutation({
      onCompleted({ addAdyenPaymentProvider }) {
        if (addAdyenPaymentProvider?.id) {
          navigate(ADYEN_INTEGRATION_ROUTE)
          addToast({
            message: translate(
              isEdition ? 'text_645d071272418a14c1c76a3e' : 'text_645d071272418a14c1c76a93'
            ),
            severity: 'success',
          })
        }
      },
    })

    return (
      <Dialog
        ref={ref}
        title={translate(
          isEdition ? 'text_645d071272418a14c1c76adc' : 'text_645d071272418a14c1c76a5f'
        )}
        description={translate(
          isEdition ? 'text_645d071272418a14c1c76a73' : 'text_645d071272418a14c1c76a6b'
        )}
        actions={({ closeDialog }) => (
          <>
            <Button
              variant="quaternary"
              onClick={() => {
                closeDialog()
              }}
            >
              {translate('text_63eba8c65a6c8043feee2a14')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid}
              onClick={async () => {
                await formikProps.submitForm()
                closeDialog()
                formikProps.resetForm()
              }}
            >
              {translate(
                isEdition ? 'text_645d071272418a14c1c76a67' : 'text_645d071272418a14c1c76ad8'
              )}
            </Button>
          </>
        )}
      >
        <Content>
          <TextInputField
            name="apiKey"
            label={translate('text_645d071272418a14c1c76a77')}
            placeholder={translate('text_645d071272418a14c1c76a83')}
            formikProps={formikProps}
          />
          <TextInputField
            name="merchantAccount"
            label={translate('text_645d071272418a14c1c76a8f')}
            placeholder={translate('text_645d071272418a14c1c76a9c')}
            formikProps={formikProps}
          />
          <TextInputField
            name="livePrefix"
            label={translate('text_645d071272418a14c1c76aa6')}
            placeholder={translate('text_645d071272418a14c1c76ab0')}
            formikProps={formikProps}
          />
          <TextInputField
            name="hmacKey"
            label={translate('text_645d071272418a14c1c76aba')}
            placeholder={translate('text_645d071272418a14c1c76ac4')}
            formikProps={formikProps}
          />
        </Content>
      </Dialog>
    )
  }
)

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

AddAdyenDialog.displayName = 'AddAdyenDialog'
