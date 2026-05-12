import { Alert } from '~/components/designSystem/Alert'
import { isCanceledWithPaymentReason } from '~/core/utils/subscriptionUtils'
import {
  CancelationReasonEnum,
  NextSubscriptionTypeEnum,
  StatusTypeEnum,
  SubscriptionForSubscriptionInformationsFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

interface SubscriptionDetailAlertsProps {
  subscription?: SubscriptionForSubscriptionInformationsFragment | null
}

export const SubscriptionDetailAlerts = ({ subscription }: SubscriptionDetailAlertsProps) => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  const isDowngrade =
    !!subscription?.nextPlan?.id &&
    subscription?.nextSubscriptionType === NextSubscriptionTypeEnum.Downgrade

  const isPendingDowngrade =
    !!subscription?.previousPlan?.id && subscription?.status === StatusTypeEnum.Pending

  return (
    <>
      {isDowngrade && (
        <Alert type="info">
          {translate('text_62681c60582e4f00aa82938a', {
            planName: subscription?.nextPlan?.name,
            dateStartNewPlan: intlFormatDateTimeOrgaTZ(subscription?.nextSubscriptionAt).date,
          })}
        </Alert>
      )}

      {isPendingDowngrade && (
        <Alert type="info">
          {translate('text_1776951742342o96gqg8qg8j', {
            planName: subscription?.previousPlan?.name,
            dateStartNewPlan: intlFormatDateTimeOrgaTZ(
              subscription?.previousSubscription?.downgradePlanDate,
            ).date,
          })}
        </Alert>
      )}

      {subscription?.status === StatusTypeEnum.Incomplete && (
        <Alert type="warning">{translate('text_1774352080433yerw1efzlhz')}</Alert>
      )}

      {isCanceledWithPaymentReason(subscription) && (
        <Alert type="info">
          {subscription?.cancelationReason === CancelationReasonEnum.PaymentFailed
            ? translate('text_1774352080433gd3ir29lpxr')
            : translate('text_1774352080433ykzd2e2f6uu')}
        </Alert>
      )}
    </>
  )
}
