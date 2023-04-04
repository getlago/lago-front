import { useCallback, MouseEvent, memo, useRef } from 'react'
import { FormikProps } from 'formik'
import styled from 'styled-components'
import { InputAdornment } from '@mui/material'
import { gql } from '@apollo/client'

import { theme } from '~/styles'
import { Button, Typography, Tooltip, Accordion, Icon } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  ChargeModelEnum,
  CurrencyEnum,
  VolumeRangesFragmentDoc,
  GraduatedChargeFragmentDoc,
  PackageChargeFragmentDoc,
  PercentageChargeFragmentDoc,
  AggregationTypeEnum,
} from '~/generated/graphql'
import { AmountInput, ComboBox, Switch } from '~/components/form'
import { GraduatedChargeTable } from '~/components/plans/GraduatedChargeTable'
import { PackageCharge } from '~/components/plans/PackageCharge'
import { ChargePercentage } from '~/components/plans/ChargePercentage'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'

import { PlanFormInput } from './types'
import { VolumeChargeTable } from './VolumeChargeTable'
import { ConditionalChargeWrapper } from './ConditionalChargeWrapper'

interface ChargeAccordionProps {
  id: string
  index: number
  currency: CurrencyEnum
  disabled?: boolean
  isUsedInSubscription?: boolean
  formikProps: FormikProps<PlanFormInput>
}

gql`
  fragment ChargeAccordion on Charge {
    id
    chargeModel
    instant
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

export const ChargeAccordion = memo(
  ({ id, index, currency, disabled, isUsedInSubscription, formikProps }: ChargeAccordionProps) => {
    const warningDialogRef = useRef<WarningDialogRef>(null)
    const { translate } = useInternationalization()
    const localCharge = formikProps.values.charges[index]
    const { isPremium } = useCurrentUser()
    const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
    const handleUpdate = useCallback(
      (name: string, value: string | boolean) => {
        if (name === 'chargeModel' && value === ChargeModelEnum.Volume) {
          formikProps.setFieldValue(`charges.${index}.instant`, false)
        }
        formikProps.setFieldValue(`charges.${index}.${name}`, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [index, formikProps.setFieldValue]
    )
    const hasErrorInCharges = Boolean(
      formikProps.errors.charges && formikProps.errors.charges[index]
    )

    return (
      <>
        <Accordion
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
              <>
                {localCharge.instant && (
                  <Tooltip placement="top-end" title={translate('text_63ff7a14be2ceb36dd22ead6')}>
                    <InstantIcon name="flash-filled" />
                  </Tooltip>
                )}
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
                <Tooltip placement="top-end" title={translate('text_624aa732d6af4e0103d40e65')}>
                  <TrashButton
                    variant="quaternary"
                    size="small"
                    icon="trash"
                    data-test="remove-charge"
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation()
                      e.preventDefault()
                      if (isUsedInSubscription) {
                        warningDialogRef?.current?.openDialog()
                      } else {
                        const charges = [...formikProps.values.charges]

                        charges.splice(index, 1)
                        formikProps.setFieldValue('charges', charges)
                      }
                    }}
                  />
                </Tooltip>
              </>
            </>
          }
        >
          <Details>
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
                {
                  label: translate('text_62a0b7107afa2700a65ef6e2'),
                  value: ChargeModelEnum.Percentage,
                },
                {
                  label: translate('text_6282085b4f283b0102655868'),
                  value: ChargeModelEnum.Package,
                },
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
            <InstantCharge>
              <Tooltip
                disableHoverListener={
                  localCharge.chargeModel !== ChargeModelEnum.Volume &&
                  ![AggregationTypeEnum.MaxAgg, AggregationTypeEnum.RecurringCountAgg].includes(
                    localCharge?.billableMetric?.aggregationType
                  )
                }
                title={translate(
                  localCharge.chargeModel === ChargeModelEnum.Volume
                    ? 'text_63ff7a14be2ceb36dd22eb84'
                    : 'text_63ff7a14be2ceb36dd22eb8f'
                )}
                placement="top-start"
              >
                <Switch
                  name="instant"
                  label={translate('text_63ff7a14be2ceb36dd22ea88')}
                  subLabel={translate('text_63ff7a14be2ceb36dd22ea89')}
                  disabled={
                    isUsedInSubscription ||
                    localCharge.chargeModel === ChargeModelEnum.Volume ||
                    [AggregationTypeEnum.MaxAgg, AggregationTypeEnum.RecurringCountAgg].includes(
                      localCharge?.billableMetric?.aggregationType
                    )
                  }
                  checked={localCharge.instant || false}
                  onChange={(value) => {
                    if (isPremium) {
                      handleUpdate('instant', value)
                    } else {
                      premiumWarningDialogRef.current?.openDialog()
                    }
                  }}
                />
              </Tooltip>
              {!isPremium && !isUsedInSubscription && <Icon name="sparkles" />}
            </InstantCharge>
          </Details>
        </Accordion>

        <WarningDialog
          ref={warningDialogRef}
          title={translate('text_63cfe20ad6c1a53c5352a46e')}
          description={translate('text_63cfe20ad6c1a53c5352a470')}
          continueText={translate('text_63cfe20ad6c1a53c5352a474')}
          onContinue={() => {
            const charges = [...formikProps.values.charges]

            charges.splice(index, 1)
            formikProps.setFieldValue('charges', charges)
          }}
        />
        <PremiumWarningDialog ref={premiumWarningDialogRef} />
      </>
    )
  }
)

ChargeAccordion.displayName = 'ChargeAccordion'

const Details = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
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

const InstantIcon = styled(Icon)`
  margin-right: ${theme.spacing(3)};
  display: flex;
  align-items: center;
  fill: ${theme.palette.secondary[500]};
`

const TrashButton = styled(Button)`
  margin-left: ${theme.spacing(3)};
`

const InstantCharge = styled.div`
  box-shadow: ${theme.shadows[5]};
  margin-left: -${theme.spacing(4)};
  margin-right: -${theme.spacing(4)};
  padding: ${theme.spacing(4)} ${theme.spacing(4)} 0 ${theme.spacing(4)};
  display: flex;
  justify-content: space-between;
  align-items: center;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }
`
