import { useStore } from '@tanstack/react-form'

import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import { ALL_ADJUSTMENT_VALUES, ALL_ANCHOR_VALUES } from '~/core/constants/issuingDatePolicy'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { useIssuingDatePolicy } from '~/hooks/useIssuingDatePolicy'

export const EDIT_INVOICE_ISSUING_DATE_POLICY_DIALOG_ANCHOR_COMBOBOX_TEST_CLASSNAME =
  'edit-invoice-issuing-date-policy-dialog-anchor-combobox'
export const EDIT_INVOICE_ISSUING_DATE_POLICY_DIALOG_ADJUSTMENT_COMBOBOX_TEST_CLASSNAME =
  'edit-invoice-issuing-date-policy-dialog-adjustment-combobox'

export const EDIT_INVOICE_ISSUING_DATE_POLICY_FORM_DEFAULT_VALUES = {
  subscriptionInvoiceIssuingDateAnchor: '' as string | undefined,
  subscriptionInvoiceIssuingDateAdjustment: '' as string | undefined,
}

type EditInvoiceIssuingDatePolicyFormExtraProps = {
  gracePeriod: number | null | undefined
}

const editInvoiceIssuingDatePolicyFormContentDefaultProps: EditInvoiceIssuingDatePolicyFormExtraProps =
  {
    gracePeriod: 0,
  }

export const EditInvoiceIssuingDatePolicyFormContent = withForm({
  defaultValues: EDIT_INVOICE_ISSUING_DATE_POLICY_FORM_DEFAULT_VALUES,
  props: editInvoiceIssuingDatePolicyFormContentDefaultProps,
  render: function EditInvoiceIssuingDatePolicyFormContentRender({ form, gracePeriod }) {
    const { translate } = useInternationalization()
    const { anchorComboboxData, adjustmentComboboxData, getIssuingDateInfoForAlert } =
      useIssuingDatePolicy()

    const anchorValue = useStore(
      form.store,
      (state) => state.values.subscriptionInvoiceIssuingDateAnchor,
    )
    const adjustmentValue = useStore(
      form.store,
      (state) => state.values.subscriptionInvoiceIssuingDateAdjustment,
    )

    const { descriptionCopyAsHtml, expectedIssuingDateCopy } = getIssuingDateInfoForAlert({
      gracePeriod: gracePeriod ?? 0,
      subscriptionInvoiceIssuingDateAdjustment: (adjustmentValue || undefined) as
        (typeof ALL_ADJUSTMENT_VALUES)[keyof typeof ALL_ADJUSTMENT_VALUES] | undefined,
      subscriptionInvoiceIssuingDateAnchor: (anchorValue || undefined) as
        (typeof ALL_ANCHOR_VALUES)[keyof typeof ALL_ANCHOR_VALUES] | undefined,
    })

    return (
      <div className="flex flex-col gap-6 p-8">
        <form.AppField name="subscriptionInvoiceIssuingDateAnchor">
          {(field) => (
            <field.ComboBoxField
              className={EDIT_INVOICE_ISSUING_DATE_POLICY_DIALOG_ANCHOR_COMBOBOX_TEST_CLASSNAME}
              data={anchorComboboxData}
              description={translate('text_1763407386500ufugm1tbr1y')}
              label={translate('text_176340738650029coq7946ow')}
              placeholder={translate('text_1763407386500w1jtfr1k45l')}
              PopperProps={{ displayInDialog: true }}
              sortValues={false}
            />
          )}
        </form.AppField>

        <form.AppField name="subscriptionInvoiceIssuingDateAdjustment">
          {(field) => (
            <field.ComboBoxField
              className={EDIT_INVOICE_ISSUING_DATE_POLICY_DIALOG_ADJUSTMENT_COMBOBOX_TEST_CLASSNAME}
              data={adjustmentComboboxData}
              description={translate('text_1763407386500gq305qitju2')}
              label={translate('text_1763407386500wht1c5kxn47')}
              placeholder={translate('text_1763407386500ut31bl1smol')}
              PopperProps={{ displayInDialog: true }}
              sortValues={false}
            />
          )}
        </form.AppField>

        <Alert type="info">
          <Typography variant="body" color="grey700" html={descriptionCopyAsHtml} />
          <br />
          <Typography variant="bodyHl" color="grey700">
            {expectedIssuingDateCopy}
          </Typography>
        </Alert>
      </div>
    )
  },
})
