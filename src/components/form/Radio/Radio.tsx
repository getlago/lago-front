import { Radio as MuiRadio, FormControlLabel } from '@mui/material'
import { forwardRef, ReactNode } from 'react'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import { theme } from '~/styles'
import Icon from '~/public/icons/forms/radio.svg'
import CheckedIcon from '~/public/icons/forms/radio-checked.svg'

export interface RadioProps {
  name?: string
  value: string | number
  checked: boolean
  disabled?: boolean
  label?: string | ReactNode
  error?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void
}

export const Radio = forwardRef<HTMLElement, RadioProps>(
  ({ name, checked, label, disabled, error, onChange }: RadioProps, ref) => {
    return (
      <Container>
        <FormControlLabel
          disabled={disabled}
          ref={ref}
          checked={checked}
          control={
            <MuiRadio
              name={name}
              icon={<Icon />}
              checkedIcon={<CheckedIcon />}
              disableRipple
              onChange={onChange}
            />
          }
          label={<Typography color={disabled ? 'disabled' : 'textSecondary'}>{label}</Typography>}
        />
        {!!error && (
          <StyledTypography variant="caption" color="error">
            {error}
          </StyledTypography>
        )}
      </Container>
    )
  }
)

Radio.displayName = 'Radio'

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

const StyledTypography = styled(Typography)`
  && {
    margin-top: ${theme.spacing(1)}px;
  }
`
