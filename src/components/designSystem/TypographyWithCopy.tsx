import { FC } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography, TypographyProps } from '~/components/designSystem/Typography'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

export const TYPOGRAPHY_WITH_COPY_CONTAINER_TEST_ID = 'typography-with-copy-container'
export const TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID = 'typography-with-copy-button'

interface TypographyWithCopyProps extends Omit<TypographyProps, 'children'> {
  children: string
}

export const TypographyWithCopy: FC<TypographyWithCopyProps> = ({
  children,
  className,
  ...typographyProps
}) => {
  const { translate } = useInternationalization()

  return (
    <div className={tw('group flex items-center gap-1', className)} data-test={TYPOGRAPHY_WITH_COPY_CONTAINER_TEST_ID}>
      <Typography {...typographyProps}>{children}</Typography>
      <Tooltip placement="top-start" title={translate('text_623b42ff8ee4e000ba87d0c6')}>
        <Button
          data-test={TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID}
          className="opacity-0 group-hover:opacity-100"
          icon="duplicate"
          variant="quaternary"
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            copyToClipboard(children)
            addToast({
              severity: 'info',
              translateKey: 'text_1775300000000copiedtoclipboard',
            })
          }}
        />
      </Tooltip>
    </div>
  )
}
