import { useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { ComboBox, ComboboxItem } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  WALLET_SCOPE_FEE_TYPE_LABEL_KEYS,
  WALLET_SCOPE_FEE_TYPES,
  WalletScopeFeeType,
} from '~/components/wallets/utils/walletScopeFeeTypes'
import { FeeTypesEnum, useGetBillableMetricsForWalletLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import type { WalletScopeSlice } from './walletFormSchema'

const DEFAULTS: WalletScopeSlice = { feeTypes: [], billableMetricCodes: [] }

export const WALLET_SCOPE_FEE_TYPE_CHIPS_TEST_ID = 'wallet-scope-fee-type-chips'
export const WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID = 'wallet-scope-fee-type-add-button'
export const WALLET_SCOPE_FEE_TYPE_COMBOBOX_TEST_ID = 'wallet-scope-fee-type-combobox'
export const WALLET_SCOPE_FEE_TYPE_CANCEL_BUTTON_TEST_ID = 'wallet-scope-fee-type-cancel-button'
export const WALLET_SCOPE_BILLABLE_METRIC_CHIPS_TEST_ID = 'wallet-scope-billable-metric-chips'
export const WALLET_SCOPE_BILLABLE_METRIC_ADD_BUTTON_TEST_ID =
  'wallet-scope-billable-metric-add-button'
export const WALLET_SCOPE_BILLABLE_METRIC_COMBOBOX_TEST_ID = 'wallet-scope-billable-metric-combobox'
export const WALLET_SCOPE_BILLABLE_METRIC_CANCEL_BUTTON_TEST_ID =
  'wallet-scope-billable-metric-cancel-button'

export const WalletScopeFields = withForm({
  defaultValues: DEFAULTS,
  props: {},
  render: function Render({ form }) {
    const { translate } = useInternationalization()
    const [showFeeTypeInput, setShowFeeTypeInput] = useState(false)
    const [showBillableMetricInput, setShowBillableMetricInput] = useState(false)

    const [getBillableMetrics, { data: billableMetricsData, loading: billableMetricsLoading }] =
      useGetBillableMetricsForWalletLazyQuery({
        variables: { limit: 50 },
      })

    return (
      <div className="flex flex-col gap-8">
        <CenteredPage.PageTitle
          title={translate('text_178335269238576yarvlompv')}
          description={translate('text_1783352692385a04ln0put4m')}
        />

        {/* Fee-type limitation */}
        <form.AppField name="feeTypes">
          {(field) => {
            const selected = field.state.value as FeeTypesEnum[]
            const allSelected = selected.length === WALLET_SCOPE_FEE_TYPES.length

            const comboboxFeeTypesData = WALLET_SCOPE_FEE_TYPES.map((feeType) => ({
              label: translate(WALLET_SCOPE_FEE_TYPE_LABEL_KEYS[feeType]),
              value: feeType,
              disabled: selected.includes(feeType),
            }))

            const removeFeeType = (target: FeeTypesEnum) =>
              field.handleChange(selected.filter((current) => current !== target))
            const addFeeType = (value: FeeTypesEnum) => field.handleChange([...selected, value])

            return (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <Typography variant="captionHl" color="grey700">
                    {translate('text_17484224585599hnm61rdb6d')}
                  </Typography>
                  <Typography variant="caption" color="grey600">
                    {translate('text_17484378349895wl4yqkmqj9')}
                  </Typography>
                </div>

                {!!selected.length && (
                  <div
                    className="flex flex-wrap items-center gap-3"
                    data-test={WALLET_SCOPE_FEE_TYPE_CHIPS_TEST_ID}
                  >
                    {selected.map((feeType) => (
                      <Chip
                        key={feeType}
                        label={translate(
                          WALLET_SCOPE_FEE_TYPE_LABEL_KEYS[feeType as WalletScopeFeeType],
                        )}
                        onDelete={() => removeFeeType(feeType)}
                      />
                    ))}
                  </div>
                )}

                {allSelected && (
                  <Alert type="info">{translate('text_17484418620700x4nxxdfenm')}</Alert>
                )}

                {showFeeTypeInput ? (
                  <div className="flex items-center gap-4">
                    <ComboBox
                      data-test={WALLET_SCOPE_FEE_TYPE_COMBOBOX_TEST_ID}
                      containerClassName="flex-1"
                      placeholder={translate('text_17484381918689r63e54hrh1')}
                      data={comboboxFeeTypesData}
                      onChange={(value) => {
                        if (value) {
                          addFeeType(value as FeeTypesEnum)
                        }
                        setShowFeeTypeInput(false)
                      }}
                    />
                    <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                      <Button
                        data-test={WALLET_SCOPE_FEE_TYPE_CANCEL_BUTTON_TEST_ID}
                        icon="trash"
                        variant="quaternary"
                        onClick={() => setShowFeeTypeInput(false)}
                      />
                    </Tooltip>
                  </div>
                ) : (
                  <Button
                    data-test={WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID}
                    className="self-start"
                    startIcon="plus"
                    variant="inline"
                    disabled={allSelected}
                    onClick={() => setShowFeeTypeInput(true)}
                  >
                    {translate('text_1748442650797pz30j2eeiv4')}
                  </Button>
                )}
              </div>
            )
          }}
        </form.AppField>

        {/* Billable-metric limitation */}
        <form.AppField name="billableMetricCodes">
          {(field) => {
            const selected = field.state.value as string[]

            const comboboxBillableMetricsData = (
              billableMetricsData?.selectableBillableMetrics?.collection ?? []
            ).map(({ name, code }) => ({
              label: `${name} (${code})`,
              labelNode: (
                <ComboboxItem>
                  <Typography variant="body" color="grey700" noWrap>
                    {name}
                  </Typography>
                  <Typography variant="caption" color="grey600" noWrap>
                    {code}
                  </Typography>
                </ComboboxItem>
              ),
              value: code,
              disabled: selected.includes(code),
            }))

            const removeCode = (target: string) =>
              field.handleChange(selected.filter((current) => current !== target))
            const addCode = (value: string) => field.handleChange([...selected, value])

            return (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <Typography variant="captionHl" color="grey700">
                    {translate('text_1753215016828k1x6yv1pwcc')}
                  </Typography>
                  <Typography variant="caption" color="grey600">
                    {translate('text_1753215016828vpzdzmz23rw')}
                  </Typography>
                </div>

                {!!selected.length && (
                  <div
                    className="flex flex-wrap items-center gap-3"
                    data-test={WALLET_SCOPE_BILLABLE_METRIC_CHIPS_TEST_ID}
                  >
                    {selected.map((code) => {
                      const matched =
                        billableMetricsData?.selectableBillableMetrics?.collection.find(
                          (billableMetric) => billableMetric.code === code,
                        )

                      return (
                        <Chip
                          key={code}
                          label={matched?.name ?? code}
                          onDelete={() => removeCode(code)}
                        />
                      )
                    })}
                  </div>
                )}

                {showBillableMetricInput ? (
                  <div className="flex items-center gap-4">
                    <ComboBox
                      data-test={WALLET_SCOPE_BILLABLE_METRIC_COMBOBOX_TEST_ID}
                      containerClassName="flex-1"
                      placeholder={translate('text_17484381918689r63e54hrh1')}
                      loading={billableMetricsLoading}
                      data={comboboxBillableMetricsData}
                      searchQuery={getBillableMetrics}
                      onChange={(value) => {
                        if (value) {
                          addCode(value)
                        }
                        setShowBillableMetricInput(false)
                      }}
                    />
                    <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                      <Button
                        data-test={WALLET_SCOPE_BILLABLE_METRIC_CANCEL_BUTTON_TEST_ID}
                        icon="trash"
                        variant="quaternary"
                        onClick={() => setShowBillableMetricInput(false)}
                      />
                    </Tooltip>
                  </div>
                ) : (
                  <Button
                    data-test={WALLET_SCOPE_BILLABLE_METRIC_ADD_BUTTON_TEST_ID}
                    className="self-start"
                    startIcon="plus"
                    variant="inline"
                    onClick={() => setShowBillableMetricInput(true)}
                  >
                    {translate('text_17532150168286lki5kmbqfo')}
                  </Button>
                )}
              </div>
            )
          }}
        </form.AppField>
      </div>
    )
  },
})
