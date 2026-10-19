import InputAdornment from '@mui/material/InputAdornment'
import { useMemo } from 'react'

import {
  booleanToNotifyOn,
  getThresholdCodeErrors,
  notifyOnToBoolean,
} from '~/components/alerts/utils'
import { Button } from '~/components/designSystem/Button'
import { ChargeTable } from '~/components/designSystem/Table/ChargeTable'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import {
  AmountInput,
  AmountValueFormatter,
  ComboBox,
  Switch,
  TextInput,
  ValueFormatter,
  ValueFormatterType,
} from '~/components/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, ThresholdInput } from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'

export const THRESHOLDS_ROW_LABEL_TEST_ID = 'thresholds-row-label'
export const THRESHOLDS_RECURRING_ROW_LABEL_TEST_ID = 'thresholds-recurring-row-label'
export const THRESHOLDS_NOTIFY_WHEN_RESOLVED_TEST_ID = 'thresholds-notify-when-resolved'
export const THRESHOLDS_RECURRING_NOTIFY_WHEN_RESOLVED_TEST_ID =
  'thresholds-recurring-notify-when-resolved'
export const THRESHOLDS_CODE_ERROR_TEST_ID = 'thresholds-code-error'

export const isThresholdValueValid = (
  index: number,
  value: string,
  previousThreshold: ThresholdInput[],
  reverse?: boolean,
) => {
  const valueNum = Number(value)
  const previous = Number(previousThreshold[index - 1]?.value)

  const compared = reverse ? valueNum >= previous : valueNum <= previous

  return index > 0 && value !== '' && compared
}

const ValueInput = ({
  currency,
  onChange,
  shouldDisplayError = false,
  shouldHandleUnits = false,
  translate,
  value,
  unitsLabel,
  allowNegativeValues,
}: {
  currency: CurrencyEnum
  onChange: (value: string) => void
  value: string
  shouldDisplayError?: boolean
  shouldHandleUnits?: boolean
  translate: TranslateFunc
  unitsLabel?: string
  allowNegativeValues?: boolean
}) => {
  if (shouldHandleUnits) {
    const beforeChangeFormatter: ValueFormatterType[] = [
      ...(allowNegativeValues ? [] : [ValueFormatter.positiveNumber]),
      ValueFormatter.int,
    ]

    return (
      <TextInput
        variant="outlined"
        beforeChangeFormatter={beforeChangeFormatter}
        error={shouldDisplayError}
        value={value}
        onChange={onChange}
        placeholder="0"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {unitsLabel || translate('text_6282085b4f283b0102655884')}
            </InputAdornment>
          ),
        }}
      />
    )
  }

  const beforeChangeFormatter: AmountValueFormatter[] = allowNegativeValues
    ? []
    : [ValueFormatter.positiveNumber]

  return (
    <AmountInput
      variant="outlined"
      error={shouldDisplayError}
      beforeChangeFormatter={beforeChangeFormatter}
      currency={currency}
      value={value}
      onChange={onChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">{getCurrencySymbol(currency)}</InputAdornment>
        ),
      }}
    />
  )
}

const NOTIFY_WHEN_RESOLVED_TRUE = 'true'
const NOTIFY_WHEN_RESOLVED_FALSE = 'false'

const NotifyWhenResolvedInput = ({
  value,
  onChange,
  translate,
  disabled = false,
  dataTest,
}: {
  value: boolean
  onChange?: (value: boolean) => void
  translate: TranslateFunc
  disabled?: boolean
  dataTest: string
}): JSX.Element => (
  <ComboBox
    variant="outlined"
    disableClearable
    sortValues={false}
    disabled={disabled}
    data-test={dataTest}
    value={value ? NOTIFY_WHEN_RESOLVED_TRUE : NOTIFY_WHEN_RESOLVED_FALSE}
    data={[
      { label: translate('text_65251f4cd55aeb004e5aa5ef'), value: NOTIFY_WHEN_RESOLVED_FALSE },
      { label: translate('text_65251f46339c650084ce0d57'), value: NOTIFY_WHEN_RESOLVED_TRUE },
    ]}
    onChange={(newValue) => onChange?.(newValue === NOTIFY_WHEN_RESOLVED_TRUE)}
  />
)

const INCREASING_COPY_KEYS = {
  firstRow: 'text_1747921119080dk04aab1ecy',
  recurringSwitchLabel: 'text_1791364076473ecdejxgegz1',
  recurringSwitchSubLabel: 'text_1791364076473ntqbftrbupz',
  recurringRow: 'text_17241798877230y851fdxzqu',
}

