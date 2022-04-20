import styled, { css } from 'styled-components'

import { theme } from '~/styles'
import { Typography, TabButton, Tooltip, Icon } from '~/components/designSystem'
import { ButtonGroup } from '~/styles'

interface ButtonSelectorOption {
  value: string | number
  label?: string
  disabled?: boolean
}

export interface ButtonSelectorProps {
  className?: string
  label?: string
  options: ButtonSelectorOption[]
  value?: string | number
  error?: string
  infoText?: string
  disabled?: boolean
  onChange: (value: string | number) => void
}

export const ButtonSelector = ({
  className,
  label,
  options,
  value,
  error,
  infoText,
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
              outlined
              disabled={disabled || optionDisabled}
              key={`button-selector-${optionValue}`}
              title={optionLabel ?? optionValue}
              active={value === optionValue}
              onClick={() => onChange(optionValue)}
            />
          )
        })}
      </ButtonGroup>
      {!!error && (
        <StyledTypography variant="caption" color="error">
          {error}
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
    margin-top: ${theme.spacing(1)}px;
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
