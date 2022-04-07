import { gql } from '@apollo/client'
import styled, { css } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'

import { Typography, Button, Avatar, Icon, Skeleton } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { useI18nContext } from '~/core/I18nContext'
import { theme, PageHeader, HEADER_TABLE_HEIGHT, NAV_HEIGHT } from '~/styles'
import { CREATE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import { useBillableMetricsQuery } from '~/generated/graphql'
import EmojiError from '~/public/images/exploding-head.png'
import EmojiEmpty from '~/public/images/spider-web.png'

gql`
  query billableMetrics($page: Int, $limit: Int) {
    billableMetrics(page: $page, limit: $limit) {
      collection {
        id
        name
        code
        createdAt
      }
    }
  }
`

const BillableMetricsList = () => {
  const { translate } = useI18nContext()
  let navigate = useNavigate()
  const { data, error, loading } = useBillableMetricsQuery()
  const list = data?.billableMetrics?.collection || []

  return (
    <div>
      <Header $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_623b497ad05b960101be3438')}
        </Typography>
        <StyledButton onClick={() => navigate(CREATE_BILLABLE_METRIC_ROUTE)}>
          {translate('text_623b497ad05b960101be343a')}
        </StyledButton>
      </Header>

      {!loading && !!error ? (
        <GenericPlaceholder
          title={translate('text_623b53fea66c76017eaebb6e')}
          subtitle={translate('text_623b53fea66c76017eaebb76')}
          buttonTitle={translate('text_623b53fea66c76017eaebb7a')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<img src={EmojiError} alt="error-emoji" />}
        />
      ) : !loading && (!list || !list.length) ? (
        <GenericPlaceholder
          title={translate('text_623b53fea66c76017eaebb70')}
          subtitle={translate('text_623b53fea66c76017eaebb78')}
          buttonTitle={translate('text_623b53fea66c76017eaebb7c')}
          buttonVariant="primary"
          buttonAction={() => navigate(CREATE_BILLABLE_METRIC_ROUTE)}
          image={<img src={EmojiEmpty} alt="empty-emoji" />}
        />
      ) : (
        <div>
          <ListHead>
            <Typography color="disabled" variant="bodyHl">
              {translate('text_623b497ad05b960101be343e')}
            </Typography>
            <CellSmall align="right" color="disabled" variant="bodyHl">
              {translate('text_623b497ad05b960101be3440')}
            </CellSmall>
          </ListHead>
          {loading
            ? [0, 1, 2].map((i) => (
                <Item key={`${i}-skeleton`} $loading>
                  <Skeleton variant="connectorAvatar" size="medium" />
                  <Skeleton variant="text" height={12} width={240} />
                  <Skeleton variant="text" height={12} width={240} />
                </Item>
              ))
            : list.map(({ id, name, code, createdAt }) => {
                return (
                  <Item key={id}>
                    <BillableMetricName>
                      <Avatar variant="connector">
                        <Icon name="pulse" color="dark" />
                      </Avatar>
                      <NameBlock>
                        <Typography color="textSecondary" variant="bodyHl" noWrap>
                          {name}
                        </Typography>
                        <Typography variant="caption" noWrap>
                          {code}
                        </Typography>
                      </NameBlock>
                    </BillableMetricName>
                    <CellSmall align="right">
                      {DateTime.fromISO(createdAt).toFormat('yyyy/LL/dd')}
                    </CellSmall>
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
  align-items: center;
  padding: 0 ${theme.spacing(12)};
  box-shadow: ${theme.shadows[7]};

  > *:first-child {
    flex: 1;
  }
  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};
  }

  ${theme.breakpoints.down('md')} {
    padding: 0 ${theme.spacing(4)};
  }
`

const CellSmall = styled(Typography)`
  width: 112px;
`

const StyledButton = styled(Button)`
  min-width: 179px;
`

const NameBlock = styled.div`
  min-width: 0;
  margin-right: ${theme.spacing(6)};
`

const Item = styled.div<{ $loading?: boolean }>`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing(12)};

  ${({ $loading }) =>
    $loading &&
    css`
      > *:not(:last-child) {
        margin-right: ${theme.spacing(6)};
      }
    `}

  ${theme.breakpoints.down('md')} {
    padding: 0 ${theme.spacing(4)};
  }
`

const BillableMetricName = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

export default BillableMetricsList
