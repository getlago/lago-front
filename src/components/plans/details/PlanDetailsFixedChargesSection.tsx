import { Accordion, Typography } from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { PlanDetailsChargeWrapperSwitch } from '~/components/plans/details/PlanDetailsChargeWrapperSwitch'
import { mapChargeIntervalCopy } from '~/components/plans/utils'
import { chargeModelLookupTranslation } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, EditPlanFragment, PlanInterval } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const PlanDetailsFixedChargesSection = ({
  currency,
  plan,
}: {
  currency: CurrencyEnum
  plan?: EditPlanFragment | null
}) => {
  const { translate } = useInternationalization()

  const isAnnual =
    plan?.interval && [PlanInterval.Semiannual, PlanInterval.Yearly].includes(plan?.interval)

  return (
    <section className="flex flex-col gap-12">
      {!!plan?.fixedCharges?.length && (
        <div className="flex flex-col gap-6">
          <div>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_64d2713ec021c6005ef64e03')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_64d2715f868d50004c21fee8')}
            </Typography>
          </div>
          {plan?.fixedCharges.map((fixedCharge, i) => (
            <Accordion
              noContentMargin
              key={`plan-details_fixed-charges-section_fixed-charge-${i}`}
              summary={
                <div>
                  <Typography variant="bodyHl" color="grey700">
                    {fixedCharge.invoiceDisplayName || fixedCharge.addOn.name}
                  </Typography>
                  <Typography variant="caption" noWrap>
                    {fixedCharge.addOn.code}
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
                        value: translate(chargeModelLookupTranslation[fixedCharge.chargeModel]),
                      },
                      {
                        label: translate('text_65201b8216455901fe273dc1'),
                        value: translate(
                          mapChargeIntervalCopy(
                            plan?.interval as PlanInterval,
                            (isAnnual && !!plan?.billChargesMonthly) || false,
                          ),
                        ),
                      },
                      {
                        label: translate('text_65771fa3f4ab9a00720726ce'),
                        value: fixedCharge?.units,
                      },
                    ]}
                  />
                </div>
                {/* Properties accordion */}
                <section className="flex flex-col gap-4 px-4 pb-4 shadow-b">
                  <PlanDetailsChargeWrapperSwitch
                    currency={currency}
                    chargeModel={fixedCharge.chargeModel}
                    values={fixedCharge.properties}
                  />
                </section>
                {/* Options */}
                <div className="px-4 pb-4">
                  <DetailsPage.InfoGrid
                    grid={[
                      {
                        label: translate('text_65201b8216455901fe273dd9'),
                        value: fixedCharge?.payInAdvance
                          ? translate('text_646e2d0cc536351b62ba6faa')
                          : translate('text_646e2d0cc536351b62ba6f8c'),
                      },
                      {
                        label: translate('text_65201b8216455901fe273df0'),
                        value: fixedCharge.prorated
                          ? translate('text_65251f46339c650084ce0d57')
                          : translate('text_65251f4cd55aeb004e5aa5ef'),
                      },
                      {
                        label: translate('text_645bb193927b375079d28a8f'),
                        value:
                          !!fixedCharge?.taxes?.length || !!plan?.taxes?.length
                            ? (fixedCharge.taxes?.length ? fixedCharge.taxes : plan?.taxes)?.map(
                                (tax, taxIndex) => (
                                  <div
                                    key={`plan-details-fixed-charge-${i}-section-accordion-tax-${taxIndex}`}
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
