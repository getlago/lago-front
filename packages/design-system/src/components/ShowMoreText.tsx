import { cloneElement, ReactElement, useState } from 'react'

import { Typography, TypographyProps } from './Typography'

interface ShowMoreTextProps extends TypographyProps {
  text: string
  limit: number
  showMore?: string | ReactElement
}

export const ShowMoreText = ({ text, limit, showMore, ...props }: ShowMoreTextProps) => {
  const [isTextTruncated, setIsTextTruncated] = useState(true)

  if (!isTextTruncated || text.length <= limit)
    return (
      <Typography className="line-break-anywhere" {...props}>
        {text}
      </Typography>
    )

  return (
    <Typography {...props}>
      <span className="mr-1 line-break-anywhere">{text.substring(0, limit)}...</span>
      <span className="text-blue-600">
        {!showMore || typeof showMore === 'string' ? (
          <button
            className="h-auto rounded-none p-0 focus:ring"
            onClick={() => setIsTextTruncated(false)}
          >
            {showMore
              ? showMore
              : // TODO: Handle translations
                //translate('text_62bdbf07117c3d1f178d6517')}
                'Show more'}
          </button>
        ) : (
          !!showMore &&
          cloneElement(showMore as ReactElement, { onClick: () => setIsTextTruncated(false) })
        )}
      </span>
    </Typography>
  )
}

ShowMoreText.displayName = 'ShowMoreText'
