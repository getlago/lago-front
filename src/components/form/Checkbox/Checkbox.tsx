import { Checkbox as MuiCheckbox, FormControlLabel } from '@mui/material'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import CheckedIcon from '~/public/icons/forms/checkbox-checked.svg'
import IndeterminateIcon from '~/public/icons/forms/checkbox-indeterminate.svg'
import Icon from '~/public/icons/forms/checkbox.svg'
import { theme } from '~/styles'

export interface CheckboxProps {
  canBeIndeterminate?: boolean
  value?: boolean | null
  disabled?: boolean
  label?: string | React.ReactNode
  name?: string
  error?: string
  className?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void
}

/**
 * If checkbox 'canBeIndeterminate, the value can either be 'true', 'false', or 'undefined'
 * Otherwise, value can only be a boolean
 *
 * The checkbox will have the following behaviour on click if it canBeIndeterminate :
 * - if 'value === true' --> the new value will be false
 * - if value is undefined or null --> new value will be true
 * - if 'value === false' --> the new value will be true
 * The only way to set the value to 'undefined' is from the parent component.
 *
 * For example, the 'undefined' (aka undetermined) state could be to show that only some sub checkboxes are checked
 */
export const Checkbox = ({
  canBeIndeterminate,
  value,
  disabled,
  label,
  name,
  error,
  className,
  onChange,
}: CheckboxProps) => {
  return (
    <Container className={className}>
      <FormControlLabel
        disabled={disabled}
        control={
          <MuiCheckbox
            color="default"
            checked={canBeIndeterminate && typeof value !== 'boolean' ? true : !!value}
            onChange={onChange}
            name={name}
            indeterminate={canBeIndeterminate && typeof value !== 'boolean'}
            checkedIcon={<CheckedIcon />}
            icon={<Icon />}
            indeterminateIcon={<IndeterminateIcon />}
            disableRipple
          />
        }
        label={
          typeof label === 'string' ? (
            <Typography color={disabled ? 'disabled' : 'textSecondary'}>{label}</Typography>
          ) : (
            label
          )
        }
      />
      {!!error && (
        <StyledTypography variant="caption" color="danger600">
          {error}
        </StyledTypography>
      )}
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

const StyledTypography = styled(Typography)`
  && {
    margin-top: ${theme.spacing(1)};
  }
`
