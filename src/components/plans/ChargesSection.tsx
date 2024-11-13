import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { FormikProps } from 'formik'
import { memo, RefObject, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

import { Button, Popper, Tooltip, Typography } from '~/components/designSystem'
import { ComboBox, SwitchField } from '~/components/form'
import { Item } from '~/components/form/ComboBox/ComboBoxItem'
import {
  FORM_TYPE_ENUM,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_METERED_CHARGE_INPUT_CLASSNAME,
  SEARCH_RECURRING_CHARGE_INPUT_CLASSNAME,
} from '~/core/constants/form'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import {
  ChargeModelEnum,
  CurrencyEnum,
  PlanInterval,
  useGetMeteredBillableMetricsLazyQuery,
  useGetRecurringBillableMetricsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Card, MenuPopper, theme } from '~/styles'

import { ChargeAccordion } from './ChargeAccordion'
import {
  RemoveChargeWarningDialog,
  RemoveChargeWarningDialogRef,
} from './RemoveChargeWarningDialog'
import { LocalChargeInput, PlanFormInput } from './types'

import { EditInvoiceDisplayNameRef } from '../invoices/EditInvoiceDisplayName'
import { PremiumWarningDialogRef } from '../PremiumWarningDialog'

const RESULT_LIMIT = 50

gql`
  fragment PlanForChargeAccordion on Plan {
    billChargesMonthly
  }

  fragment BillableMetricForChargeSection on BillableMetric {
    id
    name
    code
    aggregationType
    recurring
    filters {
      id
      key
      values
    }
  }

  query getMeteredBillableMetrics($page: Int, $limit: Int, $searchTerm: String) {
    billableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm, recurring: false) {
      collection {
        id
        ...BillableMetricForChargeSection
      }
    }
  }

  query getRecurringBillableMetrics($page: Int, $limit: Int, $searchTerm: String) {
    billableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm, recurring: true) {
      collection {
        id
        ...BillableMetricForChargeSection
      }
    }
  }
`

interface ChargesSectionProps {
  alreadyExistingCharges?: LocalChargeInput[] | null
  editInvoiceDisplayNameRef: RefObject<EditInvoiceDisplayNameRef>
  premiumWarningDialogRef: RefObject<PremiumWarningDialogRef>
  canBeEdited?: boolean
  isInitiallyOpen?: boolean
  isInSubscriptionForm?: boolean
  formikProps: FormikProps<PlanFormInput>
  isEdition?: boolean
  subscriptionFormType?: keyof typeof FORM_TYPE_ENUM
}

const getNewChargeId = (id: string, index: number) => `plan-charge-${id}-${index}`

export const ChargesSection = memo(
  ({
    alreadyExistingCharges,
    editInvoiceDisplayNameRef,
    canBeEdited,
    isInitiallyOpen,
    isInSubscriptionForm,
    formikProps,
    isEdition,
    premiumWarningDialogRef,
    subscriptionFormType,
  }: ChargesSectionProps) => {
    const { translate } = useInternationalization()
    const hasAnyCharge = !!formikProps.values.charges.length
    const [showAddMeteredCharge, setShowAddMeteredCharge] = useState(false)
    const [showAddRecurringCharge, setShowAddRecurringCharge] = useState(false)
    const newChargeId = useRef<string | null>(null)
    const removeChargeWarningDialogRef = useRef<RemoveChargeWarningDialogRef>(null)
    const [alreadyUsedBmsIds, setAlreadyUsedBmsIds] = useState<Map<string, number>>(new Map())
    const hasAnyMeteredCharge = useMemo(
      () => formikProps.values.charges.some((c) => !c.billableMetric.recurring),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [formikProps.values.charges.length],
    )
    const hasAnyRecurringCharge = useMemo(
      () => formikProps.values.charges.some((c) => !!c.billableMetric.recurring),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [formikProps.values.charges.length],
    )
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
              <Typography color="grey700" noWrap>
                {name}
              </Typography>
              &nbsp;
              <Typography color="textPrimary" noWrap>
                ({code})
              </Typography>
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
              <Typography color="grey700" noWrap>
                {name}
              </Typography>
              &nbsp;
              <Typography color="textPrimary">({code})</Typography>
            </Item>
          ),
          value: id,
        }
      })
    }, [recurringBillableMetricsData])

    useEffect(() => {
      // When adding a new charge, scroll to the new charge element
      if (!!newChargeId.current) {
        const element = document.getElementById(newChargeId.current)
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

      setAlreadyUsedBmsIds(BmIdsMap)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formikProps.values.charges.length])

    if (!hasAnyCharge && isInSubscriptionForm) {
      return null
    }

    return (
      <>
        <Card $childSpacing={8}>
          <SectionTitle>
            <Stack gap={2}>
              <Typography variant="subhead">
                {translate('text_6435888d7cc86500646d8977')}
              </Typography>
              <Typography variant="caption">
                {translate('text_6661ffe746c680007e2df0d6')}
              </Typography>
            </Stack>

            {!isInSubscriptionForm && (
              <Popper
                PopperProps={{ placement: 'bottom-end' }}
                opener={
                  <Button
                    variant="secondary"
                    startIcon="plus"
                    endIcon="chevron-down"
                    data-test="add-charge"
                  >
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
                            `.${SEARCH_METERED_CHARGE_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
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
                            `.${SEARCH_RECURRING_CHARGE_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
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
            )}
          </SectionTitle>

          {/* METERED */}
          {!!hasAnyCharge && formikProps.values.interval === PlanInterval.Yearly && (
            <SwitchField
              label={translate('text_62a30bc79dae432fb055330b')}
              subLabel={translate('text_64358e074a3b7500714f256c')}
              name="billChargesMonthly"
              disabled={isInSubscriptionForm || (isEdition && !canBeEdited)}
              formikProps={formikProps}
            />
          )}

          {(hasAnyMeteredCharge || !isInSubscriptionForm) && (
            <Group>
              <GroupTitle>
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_6661fc17337de3591e29e40f')}
                </Typography>
                <Typography variant="caption" color="grey600">
                  {translate('text_6661fc17337de3591e29e411')}
                </Typography>
              </GroupTitle>

              {hasAnyMeteredCharge && (
                <Charges>
                  {formikProps.values.charges.map((charge, i) => {
                    // Prevent displaying recurring charges
                    if (charge.billableMetric.recurring) return

                    const id = getNewChargeId(charge.billableMetric.id, i)
                    const isNew = !alreadyExistingCharges?.find(
                      (chargeFetched) => chargeFetched?.id === charge.id,
                    )
                    const shouldDisplayAlreadyUsedChargeAlert =
                      (alreadyUsedBmsIds.get(charge.billableMetric.id) || 0) > 1

                    return (
                      <ChargeAccordion
                        id={id}
                        key={id}
                        isInitiallyOpen={isInitiallyOpen}
                        isInSubscriptionForm={isInSubscriptionForm}
                        subscriptionFormType={subscriptionFormType}
                        shouldDisplayAlreadyUsedChargeAlert={shouldDisplayAlreadyUsedChargeAlert}
                        removeChargeWarningDialogRef={removeChargeWarningDialogRef}
                        premiumWarningDialogRef={premiumWarningDialogRef}
                        editInvoiceDisplayNameRef={editInvoiceDisplayNameRef}
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
              {showAddMeteredCharge ? (
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
                          (bm) => bm.id === newCharge,
                        )
                      const lastMeteredIndex = previousCharges.findLastIndex(
                        (c) => c.billableMetric.recurring === false,
                      )
                      const newChargeIndex = lastMeteredIndex < 0 ? 0 : lastMeteredIndex + 1

                      previousCharges.splice(newChargeIndex, 0, {
                        payInAdvance: false,
                        invoiceable: true,
                        billableMetric: localBillableMetrics,
                        properties: getPropertyShape({}),
                        filters: !!localBillableMetrics?.filters?.length ? [] : undefined,
                        chargeModel: ChargeModelEnum.Standard,
                        amountCents: undefined,
                      } as LocalChargeInput)

                      formikProps.setFieldValue('charges', previousCharges)
                      setShowAddMeteredCharge(false)
                      newChargeId.current = newId
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
              ) : (
                !isInSubscriptionForm && (
                  <Button
                    startIcon="plus"
                    variant="quaternary"
                    data-test="add-metered-charge"
                    onClick={() => {
                      setShowAddMeteredCharge(true)
                      setTimeout(() => {
                        ;(
                          document.querySelector(
                            `.${SEARCH_METERED_CHARGE_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                          ) as HTMLElement
                        )?.click()
                      }, 0)
                    }}
                  >
                    {translate('text_64d270faa1b07d0097fa287e')}
                  </Button>
                )
              )}
            </Group>
          )}

          {/* RECURRING */}
          {(hasAnyRecurringCharge || !isInSubscriptionForm) && (
            <Group>
              <GroupTitle>
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_64d271e20a9c11005bd6688a')}
                </Typography>
                <Typography variant="caption" color="grey600">
                  {translate('text_6661fc17337de3591e29e449')}
                </Typography>
              </GroupTitle>

              {hasAnyRecurringCharge && (
                <Charges>
                  {formikProps.values.charges.map((charge, i) => {
                    // Prevent displaying metered charges
                    if (!charge.billableMetric.recurring) return

                    const id = getNewChargeId(charge.billableMetric.id, i)
                    const isNew = !alreadyExistingCharges?.find(
                      (chargeFetched) => chargeFetched?.id === charge.id,
                    )
                    const shouldDisplayAlreadyUsedChargeAlert =
                      (alreadyUsedBmsIds.get(charge.billableMetric.id) || 0) > 1

                    return (
                      <ChargeAccordion
                        id={id}
                        key={id}
                        isInitiallyOpen={isInitiallyOpen}
                        isInSubscriptionForm={isInSubscriptionForm}
                        subscriptionFormType={subscriptionFormType}
                        shouldDisplayAlreadyUsedChargeAlert={shouldDisplayAlreadyUsedChargeAlert}
                        removeChargeWarningDialogRef={removeChargeWarningDialogRef}
                        premiumWarningDialogRef={premiumWarningDialogRef}
                        editInvoiceDisplayNameRef={editInvoiceDisplayNameRef}
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
              {showAddRecurringCharge ? (
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
                          (bm) => bm.id === newCharge,
                        )

                      formikProps.setFieldValue('charges', [
                        ...previousCharges,
                        {
                          payInAdvance: false,
                          invoiceable: true,
                          billableMetric: localBillableMetrics,
                          properties: getPropertyShape({}),
                          filters: !!localBillableMetrics?.filters?.length ? [] : undefined,
                          chargeModel: ChargeModelEnum.Standard,
                          amountCents: undefined,
                        },
                      ])
                      setShowAddRecurringCharge(false)
                      newChargeId.current = newId
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
              ) : (
                !isInSubscriptionForm && (
                  <Button
                    startIcon="plus"
                    variant="quaternary"
                    data-test="add-recurring-charge"
                    onClick={() => {
                      setShowAddRecurringCharge(true)
                      setTimeout(() => {
                        ;(
                          document.querySelector(
                            `.${SEARCH_RECURRING_CHARGE_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                          ) as HTMLElement
                        )?.click()
                      }, 0)
                    }}
                  >
                    {translate('text_64d27120a3d1e300b35d0fcc')}
                  </Button>
                )
              )}
            </Group>
          )}
        </Card>

        <RemoveChargeWarningDialog ref={removeChargeWarningDialogRef} formikProps={formikProps} />
      </>
    )
  },
  (oldProps, newProps) => {
    return (
      oldProps.alreadyExistingCharges === newProps.alreadyExistingCharges &&
      oldProps.canBeEdited === newProps.canBeEdited &&
      oldProps.isInitiallyOpen === newProps.isInitiallyOpen &&
      oldProps.isInSubscriptionForm === newProps.isInSubscriptionForm &&
      oldProps.isEdition === newProps.isEdition &&
      oldProps.subscriptionFormType === newProps.subscriptionFormType &&
      oldProps.formikProps.values === newProps.formikProps.values &&
      // Used in sub components
      oldProps.formikProps.errors === newProps.formikProps.errors &&
      oldProps.formikProps.initialValues === newProps.formikProps.initialValues
    )
  },
)

ChargesSection.displayName = 'ChargesSection'

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing(8)};
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

const Group = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(4)};
  }
`

const GroupTitle = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`
