import { Stack } from '@mui/material'
import styled from 'styled-components'

import { Accordion, Typography } from '~/components/designSystem'
import { mapChargeIntervalCopy } from '~/components/plans/ChargeAccordion'
import { PROGRESSIVE_BILLING_DOC_URL } from '~/core/constants/externalUrls'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, EditPlanFragment, PlanInterval } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DetailsInfoGrid, DetailsSectionTitle } from '~/styles/detailsPage'

import DetailsTableDisplay from '../../details/DetailsTableDisplay'

const PlanDetailsAdvancedSettingsSection = ({
  currency,
  plan,
}: {
  currency: CurrencyEnum
  plan?: EditPlanFragment | null
}) => {
  const { translate } = useInternationalization()
  const hasMinimumCommitment =
    !!plan?.minimumCommitment?.amountCents && !isNaN(Number(plan?.minimumCommitment?.amountCents))
  const hasProgressiveBilling = !!plan?.usageThresholds?.length

  if (!hasMinimumCommitment && !hasProgressiveBilling) return null

  return (
    <Container>
      <DetailsSectionTitle variant="subhead" noWrap>
        {translate('text_6661fc17337de3591e29e44d')}
      </DetailsSectionTitle>

      <Stack direction="column" gap={12}>
        {hasProgressiveBilling && (
          <Stack direction="column" gap={6}>
            <div>
              <Typography variant="bodyHl" color="grey700">
                {translate('text_1724179887722baucvj7bvc1')}
              </Typography>
              <Typography
                variant="caption"
                color="grey600"
                html={translate('text_1724179887723kdf3nisf6hp', {
                  href: PROGRESSIVE_BILLING_DOC_URL,
                })}
              />
            </div>

            <Accordion
              summary={
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_1724179887722baucvj7bvc1')}
                </Typography>
              }
            >
              <Stack direction="column" spacing={4}>
                <DetailsTableDisplay
                  className="details-table-display-last-cell-ellipsis"
                  header={[
                    '',
                    translate('text_1724179887723eh12a0kqbdw'),
                    translate('text_17241798877234jhvoho4ci9'),
                  ]}
                  body={[
                    ...(plan?.usageThresholds
                      ?.filter((t) => !t.recurring)
                      .map((threshold, i) => [
                        i === 0
                          ? translate('text_1724179887723hi673zmbvdj')
                          : translate('text_1724179887723917j8ezkd9v'),
                        intlFormatNumber(
                          deserializeAmount(
                            threshold.amountCents,
                            plan?.amountCurrency || CurrencyEnum.Usd,
                          ),
                          {
                            currency: currency,
                          },
                        ),
                        threshold.thresholdDisplayName || '',
                      ]) || []),
                  ]}
                />

                <DetailsInfoGrid
                  grid={[
                    {
                      label: translate('text_17241798877230y851fdxzqt'),
                      value: plan?.usageThresholds?.some((threshold) => threshold.recurring)
                        ? translate('text_65251f46339c650084ce0d57')
                        : translate('text_65251f4cd55aeb004e5aa5ef'),
                    },
                  ]}
                />

                {plan?.usageThresholds?.some((threshold) => threshold.recurring) && (
                  <DetailsTableDisplay
                    className="details-table-display-last-cell-ellipsis"
                    // Only take the first recurring threshold
                    body={[
                      ...([plan?.usageThresholds?.find((t) => t.recurring)]?.map((threshold) => [
                        translate('text_17241798877230y851fdxzqu'),
                        intlFormatNumber(
                          deserializeAmount(
                            threshold?.amountCents,
                            plan?.amountCurrency || CurrencyEnum.Usd,
                          ),
                          {
                            currency: currency,
                          },
                        ),
                        threshold?.thresholdDisplayName || '',
                      ]) || []),
                    ]}
                  />
                )}
              </Stack>
            </Accordion>
          </Stack>
        )}

        {hasMinimumCommitment && (
          <Stack direction="column" gap={6}>
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
              <Stack direction="column" spacing={4}>
                <DetailsTableDisplay
                  header={[translate('text_65d601bffb11e0f9d1d9f571')]}
                  body={[
                    [
                      intlFormatNumber(
                        deserializeAmount(
                          plan?.minimumCommitment?.amountCents || 0,
                          plan?.amountCurrency || CurrencyEnum.Usd,
                        ),
                        {
                          currency: currency,
                        },
                      ),
                    ],
                  ]}
                />

                <DetailsInfoGrid
                  grid={[
                    {
                      label: translate('text_65201b8216455901fe273dc1'),
                      value: translate(getIntervalTranslationKey[plan?.interval as PlanInterval]),
                    },
                    {
                      label: translate('text_645bb193927b375079d28a8f'),
                      value: !!plan?.minimumCommitment?.taxes?.length
                        ? plan?.minimumCommitment?.taxes?.map((tax, i) => (
                            <Typography
                              key={`plan-details-fixed-fee-taxe-${i}`}
                              variant="body"
                              color="grey700"
                            >
                              {tax.name} (
                              {intlFormatNumber(Number(tax.rate) / 100 || 0, {
                                style: 'percent',
                              })}
                              )
                            </Typography>
                          ))
                        : '-',
                    },
                  ]}
                />
              </Stack>
            </Accordion>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}

export default PlanDetailsAdvancedSettingsSection

const Container = styled.section`
  .details-table-display-last-cell-ellipsis {
    tr > td:last-child {
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
`
