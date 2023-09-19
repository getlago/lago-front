import { gql } from '@apollo/client'
import styled from 'styled-components'

import { CodeSnippet } from '~/components/CodeSnippet'
import { Alert, Icon, Tooltip, Typography } from '~/components/designSystem'
import { TimezoneDate } from '~/components/TimezoneDate'
import { DebuggerEventDetailsFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'

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
      <PropertiesContainer>
        <WideLine>
          <Typography variant="captionHl" color="grey700">
            {translate('text_63ebba5f5160e26242c48bd2')}
          </Typography>
        </WideLine>

        {!matchBillableMetric && (
          <WideLine>
            <Alert type="warning">{translate('text_6298bd525e359200d5ea01b7')}</Alert>
          </WideLine>
        )}
        {!matchCustomField && (
          <WideLine>
            <Alert type="warning">{translate('text_6298bd525e359200d5ea0197')}</Alert>
          </WideLine>
        )}

        <PropertyLabel variant="caption">
          {translate('text_6298bd525e359200d5ea018f')}
        </PropertyLabel>
        <PropertyValue color="grey700">
          <StyledTimezoneDate
            date={timestamp}
            customerTimezone={customerTimezone}
            mainTimezone="utc0"
            mainDateFormat="LLL. dd, yyyy HH:mm:ss 'UTC'"
          />
        </PropertyValue>

        <PropertyLabel variant="caption">
          {translate('text_62e0feac0a543924c8f67ae5')}
        </PropertyLabel>
        <PropertyValue color="textSecondary">{externalSubscriptionId}</PropertyValue>

        <PropertyLabel variant="caption">
          {translate('text_6298bd525e359200d5ea01a7')}
        </PropertyLabel>
        <PropertyValue color="textSecondary">{externalCustomerId}</PropertyValue>

        <PropertyLabel variant="caption">
          {translate('text_6298bd525e359200d5ea01c1')}
        </PropertyLabel>
        <PropertyValue color="textSecondary">{code}</PropertyValue>

        <PropertyLabel variant="caption">
          {translate('text_6298bd525e359200d5ea01da')}
        </PropertyLabel>
        <PropertyValue color="textSecondary">{billableMetricName}</PropertyValue>

        <PropertyLabel variant="caption">
          {translate('text_6298bd525e359200d5ea01f2')}
        </PropertyLabel>
        <PropertyValue color="textSecondary">
          {transactionId}
          <TransactionIdTooltip
            placement="bottom-start"
            title={translate('text_6298bd525e359200d5ea0257')}
          >
            <StyledIcon color="dark" name="info-circle" />
          </TransactionIdTooltip>
        </PropertyValue>

        <PropertyLabel variant="caption">
          {translate('text_6298bd525e359200d5ea020a')}
        </PropertyLabel>
        <PropertyValue color="textSecondary" noWrap>
          {ipAddress}
        </PropertyValue>

        <PropertyLabel variant="caption">
          {translate('text_6298bd525e359200d5ea0222')}
        </PropertyLabel>
        <PropertyValue color="textSecondary" noWrap>
          {apiClient}
        </PropertyValue>
      </PropertiesContainer>

      <CodeBlock>
        <Typography color="grey700" variant="captionHl">
          {translate('text_63ebba678559020885cee000')}
        </Typography>
        <StyledCodeSnippet
          language="json"
          code={JSON.stringify(payload, null, 2)}
          canCopy={false}
          displayHead={false}
        />
      </CodeBlock>
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

const StyledCodeSnippet = styled(CodeSnippet)`
  > * {
    padding-bottom: 0px;
  }
`

const TransactionIdTooltip = styled(Tooltip)`
  height: 16px;
`

const PropertiesContainer = styled.div`
  padding: ${theme.spacing(8)};
  box-shadow: ${theme.shadows[7]};
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: ${theme.spacing(3)};
`

const WideLine = styled.div`
  grid-column: span 2;
`

const PropertyLabel = styled(Typography)`
  padding-top: 4px;
`

const PropertyValue = styled(Typography)`
  max-width: 100%;
  min-width: 0;
  display: flex;
  overflow-wrap: anywhere;
`

const StyledTimezoneDate = styled(TimezoneDate)`
  min-width: 0;

  > * {
    min-width: 0;

    > * {
      min-width: 0;
      max-width: 100%;
      display: flex;
      white-space: unset;
    }
  }
`

const StyledIcon = styled(Icon)`
  margin: 5px 0 0 4px;
`

const CodeBlock = styled.div`
  background-color: ${theme.palette.grey[100]};
  box-shadow: ${theme.shadows[7]};
  margin-left: 1px;
  flex: 1;
  padding-bottom: ${theme.spacing(4)};

  > *:first-child {
    padding: ${theme.spacing(8)} 0 0 ${theme.spacing(8)};
  }

  > *:last-child {
    height: calc(100% - 52px);
  }
`
