import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import { FormikProps } from 'formik'
import { Icon } from 'lago-design-system'
import { FC, useEffect, useState } from 'react'

import {
  Accordion,
  Alert,
  Button,
  ChargeTable,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { AmountInput, Switch, TextInput } from '~/components/form'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { PROGRESSIVE_BILLING_DOC_URL } from '~/core/constants/externalUrls'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { PremiumIntegrationTypeEnum, UsageThresholdInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useProgressiveBillingForm } from '~/hooks/plans/useProgressiveBillingForm'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { PlanFormInput } from './types'

// Extended type for ChargeTable compatibility (requires index signature)
type ThresholdTableData = UsageThresholdInput & { [key: string]: unknown }

interface ProgressiveBillingSectionProps {
  formikProps: FormikProps<PlanFormInput>
}

export const ProgressiveBillingSection: FC<ProgressiveBillingSectionProps> = ({ formikProps }) => {
  const { translate } = useInternationalization()
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()

  const {
    nonRecurringUsageThresholds,
    recurringUsageThreshold,
    hasErrorInGroup,
    errorIndex,
    deleteProgressiveBilling,
    deleteThreshold,
    addNonRecurringThreshold,
    addRecurringThreshold,
    updateThreshold,
  } = useProgressiveBillingForm({ formikProps })

  const [displayProgressiveBillingAccordion, setDisplayProgressiveBillingAccordion] = useState(
    !!nonRecurringUsageThresholds?.length || !!recurringUsageThreshold,
  )
  const [displayRecurring, setRecurring] = useState(!!recurringUsageThreshold)

  const currency = formikProps.values.amountCurrency

  const hasPremiumIntegration = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.ProgressiveBilling,
  )

  useEffect(() => {
    setDisplayProgressiveBillingAccordion(
      !!formikProps.initialValues.nonRecurringUsageThresholds?.length ||
        !!formikProps.initialValues.recurringUsageThreshold,
    )
    setRecurring(!!formikProps.initialValues.recurringUsageThreshold)
  }, [
    formikProps.initialValues.nonRecurringUsageThresholds,
    formikProps.initialValues.recurringUsageThreshold,
  ])

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-col gap-1">
        <Typography variant="bodyHl" color="grey700">
          {translate('text_1724179887722baucvj7bvc1')}
        </Typography>
        <Typography
          variant="caption"
          color="grey600"
          html={translate('text_1724179887723kdf3nisf6hp', { href: PROGRESSIVE_BILLING_DOC_URL })}
        />
      </div>

      {!hasPremiumIntegration && (
        <PremiumFeature
          title={translate('text_1724345142892pcnx5m2k3r2')}
          description={translate('text_1724345142892ljzi79afhmc')}
          feature={translate('text_1724179887722baucvj7bvc1')}
        />
      )}

      {hasPremiumIntegration && displayProgressiveBillingAccordion && (
        <Accordion
          className="w-full"
          summary={
            <AccordionSummary
              hasErrorInGroup={hasErrorInGroup}
              onDelete={() => {
                deleteProgressiveBilling()
                setRecurring(false)
                setDisplayProgressiveBillingAccordion(false)
              }}
            />
          }
        >
          <Stack gap={6}>
            <Box display="flex" flexDirection="column">
              <Button
                className="mb-2 ml-auto"
                startIcon="plus"
                variant="inline"
                onClick={addNonRecurringThreshold}
              >
                {translate('text_1724233213997l2ksi40t8q6')}
              </Button>
              <div className="-mx-4 -mb-1 overflow-auto px-4 pb-1">
                <ChargeTable<ThresholdTableData>
                  name="graduated-percentage-charge-table"
                  data={(nonRecurringUsageThresholds ?? []).map(
                    (localData) =>
                      ({
                        ...localData,
                        disabledDelete: nonRecurringUsageThresholds?.length === 1,
                      }) as ThresholdTableData,
                  )}
                  onDeleteRow={(_, i) => {
                    deleteThreshold({ index: i, isRecurring: false })
                  }}
                  deleteTooltipContent={translate('text_17242522324608198c2vblmw')}
                  columns={[
                    {
                      size: 224,
                      content: (_, i) => (
                        <Typography className="px-4" variant="captionHl" noWrap>
                          {translate(
                            i === 0
                              ? 'text_1724234174944p8zi54j192m'
                              : 'text_1724179887723917j8ezkd9v',
                          )}
                        </Typography>
                      ),
                    },
                    {
                      size: 197,
                      title: (
                        <Typography className="px-4" variant="captionHl">
                          {translate('text_1724179887723eh12a0kqbdw')}
                        </Typography>
                      ),
                      content: (row, i) => (
                        <Tooltip
                          placement="top"
                          title={translate('text_1724252232460i4tv7384iiy', {
                            value: nonRecurringUsageThresholds?.[i - 1]?.amountCents,
                          })}
                          disableHoverListener={errorIndex !== i}
                        >
                          <AmountInput
                            variant="outlined"
                            error={errorIndex === i}
                            beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                            currency={currency}
                            value={row.amountCents}
                            onChange={(value) => {
                              updateThreshold({
                                index: i,
                                value: Number(value) || undefined,
                                isRecurring: false,
                                key: 'amountCents',
                              })
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  {getCurrencySymbol(currency)}
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Tooltip>
                      ),
                    },
                    {
                      size: 197,
                      title: (
                        <Typography className="px-4" variant="captionHl">
                          {translate('text_17241798877234jhvoho4ci9')}
                        </Typography>
                      ),
                      content: (row, i) => (
                        <TextInput
                          variant="outlined"
                          placeholder={translate('text_645bb193927b375079d28ace')}
                          value={row.thresholdDisplayName ?? ''}
                          onChange={(value) => {
                            updateThreshold({
                              index: i,
                              value: value === '' ? undefined : value,
                              isRecurring: false,
                              key: 'thresholdDisplayName',
                            })
                          }}
                        />
                      ),
                    },
                  ]}
                />
              </div>
            </Box>
            <Switch
              name="progressiveBillingRecurring"
              checked={displayRecurring}
              onChange={() => {
                if (!displayRecurring) {
                  addRecurringThreshold()
                } else {
                  deleteThreshold({ index: 0, isRecurring: true })
                }
                setRecurring(!displayRecurring)
              }}
              label={translate('text_1724234174945ztq15pvmty3')}
              subLabel={translate('text_172423417494563qf45qet2d')}
            />
            {displayRecurring && (
              <div className="-mx-4 -mb-1 overflow-auto px-4 py-1">
                <ChargeTable<ThresholdTableData>
                  name={'progressive-billing-recurring'}
                  columns={[
                    {
                      size: 224,
                      content: () => (
                        <Typography className="px-4" variant="captionHl" noWrap>
                          {translate('text_17241798877230y851fdxzqu')}
                        </Typography>
                      ),
                    },
                    {
                      size: 197,
                      content: (row, i) => (
                        <AmountInput
                          variant="outlined"
                          beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                          currency={currency}
                          value={row.amountCents}
                          onChange={(value) =>
                            updateThreshold({
                              index: i,
                              value: Number(value) || undefined,
                              isRecurring: true,
                              key: 'amountCents',
                            })
                          }
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                {getCurrencySymbol(currency)}
                              </InputAdornment>
                            ),
                          }}
                        />
                      ),
                    },
                    {
                      size: 197,
                      content: (row, i) => (
                        <TextInput
                          variant="outlined"
                          placeholder={translate('text_645bb193927b375079d28ace')}
                          value={row.thresholdDisplayName ?? ''}
                          onChange={(value) => {
                            updateThreshold({
                              index: i,
                              value: value === '' ? undefined : value,
                              isRecurring: true,
                              key: 'thresholdDisplayName',
                            })
                          }}
                        />
                      ),
                    },
                  ]}
                  data={[(recurringUsageThreshold ?? {}) as ThresholdTableData]}
                />
              </div>
            )}
            <Alert type="info">{translate('text_1724252232460iqofvwnpgnx')}</Alert>
          </Stack>
        </Accordion>
      )}

      {hasPremiumIntegration && !displayProgressiveBillingAccordion && (
        <Button
          variant="inline"
          startIcon="plus"
          disabled={displayProgressiveBillingAccordion}
          onClick={() => {
            addNonRecurringThreshold()
            setDisplayProgressiveBillingAccordion(true)
          }}
        >
          {translate('text_1724233213996upb98e8b8xx')}
        </Button>
      )}
    </div>
  )
}

ProgressiveBillingSection.displayName = 'ProgressiveBillingSection'

const AccordionSummary: FC<{ onDelete: VoidFunction; hasErrorInGroup: boolean }> = ({
  onDelete,
  hasErrorInGroup,
}) => {
  const { translate } = useInternationalization()

  return (
    <div className="flex h-18 w-full items-center justify-between gap-3 overflow-hidden">
      <div className="flex items-center gap-3 overflow-hidden py-1 pr-1">
        <Typography variant="bodyHl" color="grey700" noWrap>
          {translate('text_1724179887722baucvj7bvc1')}
        </Typography>
      </div>

      <div className="flex items-center gap-3">
        <Tooltip
          placement="top-end"
          title={
            hasErrorInGroup
              ? translate('text_635b975ecea4296eb76924b7')
              : translate('text_635b975ecea4296eb76924b1')
          }
        >
          <Icon
            className="flex items-center"
            name="validate-filled"
            color={hasErrorInGroup ? 'disabled' : 'success'}
          />
        </Tooltip>

        <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
          <Button size="small" icon="trash" variant="quaternary" onClick={onDelete} />
        </Tooltip>
      </div>
    </div>
  )
}
