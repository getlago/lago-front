import { gql } from '@apollo/client'
import { FC, useMemo, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import {
  Button,
  Card,
  Chip,
  NavigationTab,
  Popper,
  TabManagedBy,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  DisableProgressiveBillingDialog,
  DisableProgressiveBillingDialogRef,
} from '~/components/subscriptions/DisableProgressiveBillingDialog'
import {
  ResetProgressiveBillingDialog,
  ResetProgressiveBillingDialogRef,
} from '~/components/subscriptions/ResetProgressiveBillingDialog'
import { PROGRESSIVE_BILLING_DOC_URL } from '~/core/constants/externalUrls'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  EDIT_PROGRESSIVE_BILLING_CUSTOMER_SUBSCRIPTION_ROUTE,
  EDIT_PROGRESSIVE_BILLING_PLAN_SUBSCRIPTION_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  PremiumIntegrationTypeEnum,
  SubscriptionForProgressiveBillingTabFragment,
  ThresholdForRecurringThresholdsTableFragmentDoc,
  ThresholdForThresholdsTableFragmentDoc,
  useSwitchProgressiveBillingDisabledValueMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

import { FreemiumBlock } from './FreemiumBlock'
import { RecurringThresholdsTable } from './RecurringThresholdsTable'
import { ThresholdsTable } from './ThresholdsTable'

gql`
  fragment SubscriptionForProgressiveBillingTab on Subscription {
    id
    progressiveBillingDisabled
    usageThresholds {
      id
      ...ThresholdForThresholdsTable
      ...ThresholdForRecurringThresholdsTable
    }
    plan {
      id
      amountCurrency
      usageThresholds {
        id
        ...ThresholdForThresholdsTable
        ...ThresholdForRecurringThresholdsTable
      }
    }
  }

  mutation switchProgressiveBillingDisabledValue($input: UpdateSubscriptionInput!) {
    updateSubscription(input: $input) {
      id
      progressiveBillingDisabled
    }
  }

  ${ThresholdForThresholdsTableFragmentDoc}
  ${ThresholdForRecurringThresholdsTableFragmentDoc}
`

interface SubscriptionProgressiveBillingTabProps {
  subscription?: SubscriptionForProgressiveBillingTabFragment | null
  loading: boolean
}

export const SubscriptionProgressiveBillingTab: FC<SubscriptionProgressiveBillingTabProps> = ({
  subscription,
  loading,
}) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { customerId = '', planId = '' } = useParams()
  const { hasPermissions } = usePermissions()
  const { hasOrganizationPremiumAddon } = useOrganizationInfos()

  const disableDialogRef = useRef<DisableProgressiveBillingDialogRef>(null)
  const resetDialogRef = useRef<ResetProgressiveBillingDialogRef>(null)

  const currency = subscription?.plan?.amountCurrency || CurrencyEnum.Usd
  const hasPremiumIntegration = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.ProgressiveBilling,
  )

  const [
    switchProgressiveBillingDisabledValue,
    { loading: switchingProgressiveBillingDisabledValueLoading },
  ] = useSwitchProgressiveBillingDisabledValueMutation()

  const canEditSubscription = hasPermissions(['subscriptionsUpdate'])

  const subscriptionThresholds = useMemo(
    () => subscription?.usageThresholds || [],
    [subscription?.usageThresholds],
  )
  const planThresholds = useMemo(
    () => subscription?.plan?.usageThresholds || [],
    [subscription?.plan?.usageThresholds],
  )

  const editProgressiveBillingFormPath = useMemo(() => {
    if (customerId) {
      return generatePath(EDIT_PROGRESSIVE_BILLING_CUSTOMER_SUBSCRIPTION_ROUTE, {
        customerId,
        subscriptionId: subscription?.id || '',
      })
    }
    return generatePath(EDIT_PROGRESSIVE_BILLING_PLAN_SUBSCRIPTION_ROUTE, {
      planId,
      subscriptionId: subscription?.id || '',
    })
  }, [customerId, planId, subscription?.id])

  const tooltipTitle = useMemo(() => {
    const enableDisableCopy = subscription?.progressiveBillingDisabled
      ? translate('text_17521580166150wyrhvd2u56')
      : translate('text_17521580166150wyrhvd2u57')

    if (subscriptionThresholds.length > 0) {
      return translate('text_1769642763701xwuflld9biu', {
        enableDisableCopy: enableDisableCopy.toLocaleLowerCase(),
      })
    }

    return translate('text_17696427637012io81h0jc2w', {
      enableDisableCopy: enableDisableCopy.toLocaleLowerCase(),
    })
  }, [subscription?.progressiveBillingDisabled, subscriptionThresholds.length, translate])

  if (loading || !subscription) {
    return <DetailsPage.Skeleton />
  }

  const shouldDisplayOverriddenBadge =
    subscriptionThresholds.length > 0 ||
    (subscription.progressiveBillingDisabled &&
      (subscription.plan?.usageThresholds?.length || 0) > 0)

  return (
    <section className="flex flex-col gap-6 pt-6">
      <div className="flex flex-col items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Typography variant="subhead1">{translate('text_1724179887722baucvj7bvc1')}</Typography>
          <Typography
            variant="caption"
            color="grey600"
            html={translate('text_1724179887723kdf3nisf6hp', { href: PROGRESSIVE_BILLING_DOC_URL })}
          />
        </div>

        {!hasPremiumIntegration && <FreemiumBlock />}

        {hasPremiumIntegration && (
          <Card className="w-full gap-0 p-0">
            {/* Header */}
            <div className="flex w-full items-center justify-between p-4 shadow-b">
              <Typography variant="bodyHl" color="grey700">
                {translate('text_17696267549792unv7l25frt')}
              </Typography>

              <div className="flex items-center gap-3">
                {shouldDisplayOverriddenBadge && (
                  <Chip
                    className="border-purple-200 bg-purple-100"
                    color="infoMain"
                    label={translate('text_65281f686a80b400c8e2f6dd')}
                  />
                )}

                {canEditSubscription && (
                  <Popper
                    PopperProps={{ placement: 'bottom-end' }}
                    opener={({ onClick }) => (
                      <Tooltip placement="top-start" title={tooltipTitle}>
                        <Button
                          variant="quaternary"
                          icon="dots-horizontal"
                          onClick={(e) => {
                            e.stopPropagation()
                            onClick()
                          }}
                        />
                      </Tooltip>
                    )}
                  >
                    {({ closePopper }) => (
                      <MenuPopper>
                        <Button
                          fullWidth
                          align="left"
                          startIcon="pen"
                          variant="quaternary"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(editProgressiveBillingFormPath)
                            closePopper()
                          }}
                        >
                          {translate('text_1738071730498edit4pb8hzw')}
                        </Button>

                        {subscriptionThresholds.length > 0 && (
                          <Button
                            fullWidth
                            align="left"
                            startIcon="history"
                            variant="quaternary"
                            onClick={(e) => {
                              e.stopPropagation()
                              resetDialogRef.current?.openDialog({
                                subscriptionId: subscription.id,
                              })
                              closePopper()
                            }}
                          >
                            {translate('text_1738071730498ht52blrjax6')}
                          </Button>
                        )}

                        <Button
                          fullWidth
                          align="left"
                          startIcon={
                            !!subscription.progressiveBillingDisabled ? 'validate-filled' : 'stop'
                          }
                          loading={switchingProgressiveBillingDisabledValueLoading}
                          variant="quaternary"
                          onClick={async (e) => {
                            e.stopPropagation()
                            await switchProgressiveBillingDisabledValue({
                              variables: {
                                input: {
                                  id: subscription.id,
                                  progressiveBillingDisabled:
                                    !subscription.progressiveBillingDisabled,
                                },
                              },
                            })
                            closePopper()
                          }}
                        >
                          {!!subscription.progressiveBillingDisabled
                            ? translate('text_1769604747500dwp43wers40')
                            : translate('text_1769604747500dwp43wers41')}
                        </Button>
                      </MenuPopper>
                    )}
                  </Popper>
                )}
              </div>
            </div>

            <NavigationTab
              // Margin top is here to respect the design implementation. Setting a different height on the navigation tab breaks the selected tab indicator. Using margin was the easiest approach.
              className="mt-1 px-4"
              managedBy={TabManagedBy.INDEX}
              tabs={[
                {
                  title: translate('text_1769712384134peknn5jyojg'),
                  hidden:
                    !subscriptionThresholds.length && !subscription.progressiveBillingDisabled,
                  component: (
                    <div className="flex flex-col gap-4 p-4">
                      {subscription.progressiveBillingDisabled && (
                        <Typography variant="body" color="grey500">
                          {translate('text_1769714542183sxbznn2i3v0')}
                        </Typography>
                      )}
                      {!subscription.progressiveBillingDisabled && (
                        <>
                          <ThresholdsTable
                            thresholds={subscriptionThresholds}
                            currency={currency}
                          />

                          {subscriptionThresholds?.some((threshold) => threshold.recurring) && (
                            <RecurringThresholdsTable
                              thresholds={subscriptionThresholds}
                              currency={currency}
                            />
                          )}
                        </>
                      )}
                    </div>
                  ),
                },
                {
                  title: translate('text_17697123841349drggrw2qur'),
                  // hidden: !planThresholds.length,
                  component: (
                    <div className="flex flex-col gap-4 p-4">
                      <DetailsPage.TableDisplay
                        name="progressive-billing"
                        className="[&_tr>td:last-child>div]:inline [&_tr>td:last-child>div]:whitespace-pre [&_tr>td:last-child]:max-w-[100px] [&_tr>td:last-child]:truncate"
                        header={[
                          '',
                          translate('text_1724179887723eh12a0kqbdw'),
                          translate('text_17241798877234jhvoho4ci9'),
                        ]}
                        body={[
                          ...(planThresholds
                            ?.filter((t) => !t.recurring)
                            .map((threshold, i) => [
                              i === 0
                                ? translate('text_1724179887723hi673zmbvdj')
                                : translate('text_1724179887723917j8ezkd9v'),
                              intlFormatNumber(deserializeAmount(threshold.amountCents, currency), {
                                currency,
                              }),
                              threshold.thresholdDisplayName || '',
                            ]) || []),
                        ]}
                      />

                      {planThresholds?.some((threshold) => threshold.recurring) && (
                        <DetailsPage.TableDisplay
                          name="progressive-billing-recurring"
                          className="[&_tr>td:last-child>div]:inline [&_tr>td:last-child>div]:whitespace-pre [&_tr>td:last-child]:max-w-[100px] [&_tr>td:last-child]:truncate"
                          // Only take the first recurring threshold
                          body={[
                            ...([planThresholds?.find((t) => t.recurring)]?.map((threshold) => [
                              translate('text_17241798877230y851fdxzqu'),
                              intlFormatNumber(
                                deserializeAmount(threshold?.amountCents, currency),
                                {
                                  currency,
                                },
                              ),
                              threshold?.thresholdDisplayName || '',
                            ]) || []),
                          ]}
                        />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        )}
      </div>

      <DisableProgressiveBillingDialog ref={disableDialogRef} />
      <ResetProgressiveBillingDialog ref={resetDialogRef} />
    </section>
  )
}
