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
} from '~/generated/graphql'
import { AmountInput, ComboBox } from '~/components/form'
import { GraduatedChargeTable } from '~/components/plans/GraduatedChargeTable'
import { PackageCharge } from '~/components/plans/PackageCharge'
import { ChargePercentage } from '~/components/plans/ChargePercentage'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'

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

    const handleUpdate = useCallback(
      (name: string, value: string) => {
        formikProps.setFieldValue(`charges.${index}.${name}`, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [index, formikProps.setFieldValue]
    )

    const hasErrorInCharges = Boolean(
      formikProps.errors.charges && formikProps.errors.charges[index]
    )

    return (
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
        </Details>
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
      </Accordion>
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

const TrashButton = styled(Button)`
  margin-left: ${theme.spacing(3)};
`
