import { gql } from '@apollo/client'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'

import { Typography, Button, Avatar, Icon, Skeleton } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { useI18nContext } from '~/core/I18nContext'
import { theme, PageHeader, HEADER_TABLE_HEIGHT, NAV_HEIGHT } from '~/styles'
import { CREATE_BILLABLE_METRICS_ROUTE } from '~/core/router'
import { useBillableMetricsQuery } from '~/generated/graphql'
import EmojiError from '~/public/images/exploding-head.png'

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
        <StyledButton onClick={() => navigate(CREATE_BILLABLE_METRICS_ROUTE)}>
          {translate('text_623b497ad05b960101be343a')}
        </StyledButton>
      </Header>

      {loading ? (
        [0, 1, 2].map((i) => (
          <Item key={`${i}-skeleton`}>
            <Skeleton variant="connectorAvatar" size="medium" />
            <Skeleton variant="text" height={12} width={240} />
            <Skeleton variant="text" height={12} width={240} />
          </Item>
        ))
      ) : !!error ? (
        <GenericPlaceholder
          title={translate('text_623b53fea66c76017eaebb6e')}
          subtitle={translate('text_623b53fea66c76017eaebb76')}
          buttonTitle={translate('text_623b53fea66c76017eaebb7a')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<img src={EmojiError} alt="error-emoji" />}
        />
      ) : !list || !list.length ? (
        <GenericPlaceholder
          title={translate('text_623b53fea66c76017eaebb70')}
          subtitle={translate('text_623b53fea66c76017eaebb78')}
          buttonTitle={translate('text_623b53fea66c76017eaebb7c')}
          buttonVariant="primary"
          buttonAction={() => navigate(CREATE_BILLABLE_METRICS_ROUTE)}
          image={
            <Avatar variant="connector">
              <Icon name="pulse" color="dark" />
            </Avatar>
          }
        />
      ) : (
        <div>
          <ListHead>
            <Typography color="disabled" variant="bodyHl">
              {translate('text_623b497ad05b960101be343e')}
            </Typography>
            <Typography color="disabled" variant="bodyHl">
              {translate('text_623b497ad05b960101be3440')}
            </Typography>
          </ListHead>
          {list.map(({ id, name, code, createdAt }) => {
            return (
              <Item key={id}>
                <Avatar variant="connector">
                  <Icon name="pulse" color="dark" />
                </Avatar>
                <div>
                  <Typography color="textSecondary" variant="bodyHl">
                    {name}
                  </Typography>
                  <Typography variant="caption">{code}</Typography>
                </div>
                <Typography>{DateTime.fromISO(createdAt).toFormat('yyyy/LL/dd')}</Typography>
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
`

const StyledButton = styled(Button)`
  min-width: 179px;
`

const Item = styled.div`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing(12)};

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }

  > *:last-child {
    margin-left: auto;
  }
`

export default BillableMetricsList
