import { Accordion, Typography } from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, EditPlanFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const PlanDetailsSubscriptionFeeAccordion = ({
  plan,
}: {
  plan?: EditPlanFragment | null
}) => {
  const { translate } = useInternationalization()

  return (
    <Accordion
      summary={
        <Typography variant="bodyHl" color="grey700">
          {plan?.invoiceDisplayName || translate('text_642d5eb2783a2ad10d670336')}
        </Typography>
      }
    >
      <div className="flex flex-col gap-6">
        <DetailsPage.TableDisplay
          name="subscription-fee"
          header={[translate('text_624453d52e945301380e49b6')]}
          body={[
            [
              intlFormatNumber(
                deserializeAmount(plan?.amountCents || 0, plan?.amountCurrency || CurrencyEnum.Usd),
                { currency: plan?.amountCurrency || CurrencyEnum.Usd },
              ),
            ],
          ]}
        />
        <DetailsPage.InfoGrid
          grid={[
            {
              label: translate('text_65201b8216455901fe273dd9'),
              value: plan?.payInAdvance
                ? translate('text_646e2d0cc536351b62ba6faa')
                : translate('text_646e2d0cc536351b62ba6f8c'),
            },
            {
              label: translate('text_65201b8216455901fe273dcd'),
              value: plan?.trialPeriod,
            },
            {
              label: translate('text_645bb193927b375079d28a8f'),
              value: !!plan?.taxes?.length
                ? plan?.taxes?.map((tax, i) => (
                    <div key={`plan-details-subscription-fee-taxe-${i}`}>
                      <Typography variant="body" color="grey700">
                        {tax.name} (
                        {intlFormatNumber(Number(tax.rate) / 100 || 0, {
                          style: 'percent',
                        })}
                        )
                      </Typography>
                    </div>
                  ))
                : '-',
            },
          ]}
        />
      </div>
    </Accordion>
  )
}
