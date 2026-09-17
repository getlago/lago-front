import InputAdornment from '@mui/material/InputAdornment'
import { useStore } from '@tanstack/react-form'

import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import { PAYMENT_TERM_FIELDS_BY_TYPE } from '~/core/constants/paymentTerm'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { usePaymentTerm } from '~/hooks/usePaymentTerm'

import {
  PAYMENT_TERM_DUE_DATE_PREVIEW_TEST_ID,
  PAYMENT_TERM_TYPE_COMBOBOX_TEST_CLASSNAME,
} from './dataTestConstants'
import { PAYMENT_TERM_FORM_DEFAULT_VALUES, PaymentTermInheritedFrom } from './types'
import { isConcreteTermType, paymentTermFromFormValues } from './utils'

type PaymentTermFormContentExtraProps = {
  /**
   * Prepends an inherit choice to the term type list, labelled with the value that would
   * be inherited. Omit it on a level that has no parent to fall back to.
   */
  inheritedFrom?: PaymentTermInheritedFrom
  /** Set when the form is rendered inside a dialog, so the popper escapes it. */
  displayInDialog?: boolean
}

const paymentTermFormContentDefaultProps: PaymentTermFormContentExtraProps = {
  inheritedFrom: undefined,
  displayInDialog: false,
}

/**
 * The payment term editor. Every surface that can carry a term renders this same block:
 * the term type, the numeric fields that type accepts, and a preview of the due date it
 * would produce.
 */
export const PaymentTermFormContent = withForm({
  defaultValues: PAYMENT_TERM_FORM_DEFAULT_VALUES,
  props: paymentTermFormContentDefaultProps,
  render: function PaymentTermFormContentRender({ form, inheritedFrom, displayInDialog }) {
    const { translate } = useInternationalization()
    const { getDueDatePreviewCopy, getTermTypeComboboxData } = usePaymentTerm()

    const termType = useStore(form.store, (state) => state.values.termType)
    const days = useStore(form.store, (state) => state.values.days)
    const dayOfMonth = useStore(form.store, (state) => state.values.dayOfMonth)
    const monthOffset = useStore(form.store, (state) => state.values.monthOffset)

    const fields = isConcreteTermType(termType) ? PAYMENT_TERM_FIELDS_BY_TYPE[termType] : []
    const previewTerm = paymentTermFromFormValues({ termType, days, dayOfMonth, monthOffset })

    return (
      <div className="flex flex-col gap-6">
        <form.AppField name="termType">
          {(field) => (
            <field.ComboBoxField
              className={PAYMENT_TERM_TYPE_COMBOBOX_TEST_CLASSNAME}
              data={getTermTypeComboboxData({ inheritedFrom })}
              disableClearable
              helperText={translate('text_1787603382163hij5oo9hsov')}
              label={translate('text_17876033821620igdzcdhzxl')}
              placeholder={translate('text_178760338216360dag3pqr3v')}
              PopperProps={{ displayInDialog }}
              sortValues={false}
            />
          )}
        </form.AppField>

        {fields.includes('days') && (
          <form.AppField name="days">
            {(field) => (
              <field.TextInputField
                beforeChangeFormatter={['positiveNumber', 'int']}
                label={translate('text_1787603382163iraqb5sxgi1')}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {translate('text_638dc196fb209d551f3d814d')}
                    </InputAdornment>
                  ),
                }}
              />
            )}
          </form.AppField>
        )}

        {fields.includes('dayOfMonth') && (
          <div className="flex flex-row items-end gap-3">
            <form.AppField name="dayOfMonth">
              {(field) => (
                <field.TextInputField
                  beforeChangeFormatter={['positiveNumber', 'int']}
                  className="flex-1"
                  label={translate('text_1787603382163oqy9psl295a')}
                />
              )}
            </form.AppField>

            <Typography className="pb-4" variant="body" color="grey700">
              -
            </Typography>

            <form.AppField name="monthOffset">
              {(field) => (
                <field.TextInputField
                  beforeChangeFormatter={['positiveNumber', 'int']}
                  className="flex-1"
                  label={translate('text_1787603382163w1trdmfds5q')}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {translate('text_1787603382163u2kxy2qxchd')}
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </form.AppField>
          </div>
        )}

        {!!previewTerm && (
          <Alert type="info">
            <Typography
              variant="body"
              color="grey700"
              data-test={PAYMENT_TERM_DUE_DATE_PREVIEW_TEST_ID}
            >
              {getDueDatePreviewCopy(previewTerm)}
            </Typography>
          </Alert>
        )}
      </div>
    )
  },
})
