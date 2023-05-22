import { useCallback, MouseEvent, memo, useMemo, useState, RefObject, useEffect } from 'react'
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
} from '~/generated/graphql'
import { AmountInput, ComboBox } from '~/components/form'
import { GraduatedChargeTable } from '~/components/plans/GraduatedChargeTable'
import { PackageCharge } from '~/components/plans/PackageCharge'
import { ChargePercentage } from '~/components/plans/ChargePercentage'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { useCurrentUser } from '~/hooks/useCurrentUser'

import { PlanFormInput } from './types'
import { VolumeChargeTable } from './VolumeChargeTable'
import { ConditionalChargeWrapper } from './ConditionalChargeWrapper'
import { RemoveChargeWarningDialogRef } from './RemoveChargeWarningDialog'

import { PremiumWarningDialogRef } from '../PremiumWarningDialog'

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
  fragment ChargeAccordion on Charge {
    id
    chargeModel
    payInAdvance
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
      flatGroups {
        id
        key
        value
      }
    }
    ...GraduatedCharge
    ...VolumeRanges
    ...PackageCharge
    ...PercentageCharge
  }
  ${GraduatedChargeFragmentDoc}
  ${VolumeRangesFragmentDoc}
  ${PackageChargeFragmentDoc}
  ${PercentageChargeFragmentDoc}
`

const mapIntervalCopy = (
  interval: string,
  isPaidInAdvance: boolean,
  forceMonthlyCharge: boolean
): string => {
  if (isPaidInAdvance) {
    return 'text_6435895831d323008a47911e'
  } else if (forceMonthlyCharge) {
    return 'text_624453d52e945301380e49aa'
  } else if (interval === PlanInterval.Monthly) {
    return 'text_624453d52e945301380e49aa'
  } else if (interval === PlanInterval.Yearly) {
    return 'text_624453d52e945301380e49ac'
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
    const [showSpendingMinimum, setShowSpendingMinimum] = useState(
      !!initialLocalCharge?.minAmountCents && Number(initialLocalCharge?.minAmountCents) > 0
    )

    useEffect(() => {
      setShowSpendingMinimum(
        !!initialLocalCharge?.minAmountCents && Number(initialLocalCharge?.minAmountCents) > 0
      )
    }, [initialLocalCharge?.minAmountCents])

    const handleUpdate = useCallback(
      (name: string, value: string | boolean) => {
        if (name === 'chargeModel' && value === ChargeModelEnum.Volume) {
          formikProps.setFieldValue(`charges.${index}.payInAdvance`, false)
        }
        formikProps.setFieldValue(`charges.${index}.${name}`, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [index, formikProps.setFieldValue]
    )
    const hasErrorInCharges = Boolean(
      formikProps.errors.charges && formikProps.errors.charges[index]
    )

    const chargeModelData = useMemo(() => {
      const chargeModels = [
        {
          label: translate('text_624aa732d6af4e0103d40e6f'),
          value: ChargeModelEnum.Standard,
        },
        {
          label: translate('text_62793bbb599f1c01522e919f'),
          value: ChargeModelEnum.Graduated,
        },
        {
          label: translate('text_62a0b7107afa2700a65ef6e2'),
          value: ChargeModelEnum.Percentage,
        },
        {
          label: translate('text_6282085b4f283b0102655868'),
          value: ChargeModelEnum.Package,
        },
      ]

      if (!localCharge.payInAdvance) {
        chargeModels.push({
          label: translate('text_6304e74aab6dbc18d615f386'),
          value: ChargeModelEnum.Volume,
        })
      }

      return chargeModels
    }, [localCharge.payInAdvance, translate])

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
              <Chip
                label={translate(
                  mapIntervalCopy(
                    formikProps.values.interval,
                    localCharge.payInAdvance || false,
                    (formikProps.values.interval === PlanInterval.Yearly &&
                      !!formikProps.values.billChargesMonthly &&
                      !localCharge.payInAdvance) ||
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
          <PaddedContent>
            {!!shouldDisplayAlreadyUsedChargeAlert && (
              <Alert type="warning">{translate('text_6435895831d323008a47911f')}</Alert>
            )}
            <ComboBox
              name="chargeModel"
              disabled={disabled}
              label={translate('text_624c5eadff7db800acc4ca0d')}
              data={chargeModelData}
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

          {!localCharge.payInAdvance && (
            <SpendingMinimumWrapper>
              {showSpendingMinimum ? (
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
              ) : (
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
            </SpendingMinimumWrapper>
          )}
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
  padding: ${theme.spacing(4)};
  display: flex;
  border-top: 1px solid ${theme.palette.grey[300]};
`

const SpendingMinimumInput = styled(AmountInput)`
  flex: 1;
  margin-right: ${theme.spacing(3)};
`

const CloseDescriptionTooltip = styled(Tooltip)`
  margin-top: ${theme.spacing(7)};
`
