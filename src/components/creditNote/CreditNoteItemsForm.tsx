import { useStore } from '@tanstack/react-form'
import _get from 'lodash/get'
import { useMemo } from 'react'

import { CreditNoteFormItem } from '~/components/creditNote/CreditNoteFormItem'
import { FeesPerInvoice, FromFee } from '~/components/creditNote/types'
import { Typography } from '~/components/designSystem/Typography'
import { Checkbox } from '~/components/form/Checkbox'
import { intlFormatDateTime } from '~/core/timezone'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { CREDIT_NOTE_DEFAULT_VALUES } from '~/pages/createCreditNote/validationSchema'

export const getSubscriptionCheckboxTestId = (subscriptionKey: string) =>
  `subscription-checkbox-${subscriptionKey}`

const determineCheckboxValue = (
  initialValue: boolean | undefined | null,
  additionalValue: boolean | undefined,
) => {
  if (initialValue === undefined || additionalValue === undefined) return undefined
  if (initialValue === null) {
    return additionalValue
  }
  if (initialValue !== additionalValue) {
    return undefined
  }
  return additionalValue
}

interface CreditNoteItemsFormExtraProps {
  isPrepaidCreditsInvoice: boolean
  feeForCredit?: FromFee[]
  feeForAddOn?: FromFee[]
  feesPerInvoice?: FeesPerInvoice
  currency: CurrencyEnum
}

const creditNoteItemsFormDefaultProps: CreditNoteItemsFormExtraProps = {
  isPrepaidCreditsInvoice: false,
  currency: CurrencyEnum.Usd,
}

export const CreditNoteItemsForm = withForm({
  defaultValues: CREDIT_NOTE_DEFAULT_VALUES,
  props: creditNoteItemsFormDefaultProps,
  render: function CreditNoteItemsFormRender({
    form,
    isPrepaidCreditsInvoice,
    feeForCredit,
    feeForAddOn,
    feesPerInvoice,
    currency,
  }) {
    const { translate } = useInternationalization()

    const fees = useStore(form.store, (state) => state.values.fees)
    const isCreditFeeChecked = useStore(form.store, (state) =>
      Boolean(state.values.creditFee?.[0]?.checked),
    )

    const checkboxGroupValue = useMemo(() => {
      return Object.keys(fees || {}).reduce((acc, subscriptionKey) => {
        const subscriptionValues = (fees || {})[subscriptionKey]
        let subscriptionGroupValue: boolean | undefined | null = null

        subscriptionValues.fees?.forEach((fee) => {
          subscriptionGroupValue = determineCheckboxValue(subscriptionGroupValue, fee?.checked)
        })

        return { ...acc, [subscriptionKey]: { value: subscriptionGroupValue } }
      }, {})
    }, [fees])

    return (
      <div>
        {isPrepaidCreditsInvoice && (
          <div className="flex h-12 flex-row items-center justify-between shadow-b">
            <Checkbox
              label={
                <Typography variant="bodyHl" color="grey500">
                  {translate('text_661ff6e56ef7e1b7c542b200')}
                </Typography>
              }
              value={isCreditFeeChecked}
              onChange={(_, value) => {
                form.setFieldValue('creditFee', (rows) =>
                  (rows || []).map((fee) => ({ ...fee, checked: value })),
                )
              }}
            />

            <Typography variant="bodyHl" color="grey500">
              {translate('text_636bedf292786b19d3398ee0')}
            </Typography>
          </div>
        )}

        {feeForCredit &&
          feeForCredit.map((fee, i) => (
            <CreditNoteFormItem
              key={fee?.id}
              form={form}
              currency={currency}
              feeName={translate('text_1729262241097k3cnpci6p5j')}
              fieldKey={`creditFee[${i}]`}
              maxValue={fee?.maxAmount}
              isReadOnly={fee?.isReadOnly}
            />
          ))}

        {feeForAddOn &&
          feeForAddOn.map((fee, i) => (
            <CreditNoteFormItem
              key={fee?.id}
              form={form}
              currency={currency}
              feeName={fee?.name}
              fieldKey={`addOnFee[${i}]`}
              maxValue={fee?.maxAmount}
              isReadOnly={fee?.isReadOnly}
            />
          ))}

        {feesPerInvoice &&
          Object.keys(feesPerInvoice).map((subKey) => {
            const subscription = feesPerInvoice[subKey]

            return (
              <div key={subKey}>
                <div className="flex h-12 flex-row items-center justify-between shadow-b">
                  <Checkbox
                    canBeIndeterminate
                    value={_get(checkboxGroupValue, `${subKey}.value`)}
                    label={
                      <Typography variant="bodyHl" color="grey500">
                        {subscription?.subscriptionName}
                      </Typography>
                    }
                    data-test={getSubscriptionCheckboxTestId(subKey)}
                    onChange={(_, value) => {
                      const currentSubscription = fees?.[subKey]

                      if (!currentSubscription) return

                      form.setFieldValue('fees', {
                        ...fees,
                        [subKey]: {
                          ...currentSubscription,
                          fees: (currentSubscription.fees || []).map((fee) => ({
                            ...fee,
                            checked: value,
                          })),
                        },
                      })
                    }}
                  />
                  <Typography variant="bodyHl" color="grey500">
                    {translate('text_636bedf292786b19d3398ee0')}
                  </Typography>
                </div>
                {subscription?.fees?.map((fee, feeIndex) => (
                  <CreditNoteFormItem
                    key={fee?.id}
                    form={form}
                    currency={currency}
                    feeName={`${fee?.name}${
                      fee.isTrueUpFee ? ` - ${translate('text_64463aaa34904c00a23be4f7')}` : ''
                    }`}
                    fieldKey={`fees.${subKey}.fees[${feeIndex}]`}
                    maxValue={fee?.maxAmount || 0}
                    feeSucceededAt={
                      !!fee?.succeededAt ? intlFormatDateTime(fee?.succeededAt).date : undefined
                    }
                    isReadOnly={fee?.isReadOnly}
                  />
                ))}
              </div>
            )
          })}
      </div>
    )
  },
})
