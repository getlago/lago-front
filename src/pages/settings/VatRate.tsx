import { useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Typography, Button, Skeleton, Avatar, Icon } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/useInternationalization'
import { theme, NAV_HEIGHT, HEADER_TABLE_HEIGHT } from '~/styles'
import { useVatRateSettingQuery } from '~/generated/graphql'
import {
  EditOrganizationVatRateDialog,
  EditOrganizationVatRateDialogRef,
} from '~/components/settings/EditOrganizationVatRateDialog'

gql`
  query vatRateSetting {
    currentUser {
      id
      organizations {
        id
        vatRate
      }
    }
  }
`

const VatRate = () => {
  const { translate } = useInternationalization()
  const editDialogRef = useRef<EditOrganizationVatRateDialogRef>(null)
  const { data, loading } = useVatRateSettingQuery()
  const vatRate = data?.currentUser?.organizations
    ? data?.currentUser?.organizations[0]?.vatRate
    : 0

  return (
    <Page>
      <Typography variant="headline">{translate('text_62728ff857d47b013204c776')}</Typography>
      <Subtitle>{translate('text_62728ff857d47b013204c782')}</Subtitle>
      <Head $empty={typeof vatRate !== 'number' && !loading}>
        <Typography variant="subhead">{translate('text_62728ff857d47b013204c7ae')}</Typography>
        <Button variant="secondary" onClick={editDialogRef?.current?.openDialog}>
          {translate('text_62728ff857d47b013204c798')}
        </Button>
      </Head>

      <ListHead>
        <Typography variant="bodyHl" color="disabled">
          {translate('text_62728ff857d47b013204c7c4')}
        </Typography>
      </ListHead>
      <VatRateItem>
        {loading ? (
          <>
            <LeftBlock>
              <Skeleton variant="connectorAvatar" size="medium" />
              <Skeleton variant="text" width={240} height={12} />
            </LeftBlock>
          </>
        ) : (
          <LeftBlock>
            <Avatar variant="connector">
              <Icon color="dark" name="percentage" />
            </Avatar>
            <div>
              <Typography variant="bodyHl" color="textSecondary" noWrap>
                {translate('text_62728ff857d47b013204c7da', { taxRate: vatRate })}
              </Typography>
              <Typography variant="caption">
                {translate('text_62728ff857d47b013204c7f0')}
              </Typography>
            </div>
          </LeftBlock>
        )}
      </VatRateItem>
      {!loading && <Info variant="caption">{translate('text_62728ff857d47b013204c806')}</Info>}
      <EditOrganizationVatRateDialog ref={editDialogRef} vatRate={vatRate as number} />
    </Page>
  )
}

const Page = styled.div`
  padding: ${theme.spacing(12)};

  > *:first-child {
    margin-bottom: ${theme.spacing(2)};
  }
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const Head = styled.div<{ $empty?: boolean }>`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  margin-bottom: ${({ $empty }) => ($empty ? theme.spacing(6) : 0)};
`

const ListHead = styled.div`
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  height: ${HEADER_TABLE_HEIGHT}px;
`

const VatRateItem = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
`

const LeftBlock = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  margin-right: ${theme.spacing(4)};

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const Info = styled(Typography)`
  height: ${HEADER_TABLE_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  justify-content: flex-end;
  align-items: center;
`

export default VatRate
