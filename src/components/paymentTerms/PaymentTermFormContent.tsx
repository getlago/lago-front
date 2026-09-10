import InputAdornment from '@mui/material/InputAdornment'
import { useStore } from '@tanstack/react-form'
import { z } from 'zod'

import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import { PAYMENT_TERM_INPUT_CLASSNAME } from '~/core/constants/form'
import {
  PAYMENT_TERM_DAY_OF_MONTH_MAX,
  PAYMENT_TERM_DAY_OF_MONTH_MIN,
  PAYMENT_TERM_DEFAULT_MONTH_OFFSET,
  PAYMENT_TERM_FIELDS_BY_TYPE,
  PAYMENT_TERM_INHERIT,
  PAYMENT_TERM_MONTH_OFFSET_MAX,
  PAYMENT_TERM_MONTH_OFFSET_MIN,
} from '~/core/constants/paymentTerm'
import { ResolvablePaymentTerm } from '~/core/utils/paymentTerm'
import { PaymentTermTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { usePaymentTerm } from '~/hooks/usePaymentTerm'

export const PAYMENT_TERM_TYPE_COMBOBOX_TEST_CLASSNAME = PAYMENT_TERM_INPUT_CLASSNAME
export const PAYMENT_TERM_DUE_DATE_PREVIEW_TEST_ID = 'payment-term-due-date-preview'

export type PaymentTermType = PaymentTermTypeEnum | typeof PAYMENT_TERM_INHERIT

/**
 * `termType` starts out unset, so a level with no term of its own and nothing to inherit
 * from reports a required-field error instead of submitting an empty term. A level that
 * can inherit is seeded with `PAYMENT_TERM_INHERIT` by its caller.
 *
 * The numeric fields are seeded rather than left blank so that switching term type
 * reveals a usable value straight away. Values belonging to a type the user moved away
 * from are simply not sent: `buildPaymentTermInput` emits only the chosen type's fields.
 */
export const PAYMENT_TERM_FORM_DEFAULT_VALUES = {
  termType: undefined as PaymentTermType | undefined,
  days: 0 as number | '',
  dayOfMonth: PAYMENT_TERM_DAY_OF_MONTH_MIN as number | '',
  monthOffset: PAYMENT_TERM_DEFAULT_MONTH_OFFSET as number | '',
}

export type PaymentTermFormValues = typeof PAYMENT_TERM_FORM_DEFAULT_VALUES

/** Whether the value stands for a concrete term rather than the inherit choice. */
export const isConcreteTermType = (
  termType: PaymentTermType | undefined,
): termType is PaymentTermTypeEnum => !!termType && termType !== PAYMENT_TERM_INHERIT

const isPositiveIntegerWithin = (value: number | '', min: number, max: number): boolean =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max

/**
 * Mirrors the API's discriminated-union validation: a type's own fields are required and
 * bounded, and nothing else is looked at.
 */
export const paymentTermFormSchema = z
  .object({
    termType: z.union([z.enum(PaymentTermTypeEnum), z.literal(PAYMENT_TERM_INHERIT)], {
      message: 'text_1789042962229hmb871mrfas',
    }),
    days: z.union([z.number(), z.literal('')]),
    dayOfMonth: z.union([z.number(), z.literal('')]),
    monthOffset: z.union([z.number(), z.literal('')]),
  })
  .superRefine((values, ctx) => {
    if (!isConcreteTermType(values.termType)) return

    const fields = PAYMENT_TERM_FIELDS_BY_TYPE[values.termType]

    if (
      fields.includes('days') &&
      !isPositiveIntegerWithin(values.days, 0, Number.MAX_SAFE_INTEGER)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['days'],
        message: 'text_1789042962229bk0kdnqlbpc',
      })
    }

    if (
      fields.includes('dayOfMonth') &&
      !isPositiveIntegerWithin(
        values.dayOfMonth,
        PAYMENT_TERM_DAY_OF_MONTH_MIN,
        PAYMENT_TERM_DAY_OF_MONTH_MAX,
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['dayOfMonth'],
        message: 'text_1789042962229ojqymcu3289',
      })
    }

    // Absent is valid — the API fills the default — but a value that is present must be in range.
    if (
      fields.includes('monthOffset') &&
      values.monthOffset !== '' &&
      !isPositiveIntegerWithin(
        values.monthOffset,
        PAYMENT_TERM_MONTH_OFFSET_MIN,
        PAYMENT_TERM_MONTH_OFFSET_MAX,
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['monthOffset'],
        message: 'text_1789042962229esmw981wwyt',
      })
    }
  })

/** Turns the form's string-tolerant values into a term the date math can read. */
export const paymentTermFromFormValues = (
  values: PaymentTermFormValues,
): ResolvablePaymentTerm | null => {
  if (!isConcreteTermType(values.termType)) return null

  return {
    termType: values.termType,
    days: values.days === '' ? 0 : Number(values.days),
    dayOfMonth: values.dayOfMonth === '' ? null : Number(values.dayOfMonth),
    monthOffset: values.monthOffset === '' ? null : Number(values.monthOffset),
  }
}

type PaymentTermFormContentExtraProps = {
  /**
   * Prepends an inherit choice to the term type list, labelled with the value that would
   * be inherited. Omit it on a level that has no parent to fall back to.
   */
  inheritedFrom?: { term: ResolvablePaymentTerm; labelKey: string }
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
