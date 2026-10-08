import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { useStore } from '@tanstack/react-form'
import { ReactNode, useCallback } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { ChargeTable } from '~/components/designSystem/Table/ChargeTable'
import { Typography } from '~/components/designSystem/Typography'
import { FieldErrorTooltip } from '~/components/form/FieldErrorTooltip'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, RateTierInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'
import { getRatePropertiesShape } from '~/pages/catalog/drawers/rateCardRate/getRatePropertiesShape'

import {
  getTierLabelKey,
  getTierLowerBound,
  RATE_TIER_UP_TO_ERROR_KEY,
  RATE_TIER_UP_TO_KEY,
} from './rateTiers'
import { getGraduatedRateTiersExample, GraduatedRateTiersLine } from './rateTiersCalculations'
import {
  getRateTierTestId,
  RATE_TIER_FLAT_FEE_TEST_ID,
  RATE_TIER_INFINITE_UP_TO_TEST_ID,
  RATE_TIER_LABEL_TEST_ID,
  RATE_TIER_PER_UNIT_TEST_ID,
  RATE_TIER_UP_TO_TEST_ID,
  RATE_TIERS_ADD_TIER_TEST_ID,
  RATE_TIERS_EXAMPLE_LINE_TEST_ID,
  RATE_TIERS_EXAMPLE_TOTAL_TEST_ID,
} from './rateTiersTestIds'
import { useRateTiers } from './useRateTiers'

gql`
  fragment GraduatedRateTier on RateTier {
    toValue
    perUnitAmount
    flatAmount
  }
`

type GraduatedRateTiersTableProps = {
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
}

const graduatedRateTiersTableDefaultProps: GraduatedRateTiersTableProps = {
  currency: CurrencyEnum.Usd,
  pricingUnitShortName: undefined,
}

const createGraduatedTier = (toValue: string | null): RateTierInput => ({
  toValue,
  perUnitAmount: '',
  flatAmount: '',
})

