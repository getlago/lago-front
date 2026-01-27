import { FC, useMemo, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import {
  Accordion,
  Button,
  ButtonLink,
  Chip,
  Popper,
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
import { SubscriptionProgressiveBillingTable } from '~/components/subscriptions/SubscriptionProgressiveBillingTable'
import { PROGRESSIVE_BILLING_DOC_URL } from '~/core/constants/externalUrls'
import {
  EDIT_PROGRESSIVE_BILLING_CUSTOMER_SUBSCRIPTION_ROUTE,
  EDIT_PROGRESSIVE_BILLING_PLAN_SUBSCRIPTION_ROUTE,
} from '~/core/router'
import {
  CurrencyEnum,
  GetSubscriptionForDetailsQuery,
  PremiumIntegrationTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper } from '~/styles'

interface SubscriptionProgressiveBillingTabProps {
  subscription?: GetSubscriptionForDetailsQuery['subscription']
  loading?: boolean
}

enum ProgressiveBillingState {
  FREEMIUM = 'freemium',
  DISABLED = 'disabled',
  USING_PARENT_PLAN = 'using_parent_plan',
  NO_THRESHOLDS = 'no_thresholds',
  OVERRIDDEN = 'overridden',
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

  const hasPremiumIntegration = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.ProgressiveBilling,
  )
  const canEditSubscription = hasPermissions(['subscriptionsCreate', 'subscriptionsUpdate'])

  const subscriptionThresholds = useMemo(
    () => subscription?.usageThresholds || [],
    [subscription?.usageThresholds],
  )
  const planThresholds = useMemo(
    () => subscription?.plan?.usageThresholds || [],
    [subscription?.plan?.usageThresholds],
  )
  const currency = subscription?.plan?.amountCurrency || CurrencyEnum.Usd

  const state = useMemo((): ProgressiveBillingState => {
    if (!hasPremiumIntegration) {
      return ProgressiveBillingState.FREEMIUM
    }

    if (subscription?.progressiveBillingDisabled) {
      return ProgressiveBillingState.DISABLED
    }

    if (subscriptionThresholds.length > 0) {
      return ProgressiveBillingState.OVERRIDDEN
    }

    if (planThresholds.length > 0) {
      return ProgressiveBillingState.USING_PARENT_PLAN
    }

    return ProgressiveBillingState.NO_THRESHOLDS
  }, [
    hasPremiumIntegration,
    subscription?.progressiveBillingDisabled,
    subscriptionThresholds.length,
    planThresholds.length,
  ])

  const editPath = useMemo(() => {
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

  if (loading || !subscription) {
    return <DetailsPage.Skeleton />
  }

  return (
    <section className="flex flex-col gap-6 pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Typography variant="subhead1">{translate('text_1724179887722baucvj7bvc1')}</Typography>
          <Typography
            variant="caption"
            color="grey600"
            html={translate('text_1724179887723kdf3nisf6hp', { href: PROGRESSIVE_BILLING_DOC_URL })}
          />
        </div>

        {state === ProgressiveBillingState.OVERRIDDEN && canEditSubscription && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button variant="quaternary" size="small" endIcon="chevron-down">
                {translate('text_626162c62f790600f850b6fe')}
              </Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  variant="quaternary"
                  align="left"
                  startIcon="pen"
                  onClick={() => {
                    navigate(editPath)
                    closePopper()
                  }}
                >
                  {translate('text_62d7f6178ec94cd09370e63c')}
                </Button>
                <Button
                  variant="quaternary"
                  align="left"
                  startIcon="reload"
                  onClick={() => {
                    resetDialogRef.current?.openDialog({
                      subscriptionId: subscription.id,
                      subscriptionName: subscription.name || subscription.plan.name,
                    })
                    closePopper()
                  }}
                >
                  {translate('text_1738071730498ht52blrjax6')}
                </Button>
                <Button
                  variant="quaternary"
                  align="left"
                  startIcon="stop"
                  onClick={() => {
                    disableDialogRef.current?.openDialog({
                      subscriptionId: subscription.id,
                      subscriptionName: subscription.name || subscription.plan.name,
                    })
                    closePopper()
                  }}
                >
                  {translate('text_1738071730498bsjvn56ruzp')}
                </Button>
              </MenuPopper>
            )}
          </Popper>
        )}
      </div>

      {/* Freemium state - show upgrade prompt */}
      {state === ProgressiveBillingState.FREEMIUM && (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-grey-100 px-6 py-4">
          <div className="flex flex-col gap-1">
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_1724345142892pcnx5m2k3r2')}
            </Typography>
            <Typography variant="caption">{translate('text_1724345142892ljzi79afhmc')}</Typography>
          </div>
          <ButtonLink
            buttonProps={{
              variant: 'tertiary',
              size: 'medium',
              endIcon: 'sparkles',
            }}
            type="button"
            external
            to={`mailto:hello@getlago.com?subject=${translate('text_172434514289283gmf8bdhh3')}&body=${translate('text_1724346450317iqs2rtvx1tp')}`}
          >
            {translate('text_65ae73ebe3a66bec2b91d72d')}
          </ButtonLink>
        </div>
      )}

      {/* Disabled state */}
      {state === ProgressiveBillingState.DISABLED && (
        <div className="flex flex-col gap-4">
          <Typography variant="body" color="grey600">
            {translate('text_1738071730498qg3fo3j43f8')}
          </Typography>
          {canEditSubscription && (
            <Button
              variant="inline"
              startIcon="plus"
              onClick={() => navigate(editPath)}
              className="self-start"
            >
              {translate('text_1738071730498kxobqn9ebwe')}
            </Button>
          )}
        </div>
      )}

      {/* No thresholds state */}
      {state === ProgressiveBillingState.NO_THRESHOLDS && (
        <div className="flex flex-col gap-4">
          <Typography variant="body" color="grey600">
            {translate('text_17380717304985b9ufvwfxdr')}
          </Typography>
          {canEditSubscription && (
            <Button
              variant="inline"
              startIcon="plus"
              onClick={() => navigate(editPath)}
              className="self-start"
            >
              {translate('text_1724233213996upb98e8b8xx')}
            </Button>
          )}
        </div>
      )}

      {/* Using parent plan state */}
      {state === ProgressiveBillingState.USING_PARENT_PLAN && (
        <div className="flex flex-col gap-4">
          <Typography variant="body" color="grey600">
            {translate('text_1738071730498d65pmecuq6l')}
          </Typography>
          {canEditSubscription && (
            <Button
              variant="inline"
              startIcon="pen"
              onClick={() => navigate(editPath)}
              className="self-start"
            >
              {translate('text_1738071730498s3o5o6jnvhf')}
            </Button>
          )}
        </div>
      )}

      {/* Overridden state - show accordion with thresholds */}
      {state === ProgressiveBillingState.OVERRIDDEN && (
        <Accordion
          summary={
            <div className="flex w-full items-center justify-between gap-3 overflow-hidden">
              <Typography variant="bodyHl" color="grey700">
                {translate('text_1724179887722baucvj7bvc1')}
              </Typography>
              <div className="flex items-center gap-3">
                <Tooltip placement="top-end" title={translate('text_65281f686a80b400c8e2f6dd')}>
                  <Chip label={translate('text_65281f686a80b400c8e2f6dd')} />
                </Tooltip>
              </div>
            </div>
          }
        >
          <SubscriptionProgressiveBillingTable
            thresholds={subscriptionThresholds}
            currency={currency}
            name="progressive-billing-subscription"
          />
        </Accordion>
      )}

      <DisableProgressiveBillingDialog ref={disableDialogRef} />
      <ResetProgressiveBillingDialog ref={resetDialogRef} />
    </section>
  )
}
