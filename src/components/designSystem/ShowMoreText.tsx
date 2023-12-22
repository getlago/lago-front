import { cloneElement, ReactElement, useState } from 'react'
import styled from 'styled-components'

import { Typography, TypographyProps } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

interface ShowMoreTextProps extends TypographyProps {
  text: string
  limit: number
  showMore?: String | ReactElement
}

export const ShowMoreText = ({ text, limit, showMore, ...props }: ShowMoreTextProps) => {
  const { translate } = useInternationalization()
  const [isTextTruncated, setIsTextTruncated] = useState(true)

  if (!isTextTruncated || text.length <= limit) return <Typography {...props}>{text}</Typography>

  return (
    <Typography {...props}>
      <TruncatedText>{text.substring(0, limit)}...</TruncatedText>
      <ShowMoreHandler>
        {!showMore || typeof showMore === 'string' ? (
          /* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/anchor-is-valid */
          <span onClick={() => setIsTextTruncated(false)}>
            {showMore ? showMore : translate('text_62bdbf07117c3d1f178d6517')}
          </span>
        ) : (
          /* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/anchor-is-valid */
          !!showMore &&
          cloneElement(showMore as ReactElement, { onClick: () => setIsTextTruncated(false) })
        )}
      </ShowMoreHandler>
    </Typography>
  )
}

const ShowMoreHandler = styled.span`
  color: ${theme.palette.primary[600]};

  &:hover {
    cursor: pointer;
  }
`

const TruncatedText = styled.span`
  margin-right: ${theme.spacing(1)};
`

ShowMoreText.displayName = 'ShowMoreText'
