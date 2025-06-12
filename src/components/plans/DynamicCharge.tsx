import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { memo, useCallback, useState } from 'react'

import { Alert, Button, Chip, Tooltip, Typography } from '~/components/designSystem'
import { MultipleComboBox } from '~/components/form'
import { LocalChargeFilterInput, PlanFormInput } from '~/components/plans/types'
import { PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DynamicCharge on Properties {
    pricingGroupKeys
  }
`

type DynamicChargeProps = {
  chargeIndex: number
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
  disabled?: boolean
}

export const DynamicCharge = memo(
  ({ chargeIndex, disabled, formikProps, propertyCursor, valuePointer }: DynamicChargeProps) => {
    const { translate } = useInternationalization()

    const [shouldDisplayPricingGroupKeys, setShouldDisplayPricingGroupKeys] =
      useState<boolean>(false)

    const handleUpdate = useCallback(
      (name: string, value: string | string[]) => {
        formikProps.setFieldValue(`charges.${chargeIndex}.${name}`, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chargeIndex],
    )

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
          <div className="flex w-full gap-3">
            {!!valuePointer?.pricingGroupKeys?.length && (
              <div className="flex flex-wrap gap-2">
                {valuePointer?.pricingGroupKeys?.map((groupKey, groupKeyIndex) => (
                  <Chip
                    key={`pricing-groupe-key-chip-${groupKey}-${groupKeyIndex}`}
                    label={groupKey}
                    onDelete={() => {
                      const newPricingGroupKeys = valuePointer?.pricingGroupKeys?.filter(
                        (_, index) => index !== groupKeyIndex,
                      )

                      handleUpdate(`${propertyCursor}.pricingGroupKeys`, newPricingGroupKeys || [])
                    }}
                  />
                ))}
              </div>
            )}

            {shouldDisplayPricingGroupKeys ? (
              <div className="flex gap-3">
                <MultipleComboBox
                  freeSolo
                  hideTags
                  disableClearable
                  showOptionsOnlyWhenTyping
                  className="flex-1"
                  data={[]}
                  disabled={disabled}
                  onChange={(newValue) => {
                    const transformedValue = newValue?.map((item) => item.value) || undefined

                    handleUpdate(`${propertyCursor}.pricingGroupKeys`, transformedValue)
                  }}
                  value={(valuePointer?.pricingGroupKeys || []).map((key) => ({ value: key }))}
                  placeholder={translate('text_65ba6d45e780c1ff8acb206f')}
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
      </div>
    )
  },
)

DynamicCharge.displayName = 'DynamicCharge'
