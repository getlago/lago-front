import styled, { css } from 'styled-components'

import { Icon, Tooltip, Typography } from '~/components/designSystem'
import { theme } from '~/styles'
import { ButtonGroup } from '~/styles'

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
  options,
  value,
  error,
  infoText,
  helperText,
  disabled,
  onChange,
}: ButtonSelectorProps) => {
  return (
    <Container className={className}>
      {!!label && (
        <Label $withInfo={!!infoText}>
          <Typography variant="captionHl" color="textSecondary">
            {label}
          </Typography>
          {!!infoText && (
            <Tooltip placement="bottom-start" title={infoText}>
              <Icon name="info-circle" />
            </Tooltip>
          )}
        </Label>
      )}
      <ButtonGroup>
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
      </ButtonGroup>
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

      > *:last-child {
        height: 16px;
      }
    `}
`
