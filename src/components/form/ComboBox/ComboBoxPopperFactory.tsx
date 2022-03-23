import { Popper, PopperProps } from '@mui/material'
import styled from 'styled-components'

import { theme } from '~/styles'

import { ComboBoxProps } from './types'

type ComboBoxPopperFactoryArgs = Required<Pick<ComboBoxProps, 'PopperProps'>>['PopperProps']

// return a configured <Popper> component with custom styles
export const ComboBoxPopperFactory =
  ({ maxWidth, minWidth, placement }: ComboBoxPopperFactoryArgs = {}) =>
  // eslint-disable-next-line react/display-name
  (props: PopperProps) =>
    (
      <StyledPopper
        $minWidth={minWidth || 0}
        $maxWidth={maxWidth}
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
        {props.children}
      </StyledPopper>
    )

const StyledPopper = styled(Popper)<{ $minWidth?: number; $maxWidth?: number }>`
  min-width: ${({ $minWidth }) => $minWidth}px;
  max-width: ${({ $maxWidth }) => ($maxWidth ? `${$maxWidth}px` : 'initial')};
  z-index: ${theme.zIndex.popper};

  ${theme.breakpoints.down('sm')} {
    max-width: ${({ $minWidth }) => ($minWidth ? `${$minWidth}px` : 'initial')};
  }
`
