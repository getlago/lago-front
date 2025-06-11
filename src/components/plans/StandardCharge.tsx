import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { memo, useCallback, useEffect, useState } from 'react'

import { Button, Tooltip, Typography } from '~/components/designSystem'
import { AmountInput, TextInput } from '~/components/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { LocalChargeFilterInput, LocalPropertiesInput, PlanFormInput } from './types'

gql`
  fragment StandardCharge on Properties {
    amount
    pricingGroupKeys
  }
`

interface StandardChargeProps {
  chargeIndex: number
  currency: CurrencyEnum
  formikProps: FormikProps<PlanFormInput>
  initialValuePointer: LocalPropertiesInput | LocalChargeFilterInput['properties'] | undefined
  propertyCursor: string
  valuePointer: LocalPropertiesInput | LocalChargeFilterInput['properties'] | undefined
  disabled?: boolean
}

export const StandardCharge = memo(
  ({
    chargeIndex,
    currency,
    disabled,
    formikProps,
    initialValuePointer,
    propertyCursor,
    valuePointer,
  }: StandardChargeProps) => {
    const { translate } = useInternationalization()

    const [shouldDisplayPricingGroupKeys, setShouldDisplayPricingGroupKeys] = useState<boolean>(
      !!initialValuePointer?.pricingGroupKeys,
    )
    const handleUpdate = useCallback(
      (name: string, value: string) => {
        formikProps.setFieldValue(`charges.${chargeIndex}.${name}`, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chargeIndex],
    )

    useEffect(() => {
      setShouldDisplayPricingGroupKeys(!!initialValuePointer?.pricingGroupKeys)
    }, [initialValuePointer?.pricingGroupKeys])

    return (
      <div className="flex flex-col gap-6">
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
              <InputAdornment position="end">{getCurrencySymbol(currency)}</InputAdornment>
            ),
          }}
        />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="captionHl" color="textSecondary">
              {translate('text_65ba6d45e780c1ff8acb20e0')}
            </Typography>
            <Typography variant="caption">{translate('text_6661fc17337de3591e29e425')}</Typography>
          </div>
          {shouldDisplayPricingGroupKeys || !!valuePointer?.pricingGroupKeys ? (
            <div className="flex gap-3">
              <TextInput
                className="flex-1"
                name={`${propertyCursor}.pricingGroupKeys`}
                placeholder={translate('text_65ba6d45e780c1ff8acb206f')}
                helperText={translate('text_65ba6d45e780c1ff8acb2073')}
                disabled={disabled}
                value={valuePointer?.pricingGroupKeys as unknown as string}
                onChange={(value) => handleUpdate(`${propertyCursor}.pricingGroupKeys`, value)}
              />

              <Tooltip
                className="mt-1"
                placement="top-end"
                title={translate('text_63aa085d28b8510cd46443ff')}
              >
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    // NOTE: that should be removed once the new multiple combobox is implemented and used to define the pricingGroupKeys
                    handleUpdate(`${propertyCursor}.pricingGroupKeys`, '')
                    setShouldDisplayPricingGroupKeys(false)
                  }}
                />
              </Tooltip>
            </div>
          ) : (
            <Button
              fitContent
              startIcon="plus"
              variant="quaternary"
              onClick={() => setShouldDisplayPricingGroupKeys(true)}
            >
              {translate('text_6661fc17337de3591e29e427')}
            </Button>
          )}
        </div>
      </div>
    )
  },
)

StandardCharge.displayName = 'StandardCharge'
