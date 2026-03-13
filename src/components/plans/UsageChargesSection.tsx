import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { memo, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Selector, SelectorActions } from '~/components/designSystem/Selector'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { SwitchField } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  UsageChargeDrawer,
  UsageChargeDrawerRef,
} from '~/components/plans/drawers/UsageChargeDrawer'
import { mapChargeIntervalCopy } from '~/components/plans/utils'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useDuplicatePlanVar } from '~/core/apolloClient/reactiveVars/duplicatePlanVar'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { PlanInterval } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import {
  RemoveChargeWarningDialog,
  RemoveChargeWarningDialogRef,
} from './RemoveChargeWarningDialog'
import { LocalUsageChargeInput, PlanFormInput } from './types'

gql`
  fragment PlanForUsageChargeAccordion on Plan {
    billChargesMonthly
  }
`

interface UsageChargesSectionProps {
  alreadyExistingCharges?: LocalUsageChargeInput[] | null
  premiumWarningDialogRef: RefObject<PremiumWarningDialogRef>
  canBeEdited?: boolean
  isInSubscriptionForm?: boolean
  formikProps: FormikProps<PlanFormInput>
  isEdition: boolean
  subscriptionFormType?: keyof typeof FORM_TYPE_ENUM
}

export const UsageChargesSection = memo(
  ({
    alreadyExistingCharges,
    canBeEdited,
    isInSubscriptionForm,
    formikProps,
    isEdition,
    premiumWarningDialogRef,
    subscriptionFormType,
  }: UsageChargesSectionProps) => {
    const { translate } = useInternationalization()
    const { type: actionType } = useDuplicatePlanVar()
    const hasAnyCharge = !!formikProps.values.charges.length
    const removeChargeWarningDialogRef = useRef<RemoveChargeWarningDialogRef>(null)
    const usageChargeDrawerRef = useRef<UsageChargeDrawerRef>(null)
    const [alreadyUsedBmsIds, setAlreadyUsedBmsIds] = useState<Map<string, number>>(new Map())

    const handleDrawerSave = useCallback(
      (charge: LocalUsageChargeInput, index: number | null) => {
        const newCharges = [...formikProps.values.charges]

        if (index === null) {
          if (!charge.billableMetric.recurring) {
            // Insert after last metered charge
            const lastMeteredIndex = newCharges.findLastIndex((c) => !c.billableMetric.recurring)

            newCharges.splice(lastMeteredIndex < 0 ? 0 : lastMeteredIndex + 1, 0, charge)
          } else {
            newCharges.push(charge) // recurring at end
          }
        } else {
          newCharges[index] = charge
        }
        formikProps.setFieldValue('charges', newCharges)
      },
      [formikProps],
    )

    const handleChargeDelete = useCallback(
      (index: number) => {
        const newCharges = [...formikProps.values.charges]

        newCharges.splice(index, 1)
        formikProps.setFieldValue('charges', newCharges)
      },
      [formikProps],
    )

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

    const isAnnual = [PlanInterval.Semiannual, PlanInterval.Yearly].includes(
      formikProps.values.interval,
    )

    const intervalBadgeCopy = useMemo(() => {
      return translate(
        mapChargeIntervalCopy(
          formikProps.values.interval,
          (isAnnual && !!formikProps.values.billChargesMonthly) || false,
        ),
      )
    }, [translate, formikProps.values.interval, formikProps.values.billChargesMonthly, isAnnual])

    if (!hasAnyCharge && isInSubscriptionForm) {
      return null
    }

    const canApplyChargesMonthly = isAnnual

    const renderChargeSelector = (charge: LocalUsageChargeInput, i: number) => {
      const isNew = !alreadyExistingCharges?.find(
        (chargeFetched) => chargeFetched?.id === charge.id,
      )
      const alreadyUsedChargeAlertMessage =
        (alreadyUsedBmsIds.get(charge.billableMetric.id) || 0) > 1
          ? translate('text_6435895831d323008a47911f')
          : undefined
      const isUsedInSubscription = !isNew && !canBeEdited

      return (
        <Selector
          data-test={`usage-charge-selector-${i}`}
          icon="pulse"
          key={`usage-charge-${charge.billableMetric.id}-${i}`}
          subtitle={charge.billableMetric.code}
          title={charge.invoiceDisplayName || charge.billableMetric.name}
          endContent={
            <div className="flex items-center gap-3">
              <Chip label={intervalBadgeCopy} />
              <Tooltip placement="top-end" title={translate('text_17719630334671lxunwzo7ae')}>
                <Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />
              </Tooltip>
            </div>
          }
          hoverActions={
            <SelectorActions
              actions={[
                {
                  icon: 'trash',
                  tooltipCopy: 'Delete',
                  onClick: (e) => {
                    e.stopPropagation()
                    e.preventDefault()

                    const deleteCharge = () => {
                      const localChargesAfterDelete = [...formikProps.values.charges]

                      localChargesAfterDelete.splice(i, 1)
                      formikProps.setFieldValue('charges', localChargesAfterDelete)
                    }

                    if (actionType !== 'duplicate' && isUsedInSubscription) {
                      removeChargeWarningDialogRef?.current?.openDialog({ callback: deleteCharge })
                    } else {
                      deleteCharge()
                    }
                  },
                },
                {
                  icon: 'pen',
                  tooltipCopy: 'Edit',
                  onClick: () => {
                    // Fallback to the selector click action
                  },
                },
              ]}
            />
          }
          onClick={() => {
            const initialCharge = alreadyExistingCharges?.find(
              (chargeFetched) => chargeFetched?.id === charge.id,
            )

            usageChargeDrawerRef.current?.openDrawer(charge, i, {
              alreadyUsedChargeAlertMessage,
              initialCharge: initialCharge || undefined,
              isUsedInSubscription,
            })
          }}
        />
      )
    }

    return (
      <>
        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle
            title={translate('text_6435888d7cc86500646d8977')}
            description={translate('text_6661ffe746c680007e2df0d6')}
          />

          {/* METERED */}
          {!!hasAnyCharge && (
            <>
              {canApplyChargesMonthly && (
                <SwitchField
                  label={translate('text_62a30bc79dae432fb055330b')}
                  subLabel={translate('text_64358e074a3b7500714f256c')}
                  name="billChargesMonthly"
                  disabled={isInSubscriptionForm || (isEdition && !canBeEdited)}
                  formikProps={formikProps}
                />
              )}

              <div className="flex flex-col gap-4">
                {formikProps.values.charges.map((charge, i) => {
                  // Prevent displaying recurring charges
                  if (charge.billableMetric.recurring) return null

                  return renderChargeSelector(charge, i)
                })}
              </div>
            </>
          )}

          {/* Single add button at the bottom */}
          {!isInSubscriptionForm && (
            <Button
              fitContent
              startIcon="plus"
              variant="inline"
              data-test="add-usage-charge"
              onClick={() => {
                usageChargeDrawerRef.current?.openDrawer()
              }}
            >
              {translate('text_1772133285142oouequiz2t2')}
            </Button>
          )}
        </CenteredPage.PageSection>

        <UsageChargeDrawer
          ref={usageChargeDrawerRef}
          disabled={isEdition && !canBeEdited}
          isEdition={isEdition}
          isInSubscriptionForm={isInSubscriptionForm}
          premiumWarningDialogRef={premiumWarningDialogRef}
          subscriptionFormType={subscriptionFormType}
          onSave={handleDrawerSave}
          onDelete={handleChargeDelete}
          removeChargeWarningDialogRef={removeChargeWarningDialogRef}
          amountCurrency={formikProps.values.amountCurrency}
        />

        <RemoveChargeWarningDialog ref={removeChargeWarningDialogRef} />
      </>
    )
  },
  (oldProps, newProps) => {
    return (
      oldProps.alreadyExistingCharges === newProps.alreadyExistingCharges &&
      oldProps.canBeEdited === newProps.canBeEdited &&
      oldProps.isInSubscriptionForm === newProps.isInSubscriptionForm &&
      oldProps.isEdition === newProps.isEdition &&
      oldProps.subscriptionFormType === newProps.subscriptionFormType &&
      oldProps.formikProps.values === newProps.formikProps.values &&
      oldProps.formikProps.errors === newProps.formikProps.errors &&
      oldProps.formikProps.initialValues === newProps.formikProps.initialValues
    )
  },
)

UsageChargesSection.displayName = 'UsageChargesSection'