export const GraduatedRateTiersTable = withFieldGroup({
  defaultValues: getRatePropertiesShape(),
  props: graduatedRateTiersTableDefaultProps,
  render: function GraduatedRateTiersTableRender({ group, currency, pricingUnitShortName }) {
    const { translate } = useInternationalization()
    const tiers = useStore(group.store, (state) => state.values.graduatedRanges)
    const handleTiersChange = useCallback(
      (nextTiers: RateTierInput[]): void => group.setFieldValue('graduatedRanges', nextTiers),
      [group],
    )
    const { rows, addTier, deleteTier } = useRateTiers({
      tiers,
      onChange: handleTiersChange,
      createTier: createGraduatedTier,
    })
    const example = getGraduatedRateTiersExample(rows)
    const amountAdornment = pricingUnitShortName || getCurrencySymbol(currency)

    const formatAmount = (amount: number): string =>
      intlFormatNumber(amount, {
        currencyDisplay: 'symbol',
        maximumFractionDigits: 15,
        currency,
        pricingUnitShortName,
      })

    const getExampleLineCopy = (line: GraduatedRateTiersLine, index: number): string => {
      const firstLineVariables = {
        tier1LastUnit: line.units,
        tier1PerUnit: formatAmount(line.perUnit),
        tier1FlatFee: formatAmount(line.flatFee),
        totalTier1: formatAmount(line.total),
      }

      if (example.lines.length === 1) {
        return translate('text_64cac576a11db000acb130b2', firstLineVariables)
      }

      if (index === 0) return translate('text_627b69c9fe95530136833958', firstLineVariables)

      return translate('text_627b69c9fe9553013683395a', {
        unitCount: line.units,
        tierPerUnit: formatAmount(line.perUnit),
        tierFlatFee: formatAmount(line.flatFee),
        totalTier: formatAmount(line.total),
      })
    }

    const renderUpToCell = (index: number): ReactNode => {
      if (index === rows.length - 1) {
        return (
          <Typography
            className="px-4"
            variant="body"
            color="disabled"
            noWrap
            data-test={RATE_TIER_INFINITE_UP_TO_TEST_ID}
          >
            ∞
          </Typography>
        )
      }

      return (
        <group.AppField name={`graduatedRanges[${index}].toValue`}>
          {(field) => (
            <FieldErrorTooltip
              title={translate(RATE_TIER_UP_TO_ERROR_KEY, {
                value: getTierLowerBound(rows, index).toFixed(),
              })}
            >
              <field.TextInputField
                variant="outlined"
                beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                displayErrorText={false}
                data-test={getRateTierTestId(RATE_TIER_UP_TO_TEST_ID, index)}
              />
            </FieldErrorTooltip>
          )}
        </group.AppField>
      )
    }

    return (
      <div className="flex flex-col">
        <Button
          className="mb-2 ml-auto"
          startIcon="plus"
          variant="inline"
          onClick={addTier}
          data-test={RATE_TIERS_ADD_TIER_TEST_ID}
        >
          {translate('text_62793bbb599f1c01522e91a5')}
        </Button>
        <div className="-mx-4 overflow-auto px-4 pb-6">
          <ChargeTable
            name="graduated-rate-tiers-table"
            data={rows}
            onDeleteRow={(_, index) => deleteTier(index)}
            columns={[
              {
                size: 144,
                content: (_, index) => (
                  <Typography
                    className="px-4"
                    variant="captionHl"
                    data-test={getRateTierTestId(RATE_TIER_LABEL_TEST_ID, index)}
                  >
                    {translate(getTierLabelKey(index))}
                  </Typography>
                ),
              },
              {
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate(RATE_TIER_UP_TO_KEY)}
                  </Typography>
                ),
                size: 144,
                content: (_, index) => renderUpToCell(index),
              },
              {
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate('text_62793bbb599f1c01522e91b6')}
                  </Typography>
                ),
                size: 144,
                content: (_, index) => (
                  <group.AppField name={`graduatedRanges[${index}].perUnitAmount`}>
                    {(field) => (
                      <FieldErrorTooltip>
                        <field.AmountInputField
                          variant="outlined"
                          beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                          currency={currency}
                          displayErrorText={false}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">{amountAdornment}</InputAdornment>
                            ),
                          }}
                          data-test={getRateTierTestId(RATE_TIER_PER_UNIT_TEST_ID, index)}
                        />
                      </FieldErrorTooltip>
                    )}
                  </group.AppField>
                ),
              },
              {
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate('text_62793bbb599f1c01522e91bc')}
                  </Typography>
                ),
                size: 144,
                content: (_, index) => (
                  <group.AppField name={`graduatedRanges[${index}].flatAmount`}>
                    {(field) => (
                      <FieldErrorTooltip>
                        <field.AmountInputField
                          variant="outlined"
                          beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                          currency={currency}
                          displayErrorText={false}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">{amountAdornment}</InputAdornment>
                            ),
                          }}
                          data-test={getRateTierTestId(RATE_TIER_FLAT_FEE_TEST_ID, index)}
                        />
                      </FieldErrorTooltip>
                    )}
                  </group.AppField>
                ),
              },
            ]}
          />
        </div>
        <Alert type="info">
          <Typography
            variant="bodyHl"
            color="textSecondary"
            data-test={RATE_TIERS_EXAMPLE_TOTAL_TEST_ID}
          >
            {translate('text_627b69c9fe95530136833956', {
              lastRowUnit: example.totalUnits,
              value: formatAmount(example.total),
            })}
          </Typography>
          {example.lines.map((line, index) => (
            <Typography
              key={`graduated-rate-tiers-example-${index}`}
              color="textSecondary"
              data-test={getRateTierTestId(RATE_TIERS_EXAMPLE_LINE_TEST_ID, index)}
            >
              {getExampleLineCopy(line, index)}
            </Typography>
          ))}
        </Alert>
      </div>
    )
  },
})
