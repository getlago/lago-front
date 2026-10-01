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
import { CurrencyEnum, RatePercentageTierInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { RATE_CARD_RATE_FORM_DEFAULTS } from '~/pages/catalog/drawers/rateCardRate/constants'

import {
  getTierLabelKey,
  getTierLowerBound,
  RATE_TIER_UP_TO_ERROR_KEY,
  RATE_TIER_UP_TO_KEY,
} from './rateTiers'
import {
  getGraduatedPercentageRateTiersLines,
  GraduatedPercentageRateTiersLine,
} from './rateTiersCalculations'
import {
  getRateTierTestId,
  RATE_TIER_FLAT_FEE_TEST_ID,
  RATE_TIER_INFINITE_UP_TO_TEST_ID,
  RATE_TIER_LABEL_TEST_ID,
  RATE_TIER_RATE_TEST_ID,
  RATE_TIER_UP_TO_TEST_ID,
  RATE_TIERS_ADD_TIER_TEST_ID,
  RATE_TIERS_EXAMPLE_LINE_TEST_ID,
} from './rateTiersTestIds'
import { useRateTiers } from './useRateTiers'

gql`
  fragment GraduatedPercentageRateTier on RatePercentageTier {
    toValue
    rate
    flatAmount
  }
`

type GraduatedPercentageRateTiersTableProps = {
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
}

const graduatedPercentageRateTiersTableDefaultProps: GraduatedPercentageRateTiersTableProps = {
  currency: CurrencyEnum.Usd,
  pricingUnitShortName: undefined,
}

const createGraduatedPercentageTier = (toValue: string | null): RatePercentageTierInput => ({
  toValue,
  rate: '',
  flatAmount: '',
})

export const GraduatedPercentageRateTiersTable = withForm({
  defaultValues: RATE_CARD_RATE_FORM_DEFAULTS,
  props: graduatedPercentageRateTiersTableDefaultProps,
  render: function GraduatedPercentageRateTiersTableRender({
    form,
    currency,
    pricingUnitShortName,
  }) {
    const { translate } = useInternationalization()
    const tiers = useStore(
      form.store,
      (state) => state.values.properties?.graduatedPercentageRanges,
    )
    const handleTiersChange = useCallback(
      (nextTiers: RatePercentageTierInput[]): void =>
        form.setFieldValue('properties.graduatedPercentageRanges', nextTiers),
      [form],
    )
    const { rows, addTier, deleteTier } = useRateTiers({
      tiers,
      onChange: handleTiersChange,
      createTier: createGraduatedPercentageTier,
    })
    const lines = getGraduatedPercentageRateTiersLines(rows)
    const amountAdornment = pricingUnitShortName || getCurrencySymbol(currency)

    const getLineCopy = (line: GraduatedPercentageRateTiersLine, index: number): string => {
      const rate = intlFormatNumber(line.rate / 100, {
        maximumFractionDigits: 15,
        style: 'percent',
      })
      const flatAmount = intlFormatNumber(line.flatAmount, {
        currencyDisplay: 'symbol',
        maximumFractionDigits: 15,
        currency,
        pricingUnitShortName,
      })

      if (lines.length === 1)
        return translate('text_64de5dd470cdf80100c15fdb', { rate, flatAmount })

      return translate(
        index === 0 ? 'text_64de472563e2da6b31737e6f' : 'text_64de472563e2da6b31737e75',
        { units: line.units, rate, flatAmount },
      )
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
        <form.AppField name={`properties.graduatedPercentageRanges[${index}].toValue`}>
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
        </form.AppField>
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
            name="graduated-percentage-rate-tiers-table"
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
                    {translate('text_64de472463e2da6b31737de0')}
                  </Typography>
                ),
                size: 144,
                content: (_, index) => (
                  <form.AppField name={`properties.graduatedPercentageRanges[${index}].rate`}>
                    {(field) => (
                      <FieldErrorTooltip>
                        <field.AmountInputField
                          variant="outlined"
                          beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                          currency={currency}
                          displayErrorText={false}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                {translate('text_632d68358f1fedc68eed3e93')}
                              </InputAdornment>
                            ),
                          }}
                          data-test={getRateTierTestId(RATE_TIER_RATE_TEST_ID, index)}
                        />
                      </FieldErrorTooltip>
                    )}
                  </form.AppField>
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
                  <form.AppField name={`properties.graduatedPercentageRanges[${index}].flatAmount`}>
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
                  </form.AppField>
                ),
              },
            ]}
          />
        </div>
        <Alert type="info">
          {lines.map((line, index) => (
            <Typography
              key={`graduated-percentage-rate-tiers-example-${index}`}
              color="textSecondary"
              data-test={getRateTierTestId(RATE_TIERS_EXAMPLE_LINE_TEST_ID, index)}
            >
              {getLineCopy(line, index)}
            </Typography>
          ))}
        </Alert>
      </div>
    )
  },
})
