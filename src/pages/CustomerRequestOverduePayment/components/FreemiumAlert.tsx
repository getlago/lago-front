import { FC, useRef } from 'react'
import styled from 'styled-components'

import { Button, Icon, Typography } from '~/components/designSystem'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

export const FreemiumAlert: FC = () => {
  const { translate } = useInternationalization()
  const premiumDialogRef = useRef<PremiumWarningDialogRef>(null)

  return (
    <>
      <Alert>
        <div>
          <AlertTitle>
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_66b25adfd834ed0104345eb7')}
            </Typography>
            <Icon name="sparkles" />
          </AlertTitle>
          <Typography variant="caption">{translate('text_66b25adfd834ed0104345eb8')}</Typography>
        </div>
        <Button
          variant="tertiary"
          size="large"
          endIcon="sparkles"
          onClick={() => premiumDialogRef.current?.openDialog()}
        >
          {translate('text_65ae73ebe3a66bec2b91d72d')}
        </Button>
      </Alert>

      <PremiumWarningDialog ref={premiumDialogRef} />
    </>
  )
}

const Alert = styled.div`
  display: flex;
  gap: ${theme.spacing(4)};
  padding: ${theme.spacing(12)};
  background-color: ${theme.palette.secondary[100]};
  box-shadow: ${theme.shadows[7]};
  align-items: center;

  > div:first-child {
    flex: 1;
  }
`

const AlertTitle = styled.div`
  display: flex;
  gap: ${theme.spacing(2)};
  align-items: center;
`
