import { useCallback, MouseEvent, memo, useState, RefObject, useEffect, useMemo } from 'react'
import { FormikProps } from 'formik'
import styled from 'styled-components'
import { InputAdornment } from '@mui/material'
import { gql } from '@apollo/client'

import { theme } from '~/styles'
import {
  Button,
  Typography,
  Tooltip,
  Accordion,
  Icon,
  Alert,
  Chip,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  ChargeModelEnum,
  CurrencyEnum,
  VolumeRangesFragmentDoc,
  GraduatedChargeFragmentDoc,
  PackageChargeFragmentDoc,
  PercentageChargeFragmentDoc,
  PlanInterval,
  ChargeForChargeOptionsAccordionFragmentDoc,
  AggregationTypeEnum,
  useGetTaxesForChargesLazyQuery,
  TaxForPlanChargeAccordionFragment,
} from '~/generated/graphql'
import { AmountInput, ButtonSelector, ComboBox, Switch } from '~/components/form'
import { GraduatedChargeTable } from '~/components/plans/GraduatedChargeTable'
import { PackageCharge } from '~/components/plans/PackageCharge'
import { ChargePercentage } from '~/components/plans/ChargePercentage'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME,
} from '~/core/constants/form'

import { PlanFormInput } from './types'
import { VolumeChargeTable } from './VolumeChargeTable'
import { ConditionalChargeWrapper } from './ConditionalChargeWrapper'
import { RemoveChargeWarningDialogRef } from './RemoveChargeWarningDialog'
import { ChargeOptionsAccordion } from './ChargeOptionsAccordion'

import { PremiumWarningDialogRef } from '../PremiumWarningDialog'
import { Item } from '../form/ComboBox/ComboBoxItem'

interface ChargeAccordionProps {
  id: string
  index: number
  currency: CurrencyEnum
  disabled?: boolean
  shouldDisplayAlreadyUsedChargeAlert: boolean
  isUsedInSubscription?: boolean
  formikProps: FormikProps<PlanFormInput>
  removeChargeWarningDialogRef: RefObject<RemoveChargeWarningDialogRef>
  premiumWarningDialogRef: RefObject<PremiumWarningDialogRef>
}

gql`
  fragment TaxForPlanChargeAccordion on Tax {
    id
    code
    name
    rate
  }

  fragment ChargeAccordion on Charge {
    id
    chargeModel
    invoiceable
    minAmountCents
    payInAdvance
    prorated
    properties {
      amount
    }
    groupProperties {
      groupId
      values {
        amount
      }
    }
    billableMetric {
      id
      name
      code
      aggregationType
      recurring
      flatGroups {
        id
        key
        value
      }
    }
    taxes {
      ...TaxForPlanChargeAccordion
    }
    ...GraduatedCharge
    ...VolumeRanges
    ...PackageCharge
    ...PercentageCharge
    ...ChargeForChargeOptionsAccordion
  }

  query getTaxesForCharges($limit: Int, $page: Int) {
    taxes(limit: $limit, page: $page) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...TaxForPlanChargeAccordion
      }
    }
  }

  ${GraduatedChargeFragmentDoc}
  ${VolumeRangesFragmentDoc}
  ${PackageChargeFragmentDoc}
  ${PercentageChargeFragmentDoc}
  ${ChargeForChargeOptionsAccordionFragmentDoc}
`

const mapIntervalCopy = (interval: string, forceMonthlyCharge: boolean): string => {
  if (forceMonthlyCharge) {
    return 'text_624453d52e945301380e49aa'
  } else if (interval === PlanInterval.Monthly) {
    return 'text_624453d52e945301380e49aa'
  } else if (interval === PlanInterval.Yearly) {
    return 'text_624453d52e945301380e49ac'
  } else if (interval === PlanInterval.Quarterly) {
    return 'text_64d6357b00dea100ad1cb9e9'
  } else if (interval === PlanInterval.Weekly) {
    return 'text_62b32ec6b0434070791c2d4c'
  }

  return ''
}

