import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { generatePath, Link } from 'react-router-dom'
import styled from 'styled-components'

import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import {
  StatusTypeEnum,
  SubscriptionForSubscriptionInformationsFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { theme } from '~/styles'
import { DetailsInfoGrid, DetailsInfoItem, DetailsSectionTitle } from '~/styles/detailsPage'

import { Alert, Status, StatusEnum } from '../designSystem'

gql`
  fragment SubscriptionForSubscriptionInformations on Subscription {
    id
    externalId
    status
    subscriptionAt
    endingAt
    nextPendingStartDate
    nextPlan {
      id
      name
    }
    customer {
      id
      name
    }
    plan {
      id
      name
      parent {
        id
        name
      }
    }
  }
`

const SubscriptionInformations = ({
  subscription,
}: {
  subscription?: SubscriptionForSubscriptionInformationsFragment | null
}) => {
  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()

  return (
    <section>
      <DetailsSectionTitle variant="subhead" noWrap>
        {translate('text_6335e8900c69f8ebdfef5312')}
      </DetailsSectionTitle>
      <ContentWrapper>
        {!!subscription?.nextPlan?.id && (
          <Alert type="info">
            {translate('text_62681c60582e4f00aa82938a', {
              planName: subscription?.nextPlan?.name,
              dateStartNewPlan: formatTimeOrgaTZ(subscription?.nextPendingStartDate),
            })}
          </Alert>
        )}
        <DetailsInfoItem
          label={translate('text_65201c5a175a4b0238abf298')}
          value={subscription?.externalId}
        />
        <DetailsInfoGrid>
          <DetailsInfoItem
            label={translate('text_65201c5a175a4b0238abf29a')}
            value={
              <Link
                to={generatePath(CUSTOMER_DETAILS_ROUTE, {
                  id: subscription?.customer?.id as string,
                })}
              >
                {subscription?.customer?.name}
              </Link>
            }
          />
          <DetailsInfoItem
            label={translate('text_62d7f6178ec94cd09370e5fb')}
            value={
              <Status
                type={
                  subscription?.status === StatusTypeEnum.Pending
                    ? StatusEnum.paused
                    : StatusEnum.running
                }
                label={
                  subscription?.status === StatusTypeEnum.Pending
                    ? translate('text_624efab67eb2570101d117f6')
                    : translate('text_624efab67eb2570101d1180e')
                }
              />
            }
          />
          <DetailsInfoItem
            label={translate('text_65201c5a175a4b0238abf29e')}
            value={DateTime.fromISO(subscription?.subscriptionAt).toFormat('LLL. dd, yyyy')}
          />

          {!!subscription?.endingAt && (
            <DetailsInfoItem
              label={translate('text_65201c5a175a4b0238abf2a0')}
              value={DateTime.fromISO(subscription?.endingAt).toFormat('LLL. dd, yyyy')}
            />
          )}

          {/* TODO: add when plan details page exists */}
          {/* {!!subscription?.plan?.parent?.id && (
            <DetailsInfoItem
              label={translate('text_65201c5a175a4b0238abf2a2')}
              value={
                <Link
                  to={generatePath(PLAN_DETAILS, {
                    id: subscription?.plan?.parent?.id as string,
                  })}
                >
                  {subscription?.plan?.parent?.name}
                </Link>
              }
            />
          )} */}
        </DetailsInfoGrid>
      </ContentWrapper>
    </section>
  )
}

export default SubscriptionInformations

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`
