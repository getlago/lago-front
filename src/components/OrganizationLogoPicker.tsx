import { useRef, useState } from 'react'
import styled from 'styled-components'

import { Avatar, Button, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { theme } from '~/styles'

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
    var reader = new FileReader()

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
    <Container className={className}>
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
      <AvatarUploadWrapper>
        <ChooseFileButton variant="secondary" onClick={() => hiddenFileInputRef?.current?.click()}>
          {translate('text_62ab2d0396dd6b0361614d18')}
        </ChooseFileButton>
        <Typography variant="caption" color={logoUploadError ? 'danger600' : undefined}>
          {logoUploadError
            ? translate('text_62ab2d0396dd6b0361614d1e')
            : translate('text_62ab2d0396dd6b0361614d20')}
        </Typography>
      </AvatarUploadWrapper>
      <HiddenInput
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
    </Container>
  )
}

const Container = styled.div`
  display: flex;

  > *:first-child {
    margin-right: ${theme.spacing(4)};
  }
`

const AvatarUploadWrapper = styled.div`
  display: flex;
  flex-direction: column;

  > button {
    margin-bottom: ${theme.spacing(2)};
  }
`

const ChooseFileButton = styled(Button)`
  width: fit-content;
`

const HiddenInput = styled.input`
  display: none;
`
