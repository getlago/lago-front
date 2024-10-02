import { Popper, PopperProps } from '@mui/material'
import { cx } from 'class-variance-authority'
import { ReactNode } from 'react'
import styled from 'styled-components'

import { theme } from '~/styles'

import { ComboBoxProps } from './types'

type ComboBoxPopperFactoryArgs = Required<Pick<ComboBoxProps, 'PopperProps'>>['PopperProps'] & {
  grouped?: boolean
  virtualized?: boolean
}

// return a configured <Popper> component with custom styles
export const ComboBoxPopperFactory =
  ({
    maxWidth,
    minWidth,
    placement,
    displayInDialog,
    grouped,
    virtualized,
  }: ComboBoxPopperFactoryArgs = {}) =>
  // eslint-disable-next-line react/display-name
  (props: PopperProps) => (
    <StyledPopper
      $minWidth={minWidth || 0}
      $maxWidth={maxWidth}
      $displayInDialog={displayInDialog}
      placement={placement || 'bottom-start'}
      modifiers={[
        {
          name: 'offset',
          enabled: true,
          options: {
            offset: [0, 8],
          },
        },
      ]}
      {...props}
    >
      <div
        className={cx({
          'combobox-popper--virtualized': virtualized,
          'combobox-popper--grouped': grouped,
        })}
      >
        {props?.children as ReactNode}
      </div>
    </StyledPopper>
  )

const StyledPopper = styled(Popper)<{
  $minWidth?: number
  $maxWidth?: number
  $displayInDialog?: boolean
}>`
  min-width: ${({ $minWidth }) => $minWidth}px;
  max-width: ${({ $maxWidth }) => ($maxWidth ? `${$maxWidth}px` : 'initial')};
  z-index: ${({ $displayInDialog }) =>
    $displayInDialog ? theme.zIndex.dialog + 1 : theme.zIndex.popper};

  ${theme.breakpoints.down('md')} {
    max-width: ${({ $minWidth }) => ($minWidth ? `${$minWidth}px` : 'initial')};
  }

  .MuiAutocomplete-paper {
    border: 1px solid ${theme.palette.grey[200]};
    padding: ${theme.spacing(2)} 0;
    box-sizing: content-box;
  }

  > *.combobox-popper--grouped .MuiAutocomplete-paper {
    padding: 0 0 ${theme.spacing(2)} 0;
  }
`
