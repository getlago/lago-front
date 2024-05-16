import { Stack } from '@mui/material'
import { FC } from 'react'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  Chip,
  Popper,
  Skeleton,
  Status,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import Okta from '~/public/images/okta.svg'
import { MenuPopper, theme } from '~/styles'

interface OktaListItemProps {
  integrationId?: string
  onConfigure: () => void
  onDelete: () => void
  onGoDetails?: () => void
}

export const OktaListItem: FC<OktaListItemProps> = ({
  integrationId,
  onConfigure,
  onGoDetails,
  onDelete,
}) => {
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()

  return (
    <Container>
      <div>
        <Avatar size="big" variant="connector">
          <Okta />
        </Avatar>
      </div>
      <TitleWrapper>
        <Typography variant="bodyHl" color="textSecondary">
          {translate('TODO: Okta')}
        </Typography>
        <Typography variant="caption" color="grey600" noWrap>
          {translate('TODO: Allows logins using SSO by connecting Lago and Okta.')}
        </Typography>
      </TitleWrapper>
      <div>
        {integrationId ? (
          <Stack direction="row" gap={3} alignItems="center">
            <Chip label={<Status type="running" label={translate('TODO: Configured')} />} />

            <Popper
              PopperProps={{ placement: 'bottom-end' }}
              opener={({ isOpen }) => (
                <div>
                  <Tooltip
                    placement="top-end"
                    disableHoverListener={isOpen}
                    title={translate('TODO: View, edit, delete')}
                  >
                    <Button icon="dots-horizontal" variant="quaternary" size="medium" />
                  </Tooltip>
                </div>
              )}
            >
              {({ closePopper }) => (
                <MenuPopper>
                  <Button
                    variant="quaternary"
                    fullWidth
                    align="left"
                    startIcon="eye"
                    onClick={() => {
                      closePopper()
                      onGoDetails?.()
                    }}
                  >
                    {translate('TODO: View connection')}
                  </Button>
                  <Button
                    variant="quaternary"
                    align="left"
                    fullWidth
                    startIcon="pen"
                    onClick={() => {
                      closePopper()
                      onConfigure()
                    }}
                  >
                    {translate('TODO: Edit connection')}
                  </Button>
                  <Button
                    variant="quaternary"
                    align="left"
                    fullWidth
                    startIcon="trash"
                    onClick={() => {
                      closePopper()
                      onDelete()
                    }}
                  >
                    {translate('TODO: Delete connection')}
                  </Button>
                </MenuPopper>
              )}
            </Popper>
          </Stack>
        ) : (
          <Button
            variant="quaternary"
            size="medium"
            endIcon={isPremium ? undefined : 'sparkles'}
            onClick={onConfigure}
          >
            {translate('TODO: Configure')}
          </Button>
        )}
      </div>
    </Container>
  )
}

export const SkeletonOktaListItem = () => {
  return (
    <Container>
      <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
      <TitleWrapper>
        <Skeleton variant="text" width={100} marginBottom="12px" />
        <Skeleton variant="text" width={250} />
      </TitleWrapper>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
  padding-top: ${theme.spacing(8)};
  padding-bottom: ${theme.spacing(8)};
  border-bottom: 1px solid ${theme.palette.grey[200]};
`

const TitleWrapper = styled.div`
  flex: 1;
`
