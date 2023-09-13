import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

import { Button, Popper, Tooltip, Typography } from '~/components/designSystem'
import { ComboBox, SwitchField } from '~/components/form'
import { Item } from '~/components/form/ComboBox/ComboBoxItem'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_METERED_CHARGE_INPUT_CLASSNAME,
  SEARCH_RECURRING_CHARGE_INPUT_CLASSNAME,
} from '~/core/constants/form'
import {
  ChargeModelEnum,
  CurrencyEnum,
  PlanInterval,
  useGetMeteredBillableMetricsLazyQuery,
  useGetRecurringBillableMetricsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper, theme } from '~/styles'

import { ChargeAccordion } from './ChargeAccordion'
import {
  RemoveChargeWarningDialog,
  RemoveChargeWarningDialogRef,
} from './RemoveChargeWarningDialog'
import { LocalChargeInput, PlanFormInput } from './types'

import { PremiumWarningDialog, PremiumWarningDialogRef } from '../PremiumWarningDialog'

const RESULT_LIMIT = 50

gql`
  fragment PlanForChargeAccordion on Plan {
    billChargesMonthly
  }

  fragment billableMetricForChargeSection on BillableMetric {
    id
    name
    code
    aggregationType
    recurring
    flatGroups {
      id
      key
      value
    }
  }

  query getMeteredBillableMetrics($page: Int, $limit: Int, $searchTerm: String) {
    billableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm, recurring: false) {
      collection {
        id
        ...billableMetricForChargeSection
      }
    }
  }

  query getRecurringBillableMetrics($page: Int, $limit: Int, $searchTerm: String) {
    billableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm, recurring: true) {
      collection {
        id
        ...billableMetricForChargeSection
      }
    }
  }
`

interface ChargesSectionProps {
  canBeEdited: boolean
  isEdition: boolean
  hasAnyMeteredCharge: boolean
  hasAnyRecurringCharge: boolean
  getPropertyShape: Function
  formikProps: FormikProps<PlanFormInput>
  alreadyExistingCharges?: PlanFormInput['charges'] | null
}

const getNewChargeId = (id: string, index: number) => `plan-charge-${id}-${index}`

