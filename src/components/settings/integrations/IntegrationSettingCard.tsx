import { useState } from 'react'

import { Button, Skeleton, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface IntegrationSettingCardProps {
  label: string
  value?: string | null
  isValueSecret?: boolean
  isValueVisible?: boolean
  onChangeValueVisibility?: () => void
  isLoading?: boolean
}

export const IntegrationSettingCard = ({
  label,
  value,
  isValueSecret = false,
  isValueVisible = true,
  onChangeValueVisibility,
  isLoading = false,
}: IntegrationSettingCardProps) => {
  const { translate } = useInternationalization()
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    if (!value) return

    navigator.clipboard.writeText(value)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="border-gray-300 rounded-md border p-4">
      <div className="flex justify-between">
        <Typography variant="captionHl" color="grey600" className="mb-1">
          {label}
        </Typography>
        <div className="flex gap-2">
          {isValueSecret && onChangeValueVisibility && (
            <Button
              variant="quaternary"
              size="small"
              startIcon={isValueVisible ? 'eye-hidden' : 'eye'}
              onClick={onChangeValueVisibility}
            >
              {isValueVisible ? translate('text_hide_value') : translate('text_show_value')}
            </Button>
          )}
          <Button
            variant="quaternary"
            size="small"
            startIcon={isCopied ? 'checkmark' : 'duplicate'}
            onClick={handleCopy}
            disabled={!value || isLoading}
          >
            {isCopied ? translate('text_copied') : translate('text_copy')}
          </Button>
        </div>
      </div>
      {isLoading ? (
        <Skeleton variant="text" width="80%" height={20} />
      ) : (
        <Typography variant="body" color="grey700" className="break-all">
          {isValueSecret && !isValueVisible && value ? '••••••••••••••••' : value || '-'}
        </Typography>
      )}
    </div>
  )
}
