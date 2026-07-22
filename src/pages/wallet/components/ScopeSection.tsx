import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo, useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { ComboBox, ComboboxItem } from '~/components/form'
import { SHOW_LIMIT_INPUT_DATA_TEST } from '~/components/wallets/utils/dataTestConstants'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_APPLIES_TO_BILLABLE_METRIC_CLASSNAME,
  SEARCH_APPLIES_TO_FEE_TYPE_CLASSNAME,
} from '~/core/constants/form'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import { FeeTypesEnum, useGetBillableMetricsForWalletLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { emptyWalletFormDefaultValues } from '~/pages/wallet/mappers/mapFromApiToForm'

gql`
  fragment BillableMetricForWalletScopeSection on BillableMetric {
    id
    name
    code
  }

  fragment SelectableBillableMetricForWalletScopeSection on SelectableBillableMetric {
    id
    name
    code
  }

  fragment WalletForScopeSection on Wallet {
    id
    appliesTo {
      feeTypes
      billableMetrics {
        ...BillableMetricForWalletScopeSection
      }
    }
  }

  query getBillableMetricsForWallet($page: Int, $limit: Int, $searchTerm: String) {
    selectableBillableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        ...SelectableBillableMetricForWalletScopeSection
      }
      metadata {
        totalCount
      }
    }
  }
`

type AvailableFeeTypes = FeeTypesEnum.Charge | FeeTypesEnum.Commitment | FeeTypesEnum.Subscription

const availableFeeTypesTranslation: Record<AvailableFeeTypes, string> = {
  [FeeTypesEnum.Charge]: 'text_1748441354191rj96qhw3twa',
  [FeeTypesEnum.Commitment]: 'text_1748441354191cnp0tm4ubf0',
  [FeeTypesEnum.Subscription]: 'text_6630e3210c13c500cd398ea2',
}

export const ScopeSection = withForm({
  defaultValues: emptyWalletFormDefaultValues(),
  props: {},
  render: function ScopeSectionRender({ form }) {
    const { translate } = useInternationalization()
    const [showObjectLimitationInput, setShowObjectLimitationInput] = useState(false)
    const [showBillableMetricLimitationInput, setShowBillableMetricLimitationInput] =
      useState(false)

    const appliedFeeTypes = useStore(form.store, (state) => state.values.appliesTo?.feeTypes)
    const appliedBillableMetrics = useStore(
      form.store,
      (state) => state.values.appliesTo?.billableMetrics,
    )

    const [
      getBillableMetricsForWallet,
      { loading: billableMetricsLoading, data: billableMetricsData },
    ] = useGetBillableMetricsForWalletLazyQuery({
      variables: { limit: 50 },
    })

    const comboboxFeeTypesData = useMemo(() => {
      return [
        {
          label: translate(availableFeeTypesTranslation[FeeTypesEnum.Charge]),
          value: FeeTypesEnum.Charge,
          disabled: appliedFeeTypes?.includes(FeeTypesEnum.Charge) ?? false,
        },
        {
          label: translate(availableFeeTypesTranslation[FeeTypesEnum.Commitment]),
          value: FeeTypesEnum.Commitment,
          disabled: appliedFeeTypes?.includes(FeeTypesEnum.Commitment) ?? false,
        },
        {
          label: translate(availableFeeTypesTranslation[FeeTypesEnum.Subscription]),
          value: FeeTypesEnum.Subscription,
          disabled: appliedFeeTypes?.includes(FeeTypesEnum.Subscription) ?? false,
        },
      ]
    }, [appliedFeeTypes, translate])

    const comboboxBillableMetricsData = useMemo(() => {
      if (!billableMetricsData?.selectableBillableMetrics?.collection?.length) return []

      return billableMetricsData?.selectableBillableMetrics?.collection.map((billableMetric) => {
        const { id, name, code } = billableMetric

        return {
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
          value: id,
          disabled: appliedBillableMetrics?.some((bm) => bm.id === id) || false,
        }
      })
    }, [billableMetricsData?.selectableBillableMetrics?.collection, appliedBillableMetrics])

    const hasSelectedAllFeeTypes = useMemo(
      () => appliedFeeTypes?.length === Object.keys(availableFeeTypesTranslation).length,
      [appliedFeeTypes?.length],
    )

    useEffect(() => {
      getBillableMetricsForWallet()

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
      <section className="flex flex-col gap-6 pb-12 shadow-b">
        <div className="flex flex-col gap-1">
          <Typography variant="subhead1">{translate('text_1753215016828tqecv5jeg4e')}</Typography>
          <Typography variant="caption">{translate('text_1753215016828d5b7ocbawmp')}</Typography>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="captionHl" color="grey700">
              {translate('text_17484224585599hnm61rdb6d')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_17484378349895wl4yqkmqj9')}
            </Typography>
          </div>

          {!!appliedFeeTypes?.length && (
            <div className="flex flex-wrap items-center gap-3">
              {appliedFeeTypes?.map((feeType) => {
                const feeTypeTranslation =
                  availableFeeTypesTranslation[feeType as AvailableFeeTypes]

                return (
                  <Chip
                    key={feeType}
                    label={translate(feeTypeTranslation)}
                    onDelete={() => {
                      form.setFieldValue(
                        'appliesTo.feeTypes',
                        appliedFeeTypes?.filter((ft) => ft !== feeType),
                      )
                    }}
                  />
                )
              })}
            </div>
          )}

          {hasSelectedAllFeeTypes && (
            <Alert type="info">{translate('text_17484418620700x4nxxdfenm')}</Alert>
          )}

          {showObjectLimitationInput ? (
            <div className="flex items-center gap-4">
              <ComboBox
                containerClassName="flex-1"
                className={SEARCH_APPLIES_TO_FEE_TYPE_CLASSNAME}
                placeholder={translate('text_17484381918689r63e54hrh1')}
                data={comboboxFeeTypesData}
                onChange={(value: string) => {
                  const newFeeTypes = [...(appliedFeeTypes ?? [])]

                  if (value === '') {
                    form.setFieldValue('appliesTo.feeTypes', [])
                  } else if (newFeeTypes.includes(value as FeeTypesEnum)) {
                    form.setFieldValue(
                      'appliesTo.feeTypes',
                      newFeeTypes.filter((feeType) => feeType !== value),
                    )
                  } else {
                    form.setFieldValue('appliesTo.feeTypes', [
                      ...newFeeTypes,
                      value as FeeTypesEnum,
                    ])
                  }
                  setShowObjectLimitationInput(false)
                }}
              />
              <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    setShowObjectLimitationInput(false)
                  }}
                />
              </Tooltip>
            </div>
          ) : (
            <Button
              className="self-start"
              startIcon="plus"
              variant="inline"
              disabled={hasSelectedAllFeeTypes}
              onClick={() => {
                setShowObjectLimitationInput(true)

                scrollToAndClickElement({
                  selector: `.${SEARCH_APPLIES_TO_FEE_TYPE_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                })
              }}
              data-test={SHOW_LIMIT_INPUT_DATA_TEST}
            >
              {translate('text_1748442650797pz30j2eeiv4')}
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="captionHl" color="grey700">
              {translate('text_1753215016828k1x6yv1pwcc')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_1753215016828vpzdzmz23rw')}
            </Typography>
          </div>

          {!!appliedBillableMetrics?.length && (
            <div className="flex flex-wrap items-center gap-3">
              {appliedBillableMetrics?.map((appliedBillableMetric) => {
                return (
                  <Chip
                    key={appliedBillableMetric.id}
                    label={appliedBillableMetric.name}
                    onDelete={() => {
                      form.setFieldValue(
                        'appliesTo.billableMetrics',
                        appliedBillableMetrics?.filter(
                          (appliedBillableMetricForFilter) =>
                            appliedBillableMetricForFilter.id !== appliedBillableMetric.id,
                        ),
                      )
                    }}
                  />
                )
              })}
            </div>
          )}

          {showBillableMetricLimitationInput ? (
            <div className="flex items-center gap-4">
              <ComboBox
                containerClassName="flex-1"
                placeholder={translate('text_17484381918689r63e54hrh1')}
                className={SEARCH_APPLIES_TO_BILLABLE_METRIC_CLASSNAME}
                loading={billableMetricsLoading}
                data={comboboxBillableMetricsData}
                searchQuery={getBillableMetricsForWallet}
                onChange={(value: string) => {
                  if (!!value) {
                    const addedBillableMetric =
                      billableMetricsData?.selectableBillableMetrics?.collection.find(
                        (b) => b.id === value,
                      )

                    if (addedBillableMetric) {
                      form.setFieldValue('appliesTo.billableMetrics', [
                        ...(appliedBillableMetrics ?? []),
                        addedBillableMetric,
                      ])
                    }
                  } else {
                    form.setFieldValue('appliesTo.billableMetrics', [])
                  }
                  setShowBillableMetricLimitationInput(false)
                }}
              />
              <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    setShowBillableMetricLimitationInput(false)
                  }}
                />
              </Tooltip>
            </div>
          ) : (
            <Button
              className="self-start"
              startIcon="plus"
              variant="inline"
              onClick={() => {
                setShowBillableMetricLimitationInput(true)

                scrollToAndClickElement({
                  selector: `.${SEARCH_APPLIES_TO_BILLABLE_METRIC_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                })
              }}
            >
              {translate('text_17532150168286lki5kmbqfo')}
            </Button>
          )}
        </div>
      </section>
    )
  },
})
