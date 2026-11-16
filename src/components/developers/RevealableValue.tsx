import { Button } from '~/components/designSystem/Button'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { TypographyProps } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

export const REVEALABLE_VALUE_LOADING_TEST_ID = 'revealable-value-loading'

const MASK_OPTIONS = { dotsCount: 8, visibleChars: 3 }

type RevealableValueProps = {
  value: string
  isRevealed: boolean
  onToggleReveal: () => void
  maskWhenHidden?: boolean
  isLoading?: boolean
  onCopy?: () => void
  variant?: TypographyProps['variant']
  className?: string
  valueClassName?: string
  valueTestId?: string
  revealButtonTestId?: string
}

export const RevealableValue = ({
  value,
  isRevealed,
  onToggleReveal,
  maskWhenHidden = true,
  isLoading = false,
  onCopy,
  variant = 'captionCode',
  className,
  valueClassName,
  valueTestId,
  revealButtonTestId,
}: RevealableValueProps) => {
  const { translate } = useInternationalization()

  return (
    <div className={tw('flex items-center gap-2', className)}>
      {isLoading ? (
        <div className="flex h-8 items-center" data-test={REVEALABLE_VALUE_LOADING_TEST_ID}>
          <Skeleton variant="text" textVariant="captionCode" className="w-40" />
        </div>
      ) : (
        <TypographyWithCopy
          className={valueClassName}
          color="grey700"
          variant={variant}
          masked={maskWhenHidden && !isRevealed}
          maskOptions={MASK_OPTIONS}
          onCopy={onCopy}
          data-test={valueTestId}
        >
          {value}
        </TypographyWithCopy>
      )}

      <Tooltip
        placement="top-start"
        title={translate(
          isRevealed ? 'text_1731082143943pr83kgzeh86' : 'text_1731082129536sv17ey4g0sk',
        )}
      >
        <Button
          variant="quaternary"
          size="small"
          loading={isLoading}
          icon={isRevealed ? 'eye-hidden' : 'eye'}
          onClick={onToggleReveal}
          data-test={revealButtonTestId}
        />
      </Tooltip>
    </div>
  )
}
