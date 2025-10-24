import { gql } from '@apollo/client'
import { Fragment } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import {
  formatActivityType,
  formatResourceObject,
  getActivityDescription,
  isDeletedActivityType,
  resourceTypeTranslations,
} from '~/components/activityLogs/utils'
import { CodeSnippet } from '~/components/CodeSnippet'
import {
  Button,
  NavigationTab,
  Skeleton,
  TabManagedBy,
  Typography,
} from '~/components/designSystem'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CUSTOMER_DETAILS_ROUTE, CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE } from '~/core/router'
import {
  LagoApiError,
  ResourceTypeEnum,
  useGetCustomerIdForActivityLogDetailsQuery,
  useGetSingleActivityLogQuery,
  useGetSubscriptionIdForActivityLogDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useFormatterDateHelper } from '~/hooks/helpers/useFormatterDateHelper'

const remapResourceTypeNames = (resourceType: string): keyof typeof ResourceTypeEnum => {
  if (resourceType === 'FeatureObject') return 'Feature'
  return resourceType as keyof typeof ResourceTypeEnum
}

gql`
  fragment ActivityLogDetails on ActivityLog {
    activityType
    activitySource
    activityObject
    activityObjectChanges
    apiKey {
      value
      name
    }
    # If adding a new resource type with other fields than id,
    # consider updating the formatResourceObject function
    resource {
      ... on BillableMetric {
        id
      }
      ... on BillingEntity {
        id
        code
      }
      ... on Coupon {
        id
      }
      ... on CreditNote {
        id
        customer {
          id
        }
        invoice {
          id
        }
      }
      ... on Customer {
        id
      }
      ... on Invoice {
        id
        customer {
          id
        }
      }
      ... on FeatureObject {
        id
      }
      ... on Plan {
        id
      }
      ... on PaymentRequest {
        id
      }
      ... on Subscription {
        id
      }
      ... on Wallet {
        id
        walletCustomer: customer {
          id
        }
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

  query getCustomerIdForActivityLogDetails($externalId: ID) {
    customer(externalId: $externalId) {
      id
    }
  }

  query getSubscriptionIdForActivityLogDetails($externalId: ID) {
    subscription(externalId: $externalId) {
      id
    }
  }
`

export const ActivityLogDetails = ({ goBack }: { goBack: () => void }) => {
  const { logId } = useParams<{ logId: string }>()
  const { translate } = useInternationalization()
  const { formattedDateTimeWithSecondsOrgaTZ } = useFormatterDateHelper()

  const { data, loading } = useGetSingleActivityLogQuery({
    variables: { id: logId || '' },
    skip: !logId,
  })

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
    apiKey,
  } = data?.activityLog ?? {}

  const { data: customerData } = useGetCustomerIdForActivityLogDetailsQuery({
    variables: { externalId: externalCustomerId },
    skip: !externalCustomerId || !activityType || isDeletedActivityType(activityType),
    context: {
      silentErrorCodes: [LagoApiError.NotFound],
    },
  })

  const { data: subscriptionData } = useGetSubscriptionIdForActivityLogDetailsQuery({
    variables: { externalId: externalSubscriptionId },
    skip: !externalSubscriptionId || !activityType || isDeletedActivityType(activityType),
    context: {
      silentErrorCodes: [LagoApiError.NotFound],
    },
  })

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
          translate(activityTypeTranslation, parameters)
        )}
      </Typography>

      {loading && (
        <div className="flex flex-col gap-4 p-4">
          <Skeleton variant="text" textVariant="subhead1" className="w-40" />
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
              <Typography variant="subhead1" color="grey700">
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
              [
                translate('text_1732895022171f9vnwh5gm3q'),
                !!resource?.__typename
                  ? translate(resourceTypeTranslations[resource?.__typename])
                  : '-',
              ],
              [
                translate('text_1747666154075y3lcupj1zdd'),
                !!resource?.__typename
                  ? formatResourceObject(resource, {
                      resourceType: remapResourceTypeNames(resource.__typename),
                      activityType,
                    })
                  : '-',
              ],
              [
                translate('text_1748873734056eva3rfvpkoi'),
                customerData?.customer?.id ? (
                  <a
                    className="visited:text-blue"
                    href={generatePath(CUSTOMER_DETAILS_ROUTE, {
                      customerId: customerData.customer.id,
                    })}
                  >
                    {externalCustomerId}
                  </a>
                ) : (
                  (externalCustomerId ?? '-')
                ),
              ],
              [
                translate('text_1748873758144pfwdvafs9pv'),
                subscriptionData?.subscription?.id && customerData?.customer?.id ? (
                  <a
                    className="visited:text-blue"
                    href={generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                      tab: CustomerSubscriptionDetailsTabsOptionsEnum.overview,
                      customerId: customerData?.customer?.id ?? '',
                      subscriptionId: subscriptionData?.subscription?.id ?? '',
                    })}
                  >
                    {externalSubscriptionId}
                  </a>
                ) : (
                  (externalSubscriptionId ?? '-')
                ),
              ],
              [
                translate('text_17473520702542eqnulj06zc'),
                formattedDateTimeWithSecondsOrgaTZ(loggedAt),
              ],
              [translate('text_174735207025406tp34gdzxb'), userEmail],
              [translate('text_1747352070254xmjaw609ifs'), activitySource],
              [
                translate('text_645d071272418a14c1c76aa4'),
                apiKey?.name ? `${apiKey.name} - ${apiKey?.value}` : apiKey?.value,
              ],
            ]
              .filter(([label, value]) => !!label && !!value)
              .map(([label, value]) => (
                <Fragment key={label as string}>
                  <Typography key={label as string} className="pt-1" variant="caption">
                    {label}
                  </Typography>
                  <Typography
                    className="overflow-wrap-anywhere flex min-w-0 max-w-full"
                    color="grey700"
                  >
                    {value}
                  </Typography>
                </Fragment>
              ))}
          </div>

          {(Object.keys(objectChanges).length > 0 || Object.keys(newObject).length > 0) && (
            <div className="flex flex-col gap-4 pb-12">
              <Typography variant="subhead1" color="grey700">
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
