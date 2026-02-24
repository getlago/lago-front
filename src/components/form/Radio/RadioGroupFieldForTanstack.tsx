import { useTheme } from '@mui/material/styles'
import { Icon } from 'lago-design-system'

import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { useFieldContext } from '~/hooks/forms/formContext'
import { tw } from '~/styles/utils'

import { Radio, RadioProps } from './Radio'

interface RadioGroupFieldProps {
  description?: string
  disabled?: boolean
  infoText?: string
  label?: string
  optionLabelVariant?: RadioProps['labelVariant']
  options: {
    value: string | number | boolean
    label: string
    disabled?: boolean
    sublabel?: string
  }[]
  optionsGapSpacing?: number
}

const RadioGroupField = ({
  description,
  disabled,
  infoText,
  label,
  optionLabelVariant,
  options,
  optionsGapSpacing = 2,
}: RadioGroupFieldProps) => {
  const field = useFieldContext<string | number | boolean>()
  const theme = useTheme()

  return (
    <div>
      {!!label && (
        <div className="flex justify-between">
          <div
            className={tw('flex items-center justify-between', !!infoText && '*:first-child:mr-1')}
          >
            <Typography variant="captionHl" color="textSecondary" component="legend">
              {label}
            </Typography>
            {!!infoText && (
              <Tooltip className="flex h-5 items-end" placement="top-start" title={infoText}>
                <Icon name="info-circle" />
              </Tooltip>
            )}
          </div>
        </div>
      )}
      {!!description && (
        <Typography className="mb-4" variant="caption">
          {description}
        </Typography>
      )}

      <div className="flex w-full flex-col" style={{ gap: theme.spacing(optionsGapSpacing) }}>
        {options.map(({ value, label: optionLabel, disabled: optionDisabled, sublabel }) => (
          <Radio
            key={`radio-group-field-${value}`}
            name={field.name}
            value={value}
            checked={field.state.value === value}
            onChange={() => field.handleChange(value)}
            disabled={disabled || optionDisabled}
            label={optionLabel ?? value}
            labelVariant={optionLabelVariant}
            sublabel={sublabel}
            data-test={`radio-group-field-${value}`}
          />
        ))}
      </div>
    </div>
  )
}

export default RadioGroupField
