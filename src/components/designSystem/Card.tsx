import styled from 'styled-components'
import { ReactNode, forwardRef } from 'react'

import { theme } from '~/styles'

export interface CardProps {
  className?: string
  children: ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className }: CardProps, ref) => {
    return (
      <Container className={className} ref={ref}>
        {children}
      </Container>
    )
  }
)

Card.displayName = 'Card'

const Container = styled.div`
  background-color: ${theme.palette.background.default};
  box-shadow: ${theme.shadows[2]};
  border: 1px solid ${theme.palette.grey[200]};
  border-radius: 12px;
`
