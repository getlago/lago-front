import { FormikProps } from 'formik'
import { FC, useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Selector, SelectorActions } from '~/components/designSystem/Selector'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { ProgressiveBillingFormValues } from '~/components/plans/drawers/progressiveBilling/constants'
import {
  ProgressiveBillingDrawer,
  ProgressiveBillingDrawerRef,
} from '~/components/plans/drawers/progressiveBilling/ProgressiveBillingDrawer'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { PlanFormInput } from './types'

export const OPEN_PROGRESSIVE_BILLING_DRAWER_TEST_ID = 'open-progressive-billing-drawer'
export const ADD_PROGRESSIVE_BILLING_TEST_ID = 'add-progressive-billing'

interface ProgressiveBillingSectionProps {
  formikProps: FormikProps<PlanFormInput>
  onDrawerSave: (values: ProgressiveBillingFormValues) => void
}

export const ProgressiveBillingSection: FC<ProgressiveBillingSectionProps> = ({
  formikProps,
  onDrawerSave,
}) => {
  const { translate } = useInternationalization()
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()
  const progressiveBillingDrawerRef = useRef<ProgressiveBillingDrawerRef>(null)

  const { nonRecurringUsageThresholds, recurringUsageThreshold } = formikProps.values

  const hasThresholds = !!nonRecurringUsageThresholds?.length || !!recurringUsageThreshold

  const hasPremiumIntegration = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.ProgressiveBilling,
  )

  const thresholdCount =
    (nonRecurringUsageThresholds?.length ?? 0) + (recurringUsageThreshold ? 1 : 0)

  const handleDelete = () => {
    formikProps.setFieldValue('nonRecurringUsageThresholds', undefined)
    formikProps.setFieldValue('recurringUsageThreshold', undefined)
  }

  const openDrawer = () => {
    progressiveBillingDrawerRef.current?.openDrawer({
      nonRecurringUsageThresholds: (nonRecurringUsageThresholds ?? []).map((t) => ({
        amountCents: String(t.amountCents),
        thresholdDisplayName: t.thresholdDisplayName ?? undefined,
        recurring: false as const,
      })),
      recurringUsageThreshold: recurringUsageThreshold
        ? {
            amountCents: String(recurringUsageThreshold.amountCents),
            thresholdDisplayName: recurringUsageThreshold.thresholdDisplayName ?? undefined,
            recurring: true as const,
          }
        : undefined,
    })
  }

  return (
    <CenteredPage.PageSection>
      <CenteredPage.PageSectionTitle
        title={translate('text_1724179887722baucvj7bvc1')}
        description={translate('text_1724179887723kdf3nisf6hp')}
      />

      {hasThresholds && hasPremiumIntegration && (
        <Selector
          icon="table-horizontale"
          title={translate('text_1724179887722baucvj7bvc1')}
          subtitle={translate('text_1773950414511euzjefq877r', { thresholdCount }, thresholdCount)}
          endContent={<Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />}
          hoverActions={
            <SelectorActions
              actions={[
                {
                  icon: 'trash',
                  tooltipCopy: translate('text_63aa085d28b8510cd46443ff'),
                  onClick: handleDelete,
                },
                {
                  icon: 'pen',
                  tooltipCopy: translate('text_63e51ef4985f0ebd75c212fc'),
                  onClick: () => openDrawer(),
                },
              ]}
            />
          }
          data-test={OPEN_PROGRESSIVE_BILLING_DRAWER_TEST_ID}
          onClick={() => openDrawer()}
        />
      )}

      {!hasThresholds && !hasPremiumIntegration && (
        <PremiumFeature
          title={translate('text_1724345142892pcnx5m2k3r2')}
          description={translate('text_1724345142892ljzi79afhmc')}
          feature={translate('text_1724179887722baucvj7bvc1')}
        />
      )}

      {!hasThresholds && hasPremiumIntegration && (
        <Button
          fitContent
          variant="inline"
          startIcon="plus"
          data-test={ADD_PROGRESSIVE_BILLING_TEST_ID}
          onClick={() => {
            progressiveBillingDrawerRef.current?.openDrawer()
          }}
        >
          {translate('text_1724233213996upb98e8b8xx')}
        </Button>
      )}

      <ProgressiveBillingDrawer
        ref={progressiveBillingDrawerRef}
        onSave={onDrawerSave}
        onDelete={handleDelete}
      />
    </CenteredPage.PageSection>
  )
}

ProgressiveBillingSection.displayName = 'ProgressiveBillingSection'
