import { useEffect, memo, useState, useMemo, useRef } from 'react'
import { FormikProps } from 'formik'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { ComboBox, SwitchField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Button, Icon, Popper, Tooltip, Typography } from '~/components/designSystem'
import { theme, MenuPopper } from '~/styles'
import {
  AggregationTypeEnum,
  ChargeModelEnum,
  CurrencyEnum,
  PlanInterval,
  useGetBillableMetricsLazyQuery,
  useGetFilteredBillableMetricsLazyQuery,
} from '~/generated/graphql'
import { Item } from '~/components/form/ComboBox/ComboBoxItem'
import { useCurrentUser } from '~/hooks/useCurrentUser'

import { PlanFormInput } from './types'
import { ChargeAccordion } from './ChargeAccordion'
import {
  RemoveChargeWarningDialog,
  RemoveChargeWarningDialogRef,
} from './RemoveChargeWarningDialog'

import { PremiumWarningDialog, PremiumWarningDialogRef } from '../PremiumWarningDialog'

gql`
  fragment PlanForChargeAccordion on Plan {
    billChargesMonthly
  }

  fragment billableMetricForChargeSection on BillableMetric {
    id
    name
    code
    aggregationType
    flatGroups {
      id
      key
      value
    }
  }

  query getBillableMetrics($page: Int, $limit: Int, $searchTerm: String) {
    billableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        ...billableMetricForChargeSection
      }
    }
  }

  query getFilteredBillableMetrics(
    $page: Int
    $limit: Int
    $searchTerm: String
    $aggregationTypes: [AggregationTypeEnum!]
  ) {
    billableMetrics(
      page: $page
      limit: $limit
      searchTerm: $searchTerm
      aggregationTypes: $aggregationTypes
    ) {
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
  hasAnyNormalCharge: boolean
  getPropertyShape: Function
  hasAnyInstantCharge: boolean
  formikProps: FormikProps<PlanFormInput>
  existingCharges?: PlanFormInput['charges'] | null
}

const getNewChargeId = (id: string, index: number) => `plan-charge-${id}-${index}`

const SEARCH_NORMAL_CHARGE_INPUT_NAME = 'searchNormalChargeInput'
const SEARCH_INSTANT_CHARGE_INPUT_NAME = 'searchInstantChargeInput'

export const ChargesSection = memo(
  ({
    canBeEdited,
    isEdition,
    hasAnyNormalCharge,
    hasAnyInstantCharge,
    getPropertyShape,
    formikProps,
    existingCharges,
  }: ChargesSectionProps) => {
    const { translate } = useInternationalization()
    const { isPremium } = useCurrentUser()
    const [showAddNormalCharge, setShowAddNormalCharge] = useState(false)
    const [showAddInstantCharge, setShowAddInstantCharge] = useState(false)
    const [newChargeId, setNewChargeId] = useState<string | null>(null)
    const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
    const removeChargeWarningDialogRef = useRef<RemoveChargeWarningDialogRef>(null)
    const alreadyUsedBmsIds = useRef<Map<String, number>>(new Map())
    const [getBillableMetrics, { loading: billableMetricsLoading, data: billableMetricsData }] =
      useGetBillableMetricsLazyQuery({
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
        variables: { limit: 50 },
      })

    const [
      getFilteredBillableMetrics,
      { loading: filteredBillableMetricsLoading, data: filteredBillableMetricsData },
    ] = useGetFilteredBillableMetricsLazyQuery({
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      variables: { limit: 50 },
    })

    const billableMetrics = useMemo(() => {
      if (
        !billableMetricsData ||
        !billableMetricsData?.billableMetrics ||
        !billableMetricsData?.billableMetrics?.collection
      )
        return []

      return billableMetricsData?.billableMetrics?.collection.map(({ id, name, code }) => {
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
    }, [billableMetricsData])

    const filteredBillableMetrics = useMemo(() => {
      if (
        !filteredBillableMetricsData ||
        !filteredBillableMetricsData?.billableMetrics ||
        !filteredBillableMetricsData?.billableMetrics?.collection
      )
        return []

      return filteredBillableMetricsData?.billableMetrics?.collection.map(({ id, name, code }) => {
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
    }, [filteredBillableMetricsData])

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
                    align="left"
                    onClick={async () => {
                      if (!showAddNormalCharge) setShowAddNormalCharge(true)

                      setTimeout(() => {
                        const element = document.getElementsByName(
                          SEARCH_NORMAL_CHARGE_INPUT_NAME
                        )[0]

                        if (!element) return

                        element.scrollIntoView({ behavior: 'smooth' })
                        element.focus()
                      }, 0)
                      closePopper()
                    }}
                    data-test="add-normal-charge"
                  >
                    {translate('text_6435888d7cc86500646d897a')}
                  </Button>
                  <Button
                    variant="quaternary"
                    align="left"
                    endIcon={isPremium ? undefined : 'sparkles'}
                    onClick={async () => {
                      if (isPremium) {
                        if (!showAddInstantCharge) setShowAddInstantCharge(true)

                        setTimeout(() => {
                          const element = document.getElementsByName(
                            SEARCH_INSTANT_CHARGE_INPUT_NAME
                          )[0]

                          if (!element) return

                          element.scrollIntoView({ behavior: 'smooth' })
                          element.focus()
                        }, 0)
                      } else {
                        premiumWarningDialogRef.current?.openDialog()
                      }
                      closePopper()
                    }}
                    data-test="add-instant-charge"
                  >
                    {translate('text_6435888d7cc86500646d897d')}
                  </Button>
                </MenuPopper>
              )}
            </Popper>
          </SectionTitle>

          {!!formikProps.values.charges.length &&
            formikProps.values.interval === PlanInterval.Yearly && (
              <SwitchField
                label={translate('text_62a30bc79dae432fb055330b')}
                subLabel={translate('text_64358e074a3b7500714f256c')}
                name="billChargesMonthly"
                disabled={isEdition && !canBeEdited}
                formikProps={formikProps}
              />
            )}

          {(hasAnyNormalCharge || showAddNormalCharge) && (
            <div>
              <Typography variant="bodyHl" color="grey700">
                {translate('text_6435888d7cc86500646d897b')}
              </Typography>
              <Typography variant="caption" color="grey600">
                {translate('text_6435888d7cc86500646d897e')}
              </Typography>
            </div>
          )}
          {!!hasAnyNormalCharge && (
            <Charges>
              {formikProps.values.charges.map((charge, i) => {
                if (charge.instant) return null

                const id = getNewChargeId(charge.billableMetric.id, i)
                const isNew = !existingCharges?.find(
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
          {!!showAddNormalCharge && (
            <AddChargeInlineWrapper>
              <ComboBox
                name={SEARCH_NORMAL_CHARGE_INPUT_NAME}
                data={billableMetrics}
                searchQuery={getBillableMetrics}
                loading={billableMetricsLoading}
                placeholder={translate('text_6435888d7cc86500646d8981')}
                emptyText={translate('text_6246b6bc6b25f500b779aa7a')}
                onChange={(newCharge) => {
                  const previousCharges = [...formikProps.values.charges]
                  const newId = getNewChargeId(newCharge, previousCharges.length)
                  const localBillableMetrics =
                    billableMetricsData?.billableMetrics?.collection.find(
                      (bm) => bm.id === newCharge
                    )

                  formikProps.setFieldValue('charges', [
                    ...previousCharges,
                    {
                      instant: false,
                      billableMetric: localBillableMetrics,
                      properties: !localBillableMetrics?.flatGroups?.length
                        ? getPropertyShape({})
                        : undefined,
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
                  setShowAddNormalCharge(false)
                  setNewChargeId(newId)
                }}
              />
              <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    setShowAddNormalCharge(false)
                  }}
                />
              </Tooltip>
            </AddChargeInlineWrapper>
          )}
          {!!formikProps.values.charges.length && (
            <InlineButtons>
              {!showAddNormalCharge && !!hasAnyNormalCharge && (
                <Button
                  startIcon="plus"
                  variant="quaternary"
                  data-test="add-normal-charge"
                  onClick={() => {
                    setShowAddNormalCharge(true)
                    setTimeout(() => {
                      document.getElementsByName(SEARCH_NORMAL_CHARGE_INPUT_NAME)[0].focus()
                    }, 0)
                  }}
                >
                  {translate('text_6435888d7cc86500646d897a')}
                </Button>
              )}
              {!showAddInstantCharge && !hasAnyInstantCharge && (
                <Button
                  startIcon="plus"
                  endIcon={isPremium ? undefined : 'sparkles'}
                  variant="quaternary"
                  data-test="add-instant-charge"
                  onClick={() => {
                    if (isPremium) {
                      setShowAddInstantCharge(true)
                      setTimeout(() => {
                        document.getElementsByName(SEARCH_INSTANT_CHARGE_INPUT_NAME)[0].focus()
                      }, 0)
                    } else {
                      premiumWarningDialogRef.current?.openDialog()
                    }
                  }}
                >
                  {translate('text_6435888d7cc86500646d897d')}
                </Button>
              )}
            </InlineButtons>
          )}

          {(hasAnyInstantCharge || showAddInstantCharge) && (
            <InstantChargeSectionTitleWrapper>
              <InlineSectionTitle>
                <Icon name="flash-filled" />
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_64358e074a3b7500714f2579')}
                </Typography>
              </InlineSectionTitle>
              <Typography variant="caption" color="grey600">
                {translate('text_64358e074a3b7500714f257a')}
              </Typography>
            </InstantChargeSectionTitleWrapper>
          )}

          {!!hasAnyInstantCharge && (
            <Charges>
              {formikProps.values.charges.map((charge, i) => {
                if (!charge.instant) return null

                const id = getNewChargeId(charge.billableMetric.id, i)
                const isNew = !existingCharges?.find(
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
          {!!showAddInstantCharge && (
            <AddChargeInlineWrapper>
              <ComboBox
                name={SEARCH_INSTANT_CHARGE_INPUT_NAME}
                data={filteredBillableMetrics}
                searchQuery={() =>
                  getFilteredBillableMetrics({
                    variables: {
                      aggregationTypes: [
                        AggregationTypeEnum.CountAgg,
                        AggregationTypeEnum.SumAgg,
                        AggregationTypeEnum.UniqueCountAgg,
                      ],
                    },
                  })
                }
                loading={filteredBillableMetricsLoading}
                placeholder={translate('text_6435888d7cc86500646d8981')}
                emptyText={translate('text_6246b6bc6b25f500b779aa7a')}
                onChange={(newCharge) => {
                  const previousCharges = [...formikProps.values.charges]
                  const newId = getNewChargeId(newCharge, previousCharges.length)
                  const localBillableMetrics =
                    filteredBillableMetricsData?.billableMetrics?.collection.find(
                      (bm) => bm.id === newCharge
                    )

                  formikProps.setFieldValue('charges', [
                    ...previousCharges,
                    {
                      instant: true,
                      billableMetric: localBillableMetrics,
                      properties: !localBillableMetrics?.flatGroups?.length
                        ? getPropertyShape({})
                        : undefined,
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
                  setShowAddInstantCharge(false)
                  setNewChargeId(newId)
                }}
              />
              <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    setShowAddInstantCharge(false)
                  }}
                />
              </Tooltip>
            </AddChargeInlineWrapper>
          )}

          {!!formikProps.values.charges.length && (
            <InlineButtons>
              {!showAddNormalCharge && !hasAnyNormalCharge && (
                <Button
                  startIcon="plus"
                  variant="quaternary"
                  data-test="add-normal-charge"
                  onClick={() => {
                    setShowAddNormalCharge(true)
                    setTimeout(() => {
                      document.getElementsByName(SEARCH_NORMAL_CHARGE_INPUT_NAME)[0].focus()
                    }, 0)
                  }}
                >
                  {translate('text_6435888d7cc86500646d897a')}
                </Button>
              )}
              {!showAddInstantCharge && !!hasAnyInstantCharge && (
                <Button
                  startIcon="plus"
                  endIcon={isPremium ? undefined : 'sparkles'}
                  variant="quaternary"
                  data-test="add-instant-charge"
                  onClick={() => {
                    if (isPremium) {
                      setShowAddInstantCharge(true)
                      setTimeout(() => {
                        document.getElementsByName(SEARCH_INSTANT_CHARGE_INPUT_NAME)[0].focus()
                      }, 0)
                    } else {
                      premiumWarningDialogRef.current?.openDialog()
                    }
                  }}
                >
                  {translate('text_6435888d7cc86500646d897d')}
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

const InlineSectionTitle = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    fill: ${theme.palette.secondary[500]};
    margin-right: ${theme.spacing(2)};
  }
`

const InstantChargeSectionTitleWrapper = styled.div`
  margin-top: ${theme.spacing(10)} !important;
`
