/* eslint-disable tailwindcss/no-custom-classname */
import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Chip, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { RadioField, TextInput, TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import {
  DocumentNumberingEnum,
  useUpdateOrganizationInvoiceNumberingMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { getInvoiceNumberPreview } from '~/pages/settings/InvoiceSettings'
import { theme } from '~/styles'

const DynamicPrefixTranslationLoohup = {
  [DocumentNumberingEnum.PerCustomer]: 'text_6566f920a1d6c35693d6cce0',
  [DocumentNumberingEnum.PerOrganization]: 'YYYYMM',
}

gql`
  fragment EditOrganizationInvoiceNumberingDialog on CurrentOrganization {
    id
    documentNumbering
    documentNumberPrefix
  }

  mutation updateOrganizationInvoiceNumbering($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      ...EditOrganizationInvoiceNumberingDialog
    }
  }
`

export interface EditOrganizationInvoiceNumberingDialogRef extends DialogRef {}

interface EditOrganizationInvoiceNumberingDialogProps {
  documentNumbering?: DocumentNumberingEnum
  documentNumberPrefix?: string
}

export const EditOrganizationInvoiceNumberingDialog = forwardRef<
  DialogRef,
  EditOrganizationInvoiceNumberingDialogProps
>(
  (
    { documentNumbering, documentNumberPrefix }: EditOrganizationInvoiceNumberingDialogProps,
    ref,
  ) => {
    const { translate } = useInternationalization()
    const [updateOrganizationInvoiceNumbering] = useUpdateOrganizationInvoiceNumberingMutation({
      onCompleted(res) {
        if (res?.updateOrganization) {
          addToast({
            severity: 'success',
            translateKey: 'text_6566f920a1d6c35693d6ce0f',
          })
        }
      },
    })

    // Type is manually written here as errors type are not correclty read from UpdateOrganizationInput
    const formikProps = useFormik<EditOrganizationInvoiceNumberingDialogProps>({
      initialValues: {
        documentNumbering,
        documentNumberPrefix,
      },
      validationSchema: object().shape({
        documentNumbering: string().required(''),
        documentNumberPrefix: string().required('').max(10, 'text_6566f920a1d6c35693d6cd77'),
      }),
      enableReinitialize: true,
      validateOnMount: true,
      onSubmit: async (values) => {
        await updateOrganizationInvoiceNumbering({
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
        title={translate('text_6566f920a1d6c35693d6cc8c')}
        description={translate('text_6566f920a1d6c35693d6cc94')}
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
              {translate('text_6566f920a1d6c35693d6cc8c')}
            </Button>
          </>
        )}
      >
        <Content>
          <PreviewBlock>
            <Chip label={translate('text_6566f920a1d6c35693d6cc9e')} />
            <Typography variant="body" color="grey700">
              {getInvoiceNumberPreview(
                formikProps.values.documentNumbering as DocumentNumberingEnum,
                formikProps.values.documentNumberPrefix || '',
              )}
            </Typography>
          </PreviewBlock>
          <RadioContainer>
            <Typography variant="captionHl" color="textSecondary">
              {translate('text_6566f920a1d6c35693d6ccae')}
            </Typography>
            <RadioWrapper>
              <RadioField
                name="documentNumbering"
                formikProps={formikProps}
                value={DocumentNumberingEnum.PerCustomer}
                label={translate('text_6566f920a1d6c35693d6ccb8')}
              />
              <RadioField
                name="documentNumbering"
                formikProps={formikProps}
                value={DocumentNumberingEnum.PerOrganization}
                label={translate('text_6566f920a1d6c35693d6ccc0')}
              />
            </RadioWrapper>
          </RadioContainer>
          <InlineInputsWrapper>
            <TextInputField
              name="documentNumberPrefix"
              formikProps={formikProps}
              label={translate('text_6566f920a1d6c35693d6ccc8')}
              error={
                formikProps.errors.documentNumberPrefix
                  ? translate(formikProps.errors.documentNumberPrefix)
                  : undefined
              }
            />
            <Typography className="separator" variant="body">
              -
            </Typography>
            <TextInput
              disabled
              label={translate('text_6566f920a1d6c35693d6ccd8')}
              value={translate(
                DynamicPrefixTranslationLoohup[
                  formikProps.values.documentNumbering as DocumentNumberingEnum
                ],
              )}
            />
            <Typography className="separator" variant="body">
              -
            </Typography>
            <TextInput disabled label={translate('text_6566f920a1d6c35693d6cce8')} value={'001'} />
          </InlineInputsWrapper>
        </Content>
      </Dialog>
    )
  },
)

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(8)};
  margin-bottom: ${theme.spacing(8)};
`

const PreviewBlock = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
  padding: ${theme.spacing(3)};
  box-sizing: border-box;
  border-radius: 11px;
  border: 1px solid ${theme.palette.grey[300]};
`

const RadioContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(1)};
`

const RadioWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(3)};
`

const InlineInputsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 8px 1fr 8px 80px;
  gap: ${theme.spacing(3)};

  .separator {
    height: fit-content;
    margin-top: 34px;
  }
`

EditOrganizationInvoiceNumberingDialog.displayName = 'forwardRef'
