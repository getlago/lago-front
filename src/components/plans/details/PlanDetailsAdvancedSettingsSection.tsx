import { Accordion } from '~/components/designSystem/Accordion'
import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { EntitlementInfo } from '~/components/plans/EntitlementInfo'
import { MinimumCommitmentInfo } from '~/components/plans/MinimumCommitmentInfo'
import { ProgressiveBillingInfo } from '~/components/plans/ProgressiveBillingInfo'
import { mapChargeIntervalCopy } from '~/components/plans/utils'
import { CurrencyEnum, EditPlanFragment, PlanInterval } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const PlanDetailsAdvancedSettingsSection = ({
  currency,
  plan,
  showEntitlementSection = true,
  showProgressiveBillingSection = true,
}: {
  currency: CurrencyEnum
  plan?: EditPlanFragment | null
  showEntitlementSection?: boolean
  showProgressiveBillingSection?: boolean
}) => {
  const { translate } = useInternationalization()
  const hasMinimumCommitment =
    !!plan?.minimumCommitment?.amountCents && !isNaN(Number(plan?.minimumCommitment?.amountCents))
  const hasProgressiveBilling = !!plan?.usageThresholds?.length && showProgressiveBillingSection
  const hasEntitlements = showEntitlementSection && !!plan?.entitlements?.length

  if (!hasMinimumCommitment && !hasProgressiveBilling && !hasEntitlements) return null
  if (!plan) return null

  return (
    <section>
      <DetailsPage.SectionTitle variant="subhead1" noWrap>
        {translate('text_6661fc17337de3591e29e44d')}
      </DetailsPage.SectionTitle>

      <div className="flex flex-col gap-12">
        {hasProgressiveBilling && (
          <div className="flex flex-col gap-6">
            <div>
              <Typography variant="bodyHl" color="grey700">
                {translate('text_1724179887722baucvj7bvc1')}
              </Typography>
              <Typography variant="caption" color="grey600">
                {translate('text_1724179887723kdf3nisf6hp')}
              </Typography>
            </div>

            <Accordion
              summary={
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_1724179887722baucvj7bvc1')}
                </Typography>
              }
            >
              <ProgressiveBillingInfo plan={plan} currency={currency} />
            </Accordion>
          </div>
        )}

        {hasMinimumCommitment && (
          <div className="flex flex-col gap-6">
            <div>
              <Typography variant="bodyHl" color="grey700">
                {translate('text_65d601bffb11e0f9d1d9f569')}
              </Typography>
              <Typography variant="caption" color="grey600">
                {translate('text_6661fc17337de3591e29e451', {
                  interval: translate(
                    mapChargeIntervalCopy(plan?.interval ?? PlanInterval.Monthly, false),
                  ).toLocaleLowerCase(),
                })}
              </Typography>
            </div>

            <Accordion
              summary={
                <Typography variant="bodyHl" color="grey700">
                  {plan?.minimumCommitment?.invoiceDisplayName ||
                    translate('text_65d601bffb11e0f9d1d9f569')}
                </Typography>
              }
            >
              <MinimumCommitmentInfo plan={plan} currency={currency} />
            </Accordion>
          </div>
        )}

        {hasEntitlements && (
          <div className="flex flex-col gap-6">
            <div>
              <Typography variant="bodyHl" color="grey700">
                {translate('text_63e26d8308d03687188221a6')}
              </Typography>
              <Typography
                variant="caption"
                color="grey600"
                html={translate('text_17538642230602p03937fj0f')}
              />
            </div>

            {plan?.entitlements?.map((entitlement) => (
              <Accordion
                key={`plan-details-entitlement-${entitlement.code}`}
                summary={
                  <div className="flex flex-col">
                    <Typography variant="bodyHl" color="grey700">
                      {entitlement.name || '-'}
                    </Typography>
                    <Typography variant="caption" color="grey600">
                      {entitlement.code}
                    </Typography>
                  </div>
                }
              >
                <EntitlementInfo entitlement={entitlement} />
              </Accordion>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
