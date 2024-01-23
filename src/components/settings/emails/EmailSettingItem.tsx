import { useRef } from 'react'
import styled from 'styled-components'

import { Avatar, Button, Icon, Skeleton, Typography } from '~/components/designSystem'
import { Switch } from '~/components/form'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { INNER_CONTENT_WIDTH, ListItemLink, NAV_HEIGHT, theme } from '~/styles'

interface EmailSettingItemProps {
  title: String
  subtitle: String
  to: string
  active: boolean
  onChangeConfig: (value: boolean) => Promise<unknown> | void
}

export const EmailSettingItem = ({
  title,
  subtitle,
  to,
  active,
  onChangeConfig,
}: EmailSettingItemProps) => {
  const uniqName = useRef<string>(`email-setting-item-${Math.round(Math.random() * 1000)}`)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { isPremium } = useCurrentUser()

  return (
    <Main>
      <Container to={to} tabIndex={0}>
        <Avatar size="big" variant="connector">
          <Icon name="mail" color="dark" />
        </Avatar>
        <TitleContainer>
          <Typography color="grey700" variant="bodyHl" noWrap>
            {title}
          </Typography>
          <Typography variant="caption" noWrap>
            {subtitle}
          </Typography>
        </TitleContainer>
        <SpaceHolder $premium={isPremium} />
        <Button icon="chevron-right" variant="quaternary" />
      </Container>
      <SwitchBlock>
        <Switch
          name={uniqName?.current}
          checked={active}
          onChange={(value) => {
            if (isPremium) {
              onChangeConfig(value)
            } else {
              premiumWarningDialogRef.current?.openDialog()
            }
          }}
        />
        {!isPremium && <Icon name="sparkles" />}
      </SwitchBlock>
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </Main>
  )
}

export const EmailSettingItemSkeleton = () => {
  return (
    <ContainerSkeleton>
      <Skeleton variant="connectorAvatar" size="big" marginRight={theme.spacing(3)} />
      <Skeleton variant="text" width={240} />
    </ContainerSkeleton>
  )
}

const ContainerSkeleton = styled.div`
  max-width: ${INNER_CONTENT_WIDTH}px;
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
`

const Main = styled.div`
  position: relative;
  max-width: ${INNER_CONTENT_WIDTH}px;
`

const Container = styled(ListItemLink)`
  padding: 0;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }

  > *:nth-child(2) {
    flex: 1;
  }
`

const SpaceHolder = styled.div<{ $premium?: boolean }>`
  // 72px --> size of the switch + spacing
  // 100px --> size of the switch + not premium icon + spacing
  width: ${({ $premium }) => ($premium ? '72px' : '100px')};
  min-width: ${({ $premium }) => ($premium ? '72px' : '100px')};
`

const SwitchBlock = styled.div`
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  position: absolute;
  right: 52px; // Button + 12px of spacing

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const TitleContainer = styled.div`
  min-width: 0;
`
