import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { memo, useCallback, useEffect, useState } from 'react'

import { Alert, Button, Tooltip, Typography } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import {
  LocalChargeFilterInput,
  LocalPropertiesInput,
  PlanFormInput,
} from '~/components/plans/types'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DynamicCharge on Properties {
    pricingGroupKeys
  }
`

type DynamicChargeProps = {
  chargeIndex: number
  formikProps: FormikProps<PlanFormInput>
  initialValuePointer: LocalPropertiesInput | LocalChargeFilterInput['properties'] | undefined
  propertyCursor: string
  valuePointer: LocalPropertiesInput | LocalChargeFilterInput['properties'] | undefined
  disabled?: boolean
}

export const DynamicCharge = memo(
  ({
    chargeIndex,
    disabled,
    formikProps,
    initialValuePointer,
    propertyCursor,
    valuePointer,
  }: DynamicChargeProps) => {
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
        <Alert type="info">{translate('text_17277706303454rxgscdqklx')}</Alert>

        <div className="flex flex-col items-start gap-3">
          <div className="flex flex-col gap-1">
            <Typography variant="captionHl" color="textSecondary">
              {translate('text_65ba6d45e780c1ff8acb20e0')}
            </Typography>
            <Typography variant="caption">{translate('text_6661fc17337de3591e29e425')}</Typography>
          </div>
          {shouldDisplayPricingGroupKeys || !!valuePointer?.pricingGroupKeys ? (
            <div className="flex w-full gap-3">
              {/* NOTE: should be a single line textarea */}
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
                className="mt-1 h-fit"
                placement="top-end"
                title={translate('text_63aa085d28b8510cd46443ff')}
              >
                <Button
                  align="left"
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

DynamicCharge.displayName = 'DynamicCharge'
