import { useCallback, MouseEvent } from 'react'
import { FormikProps } from 'formik'
import styled from 'styled-components'

import { theme } from '~/styles'
import { Button, Typography, Tooltip, Accordion } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { ChargeModelEnum, CurrencyEnum } from '~/generated/graphql'
import { ComboBox, TextInput } from '~/components/form'
import { GraduatedChargeTable } from '~/components/plans/GraduatedChargeTable'
import { PackageCharge } from '~/components/plans/PackageCharge'
import { ChargePercentage } from '~/components/plans/ChargePercentage'

import { PlanFormInput } from './types'
import { VolumeChargeTable } from './VolumeChargeTable'

interface ChargeAccordionProps {
  id: string
  index: number
  currency: CurrencyEnum
  disabled?: boolean
  formikProps: FormikProps<PlanFormInput>
}

export const ChargeAccordion = ({
  id,
  index,
  currency,
  disabled,
  formikProps,
}: ChargeAccordionProps) => {
  const { translate } = useInternationalization()
  const localCharge = formikProps.values.charges[index]

  const handleUpdate = useCallback(
    (name: string, value: string) => {
      formikProps.setFieldValue(`charges.${index}.${name}`, value)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, formikProps.setFieldValue]
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
          {!disabled && (
            <Tooltip
              placement="top-end"
              title={
                ChargeModelEnum.Volume
                  ? translate('text_6304e74aab6dbc18d615f421')
                  : translate('text_624aa732d6af4e0103d40e65')
              }
            >
              <Button
                variant="quaternary"
                size="small"
                icon="trash"
                data-test="remove-charge"
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation()
                  e.preventDefault()
                  const charges = [...formikProps.values.charges]

                  charges.splice(index, 1)
                  formikProps.setFieldValue('charges', charges)
                }}
              />
            </Tooltip>
          )}
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

        {localCharge.chargeModel === ChargeModelEnum.Standard && (
          <LineAmount>
            <TextInput
              name="amount"
              beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
              disabled={disabled}
              label={translate('text_624453d52e945301380e49b6')}
              placeholder={translate('text_624453d52e945301380e49b8')}
              value={localCharge.amount || ''}
              onChange={(value) => handleUpdate('amount', value)}
            />
            <ComboBox
              name="amountCurrency"
              disabled
              data={Object.values(CurrencyEnum).map((currencyType) => ({
                value: currencyType,
              }))}
              disableClearable
              value={currency}
              onChange={() => {}}
            />
          </LineAmount>
        )}
        {localCharge.chargeModel === ChargeModelEnum.Package && (
          <PackageCharge
            currency={currency}
            disabled={disabled}
            chargeIndex={index}
            formikProps={formikProps}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Graduated && (
          <GraduatedChargeTable
            disabled={disabled}
            chargeIndex={index}
            currency={currency}
            formikProps={formikProps}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Percentage && (
          <ChargePercentage
            currency={currency}
            disabled={disabled}
            chargeIndex={index}
            formikProps={formikProps}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Volume && (
          <VolumeChargeTable
            currency={currency}
            disabled={disabled}
            chargeIndex={index}
            formikProps={formikProps}
          />
        )}
      </Details>
    </Accordion>
  )
}

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

const LineAmount = styled.div`
  display: flex;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
    flex: 1;
  }

  > *:last-child {
    max-width: 120px;
    margin-top: 24px;
  }
`