export const ChargeAccordion = memo(
  ({
    id,
    index,
    currency,
    disabled,
    shouldDisplayAlreadyUsedChargeAlert,
    removeChargeWarningDialogRef,
    premiumWarningDialogRef,
    isUsedInSubscription,
    formikProps,
  }: ChargeAccordionProps) => {
    const { translate } = useInternationalization()
    const { isPremium } = useCurrentUser()
    const localCharge = formikProps.values.charges[index]
    const initialLocalCharge = formikProps.initialValues.charges[index]
    const hasErrorInCharges = Boolean(
      formikProps.errors.charges && formikProps.errors.charges[index]
    )
    const [showSpendingMinimum, setShowSpendingMinimum] = useState(
      !!initialLocalCharge?.minAmountCents && Number(initialLocalCharge?.minAmountCents) > 0
    )
    const [shouldDisplayTaxesInput, setShouldDisplayTaxesInput] = useState<boolean>(false)
    const [getTaxes, { data: taxesData, loading: taxesLoading }] = useGetTaxesForChargesLazyQuery({
      variables: { limit: 500 },
    })
    const { collection: taxesCollection } = taxesData?.taxes || {}

    useEffect(() => {
      setShowSpendingMinimum(
        !!initialLocalCharge?.minAmountCents && Number(initialLocalCharge?.minAmountCents) > 0
      )
    }, [initialLocalCharge?.minAmountCents])

    const handleUpdate = useCallback(
      (name: string, value: string | boolean | TaxForPlanChargeAccordionFragment[]) => {
        if (name === 'chargeModel') {
          // Reset pay in advance when switching charge model
          if (
            value === ChargeModelEnum.Volume ||
            localCharge.billableMetric.aggregationType === AggregationTypeEnum.MaxAgg ||
            localCharge.billableMetric.aggregationType === AggregationTypeEnum.RecurringCountAgg
          ) {
            formikProps.setFieldValue(`charges.${index}.payInAdvance`, false)
          }

          // Reset prorated when switching charge model
          if (
            (localCharge.billableMetric.recurring && value === ChargeModelEnum.Graduated) ||
            value === ChargeModelEnum.Package ||
            value === ChargeModelEnum.Percentage
          ) {
            formikProps.setFieldValue(`charges.${index}.prorated`, false)
          }
        }

        if (name === 'payInAdvance') {
          if (value === true) {
            // Pay in advance
            formikProps.setFieldValue(`charges.${index}.minAmountCents`, undefined)
          } else {
            // Pay in arrears
            formikProps.setFieldValue(`charges.${index}.invoiceable`, true)
          }
        }
        formikProps.setFieldValue(`charges.${index}.${name}`, value)
      },

      [
        formikProps,
        index,
        localCharge.billableMetric.aggregationType,
        localCharge.billableMetric.recurring,
      ]
    )

    const taxValueForBadgeDisplay = useMemo((): string | undefined => {
      if (!localCharge?.taxes?.length && !formikProps?.values?.taxes?.length) return

      if (localCharge.taxes?.length)
        return String(localCharge.taxes.reduce((acc, cur) => acc + cur.rate, 0))

      return String(formikProps?.values?.taxes?.reduce((acc, cur) => acc + cur.rate, 0))
    }, [formikProps?.values?.taxes, localCharge.taxes])

    const taxesDataForCombobox = useMemo(() => {
      if (!taxesCollection) return []

      const chargeTaxesIds = localCharge.taxes?.map((tax) => tax.id) || []

      return taxesCollection.map(({ id: taxId, name, rate }) => {
        return {
          label: `${name} (${intlFormatNumber(Number(rate) / 100 || 0, {
            minimumFractionDigits: 2,
            style: 'percent',
          })})`,
          labelNode: (
            <Item>
              {name}&nbsp;
              <Typography color="textPrimary">
                (
                {intlFormatNumber(Number(rate) / 100 || 0, {
                  minimumFractionDigits: 2,
                  style: 'percent',
                })}
                )
              </Typography>
            </Item>
          ),
          value: taxId,
          disabled: chargeTaxesIds.includes(taxId),
        }
      })
    }, [localCharge.taxes, taxesCollection])

    const chargePayInAdvanceSwitchHelperText = useMemo(() => {
      if (localCharge.chargeModel === ChargeModelEnum.Volume) {
        return translate('text_646e2d0cc536351b62ba6fc0')
      } else if (localCharge.billableMetric.aggregationType === AggregationTypeEnum.MaxAgg) {
        return translate('text_646e2d0cc536351b62ba6f48')
      } else if (
        localCharge.billableMetric.aggregationType === AggregationTypeEnum.RecurringCountAgg
      ) {
        return translate('text_646e2d0cc536351b62ba6efd')
      } else if (localCharge.payInAdvance) {
        return translate('text_646e2d0cc536351b62ba6f12')
      }

      // Charge paid in arrears
      return translate('text_646e2d0cc536351b62ba6f53')
    }, [
      localCharge.chargeModel,
      localCharge.payInAdvance,
      localCharge.billableMetric.aggregationType,
      translate,
    ])

    const isProratedOptionDisabled = useMemo(() => {
      return (
        (localCharge.billableMetric.recurring &&
          localCharge.chargeModel === ChargeModelEnum.Graduated) ||
        localCharge.chargeModel === ChargeModelEnum.Package ||
        localCharge.chargeModel === ChargeModelEnum.Percentage
      )
    }, [localCharge.billableMetric.recurring, localCharge.chargeModel])

    const proratedOptionHelperText = useMemo(() => {
      if (isProratedOptionDisabled)
        return translate('text_649c54823c9089006247625a', { chargeModel: localCharge.chargeModel })

      return translate('text_649c54823c90890062476259')
    }, [isProratedOptionDisabled, translate, localCharge.chargeModel])

    return (
      <Accordion
        noContentMargin
        id={id}
        initiallyOpen={!formikProps.values.charges?.[index]?.id ? true : false}
        summary={
          <>
            <Title>
              <Typography variant="bodyHl" color="textSecondary" noWrap>
                {localCharge?.billableMetric?.name}
              </Typography>
              <Typography variant="caption" noWrap>
                {localCharge?.billableMetric?.code}
              </Typography>
            </Title>
            <SummaryRight>
              <Tooltip
                placement="top-end"
                title={
                  hasErrorInCharges
                    ? translate('text_635b975ecea4296eb76924b7')
                    : translate('text_635b975ecea4296eb76924b1')
                }
              >
                <ValidationIcon
                  name="validate-filled"
                  color={hasErrorInCharges ? 'disabled' : 'success'}
                />
              </Tooltip>

              {!!taxValueForBadgeDisplay && (
                <Chip
                  label={intlFormatNumber(Number(taxValueForBadgeDisplay) / 100 || 0, {
                    minimumFractionDigits: 2,
                    style: 'percent',
                  })}
                />
              )}
              <Chip
                label={translate(
                  mapIntervalCopy(
                    formikProps.values.interval,
                    (formikProps.values.interval === PlanInterval.Yearly &&
                      !!formikProps.values.billChargesMonthly) ||
                      false
                  )
                )}
              />
              <Tooltip placement="top-end" title={translate('text_624aa732d6af4e0103d40e65')}>
                <Button
                  variant="quaternary"
                  size="small"
                  icon="trash"
                  data-test="remove-charge"
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    e.preventDefault()

                    const deleteCharge = () => {
                      const charges = [...formikProps.values.charges]

                      charges.splice(index, 1)
                      formikProps.setFieldValue('charges', charges)
                    }

                    if (isUsedInSubscription) {
                      removeChargeWarningDialogRef?.current?.openDialog(index)
                    } else {
                      deleteCharge()
                    }
                  }}
                />
              </Tooltip>
            </SummaryRight>
          </>
        }
      >
        <>
          {/* Charge main infos */}
          <PaddedContent>
            {!!shouldDisplayAlreadyUsedChargeAlert && (
              <Alert type="warning">{translate('text_6435895831d323008a47911f')}</Alert>
            )}
            <ComboBox
              name="chargeModel"
              disabled={disabled}
              label={translate('text_624c5eadff7db800acc4ca0d')}
              data={[
                {
                  label: translate('text_624aa732d6af4e0103d40e6f'),
                  value: ChargeModelEnum.Standard,
                },
                {
                  label: translate('text_62793bbb599f1c01522e919f'),
                  value: ChargeModelEnum.Graduated,
                },
                ...(!localCharge.billableMetric.recurring
                  ? [
                      {
                        label: translate('text_62a0b7107afa2700a65ef6e2'),
                        value: ChargeModelEnum.Percentage,
                      },
                      {
                        label: translate('text_6282085b4f283b0102655868'),
                        value: ChargeModelEnum.Package,
                      },
                    ]
                  : []),
                {
                  label: translate('text_6304e74aab6dbc18d615f386'),
                  value: ChargeModelEnum.Volume,
                },
              ]}
              disableClearable
              value={localCharge.chargeModel}
              helperText={translate(
                localCharge.chargeModel === ChargeModelEnum.Percentage
                  ? 'text_62ff5d01a306e274d4ffcc06'
                  : localCharge.chargeModel === ChargeModelEnum.Graduated
                  ? 'text_62793bbb599f1c01522e91a1'
                  : localCharge.chargeModel === ChargeModelEnum.Package
                  ? 'text_6282085b4f283b010265586c'
                  : localCharge.chargeModel === ChargeModelEnum.Volume
                  ? 'text_6304e74aab6dbc18d615f38a'
                  : 'text_624d9adba93343010cd14ca7'
              )}
              onChange={(value) => handleUpdate('chargeModel', value)}
            />
          </PaddedContent>
          <ConditionalChargeWrapper
            chargeIndex={index}
            localCharge={localCharge}
            chargeErrors={formikProps.errors.charges}
          >
            {({ propertyCursor, valuePointer }) => (
              <>
                {localCharge.chargeModel === ChargeModelEnum.Standard && (
                  <AmountInput
                    name={`${propertyCursor}.amount`}
                    currency={currency}
                    beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
                    disabled={disabled}
                    label={translate('text_624453d52e945301380e49b6')}
                    value={valuePointer?.amount || ''}
                    onChange={(value) => handleUpdate(`${propertyCursor}.amount`, value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {getCurrencySymbol(currency)}
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                {localCharge.chargeModel === ChargeModelEnum.Package && (
                  <PackageCharge
                    chargeIndex={index}
                    currency={currency}
                    disabled={disabled}
                    formikProps={formikProps}
                    propertyCursor={propertyCursor}
                    valuePointer={valuePointer}
                  />
                )}
                {localCharge.chargeModel === ChargeModelEnum.Graduated && (
                  <GraduatedChargeTable
                    chargeIndex={index}
                    currency={currency}
                    disabled={disabled}
                    formikProps={formikProps}
                    propertyCursor={propertyCursor}
                    valuePointer={valuePointer}
                  />
                )}
                {localCharge.chargeModel === ChargeModelEnum.Percentage && (
                  <ChargePercentage
                    chargeIndex={index}
                    currency={currency}
                    disabled={disabled}
                    formikProps={formikProps}
                    propertyCursor={propertyCursor}
                    valuePointer={valuePointer}
                  />
                )}
                {localCharge.chargeModel === ChargeModelEnum.Volume && (
                  <VolumeChargeTable
                    chargeIndex={index}
                    currency={currency}
                    disabled={disabled}
                    formikProps={formikProps}
                    propertyCursor={propertyCursor}
                    valuePointer={valuePointer}
                  />
                )}
              </>
            )}
          </ConditionalChargeWrapper>

          {/* Charge options */}
          <ChargeOptionsAccordion charge={localCharge} currency={currency}>
            <ButtonSelector
              label={translate('text_646e2d0cc536351b62ba6f1a')}
              disabled={disabled}
              helperText={chargePayInAdvanceSwitchHelperText}
              onChange={(value) => handleUpdate('payInAdvance', Boolean(value))}
              value={localCharge.payInAdvance || false}
              options={[
                {
                  label: translate('text_646e2d0cc536351b62ba6f2b'),
                  value: false,
                },
                {
                  label: translate('text_646e2d0cc536351b62ba6f3d'),
                  value: true,
                  disabled:
                    localCharge.chargeModel === ChargeModelEnum.Volume ||
                    localCharge.billableMetric.aggregationType === AggregationTypeEnum.MaxAgg ||
                    localCharge.billableMetric.aggregationType ===
                      AggregationTypeEnum.RecurringCountAgg,
                },
              ]}
            />

            {!!localCharge.billableMetric.recurring && (
              <Switch
                name={`charge-${localCharge.id}-prorated`}
                label={translate('text_649c54823c90890062476255')}
                disabled={disabled || isProratedOptionDisabled}
                subLabel={proratedOptionHelperText}
                checked={!!localCharge.prorated}
                onChange={(value) => handleUpdate('prorated', Boolean(value))}
              />
            )}
            {localCharge.payInAdvance && (
              <InvoiceableSwitchWrapper>
                <Switch
                  name={`charge-${localCharge.id}-invoiceable`}
                  label={translate('text_646e2d0cc536351b62ba6f25')}
                  disabled={disabled}
                  subLabel={translate('text_646e2d0cc536351b62ba6f35')}
                  checked={!!localCharge.invoiceable}
                  onChange={(value) => {
                    if (isPremium) {
                      handleUpdate('invoiceable', value)
                    } else {
                      premiumWarningDialogRef.current?.openDialog()
                    }
                  }}
                />
                {!isPremium && <Icon name="sparkles" />}
              </InvoiceableSwitchWrapper>
            )}
            {!localCharge.payInAdvance && !!showSpendingMinimum && (
              <SpendingMinimumWrapper>
                <>
                  <SpendingMinimumInput
                    id={`spending-minimum-input-${index}`}
                    beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
                    label={translate('text_643e592657fc1ba5ce110c30')}
                    currency={currency}
                    placeholder={translate('text_643e592657fc1ba5ce110c80')}
                    disabled={disabled}
                    value={localCharge?.minAmountCents || ''}
                    onChange={(value) => handleUpdate('minAmountCents', value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {getCurrencySymbol(currency)}
                        </InputAdornment>
                      ),
                    }}
                  />
                  <CloseDescriptionTooltip
                    placement="top-end"
                    title={translate('text_63aa085d28b8510cd46443ff')}
                  >
                    <Button
                      icon="trash"
                      variant="quaternary"
                      disabled={disabled}
                      onClick={() => {
                        formikProps.setFieldValue(`charges.${index}.minAmountCents`, null)
                        setShowSpendingMinimum(false)
                      }}
                    />
                  </CloseDescriptionTooltip>
                </>
              </SpendingMinimumWrapper>
            )}

            {!!localCharge?.taxes?.length && (
              <div>
                <TaxLabel variant="captionHl" color="grey700">
                  {translate('text_64be910fba8ef9208686a8e3')}
                </TaxLabel>
                <InlineTaxesWrapper>
                  {localCharge.taxes.map(({ id: localTaxId, name, rate }) => (
                    <Chip
                      key={localTaxId}
                      label={`${name} (${rate}%)`}
                      disabled={disabled}
                      variant="secondary"
                      size="medium"
                      closeIcon="trash"
                      icon="percentage"
                      onCloseLabel={
                        disabled ? undefined : translate('text_63aa085d28b8510cd46443ff')
                      }
                      onClose={() => {
                        const newTaxedArray =
                          localCharge.taxes?.filter((tax) => tax.id !== localTaxId) || []

                        formikProps.setFieldValue(`charges.${index}.taxes`, newTaxedArray)
                      }}
                    />
                  ))}
                </InlineTaxesWrapper>
              </div>
            )}

            {shouldDisplayTaxesInput && (
              <div>
                {!localCharge.taxes?.length && (
                  <TaxLabel variant="captionHl" color="grey700">
                    {translate('text_64be910fba8ef9208686a8e3')}
                  </TaxLabel>
                )}
                <InlineTaxInputWrapper>
                  <ComboBox
                    className={SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME}
                    data={taxesDataForCombobox}
                    searchQuery={getTaxes}
                    loading={taxesLoading}
                    placeholder={translate('text_64be910fba8ef9208686a8e7')}
                    emptyText={translate('text_64be91fd0678965126e5657b')}
                    onChange={(newTaxId) => {
                      const previousTaxes = [...(localCharge?.taxes || [])]
                      const newTaxObject = taxesData?.taxes.collection.find(
                        (t) => t.id === newTaxId
                      ) as TaxForPlanChargeAccordionFragment

                      handleUpdate('taxes', [...previousTaxes, newTaxObject])
                      setShouldDisplayTaxesInput(false)
                    }}
                  />

                  <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                    <Button
                      icon="trash"
                      variant="quaternary"
                      onClick={() => {
                        setShouldDisplayTaxesInput(false)
                      }}
                    />
                  </Tooltip>
                </InlineTaxInputWrapper>
              </div>
            )}

            <InlineButtonsWrapper>
              {!localCharge.payInAdvance && !showSpendingMinimum && (
                <Button
                  variant="quaternary"
                  startIcon="plus"
                  disabled={disabled}
                  endIcon={isPremium ? undefined : 'sparkles'}
                  onClick={() => {
                    if (isPremium) {
                      setShowSpendingMinimum(true)
                      setTimeout(() => {
                        document.getElementById(`spending-minimum-input-${index}`)?.focus()
                      }, 0)
                    } else {
                      premiumWarningDialogRef.current?.openDialog()
                    }
                  }}
                >
                  {translate('text_643e592657fc1ba5ce110b9e')}
                </Button>
              )}

              {!shouldDisplayTaxesInput && (
                <Button
                  startIcon="plus"
                  variant="quaternary"
                  disabled={disabled}
                  onClick={() => {
                    setShouldDisplayTaxesInput(true)

                    setTimeout(() => {
                      const element = document.querySelector(
                        `.${SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`
                      ) as HTMLElement

                      if (!element) return

                      element.scrollIntoView({ behavior: 'smooth' })
                      element.click()
                    }, 0)
                  }}
                  data-test="show-add-taxes"
                >
                  {translate('text_64be910fba8ef9208686a8c9')}
                </Button>
              )}
            </InlineButtonsWrapper>
          </ChargeOptionsAccordion>
        </>
      </Accordion>
    )
  }
)

ChargeAccordion.displayName = 'ChargeAccordion'

const PaddedContent = styled.div`
  padding: ${theme.spacing(4)};

  > *:not(:first-child) {
    margin-top: ${theme.spacing(6)};
  }
`

const Title = styled.div`
  display: flex;
  flex-direction: column;
  white-space: pre;
  min-width: 20px;
  margin-right: auto;
`

const ValidationIcon = styled(Icon)`
  display: flex;
  align-items: center;
`

const SummaryRight = styled.div`
  display: flex;
  align-items: center;
  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }
`

const SpendingMinimumWrapper = styled.div`
  display: flex;
`

const SpendingMinimumInput = styled(AmountInput)`
  flex: 1;
  margin-right: ${theme.spacing(3)};
`

const CloseDescriptionTooltip = styled(Tooltip)`
  margin-top: ${theme.spacing(7)};
`

const InvoiceableSwitchWrapper = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    flex: 1;
  }
`
const InlineButtonsWrapper = styled.div`
  display: flex;
`

const TaxLabel = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
`

const InlineTaxInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};

  > *:first-child {
    flex: 1;
  }
`

const InlineTaxesWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
  flex-wrap: wrap;
`
