import { useFormik } from 'formik'
import { useEffect } from 'react'

import { ComboBoxField, TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../FiltersPanelPoper'

type FiltersItemAmountProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export enum AmountFilterInterval {
  isBetween = 'isBetween',
  isEqualTo = 'isEqualTo',
  isUpTo = 'isUpTo',
  isAtLeast = 'isAtLeast',
}

const AMOUNT_INTERVALS = [
  { value: AmountFilterInterval.isBetween, label: 'text_1734774653389kvylgxjiltu' },
  { value: AmountFilterInterval.isEqualTo, label: 'text_1734774653389pt3rhh3lspa' },
  { value: AmountFilterInterval.isUpTo, label: 'text_1734792781750cot2uyp6f1x' },
  { value: AmountFilterInterval.isAtLeast, label: 'text_17347927817503hromltntvm' },
]

const FROM_INTERVALS = [
  AmountFilterInterval.isAtLeast,
  AmountFilterInterval.isEqualTo,
  AmountFilterInterval.isBetween,
]

const TO_INTERVALS = [AmountFilterInterval.isUpTo, AmountFilterInterval.isBetween]

export const FiltersItemAmount = ({ value = '', setFilterValue }: FiltersItemAmountProps) => {
  const { translate } = useInternationalization()

  const formikProps = useFormik({
    initialValues: {
      interval: '',
      amountFrom: value.split(',')?.[0],
      amountTo: value.split(',')?.[1],
    },
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: () => {},
  })

  const showFrom = FROM_INTERVALS.includes(formikProps.values.interval as AmountFilterInterval)
  const showTo = TO_INTERVALS.includes(formikProps.values.interval as AmountFilterInterval)

  useEffect(() => {
    formikProps.setFieldValue('amountFrom', '')
    formikProps.setFieldValue('amountTo', '')

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formikProps.values.interval])

  useEffect(() => {
    const amountFrom = formikProps.values.amountFrom
    const amountTo = formikProps.values.amountTo

    if (setFilterValue) {
      setFilterValue(`${amountFrom},${amountTo}`)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formikProps.values.amountFrom, formikProps.values.amountTo])

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <ComboBoxField
        name="interval"
        data={AMOUNT_INTERVALS.map((interval) => ({
          value: interval.value,
          label: translate(interval.label),
        }))}
        placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
        formikProps={formikProps}
      />

      {showFrom && (
        <TextInputField
          name="amountFrom"
          beforeChangeFormatter={['chargeDecimal']}
          type="number"
          placeholder="0.00"
          formikProps={formikProps}
        />
      )}

      {showTo && (
        <TextInputField
          name="amountTo"
          beforeChangeFormatter={['chargeDecimal']}
          type="number"
          placeholder="0.00"
          formikProps={formikProps}
        />
      )}
    </div>
  )
}
