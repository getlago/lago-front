import styled from 'styled-components'

import { theme } from '~/styles'
import { Typography, TabButton } from '~/components/designSystem'
import { ButtonGroup } from '~/styles'

interface ButtonSelectorOption {
  value: string | number
  label?: string
}

export interface ButtonSelectorProps {
  className?: string
  label?: string
  options: ButtonSelectorOption[]
  value?: string | number
  error?: string
  onChange: (value: string | number) => void
}

export const ButtonSelector = ({
  className,
  label,
  options,
  value,
  error,
  onChange,
}: ButtonSelectorProps) => {
  return (
    <Container className={className}>
      {!!label && (
        <Typography variant="captionHl" color="textSecondary">
          {label}
        </Typography>
      )}
      <ButtonGroup>
        {options.map(({ value: optionValue, label: optionLabel }) => {
          return (
            <TabButton
              outlined
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