export const ChargesSection = memo(
  ({
    canBeEdited,
    isEdition,
    hasAnyMeteredCharge,
    hasAnyRecurringCharge,
    getPropertyShape,
    formikProps,
    alreadyExistingCharges,
  }: ChargesSectionProps) => {
    const { translate } = useInternationalization()
    const hasAnyCharge = !!formikProps.values.charges.length
    const [showAddMeteredCharge, setShowAddMeteredCharge] = useState(false)
    const [showAddRecurringCharge, setShowAddRecurringCharge] = useState(false)
    const [newChargeId, setNewChargeId] = useState<string | null>(null)
    const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
    const removeChargeWarningDialogRef = useRef<RemoveChargeWarningDialogRef>(null)
    const alreadyUsedBmsIds = useRef<Map<String, number>>(new Map())
    const [
      getMeteredBillableMetrics,
      { loading: meteredBillableMetricsLoading, data: meteredBillableMetricsData },
    ] = useGetMeteredBillableMetricsLazyQuery({
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      variables: { limit: RESULT_LIMIT },
    })
    const [
      getRecurringBillableMetrics,
      { loading: recurringBillableMetricsLoading, data: recurringBillableMetricsData },
    ] = useGetRecurringBillableMetricsLazyQuery({
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      variables: { limit: RESULT_LIMIT },
    })

    const meteredBillableMetrics = useMemo(() => {
      if (
        !meteredBillableMetricsData ||
        !meteredBillableMetricsData?.billableMetrics ||
        !meteredBillableMetricsData?.billableMetrics?.collection
      )
        return []

      return meteredBillableMetricsData?.billableMetrics?.collection.map(({ id, name, code }) => {
        return {
          label: `${name} (${code})`,
          labelNode: (
            <Item>
              {name}&nbsp;<Typography color="textPrimary">({code})</Typography>
            </Item>
          ),
          value: id,
        }
      })
    }, [meteredBillableMetricsData])

    const recurringBillableMetrics = useMemo(() => {
      if (
        !recurringBillableMetricsData ||
        !recurringBillableMetricsData?.billableMetrics ||
        !recurringBillableMetricsData?.billableMetrics?.collection
      )
        return []

      return recurringBillableMetricsData?.billableMetrics?.collection.map(({ id, name, code }) => {
        return {
          label: `${name} (${code})`,
          labelNode: (
            <Item>
              {name}&nbsp;<Typography color="textPrimary">({code})</Typography>
            </Item>
          ),
          value: id,
        }
      })
    }, [recurringBillableMetricsData])

    useEffect(() => {
      // When adding a new charge, scroll to the new charge element
      if (!!newChargeId) {
        const element = document.getElementById(newChargeId)
        const rootElement = document.getElementById('root')

        if (!element || !rootElement) return

        rootElement.scrollTo({ top: element.offsetTop - 72 - 16 })
      }
    }, [newChargeId])

    useEffect(() => {
      const BmIdsMap = new Map()

      for (let i = 0; i < formikProps.values.charges.length; i++) {
        const element = formikProps.values.charges[i]
        const bmId = element.billableMetric.id

        if (BmIdsMap.has(bmId)) {
          BmIdsMap.set(bmId, BmIdsMap.get(bmId) + 1)
        } else {
          BmIdsMap.set(bmId, 1)
        }
      }

      alreadyUsedBmsIds.current = BmIdsMap
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formikProps.values.charges.length])

    return (
      <>
        <Card>
          <SectionTitle>
            <Typography variant="subhead">{translate('text_6435888d7cc86500646d8977')}</Typography>
            <Popper
              PopperProps={{ placement: 'bottom-end' }}
              opener={
                <Button variant="secondary" endIcon="chevron-down" data-test="add-charge">
                  {translate('text_6435888d7cc86500646d8974')}
                </Button>
              }
            >
              {({ closePopper }) => (
                <MenuPopper>
                  <Button
                    variant="quaternary"
                    data-test="add-metered-charge"
                    onClick={async () => {
                      if (!showAddMeteredCharge) setShowAddMeteredCharge(true)

                      setTimeout(() => {
                        const element = document.querySelector(
                          `.${SEARCH_METERED_CHARGE_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`
                        ) as HTMLElement

                        if (!element) return

                        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        element.click()

                        closePopper()
                      }, 0)
                    }}
                  >
                    {translate('text_64d270faa1b07d0097fa287e')}
                  </Button>
                  <Button
                    variant="quaternary"
                    data-test="add-recurring-charge"
                    onClick={async () => {
                      if (!showAddRecurringCharge) setShowAddRecurringCharge(true)

                      setTimeout(() => {
                        const element = document.querySelector(
                          `.${SEARCH_RECURRING_CHARGE_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`
                        ) as HTMLElement

                        if (!element) return

                        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        element.click()

                        closePopper()
                      }, 0)
                    }}
                  >
                    {translate('text_64d27120a3d1e300b35d0fcc')}
                  </Button>
                </MenuPopper>
              )}
            </Popper>
          </SectionTitle>

          {/* METERED */}
          {!!hasAnyCharge && formikProps.values.interval === PlanInterval.Yearly && (
            <SwitchField
              label={translate('text_62a30bc79dae432fb055330b')}
              subLabel={translate('text_64358e074a3b7500714f256c')}
              name="billChargesMonthly"
              disabled={isEdition && !canBeEdited}
              formikProps={formikProps}
            />
          )}

          {(hasAnyMeteredCharge || showAddMeteredCharge) && (
            <div>
              <Typography variant="bodyHl" color="grey700">
                {translate('text_64d2713ec021c6005ef64e03')}
              </Typography>
              <Typography variant="caption" color="grey600">
                {translate('text_64d2715f868d50004c21fee8')}
              </Typography>
            </div>
          )}

          {hasAnyMeteredCharge && (
            <Charges>
              {formikProps.values.charges.map((charge, i) => {
                // Prevent displaying recurring charges
                if (charge.billableMetric.recurring) return

                const id = getNewChargeId(charge.billableMetric.id, i)
                const isNew = !alreadyExistingCharges?.find(
                  (chargeFetched) => chargeFetched?.id === charge.id
                )
                const shouldDisplayAlreadyUsedChargeAlert =
                  (alreadyUsedBmsIds.current.get(charge.billableMetric.id) || 0) > 1

                return (
                  <ChargeAccordion
                    id={id}
                    key={id}
                    shouldDisplayAlreadyUsedChargeAlert={shouldDisplayAlreadyUsedChargeAlert}
                    removeChargeWarningDialogRef={removeChargeWarningDialogRef}
                    premiumWarningDialogRef={premiumWarningDialogRef}
                    isUsedInSubscription={!isNew && !canBeEdited}
                    currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
                    index={i}
                    disabled={isEdition && !canBeEdited && !isNew}
                    formikProps={formikProps}
                  />
                )
              })}
            </Charges>
          )}
          {!!showAddMeteredCharge && (
            <AddChargeInlineWrapper>
              <ComboBox
                className={SEARCH_METERED_CHARGE_INPUT_CLASSNAME}
                data={meteredBillableMetrics}
                searchQuery={getMeteredBillableMetrics}
                loading={meteredBillableMetricsLoading}
                placeholder={translate('text_6435888d7cc86500646d8981')}
                emptyText={translate('text_6246b6bc6b25f500b779aa7a')}
                onChange={(newCharge) => {
                  const previousCharges = [...formikProps.values.charges]
                  const newId = getNewChargeId(newCharge, previousCharges.length)
                  const localBillableMetrics =
                    meteredBillableMetricsData?.billableMetrics?.collection.find(
                      (bm) => bm.id === newCharge
                    )
                  const lastMeteredIndex = previousCharges.findLastIndex(
                    (c) => c.billableMetric.recurring === false
                  )
                  const newChargeIndex = lastMeteredIndex < 0 ? 0 : lastMeteredIndex + 1

                  previousCharges.splice(newChargeIndex, 0, {
                    payInAdvance: false,
                    invoiceable: true,
                    billableMetric: localBillableMetrics,
                    properties: getPropertyShape({}),
                    groupProperties: localBillableMetrics?.flatGroups?.length ? [] : undefined,

                    // localBillableMetrics?.flatGroups.map((group) => {
                    //   return {
                    //     groupId: group.id,
                    //     values: getPropertyShape({}),
                    //   }
                    // })

                    chargeModel: ChargeModelEnum.Standard,
                    amountCents: undefined,
                  } as LocalChargeInput)

                  formikProps.setFieldValue('charges', previousCharges)
                  setShowAddMeteredCharge(false)
                  setNewChargeId(newId)
                }}
              />
              <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    setShowAddMeteredCharge(false)
                  }}
                />
              </Tooltip>
            </AddChargeInlineWrapper>
          )}

          {hasAnyCharge && (
            <InlineButtons>
              {!showAddMeteredCharge && !!hasAnyMeteredCharge && (
                <Button
                  startIcon="plus"
                  variant="quaternary"
                  data-test="add-metered-charge"
                  onClick={() => {
                    setShowAddMeteredCharge(true)
                    setTimeout(() => {
                      ;(
                        document.querySelector(
                          `.${SEARCH_METERED_CHARGE_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`
                        ) as HTMLElement
                      )?.click()
                    }, 0)
                  }}
                >
                  {translate('text_64d270faa1b07d0097fa287e')}
                </Button>
              )}
              {!showAddRecurringCharge && !hasAnyRecurringCharge && (
                <Button
                  startIcon="plus"
                  variant="quaternary"
                  data-test="add-recurring-charge"
                  onClick={() => {
                    setShowAddRecurringCharge(true)
                    setTimeout(() => {
                      ;(
                        document.querySelector(
                          `.${SEARCH_RECURRING_CHARGE_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`
                        ) as HTMLElement
                      )?.click()
                    }, 0)
                  }}
                >
                  {translate('text_64d27120a3d1e300b35d0fcc')}
                </Button>
              )}
            </InlineButtons>
          )}

          {/* RECURRING */}
          {(hasAnyRecurringCharge || showAddRecurringCharge) && (
            <RecurringSectionTitleWrapper
              $hasAnyAboveSection={hasAnyMeteredCharge || showAddMeteredCharge}
            >
              <Typography variant="bodyHl" color="grey700">
                {translate('text_64d271e20a9c11005bd6688a')}
              </Typography>
              <Typography variant="caption" color="grey600">
                {translate('text_64d2720f666bf7007e9ca759')}
              </Typography>
            </RecurringSectionTitleWrapper>
          )}

          {hasAnyRecurringCharge && (
            <Charges>
              {formikProps.values.charges.map((charge, i) => {
                // Prevent displaying metered charges
                if (!charge.billableMetric.recurring) return

                const id = getNewChargeId(charge.billableMetric.id, i)
                const isNew = !alreadyExistingCharges?.find(
                  (chargeFetched) => chargeFetched?.id === charge.id
                )
                const shouldDisplayAlreadyUsedChargeAlert =
                  (alreadyUsedBmsIds.current.get(charge.billableMetric.id) || 0) > 1

                return (
                  <ChargeAccordion
                    id={id}
                    key={id}
                    shouldDisplayAlreadyUsedChargeAlert={shouldDisplayAlreadyUsedChargeAlert}
                    removeChargeWarningDialogRef={removeChargeWarningDialogRef}
                    premiumWarningDialogRef={premiumWarningDialogRef}
                    isUsedInSubscription={!isNew && !canBeEdited}
                    currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
                    index={i}
                    disabled={isEdition && !canBeEdited && !isNew}
                    formikProps={formikProps}
                  />
                )
              })}
            </Charges>
          )}
          {!!showAddRecurringCharge && (
            <AddChargeInlineWrapper>
              <ComboBox
                className={SEARCH_RECURRING_CHARGE_INPUT_CLASSNAME}
                data={recurringBillableMetrics}
                searchQuery={getRecurringBillableMetrics}
                loading={recurringBillableMetricsLoading}
                placeholder={translate('text_6435888d7cc86500646d8981')}
                emptyText={translate('text_6246b6bc6b25f500b779aa7a')}
                onChange={(newCharge) => {
                  const previousCharges = [...formikProps.values.charges]
                  const newId = getNewChargeId(newCharge, previousCharges.length)
                  const localBillableMetrics =
                    recurringBillableMetricsData?.billableMetrics?.collection.find(
                      (bm) => bm.id === newCharge
                    )

                  formikProps.setFieldValue('charges', [
                    ...previousCharges,
                    {
                      payInAdvance: false,
                      invoiceable: true,
                      billableMetric: localBillableMetrics,
                      properties: getPropertyShape({}),
                      groupProperties: localBillableMetrics?.flatGroups?.length
                        ? localBillableMetrics?.flatGroups.map((group) => {
                            return {
                              groupId: group.id,
                              values: getPropertyShape({}),
                            }
                          })
                        : undefined,
                      chargeModel: ChargeModelEnum.Standard,
                      amountCents: undefined,
                    },
                  ])
                  setShowAddRecurringCharge(false)
                  setNewChargeId(newId)
                }}
              />
              <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    setShowAddRecurringCharge(false)
                  }}
                />
              </Tooltip>
            </AddChargeInlineWrapper>
          )}

          {hasAnyCharge && (
            <InlineButtons>
              {!showAddMeteredCharge && !hasAnyMeteredCharge && (
                <Button
                  startIcon="plus"
                  variant="quaternary"
                  data-test="add-metered-charge"
                  onClick={() => {
                    setShowAddMeteredCharge(true)
                    setTimeout(() => {
                      ;(
                        document.querySelector(
                          `.${SEARCH_METERED_CHARGE_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`
                        ) as HTMLElement
                      )?.click()
                    }, 0)
                  }}
                >
                  {translate('text_64d270faa1b07d0097fa287e')}
                </Button>
              )}
              {!showAddRecurringCharge && !!hasAnyRecurringCharge && (
                <Button
                  startIcon="plus"
                  variant="quaternary"
                  data-test="add-recurring-charge"
                  onClick={() => {
                    setShowAddRecurringCharge(true)
                    setTimeout(() => {
                      ;(
                        document.querySelector(
                          `.${SEARCH_RECURRING_CHARGE_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`
                        ) as HTMLElement
                      )?.click()
                    }, 0)
                  }}
                >
                  {translate('text_64d27120a3d1e300b35d0fcc')}
                </Button>
              )}
            </InlineButtons>
          )}
        </Card>

        <RemoveChargeWarningDialog ref={removeChargeWarningDialogRef} formikProps={formikProps} />
        <PremiumWarningDialog ref={premiumWarningDialogRef} />
      </>
    )
  }
)

ChargesSection.displayName = 'ChargesSection'

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Card = styled.div`
  padding: ${theme.spacing(8)};
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  box-sizing: border-box;

  > *:not(:first-child) {
    margin-top: ${theme.spacing(6)};
  }
`
const AddChargeInlineWrapper = styled.div`
  > :first-child {
    flex: 1;
    margin-right: ${theme.spacing(3)};
  }

  display: flex;
  align-items: center;
`
const Charges = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const InlineButtons = styled.div`
  display: flex;
`

const RecurringSectionTitleWrapper = styled.div<{ $hasAnyAboveSection: boolean }>`
  margin-top: ${({ $hasAnyAboveSection }) =>
    $hasAnyAboveSection ? `${theme.spacing(12)} !important` : 'initial'};
`
