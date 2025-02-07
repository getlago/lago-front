import { FormikProps } from 'formik'
import _get from 'lodash/get'
import { DateTime } from 'luxon'
import { FC, useMemo } from 'react'

import { CreditNoteFormItem } from '~/components/creditNote/CreditNoteFormItem'
import { CreditNoteForm, FeesPerInvoice, FromFee, GroupedFee } from '~/components/creditNote/types'
import { Typography } from '~/components/designSystem'
import { Checkbox } from '~/components/form/Checkbox'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

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

interface CreditNoteItemsFormProps {
  isPrepaidCreditsInvoice: boolean
  formikProps: FormikProps<Partial<CreditNoteForm>>
  feeForCredit?: FromFee[]
  feeForAddOn?: FromFee[]
  feesPerInvoice?: FeesPerInvoice
  currency: CurrencyEnum
}

export const CreditNoteItemsForm: FC<CreditNoteItemsFormProps> = ({
  isPrepaidCreditsInvoice,
  formikProps,
  feeForCredit,
  feeForAddOn,
  feesPerInvoice,
  currency,
}) => {
  const { translate } = useInternationalization()

  const checkboxGroupValue = useMemo(() => {
    const fees = formikProps.values.fees || {}

    return (
      Object.keys(fees).reduce((acc, subscriptionKey) => {
        const subscriptionValues = fees[subscriptionKey]

        let subscriptionGroupValues: {
          value: undefined | boolean | null
          [key: string]: undefined | boolean | null
        } = {
          value: null,
        }

        Object.keys(subscriptionValues.fees).forEach((childKey) => {
          const child = subscriptionValues.fees[childKey] as FromFee

          if (typeof child?.checked === 'boolean') {
            subscriptionGroupValues = {
              ...subscriptionGroupValues,
              value: determineCheckboxValue(subscriptionGroupValues.value, child?.checked),
            }
          } else {
            let groupValue: boolean | undefined | null = null

            const grouped = (child as unknown as GroupedFee)?.grouped

            Object.keys(grouped || {}).forEach((groupedKey) => {
              const feeValues = grouped[groupedKey]

              groupValue = determineCheckboxValue(groupValue, feeValues.checked)
            })

            subscriptionGroupValues = {
              ...subscriptionGroupValues,
              [childKey]: groupValue,
              value: determineCheckboxValue(
                subscriptionGroupValues.value,
                groupValue as unknown as boolean | undefined,
              ),
            }
          }
        })

        return { ...acc, [subscriptionKey]: subscriptionGroupValues }
      }, {}) || {}
    )
  }, [formikProps.values.fees])

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
            value={formikProps.values.creditFee?.[0]?.checked}
            onChange={(_, value) => {
              formikProps.setFieldValue(`creditFee.0.checked`, value)
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
            formikProps={formikProps}
            currency={currency}
            feeName={translate('text_1729262241097k3cnpci6p5j')}
            formikKey={`creditFee.${i}`}
            maxValue={fee?.maxAmount}
          />
        ))}

      {feeForAddOn &&
        feeForAddOn.map((fee, i) => (
          <CreditNoteFormItem
            key={fee?.id}
            formikProps={formikProps}
            currency={currency}
            feeName={fee?.name}
            formikKey={`addOnFee.${i}`}
            maxValue={fee?.maxAmount}
          />
        ))}

      {feesPerInvoice &&
        Object.keys(feesPerInvoice).map((subKey) => {
          const subscription = feesPerInvoice[subKey]

          return (
            <div key={subKey}>
              <div className="flex h-12 flex-row items-center justify-between shadow-b">
                <Checkbox
                  value={_get(checkboxGroupValue, `${subKey}.value`)}
                  canBeIndeterminate
                  label={
                    <Typography variant="bodyHl" color="grey500">
                      {subscription?.subscriptionName}
                    </Typography>
                  }
                  onChange={(_, value) => {
                    const childValues = _get(
                      formikProps.values.fees,
                      `${subKey}.fees`,
                    ) as unknown as { [feeGroupId: string]: FromFee | GroupedFee }

                    formikProps.setFieldValue(
                      `fees.${subKey}.fees`,
                      Object.keys(childValues).reduce((acc, childKey) => {
                        const child = childValues[childKey] as FromFee

                        if (typeof child.checked === 'boolean') {
                          acc = { ...acc, [childKey]: { ...child, checked: value } }
                        } else {
                          const grouped = (child as unknown as GroupedFee)?.grouped

                          acc = {
                            ...acc,
                            [childKey]: {
                              ...child,
                              grouped: Object.keys(grouped || {}).reduce((accGroup, groupKey) => {
                                const fee = grouped[groupKey]

                                return {
                                  ...accGroup,
                                  [groupKey]: { ...fee, checked: value },
                                }
                              }, {}),
                            },
                          }
                        }
                        return acc
                      }, {}),
                    )
                  }}
                />
                <Typography variant="bodyHl" color="grey500">
                  {translate('text_636bedf292786b19d3398ee0')}
                </Typography>
              </div>
              {Object.keys(subscription?.fees)?.map((groupFeeKey) => {
                const child = subscription?.fees[groupFeeKey] as FromFee

                if (typeof child?.checked === 'boolean') {
                  return (
                    <CreditNoteFormItem
                      key={child?.id}
                      formikProps={formikProps}
                      currency={currency}
                      feeName={`${child?.name}${
                        child.isTrueUpFee ? ` - ${translate('text_64463aaa34904c00a23be4f7')}` : ''
                      }`}
                      formikKey={`fees.${subKey}.fees.${groupFeeKey}`}
                      maxValue={child?.maxAmount || 0}
                      feeSucceededAt={
                        !!child?.succeededAt
                          ? DateTime.fromISO(child?.succeededAt).toFormat('LLL. dd, yyyy')
                          : undefined
                      }
                    />
                  )
                }

                const grouped = (child as unknown as GroupedFee)?.grouped

                return (
                  <div key={groupFeeKey}>
                    {Object.keys(grouped).map((groupedFeeKey) => {
                      const fee = grouped[groupedFeeKey]

                      return (
                        <CreditNoteFormItem
                          key={fee?.id}
                          formikProps={formikProps}
                          currency={currency}
                          feeName={`${child.name} • ${fee?.name}${
                            fee.isTrueUpFee
                              ? ` - ${translate('text_64463aaa34904c00a23be4f7')}`
                              : ''
                          }`}
                          formikKey={`fees.${subKey}.fees.${groupFeeKey}.grouped.${fee?.id}`}
                          maxValue={fee?.maxAmount || 0}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
    </div>
  )
}
