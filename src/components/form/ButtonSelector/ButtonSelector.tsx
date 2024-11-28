import styled, { css } from 'styled-components'

import { Icon, Tooltip, Typography } from '~/components/designSystem'
import { theme } from '~/styles'

import { TabButton } from './TabButton'

type ValueType = string | number | boolean

interface ButtonSelectorOption {
  value: ValueType
  label?: string
  disabled?: boolean
}

export interface ButtonSelectorProps {
  className?: string
  label?: string
  description?: string
  options: ButtonSelectorOption[]
  value?: ValueType
  error?: string
  infoText?: string
  helperText?: string
  disabled?: boolean
  onChange: (value: ValueType) => void
}

export const ButtonSelector = ({
  className,
  label,
  description,
  options,
  value,
  error,
  infoText,
  helperText,
  disabled,
  onChange,
  ...props
}: ButtonSelectorProps) => {
  return (
    <Container className={className} {...props}>
      {!!label && (
        <Label $withInfo={!!infoText}>
          <Typography variant="captionHl" color="textSecondary">
            {label}
          </Typography>
          {!!infoText && (
            <Tooltip className="flex h-5 items-end" placement="bottom-start" title={infoText}>
              <Icon name="info-circle" />
            </Tooltip>
          )}
        </Label>
      )}
      {!!description && (
        <Description>
          <Typography variant="caption">{description}</Typography>
        </Description>
      )}
      <div className="flex flex-row flex-wrap items-center gap-3">
        {options.map(({ value: optionValue, label: optionLabel, disabled: optionDisabled }) => {
          return (
            <TabButton
              disabled={disabled || optionDisabled}
              key={`button-selector-${optionValue}`}
              title={optionLabel ?? optionValue}
              active={value === optionValue}
              onClick={() => onChange(optionValue)}
              data-test={`button-selector-${optionValue}`}
            />
          )
        })}
      </div>
      {(!!error || !!helperText) && (
        <StyledTypography variant="caption" color={error ? 'danger600' : 'textPrimary'}>
          {error || helperText}
        </StyledTypography>
      )}
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;

  > *:first-child {
    margin-bottom: ${theme.spacing(1)};
  }
`

const StyledTypography = styled(Typography)`
  && {
    margin-top: ${theme.spacing(1)};
  }
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
    `}
`

const Description = styled.div`
  margin-bottom: ${theme.spacing(4)} !important;
`
