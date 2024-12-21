import { useFormik } from 'formik'
import { forwardRef } from 'react'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, Typography } from '~/components/designSystem'
import {
  CreditNoteExportTypeEnum,
  DataExportFormatTypeEnum,
  InvoiceExportTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { theme } from '~/styles'

import { RadioGroupField } from '../form'

type ExportTypeEnum = CreditNoteExportTypeEnum | InvoiceExportTypeEnum

type ExportForm = {
  format: DataExportFormatTypeEnum
  resourceType: ExportTypeEnum
}

export type ExportValues<T> = {
  clientMutationId?: string
  format: DataExportFormatTypeEnum
  resourceType: T
}

type ExportDialogProps = {
  totalCountLabel: string
  onExport: (values: any) => void
  disableExport?: boolean
  resourceTypeOptions: {
    label: string
    sublabel: string
    value: ExportForm['resourceType']
  }[]
}

export interface ExportDialogRef {
  openDialog: () => unknown
  closeDialog: () => unknown
}

export const ExportDialog = forwardRef<ExportDialogRef, ExportDialogProps>(
  (
    { totalCountLabel, onExport, disableExport = false, resourceTypeOptions }: ExportDialogProps,
    ref,
  ) => {
    const { translate } = useInternationalization()
    const { currentUser } = useCurrentUser()

    const formikProps = useFormik<Omit<ExportForm, 'filters'>>({
      initialValues: {
        format: DataExportFormatTypeEnum.Csv,
        resourceType: resourceTypeOptions[0].value,
      },
      validationSchema: object().shape({
        format: string().required(''),
      }),
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: (values) => onExport(values),
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
              disabled={!formikProps.isValid || disableExport}
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
        <ExportDialogContentWrapper>
          <InfosLineWrapper>
            <InfoLine>
              <Typography variant="caption" color="grey600">
                {translate('text_6419c64eace749372fc72b27')} 2
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
                {totalCountLabel}
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
            options={resourceTypeOptions}
            formikProps={formikProps}
          />
        </ExportDialogContentWrapper>
      </Dialog>
    )
  },
)

ExportDialog.displayName = 'ExportDialog'

const ExportDialogContentWrapper = styled.div`
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
