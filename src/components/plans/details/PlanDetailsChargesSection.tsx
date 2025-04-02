import { Accordion, Typography } from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { mapChargeIntervalCopy } from '~/components/plans/ChargeAccordion'
import { PlanDetailsChargesSectionAccordion } from '~/components/plans/details/PlanDetailsChargesSectionAccordion'
import { chargeModelLookupTranslation } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  Charge,
  CurrencyEnum,
  EditPlanFragment,
  PlanInterval,
  RegroupPaidFeesEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const PlanDetailsChargesSection = ({
  currency,
  plan,
}: {
  currency: CurrencyEnum
  plan?: EditPlanFragment | null
}) => {
  const { translate } = useInternationalization()
  const { meteredCharges, recurringCharges } =
    plan?.charges?.reduce(
      (acc, charge) => {
        if (!charge.billableMetric.recurring) {
          acc?.meteredCharges?.push(charge)
        } else {
          acc?.recurringCharges?.push(charge)
        }
        return acc
      },
      { meteredCharges: [], recurringCharges: [] } as {
        meteredCharges: EditPlanFragment['charges']
        recurringCharges: EditPlanFragment['charges']
      },
    ) ?? {}

  return (
    <section className="flex flex-col gap-12">
      {!!meteredCharges?.length && (
        <div className="flex flex-col gap-6">
          <div>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_64d2713ec021c6005ef64e03')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_64d2715f868d50004c21fee8')}
            </Typography>
          </div>
          {meteredCharges.map((charge, i) => (
            <Accordion
              noContentMargin
              key={`plan-details_charges-section_metered-charge-${i}`}
              summary={
                <div>
                  <Typography variant="bodyHl" color="grey700">
                    {charge.invoiceDisplayName || charge.billableMetric.name}
                  </Typography>
                  <Typography variant="caption" noWrap>
                    {charge.billableMetric.code}
                  </Typography>
                </div>
              }
            >
              <section className="flex flex-col gap-4">
                {/* Charge main infos */}
                <div className="px-4 pt-4">
                  <DetailsPage.InfoGrid
                    grid={[
                      {
                        label: translate('text_65201b8216455901fe273dd5'),
                        value: translate(chargeModelLookupTranslation[charge.chargeModel]),
                      },
                      {
                        label: translate('text_65201b8216455901fe273dc1'),
                        value: translate(
                          mapChargeIntervalCopy(
                            plan?.interval as PlanInterval,
                            (plan?.interval === PlanInterval.Yearly &&
                              !!plan?.billChargesMonthly) ||
                              false,
                          ),
                        ),
                      },
                    ]}
                  />
                </div>
                {/* Properties accordion */}
                <PlanDetailsChargesSectionAccordion currency={currency} charge={charge as Charge} />
                {/* Options */}
                <div className="px-4 pb-4">
                  <DetailsPage.InfoGrid
                    grid={[
                      {
                        label: translate('text_65201b8216455901fe273dd9'),
                        value: charge?.payInAdvance
                          ? translate('text_646e2d0cc536351b62ba6faa')
                          : translate('text_646e2d0cc536351b62ba6f8c'),
                      },
                      {
                        label: translate('text_65201b8216455901fe273ddb'),
                        value: intlFormatNumber(
                          deserializeAmount(charge.minAmountCents, currency),
                          {
                            currencyDisplay: 'symbol',
                            currency,
                            maximumFractionDigits: 15,
                          },
                        ),
                      },
                      {
                        label: translate('text_65201b8216455901fe273df0'),
                        value: charge.prorated
                          ? translate('text_65251f46339c650084ce0d57')
                          : translate('text_65251f4cd55aeb004e5aa5ef'),
                      },
                      {
                        label: translate('text_6682c52081acea90520744ca'),
                        value: !charge.payInAdvance
                          ? translate('text_66968fba80f8f89a8aefdec0')
                          : charge.invoiceable
                            ? translate('text_66968fba80f8f89a8aefdebf')
                            : charge.regroupPaidFees === RegroupPaidFeesEnum.Invoice
                              ? translate('text_66968fba80f8f89a8aefdec0')
                              : translate('text_6682c52081acea9052074686'),
                      },
                      {
                        label: translate('text_645bb193927b375079d28a8f'),
                        value:
                          !!charge?.taxes?.length || !!plan?.taxes?.length
                            ? (charge.taxes?.length ? charge.taxes : plan?.taxes)?.map(
                                (tax, taxIndex) => (
                                  <div
                                    key={`plan-details-charge-${i}-section-accordion-tax-${taxIndex}`}
                                  >
                                    {tax.name} (
                                    {intlFormatNumber(Number(tax.rate) / 100 || 0, {
                                      style: 'percent',
                                    })}
                                    )
                                  </div>
                                ),
                              )
                            : '-',
                      },
                    ]}
                  />
                </div>
              </section>
            </Accordion>
          ))}
        </div>
      )}
      {!!recurringCharges?.length && (
        <div className="flex flex-col gap-6">
          <div>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_64d271e20a9c11005bd6688a')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_64d2720f666bf7007e9ca759')}
            </Typography>
          </div>
          {recurringCharges.map((charge, i) => (
            <Accordion
              noContentMargin
              key={`plan-details_charges-section_recurring-charge-${i}`}
              summary={
                <div>
                  <Typography variant="bodyHl" color="grey700">
                    {charge.invoiceDisplayName || charge.billableMetric.name}
                  </Typography>
                  <Typography variant="caption" noWrap>
                    {charge.billableMetric.code}
                  </Typography>
                </div>
              }
            >
              <section className="flex flex-col gap-4">
                {/* Charge main infos */}
                <div className="px-4 pt-4">
                  <DetailsPage.InfoGrid
                    grid={[
                      {
                        label: translate('text_65201b8216455901fe273dd5'),
                        value: translate(chargeModelLookupTranslation[charge.chargeModel]),
                      },
                      {
                        label: translate('text_65201b8216455901fe273dc1'),
                        value: translate(
                          mapChargeIntervalCopy(
                            plan?.interval as PlanInterval,
                            (plan?.interval === PlanInterval.Yearly &&
                              !!plan?.billChargesMonthly) ||
                              false,
                          ),
                        ),
                      },
                    ]}
                  />
                </div>
                {/* Properties accordion */}
                <PlanDetailsChargesSectionAccordion currency={currency} charge={charge as Charge} />
                {/* Options */}
                <div className="px-4 pb-4">
                  <DetailsPage.InfoGrid
                    grid={[
                      {
                        label: translate('text_65201b8216455901fe273dd9'),
                        value: charge?.payInAdvance
                          ? translate('text_646e2d0cc536351b62ba6faa')
                          : translate('text_646e2d0cc536351b62ba6f8c'),
                      },
                      {
                        label: translate('text_65201b8216455901fe273ddb'),
                        value: intlFormatNumber(
                          deserializeAmount(charge.minAmountCents, currency),
                          {
                            currencyDisplay: 'symbol',
                            currency,
                            maximumFractionDigits: 15,
                          },
                        ),
                      },
                      {
                        label: translate('text_65201b8216455901fe273df0'),
                        value: charge.prorated
                          ? translate('text_65251f46339c650084ce0d57')
                          : translate('text_65251f4cd55aeb004e5aa5ef'),
                      },
                      {
                        label: translate('text_646e2d0cc536351b62ba6f16'),
                        value: charge.invoiceable
                          ? translate('text_65251f46339c650084ce0d57')
                          : translate('text_65251f4cd55aeb004e5aa5ef'),
                      },
                      {
                        label: translate('text_645bb193927b375079d28a8f'),
                        value:
                          !!charge?.taxes?.length || !!plan?.taxes?.length
                            ? (charge.taxes?.length ? charge.taxes : plan?.taxes)?.map(
                                (tax, taxIndex) => (
                                  <div
                                    key={`plan-details-charge-${i}-section-accordion-tax-${taxIndex}`}
                                  >
                                    {tax.name} (
                                    {intlFormatNumber(Number(tax.rate) / 100 || 0, {
                                      style: 'percent',
                                    })}
                                    )
                                  </div>
                                ),
                              )
                            : '-',
                      },
                    ]}
                  />
                </div>
              </section>
            </Accordion>
          ))}
        </div>
      )}
    </section>
  )
}
