import { ReactNode, useState } from 'react'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

interface ShowMoreTextProps {
  text: string
  limit: number
  showMore?: String | ReactNode
}

export const ShowMoreText = ({ text, limit, showMore }: ShowMoreTextProps) => {
  const { translate } = useInternationalization()
  const [isTextTruncated, setIsTextTruncated] = useState(true)

  if (!isTextTruncated || text.length <= limit) return <>{text}</>

  return (
    <Typography>
      <TruncatedText>{text.substring(0, limit)}...</TruncatedText>
      <span>
        {!showMore || typeof showMore === 'string' ? (
          /* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/anchor-is-valid */
          <ShowMoreHandler onClick={() => setIsTextTruncated(false)}>
            {showMore ? showMore : translate('text_62bdbf07117c3d1f178d6517')}
          </ShowMoreHandler>
        ) : (
          /* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/anchor-is-valid */
          !!showMore && showMore
        )}
      </span>
    </Typography>
  )
}

const ShowMoreHandler = styled.a`
  &:hover {
    cursor: pointer;
  }
`

const TruncatedText = styled.span`
  margin-right: ${theme.spacing(1)};
`

ShowMoreText.displayName = 'ShowMoreText'
