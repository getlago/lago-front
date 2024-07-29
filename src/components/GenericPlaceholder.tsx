import { ReactNode } from 'react'
import styled from 'styled-components'

import { theme } from '~/styles'

import { Button, ButtonVariant } from './designSystem/Button'
import { Typography } from './designSystem/Typography'

export interface GenericPlaceholderProps {
  className?: string
  title?: string
  subtitle: string | ReactNode
  image: ReactNode
  buttonTitle?: string
  buttonVariant?: ButtonVariant
  buttonAction?: (() => Promise<void>) | (() => void)
  noMargins?: boolean
}

export const GenericPlaceholder = ({
  className,
  title,
  subtitle,
  image,
  buttonTitle,
  noMargins = false,
  buttonVariant,
  buttonAction,
  ...props
}: GenericPlaceholderProps) => {
  const hasButton = !!buttonTitle && !!buttonAction

  return (
    <Container className={className} $noMargins={noMargins} {...props}>
      {image}
      {title && <Title variant="subhead">{title}</Title>}
      <Body $withButton={hasButton}>{subtitle}</Body>

      {hasButton && (
        <Button variant={buttonVariant} onClick={buttonAction}>
          {buttonTitle}
        </Button>
      )}
    </Container>
  )
}

const Container = styled.div<{ $noMargins?: boolean }>`
  margin: ${({ $noMargins }) => ($noMargins ? 0 : '0 auto')};
  padding: ${({ $noMargins }) =>
    $noMargins ? 0 : `${theme.spacing(12)} ${theme.spacing(4)} ${theme.spacing(4)}`};
  max-width: 496px;

  img {
    width: 40px;
    height: 40px;
  }

  > *:first-child {
    margin-bottom: ${theme.spacing(5)};
  }
`

const Title = styled(Typography)`
  && {
    margin-bottom: ${theme.spacing(3)};
  }
`

const Body = styled(Typography)<{ $withButton?: boolean }>`
  && {
    margin-bottom: ${({ $withButton }) => ($withButton ? theme.spacing(5) : 0)};
  }
`
