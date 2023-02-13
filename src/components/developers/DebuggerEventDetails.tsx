import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Typography, Tooltip, Icon, Alert } from '~/components/designSystem'
import { DebuggerEventDetailsFragment } from '~/generated/graphql'
import { TimezoneDate } from '~/components/TimezoneDate'
import { theme, NAV_HEIGHT } from '~/styles'
import { CodeSnippet } from '~/components/CodeSnippet'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DebuggerEventDetails on Event {
    id
    code
    externalCustomerId
    transactionId
    timestamp
    receivedAt
    payload
    billableMetricName
    matchBillableMetric
    matchCustomField
    apiClient
    ipAddress
    externalSubscriptionId
    customerTimezone
  }
`

interface DebuggerEventDetailsProps {
  event: DebuggerEventDetailsFragment
}

export const DebuggerEventDetails = ({ event }: DebuggerEventDetailsProps) => {
  const { translate } = useInternationalization()
  const {
    billableMetricName,
    timestamp,
    payload,
    externalCustomerId,
    transactionId,
    apiClient,
    code,
    ipAddress,
    matchBillableMetric,
    matchCustomField,
    externalSubscriptionId,
    customerTimezone,
  } = event

  return (
    <>
      <EventHeader variant="bodyHl" color="textSecondary">
        {billableMetricName}
      </EventHeader>
      <EventInfosContainer>
        {!matchBillableMetric && (
          <StyledAlert type="warning">{translate('text_6298bd525e359200d5ea01b7')}</StyledAlert>
        )}
        {!matchCustomField && (
          <StyledAlert type="warning">{translate('text_6298bd525e359200d5ea0197')}</StyledAlert>
        )}
        <EventInfoLine>
          <Typography variant="caption">{translate('text_6298bd525e359200d5ea018f')}</Typography>
          <Typography color="textSecondary" noWrap>
            <TimezoneDate
              date={timestamp}
              customerTimezone={customerTimezone}
              mainTimezone="utc0"
              mainDateFormat="LLL. dd, yyyy HH:mm:ss 'UTC'"
            />
          </Typography>
        </EventInfoLine>
        <EventInfoLine>
          <Typography variant="caption">{translate('text_62e0feac0a543924c8f67ae5')}</Typography>
          <Typography color="textSecondary" noWrap>
            {externalSubscriptionId}
          </Typography>
        </EventInfoLine>
        <EventInfoLine>
          <Typography variant="caption">{translate('text_6298bd525e359200d5ea01a7')}</Typography>
          <Typography color="textSecondary" noWrap>
            {externalCustomerId}
          </Typography>
        </EventInfoLine>
        <EventInfoLine>
          <Typography variant="caption">{translate('text_6298bd525e359200d5ea01c1')}</Typography>
          <Typography color="textSecondary" noWrap>
            {code}
          </Typography>
        </EventInfoLine>
        <EventInfoLine>
          <Typography variant="caption">{translate('text_6298bd525e359200d5ea01da')}</Typography>
          <Typography color="textSecondary" noWrap>
            {billableMetricName}
          </Typography>
        </EventInfoLine>
        <EventInfoLine>
          <Typography variant="caption">{translate('text_6298bd525e359200d5ea01f2')}</Typography>
          <TransactionId color="textSecondary" noWrap>
            {transactionId}
          </TransactionId>
          <TransactionIdTooltip
            placement="bottom-start"
            title={translate('text_6298bd525e359200d5ea0257')}
          >
            <Icon name="info-circle" />
          </TransactionIdTooltip>
        </EventInfoLine>
        <EventInfoLine>
          <Typography variant="caption">{translate('text_6298bd525e359200d5ea020a')}</Typography>
          <Typography color="textSecondary" noWrap>
            {ipAddress}
          </Typography>
        </EventInfoLine>
        <EventInfoLine>
          <Typography variant="caption">{translate('text_6298bd525e359200d5ea0222')}</Typography>
          <Typography color="textSecondary" noWrap>
            {apiClient}
          </Typography>
        </EventInfoLine>
      </EventInfosContainer>
      <Payload>
        <StyledCodeSnippet
          language="json"
          code={JSON.stringify(payload, null, 2)}
          canCopy={false}
          displayHead={false}
        />
      </Payload>
    </>
  )
}

const Header = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  min-height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing(8)};
  box-sizing: border-box;
`

const EventHeader = styled(Header)`
  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const EventInfosContainer = styled.div`
  padding: ${theme.spacing(8)};
  box-shadow: ${theme.shadows[7]};

  > * {
    display: flex;
    &:not(:last-child) {
      margin-bottom: ${theme.spacing(3)};
    }
  }
`

const TransactionId = styled(Typography)`
  margin-right: ${theme.spacing(1)};
`

const EventInfoLine = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    width: 140px;
    min-width: 140px;
    margin-right: ${theme.spacing(3)};
  }
`

const StyledAlert = styled(Alert)`
  margin-bottom: ${theme.spacing(8)};
`

const StyledCodeSnippet = styled(CodeSnippet)`
  > * {
    padding-bottom: 0px;
  }
`

const TransactionIdTooltip = styled(Tooltip)`
  height: 16px;
`

const Payload = styled.div`
  flex: 1;
  box-shadow: ${theme.shadows[8]};
  background-color: ${theme.palette.grey[100]};

  ${theme.breakpoints.down('md')} {
    box-shadow: ${theme.shadows[7]};
  }
`
