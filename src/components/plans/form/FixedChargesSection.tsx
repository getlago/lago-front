import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Selector, SelectorActions } from '~/components/designSystem/Selector'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { SwitchField } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  FixedChargeDrawer,
  FixedChargeDrawerRef,
} from '~/components/plans/drawers/FixedChargeDrawer'
import {
  RemoveChargeWarningDialog,
  RemoveChargeWarningDialogRef,
} from '~/components/plans/RemoveChargeWarningDialog'
import { LocalFixedChargeInput, PlanFormInput } from '~/components/plans/types'
import { mapChargeIntervalCopy } from '~/components/plans/utils'
import { useDuplicatePlanVar } from '~/core/apolloClient/reactiveVars/duplicatePlanVar'
import {
  GraduatedChargeFragmentDoc,
  PlanInterval,
  TaxForPlanAndChargesInPlanFormFragmentDoc,
  VolumeRangesFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment FixedChargesOnPlanForm on Plan {
    id
    billFixedChargesMonthly
    fixedCharges {
      id
      prorated
      units
      chargeModel
      invoiceDisplayName
      payInAdvance
      addOn {
        ...AddOnForFixedChargesSection
      }
      properties {
        amount
        graduatedRanges {
          ...GraduatedCharge
        }
        volumeRanges {
          ...VolumeRanges
        }
      }
      taxes {
        ...TaxForPlanAndChargesInPlanForm
      }
    }
  }

  ${TaxForPlanAndChargesInPlanFormFragmentDoc}
  ${GraduatedChargeFragmentDoc}
  ${VolumeRangesFragmentDoc}
`

interface FixedChargesSectionProps {
  alreadyExistingFixedChargesIds: string[]
  canBeEdited?: boolean
  isInSubscriptionForm?: boolean
  formikProps: FormikProps<PlanFormInput>
  isEdition?: boolean
}

export const FixedChargesSection = memo(
  ({
    alreadyExistingFixedChargesIds,
    canBeEdited,
    isInSubscriptionForm,
    formikProps,
    isEdition = false,
  }: FixedChargesSectionProps) => {
    const { translate } = useInternationalization()
    const { type: actionType } = useDuplicatePlanVar()
    const hasAnyFixedCharge = !!formikProps.values.fixedCharges.length
    const removeChargeWarningDialogRef = useRef<RemoveChargeWarningDialogRef>(null)
    const fixedChargeDrawerRef = useRef<FixedChargeDrawerRef>(null)
    const [alreadyUsedAddOnIds, setAlreadyUsedAddOnIds] = useState<Map<string, number>>(new Map())
    const formFixedCharges = formikProps.values.fixedCharges

    const handleDrawerSave = useCallback(
      (charge: LocalFixedChargeInput, index: number | null) => {
        const newCharges = [...formikProps.values.fixedCharges]

        if (index === null) {
          newCharges.push(charge)
        } else {
          newCharges[index] = charge
        }
        formikProps.setFieldValue('fixedCharges', newCharges)
      },
      [formikProps],
    )

    const handleChargeDelete = useCallback(
      (index: number) => {
        const newCharges = [...formikProps.values.fixedCharges]

        newCharges.splice(index, 1)
        formikProps.setFieldValue('fixedCharges', newCharges)
      },
      [formikProps],
    )

    useEffect(() => {
      setAlreadyUsedAddOnIds(
        formFixedCharges?.reduce((prev, curr) => {
          const id = curr.addOn.id

          return prev.set(id, (prev.get(id) || 0) + 1)
        }, new Map()),
      )
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formFixedCharges?.length])

    const isAnnual = [PlanInterval.Semiannual, PlanInterval.Yearly].includes(
      formikProps.values.interval,
    )

    const intervalBadgeCopy = useMemo(() => {
      return translate(
        mapChargeIntervalCopy(
          formikProps.values.interval,
          (isAnnual && !!formikProps.values.billFixedChargesMonthly) || false,
        ),
      )
    }, [
      translate,
      formikProps.values.interval,
      formikProps.values.billFixedChargesMonthly,
      isAnnual,
    ])

    if (!hasAnyFixedCharge && isInSubscriptionForm) {
      return null
    }

    const canApplyChargesMonthly = isAnnual

    return (
      <>
        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle
            title={translate('text_176072970726728iw4tc8ucl')}
            description={translate('text_1760729707268c05r06ip8vg')}
          />

          {!!hasAnyFixedCharge && canApplyChargesMonthly && (
            <SwitchField
              label={translate('text_1760729707268reew4lqsqof')}
              subLabel={translate('text_1760729707268ge00k7a7e84')}
              name="billFixedChargesMonthly"
              disabled={isInSubscriptionForm || (isEdition && !canBeEdited)}
              formikProps={formikProps}
            />
          )}

          {(!!formFixedCharges?.length || !isInSubscriptionForm) && (
            <div className="flex flex-col gap-6">
              {!!formFixedCharges?.length && (
                <div className="flex flex-col gap-4">
                  {formFixedCharges.map((fixedCharge: LocalFixedChargeInput, i) => {
                    const isNew = !alreadyExistingFixedChargesIds?.includes(fixedCharge?.id || '')
                    const alreadyUsedChargeAlertMessage =
                      (alreadyUsedAddOnIds.get(fixedCharge.addOn.id) || 0) > 1
                        ? translate('text_1760729707268h378x60alri')
                        : undefined
                    const isUsedInSubscription = !isNew && !canBeEdited

                    return (
                      <Selector
                        key={`fixed-charge-${fixedCharge.addOn.id}-${i}`}
                        icon="puzzle"
                        title={fixedCharge.invoiceDisplayName || fixedCharge.addOn.name}
                        subtitle={fixedCharge.addOn.code}
                        endContent={
                          <div className="flex items-center gap-3">
                            <Chip label={intervalBadgeCopy} />
                            <Tooltip
                              placement="top-end"
                              title={translate('text_17719630334671lxunwzo7ae')}
                            >
                              <Button
                                icon="chevron-right-filled"
                                variant="quaternary"
                                tabIndex={-1}
                              />
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
                                    const localChargesAfterDelete = [
                                      ...formikProps.values.fixedCharges,
                                    ]

                                    localChargesAfterDelete.splice(i, 1)
                                    formikProps.setFieldValue(
                                      'fixedCharges',
                                      localChargesAfterDelete,
                                    )
                                  }

                                  if (actionType !== 'duplicate' && isUsedInSubscription) {
                                    removeChargeWarningDialogRef?.current?.openDialog({
                                      callback: deleteCharge,
                                    })
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
                        data-test={`fixed-charge-selector-${i}`}
                        onClick={() => {
                          fixedChargeDrawerRef.current?.openDrawer(fixedCharge, i, {
                            alreadyUsedChargeAlertMessage,
                            isUsedInSubscription,
                          })
                        }}
                      />
                    )
                  })}
                </div>
              )}
              {!isInSubscriptionForm && (
                <Button
                  fitContent
                  startIcon="plus"
                  variant="inline"
                  data-test="add-fixed-charge"
                  onClick={() => {
                    fixedChargeDrawerRef.current?.openDrawer()
                  }}
                >
                  {translate('text_176072970726882uau5y69f1')}
                </Button>
              )}
            </div>
          )}
        </CenteredPage.PageSection>

        <FixedChargeDrawer
          ref={fixedChargeDrawerRef}
          disabled={isEdition && !canBeEdited}
          isEdition={isEdition}
          isInSubscriptionForm={isInSubscriptionForm}
          onSave={handleDrawerSave}
          onDelete={handleChargeDelete}
          removeChargeWarningDialogRef={removeChargeWarningDialogRef}
        />

        <RemoveChargeWarningDialog ref={removeChargeWarningDialogRef} />
      </>
    )
  },
  (oldProps, newProps) => {
    return (
      oldProps.alreadyExistingFixedChargesIds === newProps.alreadyExistingFixedChargesIds &&
      oldProps.canBeEdited === newProps.canBeEdited &&
      oldProps.isInSubscriptionForm === newProps.isInSubscriptionForm &&
      oldProps.isEdition === newProps.isEdition &&
      oldProps.formikProps.values === newProps.formikProps.values &&
      oldProps.formikProps.errors === newProps.formikProps.errors &&
      oldProps.formikProps.initialValues === newProps.formikProps.initialValues
    )
  },
)

FixedChargesSection.displayName = 'FixedChargesSection'
