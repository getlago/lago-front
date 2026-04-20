import { FC } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography, TypographyProps } from '~/components/designSystem/Typography'
import { addToast } from '~/core/apolloClient'
import { MaskOptions, maskValue } from '~/core/formats/maskValue'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

export const TYPOGRAPHY_WITH_COPY_CONTAINER_TEST_ID = 'typography-with-copy-container'
export const TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID = 'typography-with-copy-button'

interface TypographyWithCopyProps extends TypographyProps {
  masked?: boolean
  maskOptions?: MaskOptions
}

export const TypographyWithCopy: FC<TypographyWithCopyProps> = ({
  children,
  className,
  masked,
  maskOptions,
  ...typographyProps
}) => {
  const { translate } = useInternationalization()

  if (masked) {
    return (
      <Typography className={className} {...typographyProps}>
        {maskOptions ? maskValue(children as string, maskOptions) : children}
      </Typography>
    )
  }

  return (
    <Tooltip placement="top" title={translate('text_623b42ff8ee4e000ba87d0c6')}>
      <Button
        data-test={TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID}
        endIcon="duplicate"
        variant="quaternary"
        size="small"
        className={tw('-ml-1 px-1 py-0', className)}
        onClick={(e) => {
          e.stopPropagation()
          copyToClipboard(children as string)
          addToast({
            severity: 'info',
            translateKey: 'text_1775559630554ourrtpgddty',
          })
        }}
      >
        <Typography {...typographyProps}>{children}</Typography>
      </Button>
    </Tooltip>
  )
}