const DECREASING_COPY_KEYS: typeof INCREASING_COPY_KEYS = {
  firstRow: 'text_17913640764735guuliakuv6',
  recurringSwitchLabel: 'text_1791364076473qvli2f42tos',
  recurringSwitchSubLabel: 'text_1791364076473rfetdcmq055',
  recurringRow: 'text_1791364076473tj13xy14d28',
}

const AlertThresholds = ({
  thresholds,
  setThresholds,
  setThresholdValue,
  currency,
  shouldHandleUnits,
  unitsLabel,
  unitsTitle,
  reversedThreshold,
  allowNegativeValues,
}: {
  thresholds: ThresholdInput[]
  setThresholds: (thresholds: ThresholdInput[]) => void
  setThresholdValue: ({
    index,
    key,
    newValue,
  }: {
    index: number
    key: keyof ThresholdInput
    newValue: unknown
  }) => void
  currency: CurrencyEnum
  shouldHandleUnits: boolean
  unitsLabel?: string
  unitsTitle?: string
  reversedThreshold?: boolean
  allowNegativeValues?: boolean
}) => {
  const { translate } = useInternationalization()
  const copyKeys = reversedThreshold ? DECREASING_COPY_KEYS : INCREASING_COPY_KEYS

  const recurringIndex = thresholds.findIndex((t) => t.recurring)
  const hasRecurringThreshold = recurringIndex !== -1

  const addThreshold = ({ recurring = false }: { recurring?: boolean } = {}) => {
    const thresholdsToUpdate = [...thresholds]
    const newThreshold: ThresholdInput = {
      code: '',
      value: '',
      recurring,
      notifyOn: booleanToNotifyOn(false),
    }

    if (!recurring && hasRecurringThreshold && recurringIndex > 0) {
      thresholdsToUpdate.splice(recurringIndex, 0, newThreshold)
    } else {
      thresholdsToUpdate.push(newThreshold)
    }

    setThresholds(thresholdsToUpdate)
  }

  const deleteThreshold = (index: number) => {
    const newThresholds = [...thresholds].filter((_, i) => i !== index)

    setThresholds(newThresholds)
  }

  const onSwitchClick = () => {
    if (!hasRecurringThreshold) {
      addThreshold({ recurring: true })
    } else {
      if (recurringIndex !== -1) {
        deleteThreshold(recurringIndex)
      }
    }
  }

  const nonRecurringThresholds = useMemo(
    () => thresholds.filter((threshold) => !threshold.recurring),
    [thresholds],
  )

  const codeErrors = useMemo(() => getThresholdCodeErrors(thresholds), [thresholds])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col">
        <Button
          className="mb-2 ml-auto"
          startIcon="plus"
          variant="inline"
          onClick={() => addThreshold()}
          data-test="add-new-non-recurring-threshold-button"
        >
          {translate('text_1724233213997l2ksi40t8q6')}
        </Button>
        <div className="-mx-4 -my-1 overflow-auto px-4 py-1">
          <ChargeTable
            name="graduated-percentage-charge-table"
            data={nonRecurringThresholds.map((localData, i) => ({
              ...localData,
              disabledDelete: i === 0,
            }))}
            onDeleteRow={(_, i) => {
              // Recurring threshold will always be at the end of the array
              // So we can use the index to delete the non-recurring threshold
              deleteThreshold(i)
            }}
            deleteTooltipContent={translate('text_17242522324608198c2vblmw')}
            columns={[
              {
                size: 200,
                content: (_, i) => (
                  <Typography
                    className="px-4"
                    variant="captionHl"
                    noWrap
                    data-test={THRESHOLDS_ROW_LABEL_TEST_ID}
                  >
                    {translate(i === 0 ? copyKeys.firstRow : 'text_1724179887723917j8ezkd9v')}
                  </Typography>
                ),
              },
              {
                size: 155,
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate(
                      shouldHandleUnits
                        ? unitsTitle || 'text_1748858070139kmh56doz3la'
                        : 'text_1748858044483q61vd2npre7',
                    )}
                  </Typography>
                ),
                content: (row, i) => {
                  const shouldDisplayError = isThresholdValueValid(
                    i,
                    row.value,
                    nonRecurringThresholds,
                    reversedThreshold,
                  )

                  const tooltipTitle = translate(
                    reversedThreshold
                      ? 'text_1773223136519pcuvc8zwoyf'
                      : 'text_1724252232460i4tv7384iiy',
                    {
                      value: nonRecurringThresholds[i - 1]?.value,
                    },
                  )

                  return (
                    <Tooltip
                      placement="top"
                      title={tooltipTitle}
                      disableHoverListener={!shouldDisplayError}
                    >
                      <ValueInput
                        currency={currency}
                        onChange={(value) => {
                          setThresholdValue({
                            index: i,
                            key: 'value',
                            newValue: String(value) || undefined,
                          })
                        }}
                        shouldDisplayError={shouldDisplayError}
                        shouldHandleUnits={shouldHandleUnits}
                        translate={translate}
                        value={row.value}
                        unitsLabel={unitsLabel}
                        allowNegativeValues={allowNegativeValues}
                      />
                    </Tooltip>
                  )
                },
              },
              {
                size: 140,
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate('text_1748334091887k4p2p41jdou')}
                  </Typography>
                ),
                content: (row, i) => {
                  const codeError = codeErrors[i]

                  return (
                    <Tooltip
                      placement="top"
                      title={codeError ? translate(codeError) : ''}
                      disableHoverListener={!codeError}
                    >
                      <TextInput
                        variant="outlined"
                        error={!!codeError}
                        data-test={codeError ? THRESHOLDS_CODE_ERROR_TEST_ID : undefined}
                        placeholder={translate('text_1747921154885jqsl0c9xhro')}
                        value={row.code ?? ''}
                        onChange={(value) => {
                          setThresholdValue({
                            index: i,
                            key: 'code',
                            newValue: value === '' ? undefined : value,
                          })
                        }}
                      />
                    </Tooltip>
                  )
                },
              },
              {
                size: 180,
                title: (
                  <Typography className="px-4" variant="captionHl" noWrap>
                    {translate('text_1792439710542ctc2yq2zptb')}
                  </Typography>
                ),
                content: (row, i) => (
                  <NotifyWhenResolvedInput
                    dataTest={THRESHOLDS_NOTIFY_WHEN_RESOLVED_TEST_ID}
                    translate={translate}
                    value={notifyOnToBoolean(row.notifyOn)}
                    onChange={(notifyWhenResolved) => {
                      setThresholdValue({
                        index: i,
                        key: 'notifyOn',
                        newValue: notifyWhenResolved,
                      })
                    }}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>
      <Switch
        name="recurring-threshold"
        className="w-fit cursor-pointer"
        data-test="add-new-recurring-threshold-switch"
        checked={hasRecurringThreshold}
        onChange={onSwitchClick}
        label={translate(copyKeys.recurringSwitchLabel)}
        subLabel={translate(copyKeys.recurringSwitchSubLabel)}
      />
      {hasRecurringThreshold && (
        <div className="-mx-4 -my-1 overflow-auto px-4 py-1">
          <ChargeTable
            name={'progressive-billing-recurring'}
            data={thresholds.filter((threshold) => threshold.recurring) || []}
            columns={[
              {
                size: 200,
                content: () => (
                  <Typography
                    className="px-4"
                    variant="captionHl"
                    noWrap
                    data-test={THRESHOLDS_RECURRING_ROW_LABEL_TEST_ID}
                  >
                    {translate(copyKeys.recurringRow)}
                  </Typography>
                ),
              },
              {
                size: 155,
                content: (row) => (
                  <ValueInput
                    currency={currency}
                    onChange={(value) => {
                      setThresholdValue({
                        index: recurringIndex,
                        key: 'value',
                        newValue: String(value) || undefined,
                      })
                    }}
                    shouldHandleUnits={shouldHandleUnits}
                    translate={translate}
                    value={row.value}
                    unitsLabel={unitsLabel}
                    allowNegativeValues={allowNegativeValues}
                  />
                ),
              },
              {
                size: 140,
                content: (row) => (
                  <TextInput
                    variant="outlined"
                    placeholder={translate('text_1747921154885jqsl0c9xhro')}
                    value={row.code ?? ''}
                    onChange={(value) => {
                      setThresholdValue({
                        index: recurringIndex,
                        key: 'code',
                        newValue: value === '' ? undefined : value,
                      })
                    }}
                  />
                ),
              },
              {
                size: 180,
                content: () => (
                  <NotifyWhenResolvedInput
                    disabled
                    dataTest={THRESHOLDS_RECURRING_NOTIFY_WHEN_RESOLVED_TEST_ID}
                    translate={translate}
                    value={false}
                  />
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}

export default AlertThresholds
