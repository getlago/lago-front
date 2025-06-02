import { gql } from '@apollo/client'
import { Fragment } from 'react'
import { useParams } from 'react-router-dom'

import {
  formatActivityType,
  formatResourceObject,
  getActivityDescription,
} from '~/components/activityLogs/utils'
import { CodeSnippet } from '~/components/CodeSnippet'
import {
  Button,
  NavigationTab,
  Skeleton,
  TabManagedBy,
  Typography,
} from '~/components/designSystem'
import { useGetApiKeyForActivityLogQuery, useGetSingleActivityLogQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  fragment ActivityLogDetails on ActivityLog {
    activityType
    activitySource
    activityObject
    activityObjectChanges
    apiKeyId
    resource {
      ... on BillableMetric {
        id
      }
      ... on BillingEntity {
        id
      }
      ... on Coupon {
        id
      }
      ... on CreditNote {
        id
      }
      ... on Customer {
        externalId
      }
      ... on Invoice {
        id
      }
      ... on Plan {
        id
      }
      ... on Subscription {
        externalId
      }
      ... on Wallet {
        id
      }
    }
    loggedAt
    userEmail
    externalSubscriptionId
    externalCustomerId
  }

  query getSingleActivityLog($id: ID!) {
    activityLog(activityId: $id) {
      activityId
      ...ActivityLogDetails
    }
  }

  query getApiKeyForActivityLog($id: ID!) {
    apiKey(id: $id) {
      id
      value
    }
  }
`

export const ActivityLogDetails = ({ goBack }: { goBack: () => void }) => {
  const { logId } = useParams<{ logId: string }>()
  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()

  const { data, loading: activityLogLoading } = useGetSingleActivityLogQuery({
    variables: { id: logId || '' },
    skip: !logId,
  })

  const { data: apiKeyData, loading: apiKeyLoading } = useGetApiKeyForActivityLogQuery({
    variables: { id: data?.activityLog?.apiKeyId || '' },
    skip: !data?.activityLog?.apiKeyId,
  })

  const loading = activityLogLoading || apiKeyLoading

  const {
    activityId,
    activityType,
    resource,
    loggedAt,
    userEmail,
    activitySource,
    activityObject,
    activityObjectChanges,
    externalSubscriptionId,
    externalCustomerId,
  } = data?.activityLog ?? {}

  const [activityTypeTranslation, parameters] = activityType
    ? getActivityDescription(activityType, {
        activityObject,
        externalSubscriptionId: externalSubscriptionId ?? undefined,
        externalCustomerId: externalCustomerId ?? undefined,
      })
    : ['', {}]

  const objectChanges = activityObjectChanges ?? {}
  const newObject = activityObject ?? {}

  return (
    <>
      <Typography
        className="hidden min-h-14 items-center justify-between px-4 py-2 shadow-b md:flex"
        variant="bodyHl"
        color="textSecondary"
      >
        {loading ? (
          <Skeleton variant="text" textVariant="bodyHl" className="w-30" />
        ) : (
          'Description'
        )}
      </Typography>

      {loading && (
        <div className="flex flex-col gap-4 p-4">
          <Skeleton variant="text" textVariant="subhead" className="w-40" />
          <div className="grid grid-cols-[140px,_1fr] items-baseline gap-x-8 gap-y-3">
            {[...Array(3)].map((_, index) => (
              <Fragment key={index}>
                <Skeleton variant="text" textVariant="caption" className="w-20" />
                <Skeleton variant="text" textVariant="caption" className="w-full" />
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-12 p-4">
          <div className="grid grid-cols-[140px,_1fr] items-baseline gap-3 not-last:pb-12 not-last:shadow-b">
            <div className="col-span-2 flex items-center justify-between">
              <Typography variant="subhead" color="grey700">
                {translate('text_63ebba5f5160e26242c48bd2')}
              </Typography>
              <Button
                icon="close"
                variant="quaternary"
                size="small"
                onClick={() => goBack()}
                className="md:hidden"
              />
            </div>

            {[
              activityType
                ? [translate('text_6560809c38fb9de88d8a52fb'), formatActivityType(activityType)]
                : [],
              [
                translate('text_6388b923e514213fed58331c'),
                translate(activityTypeTranslation, parameters),
              ],
              [translate('text_1747666154075d10admbnf16'), activityId],
              resource
                ? [translate('text_1747666154075y3lcupj1zdd'), formatResourceObject(resource)]
                : [],
              [
                translate('text_17473520702542eqnulj06zc'),
                formatTimeOrgaTZ(loggedAt, 'LLL dd, hh:mm:ss a'),
              ],
              [translate('text_174735207025406tp34gdzxb'), userEmail],
              [translate('text_1747352070254xmjaw609ifs'), activitySource],
              apiKeyData?.apiKey.value
                ? [translate('text_645d071272418a14c1c76aa4'), apiKeyData?.apiKey.value]
                : [],
            ]
              .filter(([label, value]) => !!label && !!value)
              .map(([label, value]) => (
                <>
                  <Typography key={label} className="pt-1" variant="caption">
                    {label}
                  </Typography>
                  <Typography
                    className="overflow-wrap-anywhere flex min-w-0 max-w-full"
                    color="grey700"
                  >
                    {value}
                  </Typography>
                </>
              ))}
          </div>

          {(Object.keys(objectChanges).length > 0 || Object.keys(newObject).length > 0) && (
            <div className="flex flex-col gap-4 pb-12">
              <Typography variant="subhead" color="grey700">
                {translate('text_1746623729674wq0tach0cop')}
              </Typography>

              <NavigationTab
                managedBy={TabManagedBy.INDEX}
                name="activity-log-details-tabs"
                tabs={[
                  {
                    title: translate('text_1747352070255d4ehqskdfn3'),
                    hidden: Object.keys(objectChanges).length === 0,
                    component: (
                      <CodeSnippet
                        variant="minimal"
                        language="json"
                        code={JSON.stringify(objectChanges, null, 2)}
                        displayHead={false}
                        canCopy
                      />
                    ),
                  },
                  {
                    title: translate('text_1747352070255f5ai2kw7zka'),
                    hidden: Object.keys(newObject).length === 0,
                    component: (
                      <CodeSnippet
                        variant="minimal"
                        language="json"
                        code={JSON.stringify(newObject, null, 2)}
                        displayHead={false}
                        canCopy
                      />
                    ),
                  },
                ]}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}
