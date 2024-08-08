import { Stack } from '@mui/material'
import { FormikProps } from 'formik'
import { FC } from 'react'
import styled, { css } from 'styled-components'

import { Icon, Tooltip, Typography } from '~/components/designSystem'
import { theme } from '~/styles'

import { RadioProps } from './Radio'
import { RadioField, RadioFieldProps } from './RadioField'

interface RadioGroupFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
  name: string
  label?: string
  optionLabelVariant?: RadioProps['labelVariant']
  infoText?: string
  description?: string
  optionsGapSpacing?: number
  options: Pick<RadioFieldProps, 'value' | 'label' | 'disabled' | 'sublabel'>[]
  disabled?: boolean
}

export const RadioGroupField: FC<RadioGroupFieldProps> = ({
  name,
  formikProps,
  options,
  disabled,
  label,
  optionLabelVariant,
  optionsGapSpacing = 2,
  description,
  infoText,
}) => {
  return (
    <div>
      {!!label && (
        <InlineLabelContainer>
          {label && (
            <Label $withInfo={!!infoText}>
              <Typography variant="captionHl" color="textSecondary" component="legend">
                {label}
              </Typography>
              {!!infoText && (
                <Tooltip placement="top-start" title={infoText}>
                  <Icon name="info-circle" />
                </Tooltip>
              )}
            </Label>
          )}
        </InlineLabelContainer>
      )}
      {!!description && (
        <Description>
          <Typography variant="caption">{description}</Typography>
        </Description>
      )}

      <Stack width="100%" gap={optionsGapSpacing}>
        {options.map(
          ({ value: optionValue, label: optionLabel, disabled: optionDisabled, ...props }) => {
            return (
              <RadioField
                {...props}
                name={name}
                formikProps={formikProps}
                disabled={disabled || optionDisabled}
                key={`radio-group-field-${optionValue}`}
                label={optionLabel ?? optionValue}
                labelVariant={optionLabelVariant}
                value={optionValue}
                data-test={`radio-group-field-${optionValue}`}
              />
            )
          },
        )}
      </Stack>
    </div>
  )
}

const InlineLabelContainer = styled.div`
  display: flex;
  justify-content: space-between;
`

const Label = styled.div<{ $withInfo?: boolean }>`
  display: flex;
  align-items: center;

  ${({ $withInfo }) =>
    $withInfo &&
    css`
      > *:first-child {
        margin-right: ${theme.spacing(1)};
      }

      > *:last-child {
        height: 16px;
      }
    `}
`

const Description = styled.div`
  margin-bottom: ${theme.spacing(4)} !important;
`
