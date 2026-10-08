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
import { withForm } from '~/hooks/forms/useAppform'
import { RATE_CARD_RATE_FORM_DEFAULTS } from '~/pages/catalog/drawers/rateCardRate/constants'

import {
  getTierLowerBound,
  RATE_TIER_TOTAL_UNITS_LABEL_KEY,
  RATE_TIER_UP_TO_ERROR_KEY,
  RATE_TIER_UP_TO_KEY,
} from './rateTiers'
import { getVolumeRateTiersExample } from './rateTiersCalculations'
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
  fragment VolumeRateTier on RateTier {
    toValue
    perUnitAmount
    flatAmount
  }
`

type VolumeRateTiersTableProps = {
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
}

const volumeRateTiersTableDefaultProps: VolumeRateTiersTableProps = {
  currency: CurrencyEnum.Usd,
  pricingUnitShortName: undefined,
}

const createVolumeTier = (toValue: string | null): RateTierInput => ({
  toValue,
  perUnitAmount: '',
  flatAmount: '',
})

export const VolumeRateTiersTable = withForm({
  defaultValues: RATE_CARD_RATE_FORM_DEFAULTS,
  props: volumeRateTiersTableDefaultProps,
  render: function VolumeRateTiersTableRender({ form, currency, pricingUnitShortName }) {
    const { translate } = useInternationalization()
    const tiers = useStore(form.store, (state) => state.values.properties?.volumeRanges)
    const handleTiersChange = useCallback(
      (nextTiers: RateTierInput[]): void =>
        form.setFieldValue('properties.volumeRanges', nextTiers),
      [form],
    )
    const { rows, addTier, deleteTier } = useRateTiers({
      tiers,
      onChange: handleTiersChange,
      createTier: createVolumeTier,
    })
    const example = getVolumeRateTiersExample(rows)
    const amountAdornment = pricingUnitShortName || getCurrencySymbol(currency)

    const formatAmount = (amount: number): string =>
      intlFormatNumber(amount, {
        currencyDisplay: 'symbol',
        maximumFractionDigits: 15,
        currency,
        pricingUnitShortName,
      })

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
        <form.AppField name={`properties.volumeRanges[${index}].toValue`}>
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
          {translate('text_6304e74aab6dbc18d615f38e')}
        </Button>
        <div className="-mx-4 overflow-auto px-4 pb-6">
          <ChargeTable
            name="volume-rate-tiers-table"
            data={rows}
            onDeleteRow={(_, index) => deleteTier(index)}
            columns={[
              {
                size: 181,
                content: (_, index) => (
                  <Typography
                    className="px-4"
                    variant="captionHl"
                    data-test={getRateTierTestId(RATE_TIER_LABEL_TEST_ID, index)}
                  >
                    {translate(RATE_TIER_TOTAL_UNITS_LABEL_KEY)}
                  </Typography>
                ),
              },
              {
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate(RATE_TIER_UP_TO_KEY)}
                  </Typography>
                ),
                size: 181,
                content: (_, index) => renderUpToCell(index),
              },
              {
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate('text_62793bbb599f1c01522e91b6')}
                  </Typography>
                ),
                size: 181,
                content: (_, index) => (
                  <form.AppField name={`properties.volumeRanges[${index}].perUnitAmount`}>
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
                  </form.AppField>
                ),
              },
              {
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate('text_62793bbb599f1c01522e91bc')}
                  </Typography>
                ),
                size: 181,
                content: (_, index) => (
                  <form.AppField name={`properties.volumeRanges[${index}].flatAmount`}>
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
          <Typography
            variant="bodyHl"
            color="textSecondary"
            data-test={RATE_TIERS_EXAMPLE_TOTAL_TEST_ID}
          >
            {translate('text_6304e74aab6dbc18d615f412', {
              lastRowFirstUnit: example.units,
              value: formatAmount(example.total),
            })}
          </Typography>
          <Typography
            variant="body"
            color="textSecondary"
            data-test={getRateTierTestId(RATE_TIERS_EXAMPLE_LINE_TEST_ID, 0)}
          >
            {translate('text_6304e74aab6dbc18d615f416', {
              lastRowFirstUnit: example.units,
              lastRowPerUnit: formatAmount(example.perUnit),
              lastRowFlatFee: formatAmount(example.flatFee),
              value: formatAmount(example.total),
            })}
          </Typography>
        </Alert>
      </div>
    )
  },
})
