import { gql } from '@apollo/client'
import styled, { css } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'

import { Typography, Button, Avatar, Icon, Skeleton } from '~/components/designSystem'
import { CREATE_PLAN_ROUTE } from '~/core/router'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { theme, PageHeader, HEADER_TABLE_HEIGHT, NAV_HEIGHT } from '~/styles'
import { useI18nContext } from '~/core/I18nContext'
import { usePlansQuery } from '~/generated/graphql'
import EmojiError from '~/public/images/exploding-head.png'
import EmojiEmpty from '~/public/images/spider-web.png'

gql`
  query plans($page: Int, $limit: Int) {
    plans(page: $page, limit: $limit) {
      collection {
        id
        name
        code
        chargeCount
        customerCount
        createdAt
      }
    }
  }
`

const PlansList = () => {
  const { translate } = useI18nContext()
  let navigate = useNavigate()
  const { data, error, loading } = usePlansQuery()
  const list = data?.plans?.collection || []

  return (
    <div>
      <Header $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_62442e40cea25600b0b6d84a')}
        </Typography>
        <Button onClick={() => navigate(CREATE_PLAN_ROUTE)}>
          {translate('text_62442e40cea25600b0b6d84c')}
        </Button>
      </Header>

      {!loading && !!error ? (
        <GenericPlaceholder
          title={translate('text_624451f920b6a500aab3761a')}
          subtitle={translate('text_624451f920b6a500aab3761e')}
          buttonTitle={translate('text_624451f920b6a500aab37622')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<img src={EmojiError} alt="error-emoji" />}
        />
      ) : !loading && (!list || !list.length) ? (
        <GenericPlaceholder
          title={translate('text_624451f920b6a500aab37618')}
          subtitle={translate('text_624451f920b6a500aab3761c')}
          buttonTitle={translate('text_624451f920b6a500aab37620')}
          buttonVariant="primary"
          buttonAction={() => navigate(CREATE_PLAN_ROUTE)}
          image={<img src={EmojiEmpty} alt="empty-emoji" />}
        />
      ) : (
        <div>
          <ListHead>
            <PlanNameSection>
              <Typography color="disabled" variant="bodyHl">
                {translate('text_62442e40cea25600b0b6d852')}
              </Typography>
            </PlanNameSection>
            <PlanInfosSection>
              <MediumCell color="disabled" variant="bodyHl">
                {translate('text_62442e40cea25600b0b6d854')}
              </MediumCell>
              <SmallCell color="disabled" variant="bodyHl">
                {translate('text_62442e40cea25600b0b6d856')}
              </SmallCell>
              <MediumCell color="disabled" variant="bodyHl">
                {translate('text_62442e40cea25600b0b6d858')}
              </MediumCell>
            </PlanInfosSection>
          </ListHead>
          {loading
            ? [0, 1, 2].map((i) => (
                <Item key={`${i}-skeleton`} $skeleton>
                  <Skeleton variant="connectorAvatar" size="medium" />
                  <Skeleton variant="text" height={12} width={240} />
                  <Skeleton variant="text" height={12} width={240} />
                </Item>
              ))
            : list.map(({ id, name, code, createdAt, customerCount, chargeCount }) => {
                return (
                  <Item key={id}>
                    <PlanNameSection>
                      <ListAvatar variant="connector">
                        <Icon name="board" color="dark" />
                      </ListAvatar>
                      <NameBlock>
                        <Typography color="textSecondary" variant="bodyHl" noWrap>
                          {name}
                        </Typography>
                        <Typography variant="caption" noWrap>
                          {code}
                        </Typography>
                      </NameBlock>
                    </PlanNameSection>
                    <PlanInfosSection>
                      <MediumCell>{customerCount}</MediumCell>
                      <SmallCell>{chargeCount}</SmallCell>
                      <MediumCell>{DateTime.fromISO(createdAt).toFormat('yyyy/LL/dd')}</MediumCell>
                    </PlanInfosSection>
                  </Item>
                )
              })}
        </div>
      )}
    </div>
  )
}

const Header = styled(PageHeader)`
  > * {
    white-space: pre;

    &:first-child {
      margin-right: ${theme.spacing(4)};
    }
  }
`

const ListHead = styled.div`
  background-color: ${theme.palette.grey[100]};
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 ${theme.spacing(12)};
  box-shadow: ${theme.shadows[7]};

  ${theme.breakpoints.down('md')} {
    padding: 0 ${theme.spacing(4)};
  }
`

const Item = styled.div<{ $skeleton?: boolean }>`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing(12)};

  ${({ $skeleton }) =>
    $skeleton &&
    css`
      > *:not(:last-child) {
        margin-right: ${theme.spacing(3)};
      }
    `}

  ${theme.breakpoints.down('md')} {
    padding: 0 ${theme.spacing(4)};
  }
`

const MediumCell = styled(Typography)`
  text-align: right;
  width: 112px;
`

const SmallCell = styled(Typography)`
  text-align: right;
  width: 80px;
`

const ListAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(3)};
`

const PlanNameSection = styled.div`
  margin-right: auto;
  display: flex;
  align-items: center;
  min-width: 0;
`

const NameBlock = styled.div`
  min-width: 0;
`

const PlanInfosSection = styled.div`
  display: flex;
  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};

    ${theme.breakpoints.down('md')} {
      display: none;
    }
  }
`

export default PlansList
