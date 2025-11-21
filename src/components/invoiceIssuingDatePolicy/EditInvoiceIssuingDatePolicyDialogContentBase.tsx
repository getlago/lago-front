import { FormikProps, FormikValues } from 'formik'
import { Alert, Button, Dialog, DialogRef, Typography } from 'lago-design-system'
import { ForwardedRef, forwardRef } from 'react'

import { ComboBoxField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useIssuingDatePolicy } from '~/hooks/useIssuingDatePolicy'

export type EditInvoiceIssuingDatePolicyDialogContentProps<
  FormValues extends FormikValues = FormikValues,
> = {
  formikProps: FormikProps<FormValues>
  descriptionCopyAsHtml: string
  expectedIssuingDateCopy: string
}
export type EditInvoiceIssuingDatePolicyDialogContentRef = DialogRef
type EditInvoiceIssuingDatePolicyDialogContentComponent = <
  FormValues extends FormikValues = FormikValues,
>(
  props: EditInvoiceIssuingDatePolicyDialogContentProps<FormValues> & {
    ref?: ForwardedRef<EditInvoiceIssuingDatePolicyDialogContentRef>
  },
) => JSX.Element

type EditInvoiceIssuingDatePolicyDialogContentComponentWithDisplayName =
  EditInvoiceIssuingDatePolicyDialogContentComponent & {
    displayName?: string
  }

export const EditInvoiceIssuingDatePolicyDialogContentBase = forwardRef(
  function EditInvoiceIssuingDatePolicyDialogContentBase<
    FormValues extends FormikValues = FormikValues,
  >(
    {
      formikProps,
      descriptionCopyAsHtml,
      expectedIssuingDateCopy,
    }: EditInvoiceIssuingDatePolicyDialogContentProps<FormValues>,
    ref: ForwardedRef<EditInvoiceIssuingDatePolicyDialogContentRef>,
  ): JSX.Element {
    const { translate } = useInternationalization()
    const { anchorComboboxData, adjustmentComboboxData } = useIssuingDatePolicy()

    return (
      <Dialog
        ref={ref}
        title={translate('text_1763407386500gd23ly5ygu8')}
        description={translate('text_1763407386500yt8w46cn30c')}
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
              {translate('text_17634073865002q0veaoj93x')}
            </Button>
          </>
        )}
      >
        <div className="mb-8 flex flex-col gap-6">
          <ComboBoxField
            data={anchorComboboxData}
            description={translate('text_1763407386500ufugm1tbr1y')}
            formikProps={formikProps}
            label={translate('text_176340738650029coq7946ow')}
            name="subscriptionInvoiceIssuingDateAnchor"
            placeholder={translate('text_1763407386500w1jtfr1k45l')}
            PopperProps={{ displayInDialog: true }}
            sortValues={false}
          />

          <ComboBoxField
            data={adjustmentComboboxData}
            description={translate('text_1763407386500gq305qitju2')}
            formikProps={formikProps}
            label={translate('text_1763407386500wht1c5kxn47')}
            name="subscriptionInvoiceIssuingDateAdjustment"
            placeholder={translate('text_1763407386500ut31bl1smol')}
            PopperProps={{ displayInDialog: true }}
            sortValues={false}
          />

          <Alert type="info">
            <Typography variant="body" color="grey700" html={descriptionCopyAsHtml} />
            <br />
            <Typography variant="bodyHl" color="grey700">
              {expectedIssuingDateCopy}
            </Typography>
          </Alert>
        </div>
      </Dialog>
    )
  },
) as EditInvoiceIssuingDatePolicyDialogContentComponentWithDisplayName

EditInvoiceIssuingDatePolicyDialogContentBase.displayName =
  'EditInvoiceIssuingDatePolicyDialogContentBase'
