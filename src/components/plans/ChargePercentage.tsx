import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps, FormikState } from 'formik'
import _get from 'lodash/get'
import { memo, RefObject, useCallback, useMemo } from 'react'

import { Alert, Button, Popper, Tooltip, Typography } from '~/components/designSystem'
import { AmountInput, TextInput } from '~/components/form'
import { ChargeCursor } from '~/components/plans/chargeAccordion/ChargeWrapperSwitch'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { MIN_AMOUNT_SHOULD_BE_LOWER_THAN_MAX_ERROR } from '~/core/constants/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { MenuPopper } from '~/styles'

import { LocalChargeFilterInput, PlanFormInput } from './types'

gql`
  fragment PercentageCharge on Properties {
    fixedAmount
    freeUnitsPerEvents
    freeUnitsPerTotalAggregation
    rate
    perTransactionMinAmount
    perTransactionMaxAmount
  }
`

interface ChargePercentageProps {
  chargeCursor: ChargeCursor
  chargeErrors: FormikState<PlanFormInput>['errors']
  chargeIndex: number
  chargePricingUnitShortName: string | undefined
  currency: CurrencyEnum
  disabled?: boolean
  filterIndex?: number
  premiumWarningDialogRef?: RefObject<PremiumWarningDialogRef>
  propertyCursor: string
  setFieldValue: FormikProps<PlanFormInput>['setFieldValue']
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
}

