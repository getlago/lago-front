import { InputAdornment } from '@mui/material'
import { Button, Tooltip, Typography } from 'lago-design-system'
import { useMemo } from 'react'

import { ChargeTable } from '~/components/designSystem'
import { AmountInput, Switch, TextInput } from '~/components/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, ThresholdInput } from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'

export const isThresholdValueValid = (
  index: number,
  value: string,
  previousThreshold: ThresholdInput[],
) => {
  return index > 0 && value !== '' && Number(value) <= Number(previousThreshold[index - 1]?.value)
}

const ValueInput = ({
  currency,
  onChange,
  shouldDisplayError = false,
  shouldHandleUnits = false,
  translate,
  value,
}: {
  currency: CurrencyEnum
  onChange: (value: string) => void
  value: string
  shouldDisplayError?: boolean
  shouldHandleUnits?: boolean
  translate: TranslateFunc
}) => {
  if (shouldHandleUnits) {
    return (
      <TextInput
        variant="outlined"
        beforeChangeFormatter={['positiveNumber', 'int']}
        error={shouldDisplayError}
        value={value}
        onChange={onChange}
        placeholder="0"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {translate('text_6282085b4f283b0102655884')}
            </InputAdornment>
          ),
        }}
      />
    )
  }

  return (
    <AmountInput
      variant="outlined"
      error={shouldDisplayError}
      beforeChangeFormatter={['positiveNumber']}
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

const AlertThresholds = ({
  thresholds,
  setThresholds,
  setThresholdValue,
  currency,
  shouldHandleUnits,
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
}) => {
  const { translate } = useInternationalization()

  const recurringIndex = thresholds.findIndex((t) => t.recurring)
  const hasRecurringThreshold = recurringIndex !== -1

  const addThreshold = ({ recurring = false }: { recurring?: boolean } = {}) => {
    const thresholdsToUpdate = [...thresholds]
    const newThreshold: ThresholdInput = {
      code: '',
      value: '',
      recurring,
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
                size: 175,
                content: (_, i) => (
                  <Typography className="px-4" variant="captionHl" noWrap>
                    {translate(
                      i === 0 ? 'text_1747921119080dk04aab1ecy' : 'text_1724179887723917j8ezkd9v',
                    )}
                  </Typography>
                ),
              },
              {
                size: 250,
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate(
                      shouldHandleUnits
                        ? 'text_1748858070139kmh56doz3la'
                        : 'text_1748858044483q61vd2npre7',
                    )}
                  </Typography>
                ),
                content: (row, i) => {
                  const shouldDisplayError = isThresholdValueValid(
                    i,
                    row.value,
                    nonRecurringThresholds,
                  )

                  return (
                    <Tooltip
                      placement="top"
                      title={translate('text_1724252232460i4tv7384iiy', {
                        value: nonRecurringThresholds[i - 1]?.value,
                      })}
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
                      />
                    </Tooltip>
                  )
                },
              },
              {
                size: 250,
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate('text_1748334091887k4p2p41jdou')}
                  </Typography>
                ),
                content: (row, i) => (
                  <TextInput
                    variant="outlined"
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
        label={translate('text_1724234174945ztq15pvmty3')}
        subLabel={translate('text_172423417494563qf45qet2d')}
      />
      {hasRecurringThreshold && (
        <div className="-mx-4 -my-1 overflow-auto px-4 py-1">
          <ChargeTable
            name={'progressive-billing-recurring'}
            data={thresholds.filter((threshold) => threshold.recurring) || []}
            columns={[
              {
                size: 175,
                content: () => (
                  <Typography className="px-4" variant="captionHl" noWrap>
                    {translate('text_17241798877230y851fdxzqu')}
                  </Typography>
                ),
              },
              {
                size: 250,
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
                  />
                ),
              },
              {
                size: 250,
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
            ]}
          />
        </div>
      )}
    </div>
  )
}

export default AlertThresholds
