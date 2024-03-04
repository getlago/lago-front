import { Popper, PopperProps } from '@mui/material'
import clsns from 'classnames'
import { ReactNode } from 'react'
import styled from 'styled-components'

import { theme } from '~/styles'

import { MultipleComboBoxProps } from './types'

type MultipleComboBoxPopperFactoryArgs = Required<
  Pick<MultipleComboBoxProps, 'PopperProps'>
>['PopperProps'] & {
  grouped?: boolean
  virtualized?: boolean
}

// return a configured <Popper> component with custom styles
export const MultipleComboBoxPopperFactory =
  ({
    maxWidth,
    minWidth,
    placement,
    displayInDialog,
    grouped,
    virtualized,
  }: MultipleComboBoxPopperFactoryArgs = {}) =>
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
        className={clsns({
          'multipleComboBox-popper--virtualized': virtualized,
          'multipleComboBox-popper--grouped': grouped,
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

  .MuiAutocomplete-option {
    margin: 0;
  }
`
