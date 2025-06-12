import { Button, Chip, Tooltip, Typography } from 'lago-design-system'
import { useState } from 'react'

import { MultipleComboBox } from '~/components/form'
import { PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface PricingGroupKeysProps {
  disabled: boolean | undefined
  handleUpdate: (propertyCursor: string, value: string[]) => void
  propertyCursor: string
  valuePointer: PropertiesInput | undefined
}
const PricingGroupKeys = ({
  disabled,
  handleUpdate,
  propertyCursor,
  valuePointer,
}: PricingGroupKeysProps) => {
  const { translate } = useInternationalization()

  const [shouldDisplayPricingGroupKeys, setShouldDisplayPricingGroupKeys] = useState<boolean>(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Typography variant="captionHl" color="textSecondary">
          {translate('text_65ba6d45e780c1ff8acb20ce')}
        </Typography>
        <Typography variant="caption">{translate('text_6661fc17337de3591e29e425')}</Typography>
      </div>
      <div className="flex flex-col gap-3">
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
              className="mt-1"
              placement="top-end"
              title={translate('text_63aa085d28b8510cd46443ff')}
            >
              <Button
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
}

export default PricingGroupKeys
