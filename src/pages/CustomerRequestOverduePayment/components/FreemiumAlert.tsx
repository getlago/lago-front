import { FC } from 'react'
import styled from 'styled-components'

import { Button, Icon, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { theme } from '~/styles'

interface FreemiumAlertProps {}

export const FreemiumAlert: FC<FreemiumAlertProps> = () => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()

  if (isPremium) {
    return null
  }

  return (
    <Alert>
      <div>
        <AlertTitle>
          <Typography variant="bodyHl" color="textSecondary">
            {translate('TODO: Request overdue payment')}
          </Typography>
          <Icon name="sparkles" />
        </AlertTitle>
        <Typography variant="caption">
          {translate(
            'TODO: Send an email to your customer to request the payment of all overdue invoices',
          )}
        </Typography>
      </div>
      <Button variant="tertiary" size="large" endIcon="sparkles">
        {translate('TODO: Contact us')}
      </Button>
    </Alert>
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
