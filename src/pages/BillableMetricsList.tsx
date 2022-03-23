import styled from 'styled-components'

import { Typography, Button, Avatar, Icon } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { useI18nContext } from '~/core/I18nContext'
import { theme, PageHeader, HEADER_TABLE_HEIGHT } from '~/styles'

const BillableMetricsList = () => {
  const { translate } = useI18nContext()
  const empty = false
  const error = true

  return (
    <div>
      <Header $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_623b497ad05b960101be3438')}
        </Typography>
        <StyledButton onClick={() => {}}>{translate('text_623b497ad05b960101be343a')}</StyledButton>
      </Header>
      <ListHead>
        <Typography color="disabled" variant="bodyHl">
          {translate('text_623b497ad05b960101be343e')}
        </Typography>
        <Typography color="disabled" variant="bodyHl">
          {translate('text_623b497ad05b960101be3440')}
        </Typography>
      </ListHead>
      {empty && (
        <GenericPlaceholder
          title={translate('text_623b53fea66c76017eaebb70')}
          subtitle={translate('text_623b53fea66c76017eaebb78')}
          buttonTitle={translate('text_623b53fea66c76017eaebb7c')}
          buttonVariant="primary"
          buttonAction={() => {}}
          image={
            <Avatar variant="connector">
              <Icon name="pulse" color="dark" />
            </Avatar>
          }
        />
      )}
      {error && (
        <GenericPlaceholder
          title={translate('text_623b53fea66c76017eaebb6e')}
          subtitle={translate('text_623b53fea66c76017eaebb76')}
          buttonTitle={translate('text_623b53fea66c76017eaebb7a')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={
            <Avatar variant="connector">
              <Icon name="stop" color="error" />
            </Avatar>
          }
        />
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
  padding: 0 ${theme.spacing(4)};
  box-shadow: ${theme.shadows[7]};
`

const StyledButton = styled(Button)`
  min-width: 179px;
`

export default BillableMetricsList