export const ChargePercentage = memo(
  ({
    chargeCursor,
    chargeErrors: chargeErrorsProps,
    chargeIndex,
    chargePricingUnitShortName,
    currency,
    disabled,
    filterIndex,
    premiumWarningDialogRef,
    propertyCursor,
    setFieldValue,
    valuePointer,
  }: ChargePercentageProps) => {
    const { translate } = useInternationalization()
    const { isPremium } = useCurrentUser()
    const chargeErrors = _get(chargeErrorsProps, `${chargeCursor}.${chargeIndex}`)
    const showFixedAmount = valuePointer?.fixedAmount !== undefined
    const showFreeUnitsPerEvents = valuePointer?.freeUnitsPerEvents !== undefined
    const showFreeUnitsPerTotalAggregation =
      valuePointer?.freeUnitsPerTotalAggregation !== undefined
    const showPerTransactionMinAmount = valuePointer?.perTransactionMinAmount !== undefined
    const showPerTransactionMmaxAmount = valuePointer?.perTransactionMaxAmount !== undefined
    let freeUnitsPerTotalAggregationTranslation = translate('text_6303351deffd2a0d70498677', {
      freeAmountUnits: intlFormatNumber(Number(valuePointer?.freeUnitsPerTotalAggregation) || 0, {
        currencyDisplay: 'symbol',
        pricingUnitShortName: chargePricingUnitShortName,
        currency,
        maximumFractionDigits: 15,
      }),
    })

    const hasMinAmountError = useMemo(() => {
      if (typeof filterIndex === 'number') {
        return (
          _get(chargeErrors, `filters.${filterIndex}.properties.perTransactionMinAmount`) ===
          MIN_AMOUNT_SHOULD_BE_LOWER_THAN_MAX_ERROR
        )
      }
      return (
        _get(chargeErrors, `properties.perTransactionMinAmount`) ===
        MIN_AMOUNT_SHOULD_BE_LOWER_THAN_MAX_ERROR
      )
    }, [chargeErrors, filterIndex])

    const handleUpdate = useCallback(
      (name: string, value: string | string[]) => {
        setFieldValue(`${chargeCursor}.${chargeIndex}.${name}`, value)
      },

      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chargeCursor, chargeIndex],
    )

    if (!showFreeUnitsPerEvents && showFreeUnitsPerTotalAggregation) {
      freeUnitsPerTotalAggregationTranslation =
        freeUnitsPerTotalAggregationTranslation.charAt(0).toUpperCase() +
        freeUnitsPerTotalAggregationTranslation.slice(1)
    }

    return (
      <>
        <TextInput
          className="flex-1"
          name={`${propertyCursor}.rate`}
          label={translate('text_62a0b7107afa2700a65ef6f6')}
          beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
          disabled={disabled}
          placeholder={translate('text_62a0b7107afa2700a65ef700')}
          value={valuePointer?.rate as number | undefined}
          onChange={(value) => handleUpdate(`${propertyCursor}.rate`, value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {translate('text_62a0b7107afa2700a65ef70a')}
              </InputAdornment>
            ),
          }}
        />

        {valuePointer?.fixedAmount !== undefined && (
          <div className="flex gap-3">
            <AmountInput
              className="flex-1"
              name={`${propertyCursor}.fixedAmount`}
              currency={currency}
              beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
              disabled={disabled}
              label={translate('text_62ff5d01a306e274d4ffcc1e')}
              value={valuePointer?.fixedAmount || ''}
              onChange={(value) => handleUpdate(`${propertyCursor}.fixedAmount`, value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {chargePricingUnitShortName || getCurrencySymbol(currency)}
                  </InputAdornment>
                ),
              }}
              helperText={translate('text_62ff5d01a306e274d4ffcc30')}
            />
            <Tooltip
              className="mt-8"
              disableHoverListener={disabled}
              title={translate('text_62ff5d01a306e274d4ffcc28')}
              placement="top-end"
            >
              <Button
                icon="trash"
                disabled={disabled}
                variant="quaternary"
                onClick={() => {
                  setFieldValue(`${chargeCursor}.${chargeIndex}.${propertyCursor}`, {
                    ...valuePointer,
                    fixedAmount: undefined,
                  })
                }}
                data-test="remove-fixed-fee"
              />
            </Tooltip>
          </div>
        )}

        {valuePointer?.freeUnitsPerEvents !== undefined && (
          <div className="flex gap-3">
            <TextInput
              className="flex-1"
              name={`${propertyCursor}.freeUnitsPerEvents`}
              beforeChangeFormatter={['positiveNumber', 'int']}
              disabled={disabled}
              label={translate('text_62ff5d01a306e274d4ffcc36')}
              placeholder={translate('text_62ff5d01a306e274d4ffcc3c')}
              value={valuePointer?.freeUnitsPerEvents || ''}
              onChange={(value) => handleUpdate(`${propertyCursor}.freeUnitsPerEvents`, value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {translate('text_62ff5d01a306e274d4ffcc42')}
                  </InputAdornment>
                ),
              }}
              data-test="free-unit-per-event"
            />
            <Tooltip
              className="mt-8"
              disableHoverListener={disabled}
              title={translate('text_62ff5d01a306e274d4ffcc46')}
              placement="top-end"
            >
              <Button
                icon="trash"
                disabled={disabled}
                variant="quaternary"
                onClick={() => {
                  setFieldValue(`${chargeCursor}.${chargeIndex}.${propertyCursor}`, {
                    ...valuePointer,
                    freeUnitsPerEvents: undefined,
                  })
                }}
                data-test="remove-free-units-per-event"
              />
            </Tooltip>
          </div>
        )}

        {valuePointer?.freeUnitsPerTotalAggregation !== undefined && (
          <div className="flex gap-3">
            {valuePointer?.freeUnitsPerEvents !== undefined &&
              valuePointer?.freeUnitsPerTotalAggregation !== undefined && (
                <Typography className="mt-10 flex-initial" variant="body">
                  {translate('text_62ff5d01a306e274d4ffcc59')}
                </Typography>
              )}
            <AmountInput
              className="flex-1"
              name={`${propertyCursor}.freeUnitsPerTotalAggregation`}
              currency={currency}
              beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
              disabled={disabled}
              label={translate('text_62ff5d01a306e274d4ffcc48')}
              value={valuePointer?.freeUnitsPerTotalAggregation || ''}
              onChange={(value) =>
                handleUpdate(`${propertyCursor}.freeUnitsPerTotalAggregation`, value)
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {chargePricingUnitShortName || getCurrencySymbol(currency)}
                  </InputAdornment>
                ),
              }}
              data-test="free-unit-per-total-aggregation"
            />
            <Tooltip
              className="mt-8"
              disableHoverListener={disabled}
              title={translate('text_62ff5d01a306e274d4ffcc5b')}
              placement="top-end"
            >
              <Button
                icon="trash"
                disabled={disabled}
                variant="quaternary"
                onClick={() => {
                  setFieldValue(`${chargeCursor}.${chargeIndex}.${propertyCursor}`, {
                    ...valuePointer,
                    freeUnitsPerTotalAggregation: undefined,
                  })
                }}
                data-test="remove-free-unit-per-total-aggregation"
              />
            </Tooltip>
          </div>
        )}

        {valuePointer?.perTransactionMinAmount !== undefined && (
          <div className="flex gap-3">
            <AmountInput
              className="flex-1"
              name={`${propertyCursor}.perTransactionMinAmount`}
              beforeChangeFormatter={['positiveNumber']}
              currency={currency}
              disabled={disabled}
              error={
                !!hasMinAmountError &&
                translate('text_64e7b273b046851c46d78207', {
                  transac_max: intlFormatNumber(
                    Number(valuePointer?.perTransactionMaxAmount || 0),
                    {
                      currency,
                      currencyDisplay: 'symbol',
                      minimumFractionDigits: 2,
                    },
                  ),
                })
              }
              label={translate('text_64e7b273b046851c46d781e5')}
              placeholder={translate('text_632d68358f1fedc68eed3e86')}
              helperText={translate('text_64e7b273b046851c46d78201')}
              value={valuePointer?.perTransactionMinAmount || ''}
              onChange={(value) => handleUpdate(`${propertyCursor}.perTransactionMinAmount`, value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {chargePricingUnitShortName || getCurrencySymbol(currency)}
                  </InputAdornment>
                ),
              }}
              data-test="per-transaction-min-amount"
            />
            <Tooltip
              className="mt-8"
              disableHoverListener={disabled}
              title={translate('text_64e7b273b046851c46d78249')}
              placement="top-end"
            >
              <Button
                icon="trash"
                disabled={disabled}
                variant="quaternary"
                onClick={() => {
                  setFieldValue(`${chargeCursor}.${chargeIndex}.${propertyCursor}`, {
                    ...valuePointer,
                    perTransactionMinAmount: undefined,
                  })
                }}
                data-test="remove-per-transaction-min-amount-cta"
              />
            </Tooltip>
          </div>
        )}

        {valuePointer?.perTransactionMaxAmount !== undefined && (
          <div className="flex gap-3">
            <AmountInput
              className="flex-1"
              name={`${propertyCursor}.perTransactionMaxAmount`}
              beforeChangeFormatter={['positiveNumber']}
              currency={currency}
              disabled={disabled}
              label={translate('text_64e7b273b046851c46d78205')}
              placeholder={translate('text_632d68358f1fedc68eed3e86')}
              helperText={translate('text_64e7b273b046851c46d78221')}
              value={valuePointer?.perTransactionMaxAmount || ''}
              onChange={(value) => handleUpdate(`${propertyCursor}.perTransactionMaxAmount`, value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {chargePricingUnitShortName || getCurrencySymbol(currency)}
                  </InputAdornment>
                ),
              }}
              data-test="per-transaction-max-amount"
            />
            <Tooltip
              className="mt-8"
              disableHoverListener={disabled}
              title={translate('text_64e7b273b046851c46d782d6')}
              placement="top-end"
            >
              <Button
                icon="trash"
                disabled={disabled}
                variant="quaternary"
                onClick={() => {
                  setFieldValue(`${chargeCursor}.${chargeIndex}.${propertyCursor}`, {
                    ...valuePointer,
                    perTransactionMaxAmount: undefined,
                  })
                }}
                data-test="remove-per-transaction-max-amount-cta"
              />
            </Tooltip>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            startIcon="plus"
            variant="inline"
            disabled={disabled || valuePointer?.fixedAmount !== undefined}
            onClick={() =>
              setFieldValue(`${chargeCursor}.${chargeIndex}.${propertyCursor}`, {
                ...valuePointer,
                fixedAmount: '',
              })
            }
            data-test="add-fixed-fee"
          >
            {translate('text_62ff5d01a306e274d4ffcc5d')}
          </Button>

          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button
                startIcon="plus"
                endIcon="chevron-down"
                variant="inline"
                disabled={
                  disabled ||
                  (valuePointer?.freeUnitsPerEvents !== undefined &&
                    valuePointer?.freeUnitsPerTotalAggregation !== undefined)
                }
                data-test="add-free-units"
              >
                {translate('text_62ff5d01a306e274d4ffcc61')}
              </Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  className="justify-start"
                  variant="quaternary"
                  disabled={disabled || valuePointer?.freeUnitsPerEvents !== undefined}
                  onClick={() => {
                    setFieldValue(`${chargeCursor}.${chargeIndex}.${propertyCursor}`, {
                      ...valuePointer,
                      freeUnitsPerEvents: '',
                    })
                    closePopper()
                  }}
                  data-test="add-free-units-events"
                >
                  {translate('text_62ff5d01a306e274d4ffcc3e')}
                </Button>
                <Button
                  className="justify-start"
                  variant="quaternary"
                  disabled={disabled || valuePointer?.freeUnitsPerTotalAggregation !== undefined}
                  onClick={() => {
                    setFieldValue(`${chargeCursor}.${chargeIndex}.${propertyCursor}`, {
                      ...valuePointer,
                      freeUnitsPerTotalAggregation: '',
                    })

                    closePopper()
                  }}
                  data-test="add-free-units-total-amount"
                >
                  {translate('text_62ff5d01a306e274d4ffcc44')}
                </Button>
              </MenuPopper>
            )}
          </Popper>

          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button
                startIcon="plus"
                endIcon="chevron-down"
                variant="inline"
                disabled={
                  disabled ||
                  (valuePointer?.perTransactionMinAmount !== undefined &&
                    valuePointer?.perTransactionMaxAmount !== undefined)
                }
                data-test="add-min-max-drowdown-cta"
              >
                {translate('text_64e7b273b046851c46d78235')}
              </Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  className="justify-start"
                  variant="quaternary"
                  endIcon={isPremium ? undefined : 'sparkles'}
                  disabled={disabled || valuePointer?.perTransactionMinAmount !== undefined}
                  onClick={() => {
                    if (isPremium) {
                      setFieldValue(`${chargeCursor}.${chargeIndex}.${propertyCursor}`, {
                        ...valuePointer,
                        perTransactionMinAmount: '',
                      })
                    } else {
                      premiumWarningDialogRef?.current?.openDialog()
                    }

                    closePopper()
                  }}
                  data-test="add-min-cta"
                >
                  {translate('text_64e7b273b046851c46d781e5')}
                </Button>
                <Button
                  className="justify-start"
                  variant="quaternary"
                  endIcon={isPremium ? undefined : 'sparkles'}
                  disabled={disabled || valuePointer?.perTransactionMaxAmount !== undefined}
                  onClick={() => {
                    if (isPremium) {
                      setFieldValue(`${chargeCursor}.${chargeIndex}.${propertyCursor}`, {
                        ...valuePointer,
                        perTransactionMaxAmount: '',
                      })
                    } else {
                      premiumWarningDialogRef?.current?.openDialog()
                    }

                    closePopper()
                  }}
                  data-test="add-max-cta"
                >
                  {translate('text_64e7b273b046851c46d78205')}
                </Button>
              </MenuPopper>
            )}
          </Popper>
        </div>

        <Alert type="info">
          <Typography color="textSecondary">
            {translate('text_62ff5d01a306e274d4ffcc65', {
              percentageFee: intlFormatNumber(Number(valuePointer?.rate) / 100 || 0, {
                maximumFractionDigits: 15,
                style: 'percent',
              }),
            })}
          </Typography>

          {(showFreeUnitsPerEvents || showFreeUnitsPerTotalAggregation) && (
            <Typography color="textSecondary">
              {showFreeUnitsPerEvents &&
                translate(
                  'text_62ff5d01a306e274d4ffcc6d',
                  {
                    freeEventUnits: valuePointer?.freeUnitsPerEvents || 0,
                  },
                  Math.max(Number(valuePointer?.freeUnitsPerEvents) || 0),
                )}

              {/* Spaces bellow are important */}
              {showFreeUnitsPerEvents &&
                showFreeUnitsPerTotalAggregation &&
                ` ${translate('text_6303351deffd2a0d70498675')} `}

              {showFreeUnitsPerTotalAggregation && freeUnitsPerTotalAggregationTranslation}

              {` ${translate(
                'text_6303351deffd2a0d70498679',
                {
                  freeEventUnits: valuePointer?.freeUnitsPerEvents || 0,
                },
                (valuePointer?.freeUnitsPerEvents || 0) < 2 && !showFreeUnitsPerTotalAggregation
                  ? 1
                  : 2,
              )}`}
            </Typography>
          )}

          {showFixedAmount && (
            <Typography color="textSecondary">
              {translate('text_62ff5d01a306e274d4ffcc69', {
                fixedFeeValue: intlFormatNumber(Number(valuePointer?.fixedAmount) || 0, {
                  currency,
                  currencyDisplay: 'symbol',
                  maximumFractionDigits: 15,
                  pricingUnitShortName: chargePricingUnitShortName,
                }),
              })}
            </Typography>
          )}

          {/* Min max alert message */}
          {!!showPerTransactionMinAmount && !showPerTransactionMmaxAmount && (
            <Typography color="textSecondary">
              {translate('text_64e7b273b046851c46d78241', {
                minAmount: intlFormatNumber(Number(valuePointer?.perTransactionMinAmount || 0), {
                  pricingUnitShortName: chargePricingUnitShortName,
                  currency,
                  currencyDisplay: 'symbol',
                  minimumFractionDigits: 2,
                }),
              })}
            </Typography>
          )}
          {!showPerTransactionMinAmount && !!showPerTransactionMmaxAmount && (
            <Typography color="textSecondary">
              {translate('text_64e7b273b046851c46d78245', {
                maxAmount: intlFormatNumber(Number(valuePointer?.perTransactionMaxAmount || 0), {
                  currency,
                  currencyDisplay: 'symbol',
                  minimumFractionDigits: 2,
                  pricingUnitShortName: chargePricingUnitShortName,
                }),
              })}
            </Typography>
          )}
          {!!showPerTransactionMinAmount && !!showPerTransactionMmaxAmount && (
            <Typography color="textSecondary">
              {translate('text_64e7b273b046851c46d78250', {
                minAmount: intlFormatNumber(Number(valuePointer?.perTransactionMinAmount || 0), {
                  currency,
                  currencyDisplay: 'symbol',
                  minimumFractionDigits: 2,
                  pricingUnitShortName: chargePricingUnitShortName,
                }),
                maxAmount: intlFormatNumber(Number(valuePointer?.perTransactionMaxAmount || 0), {
                  currency,
                  currencyDisplay: 'symbol',
                  minimumFractionDigits: 2,
                  pricingUnitShortName: chargePricingUnitShortName,
                }),
              })}
            </Typography>
          )}
        </Alert>
      </>
    )
  },
)

ChargePercentage.displayName = 'ChargePercentage'
