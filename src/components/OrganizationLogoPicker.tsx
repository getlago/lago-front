import { useRef, useState } from 'react'

import { Avatar, Button, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { tw } from '~/styles/utils'

interface OrganizationLogoPickerProps {
  logoValue?: string
  className?: string
  onChange: (value?: string) => void
}

const FILE_MAX_SIZE = 800000

export const OrganizationLogoPicker = ({
  className,
  logoValue,
  onChange,
}: OrganizationLogoPickerProps) => {
  const [logoUploadError, setLogoUploadError] = useState(false)
  const { organization } = useOrganizationInfos()
  const { translate } = useInternationalization()
  const hiddenFileInputRef = useRef<HTMLInputElement>(null)

  const getBase64 = (file: Blob) => {
    const reader = new FileReader()

    if (file.size > FILE_MAX_SIZE) {
      setLogoUploadError(true)
      return
    }

    reader.readAsDataURL(file)
    reader.onload = () => {
      onChange(reader?.result?.toString())
    }
    reader.onerror = (error) => {
      // eslint-disable-next-line no-console
      console.error('Error: ', error)
    }
  }

  return (
    <div className={tw('flex gap-4', className)}>
      {logoValue || organization?.logoUrl ? (
        <Avatar size="large" variant="connector">
          <img
            src={(logoValue || organization?.logoUrl) as string}
            alt={`${organization?.name}'s logo`}
          />
        </Avatar>
      ) : (
        <Avatar
          size="large"
          variant="company"
          identifier={organization?.name || ''}
          initials={(organization?.name || '')
            .split(' ')
            .reduce((acc, n) => (acc = acc + n[0]), '')}
        />
      )}
      <div className="flex flex-col gap-2">
        <Button
          className="w-fit"
          variant="secondary"
          onClick={() => hiddenFileInputRef?.current?.click()}
        >
          {translate('text_62ab2d0396dd6b0361614d18')}
        </Button>
        <Typography variant="caption" color={logoUploadError ? 'danger600' : undefined}>
          {logoUploadError
            ? translate('text_62ab2d0396dd6b0361614d1e')
            : translate('text_62ab2d0396dd6b0361614d20')}
        </Typography>
      </div>
      <input
        className="hidden"
        type="file"
        accept="image/png, image/jpeg"
        ref={hiddenFileInputRef}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setLogoUploadError(false)
          const file = event?.target?.files?.[0]

          if (file) {
            getBase64(file)
          }
        }}
      />
    </div>
  )
}
