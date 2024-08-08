import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, Typography } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import {
  CreateDataExportsInvoicesInput,
  DataExportFormatTypeEnum,
  ExportTypeEnum,
  useCreateInvoicesDataExportMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { theme } from '~/styles'

import { formatFiltersForInvoiceQuery } from '../designSystem/Filters/utils'
import { RadioGroupField } from '../form'

gql`
  mutation createInvoicesDataExport($input: CreateDataExportsInvoicesInput!) {
    createInvoicesDataExport(input: $input) {
      id
    }
  }
`

type ExportInvoicesDialogProps = {
  invoicesTotalCount: number | undefined
  invoicesVariablesSearchTerm: string | null | undefined
}

export interface ExportInvoicesDialogRef {
  openDialog: () => unknown
  closeDialog: () => unknown
}

export const ExportInvoicesDialog = forwardRef<ExportInvoicesDialogRef, ExportInvoicesDialogProps>(
  ({ invoicesTotalCount, invoicesVariablesSearchTerm }: ExportInvoicesDialogProps, ref) => {
    const { translate } = useInternationalization()
    const { currentUser } = useCurrentUser()
    let [searchParams] = useSearchParams()
    const [triggerCreateInvoicesDataExport] = useCreateInvoicesDataExportMutation({
      onCompleted({ createInvoicesDataExport }) {
        if (createInvoicesDataExport) {
          addToast({
            message: translate('text_66b323b63e76c400f78cd342'),
            severity: 'info',
          })
        }
      },
    })

    const formikProps = useFormik<Omit<CreateDataExportsInvoicesInput, 'filters'>>({
      initialValues: {
        format: DataExportFormatTypeEnum.Csv,
        resourceType: ExportTypeEnum.Invoices,
      },
      validationSchema: object().shape({
        format: string().required(''),
        resourceType: string().oneOf(Object.values(ExportTypeEnum)).required(''),
      }),
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: async (values) => {
        const filters = {
          ...formatFiltersForInvoiceQuery(searchParams),
          searchTerm: invoicesVariablesSearchTerm,
        }

        const res = await triggerCreateInvoicesDataExport({
          variables: {
            input: {
              ...values,
              filters,
            },
          },
        })

        // If error, prevent closing the dialog
        if (res.errors) return
      },
    })

    return (
      <Dialog
        ref={ref}
        title={translate('text_66b21236c939426d07ff9930')}
        description={translate('text_66b21236c939426d07ff9932')}
        onClose={() => {
          formikProps.resetForm()
          formikProps.validateForm()
        }}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_63eba8c65a6c8043feee2a14')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid || invoicesTotalCount === 0}
              onClick={async () => {
                await formikProps.submitForm()
                closeDialog()
              }}
            >
              {translate('text_66b21236c939426d07ff9940')}
            </Button>
          </>
        )}
      >
        <ExportInvoiceDialogContentWrapper>
          <InfosLineWrapper>
            <InfoLine>
              <Typography variant="caption" color="grey600">
                {translate('text_6419c64eace749372fc72b27')}
              </Typography>
              <Typography variant="body" color="grey700">
                {currentUser?.email}
              </Typography>
            </InfoLine>
            <InfoLine>
              <Typography variant="caption" color="grey600">
                {translate('text_66b21236c939426d07ff9936')}
              </Typography>
              <Typography variant="body" color="grey700">
                {translate('text_66b21236c939426d07ff9935')}
              </Typography>
            </InfoLine>
            <InfoLine>
              <Typography variant="caption" color="grey600">
                {translate('text_66b21236c939426d07ff9938')}
              </Typography>
              <Typography variant="body" color="grey700">
                {translate(
                  'text_66b21236c939426d07ff9937',
                  { invoicesTotalCount },
                  invoicesTotalCount,
                )}
              </Typography>
            </InfoLine>
          </InfosLineWrapper>

          <Separator />

          <ExportTypeLabelWrapper>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_66b21236c939426d07ff9939')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_66b21236c939426d07ff993a')}
            </Typography>
          </ExportTypeLabelWrapper>

          <RadioGroupField
            name="resourceType"
            optionsGapSpacing={4}
            optionLabelVariant="body"
            options={[
              {
                label: translate('text_66b21236c939426d07ff993b'),
                sublabel: translate('text_66b21236c939426d07ff993c'),
                value: ExportTypeEnum.Invoices,
              },
              {
                label: translate('text_66b21236c939426d07ff993d'),
                sublabel: translate('text_66b21236c939426d07ff993e'),
                value: ExportTypeEnum.InvoiceFees,
              },
            ]}
            formikProps={formikProps}
          />
        </ExportInvoiceDialogContentWrapper>
      </Dialog>
    )
  },
)

ExportInvoicesDialog.displayName = 'ExportInvoicesDialog'

const ExportInvoiceDialogContentWrapper = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

const InfosLineWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(3)};
`

const InfoLine = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};

  > *:first-child {
    width: 140px;
  }

  > *:last-child {
    flex: 1;
  }
`

const Separator = styled.div`
  width: 100%;
  border-bottom: 1px solid ${theme.palette.grey[300]};
  margin: ${theme.spacing(8)} 0;
`

const ExportTypeLabelWrapper = styled.div`
  margin-bottom: ${theme.spacing(4)};
`
