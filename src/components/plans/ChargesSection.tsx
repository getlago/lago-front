import { useEffect, memo, useState, useMemo, useRef } from 'react'
import { FormikProps } from 'formik'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { ComboBox, SwitchField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Button, Tooltip, Typography } from '~/components/designSystem'
import { theme } from '~/styles'
import {
  ChargeModelEnum,
  CurrencyEnum,
  PlanInterval,
  useGetBillableMetricsLazyQuery,
} from '~/generated/graphql'
import { Item } from '~/components/form/ComboBox/ComboBoxItem'
import { MUI_INPUT_BASE_ROOT_CLASSNAME, SEARCH_CHARGE_INPUT_NAME } from '~/core/constants/form'

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
`

interface ChargesSectionProps {
  canBeEdited: boolean
  isEdition: boolean
  getPropertyShape: Function
  formikProps: FormikProps<PlanFormInput>
  alreadyExistingCharges?: PlanFormInput['charges'] | null
}

const getNewChargeId = (id: string, index: number) => `plan-charge-${id}-${index}`

export const ChargesSection = memo(
  ({
    canBeEdited,
    isEdition,
    getPropertyShape,
    formikProps,
    alreadyExistingCharges,
  }: ChargesSectionProps) => {
    const { translate } = useInternationalization()
    // const { isPremium } = useCurrentUser()
    const hasAnyCharge = !!formikProps.values.charges.length
    const [showAddCharge, setShowAddCharge] = useState(false)
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
              {name} <Typography color="textPrimary">({code})</Typography>
            </Item>
          ),
          value: id,
        }
      })
    }, [billableMetricsData])

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
            <Button
              variant="secondary"
              data-test="add-charge"
              onClick={async () => {
                if (!showAddCharge) setShowAddCharge(true)

                setTimeout(() => {
                  const element = document.querySelector(
                    `.${SEARCH_CHARGE_INPUT_NAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`
                  ) as HTMLElement

                  if (!element) return

                  element.scrollIntoView({ behavior: 'smooth' })
                  element.click()
                }, 0)
              }}
            >
              {translate('text_6435888d7cc86500646d8974')}
            </Button>
          </SectionTitle>

          {!!hasAnyCharge && formikProps.values.interval === PlanInterval.Yearly && (
            <SwitchField
              label={translate('text_62a30bc79dae432fb055330b')}
              subLabel={translate('text_64358e074a3b7500714f256c')}
              name="billChargesMonthly"
              disabled={isEdition && !canBeEdited}
              formikProps={formikProps}
            />
          )}

          {!!hasAnyCharge && (
            <Charges>
              {formikProps.values.charges.map((charge, i) => {
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
          {!!showAddCharge && (
            <AddChargeInlineWrapper>
              <ComboBox
                className={SEARCH_CHARGE_INPUT_NAME}
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
                      payInAdvance: false,
                      invoiceable: true,
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
                  setShowAddCharge(false)
                  setNewChargeId(newId)
                }}
              />
              <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    setShowAddCharge(false)
                  }}
                />
              </Tooltip>
            </AddChargeInlineWrapper>
          )}
          {!!hasAnyCharge && !showAddCharge && (
            <Button
              startIcon="plus"
              variant="quaternary"
              data-test="add-charge"
              onClick={() => {
                setShowAddCharge(true)
                setTimeout(() => {
                  ;(
                    document.querySelector(
                      `.${SEARCH_CHARGE_INPUT_NAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`
                    ) as HTMLElement
                  ).click()
                }, 0)
              }}
            >
              {translate('text_6435888d7cc86500646d897a')}
            </Button>
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
