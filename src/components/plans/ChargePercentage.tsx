import { useCallback } from 'react'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import styled from 'styled-components'

import { intlFormatNumber } from '~/core/intlFormatNumber'
import { TextInput, ButtonSelector, ComboBox } from '~/components/form'
import { theme } from '~/styles'
import { Alert, Typography, Button, Tooltip } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CurrencyEnum, FixedAmountTargetEnum } from '~/generated/graphql'

import { PlanFormInput } from './types'

interface ChargePercentageProps {
  disabled?: boolean
  chargeIndex: number
  formikProps: FormikProps<PlanFormInput>
}

export const ChargePercentage = ({ disabled, chargeIndex, formikProps }: ChargePercentageProps) => {
  const { translate } = useInternationalization()
  const localCharge = formikProps.values.charges[chargeIndex]
  const handleUpdate = useCallback(
    (name: string, value: string | number) => {
      formikProps.setFieldValue(`charges.${chargeIndex}.${name}`, value)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chargeIndex]
  )

  const formattedFixedCharge = intlFormatNumber(Number(localCharge.fixedAmount) || 0, {
    currencyDisplay: 'code',
    currency: localCharge.amountCurrency,
    initialUnit: 'standard',
    maximumFractionDigits: 5,
  })
  const formattedRate = intlFormatNumber(Number(localCharge.rate) || 0, {
    minimumFractionDigits: 2,
    style: 'percent',
  })

  return (
    <Container>
      <TextInput
        label={translate('text_62a0b7107afa2700a65ef6f6')}
        name="rate"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        beforeChangeFormatter={['positiveNumber', 'decimal']}
        error={_get(formikProps.errors, `charges.${chargeIndex}.rate`)}
        disabled={disabled}
        placeholder={translate('text_62a0b7107afa2700a65ef700')}
        value={localCharge.rate as number | undefined}
        onChange={(value) => handleUpdate('rate', value)}
        InputProps={{
          endAdornment: (
            <InputEnd color={disabled ? 'disabled' : 'textSecondary'}>
              {translate('text_62a0b7107afa2700a65ef70a')}
            </InputEnd>
          ),
        }}
      />

      {!!localCharge.fixedAmountTarget ? (
        <>
          <LineAmount>
            <TextInput
              name="fixedAmount"
              beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
              disabled={disabled}
              label={translate('text_62a0b7107afa2700a65ef708')}
              placeholder={translate('text_62a0b7107afa2700a65ef712')}
              value={localCharge.fixedAmount || ''}
              onChange={(value) => handleUpdate('fixedAmount', value)}
            />
            <StyledComboBox
              name="amountCurrency"
              disabled
              data={Object.values(CurrencyEnum).map((currencyType) => ({
                value: currencyType,
              }))}
              disableClearable
              value={localCharge.amountCurrency}
              onChange={() => {}}
            />
            <Tooltip
              disableHoverListener={disabled}
              title={translate('text_62a0b7107afa2700a65ef74c')}
              placement="top-end"
            >
              <Button
                icon="trash"
                size="small"
                disabled={disabled}
                variant="quaternary"
                onClick={() => {
                  formikProps.setFieldValue(`charges.${chargeIndex}`, {
                    ...localCharge,
                    fixedAmount: undefined,
                    fixedAmountTarget: undefined,
                  })
                }}
              />
            </Tooltip>
          </LineAmount>
          <ButtonSelector
            label={translate('text_62a0b7107afa2700a65ef726')}
            value={localCharge.fixedAmountTarget as string | undefined}
            onChange={(value) => handleUpdate('fixedAmountTarget', value)}
            disabled={disabled}
            options={[
              {
                label: translate('text_62a0b7107afa2700a65ef730'),
                value: FixedAmountTargetEnum.EachUnit,
              },
              {
                label: translate('text_62a0b7107afa2700a65ef738'),
                value: FixedAmountTargetEnum.AllUnits,
              },
            ]}
          />
        </>
      ) : (
        <Button
          startIcon="plus"
          variant="quaternary"
          disabled={disabled}
          onClick={() =>
            formikProps.setFieldValue(`charges.${chargeIndex}`, {
              ...localCharge,
              fixedAmount: undefined,
              fixedAmountTarget: FixedAmountTargetEnum.EachUnit,
            })
          }
        >
          {translate('text_62a0b7107afa2700a65ef714')}
        </Button>
      )}
      <Alert type="info">
        <Typography
          color="textSecondary"
          html={
            !localCharge.fixedAmountTarget
              ? translate('text_62a0b7107afa2700a65ef71e', {
                  rate: formattedRate,
                  cost: intlFormatNumber(((Number(localCharge.rate) || 0) * 100) / 100, {
                    currencyDisplay: 'code',
                    currency: localCharge.amountCurrency,
                    initialUnit: 'standard',
                  }),
                })
              : localCharge.fixedAmountTarget === FixedAmountTargetEnum.EachUnit
              ? translate('text_62a0b7107afa2700a65ef73e', {
                  rate: formattedRate,
                  fixedCharge: formattedFixedCharge,
                  cost: intlFormatNumber(
                    ((Number(localCharge.rate) || 0) * 100) / 100 +
                      100 * (Number(localCharge.fixedAmount) || 0),
                    {
                      currencyDisplay: 'code',
                      currency: localCharge.amountCurrency,
                      initialUnit: 'standard',
                      maximumFractionDigits: 5,
                    }
                  ),
                })
              : translate('text_62a0b7107afa2700a65ef73a', {
                  rate: formattedRate,
                  fixedCharge: formattedFixedCharge,
                  cost: intlFormatNumber(
                    ((Number(localCharge.rate) || 0) * 100) / 100 +
                      (Number(localCharge.fixedAmount) || 0),
                    {
                      currencyDisplay: 'code',
                      currency: localCharge.amountCurrency,
                      initialUnit: 'standard',
                      maximumFractionDigits: 5,
                    }
                  ),
                })
          }
        />
      </Alert>
    </Container>
  )
}

const Container = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const InputEnd = styled(Typography)`
  margin-right: ${theme.spacing(4)};
`

const LineAmount = styled.div`
  display: flex;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
    flex: 1;
  }

  > *:last-child {
    transform: translateY(50%);
  }
`

const StyledComboBox = styled(ComboBox)`
  max-width: 120px;
  margin-top: ${theme.spacing(6)};
  margin-right: ${theme.spacing(3)};
`
