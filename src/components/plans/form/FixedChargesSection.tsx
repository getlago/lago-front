import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { memo, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button, Card, Tooltip, Typography } from '~/components/designSystem'
import { ComboBox, ComboboxItem, SwitchField } from '~/components/form'
import { EditInvoiceDisplayNameDialogRef } from '~/components/invoices/EditInvoiceDisplayNameDialog'
import { FixedChargeAccordion } from '~/components/plans/FixedChargeAccordion'
import {
  RemoveChargeWarningDialog,
  RemoveChargeWarningDialogRef,
} from '~/components/plans/RemoveChargeWarningDialog'
import { LocalFixedChargeInput, PlanFormInput } from '~/components/plans/types'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_ADD_ON_FOR_FIXED_CHARGES_SECTION_INPUT_CLASSNAME,
} from '~/core/constants/form'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import {
  CurrencyEnum,
  FixedChargeChargeModelEnum,
  GraduatedChargeFragmentDoc,
  PlanInterval,
  TaxForPlanAndChargesInPlanFormFragmentDoc,
  useGetAddOnsForFixedChargesSectionLazyQuery,
  VolumeRangesFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const ACCORDION_HEIGHT = 72 // px
const ACCORDION_PADDING = 16 // px

gql`
  fragment AddOnForFixedChargesSection on AddOn {
    id
    name
    code
  }

  fragment FixedChargesOnPlanForm on Plan {
    id
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

  query getAddOnsForFixedChargesSection($page: Int, $limit: Int, $searchTerm: String) {
    addOns(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...AddOnForFixedChargesSection
      }
    }
  }

  ${TaxForPlanAndChargesInPlanFormFragmentDoc}
  ${GraduatedChargeFragmentDoc}
  ${VolumeRangesFragmentDoc}
`

interface FixedChargesSectionProps {
  alreadyExistingFixedChargesIds: string[]
  editInvoiceDisplayNameDialogRef: RefObject<EditInvoiceDisplayNameDialogRef>
  premiumWarningDialogRef: RefObject<PremiumWarningDialogRef>
  canBeEdited?: boolean
  isInitiallyOpen?: boolean
  isInSubscriptionForm?: boolean
  formikProps: FormikProps<PlanFormInput>
  isEdition?: boolean
}

const getNewChargeId = (id: string, index: number) => `plan-fixed-charge-${id}-${index}`

export const FixedChargesSection = memo(
  ({
    alreadyExistingFixedChargesIds,
    editInvoiceDisplayNameDialogRef,
    canBeEdited,
    isInitiallyOpen,
    isInSubscriptionForm,
    formikProps,
    isEdition = false,
    premiumWarningDialogRef,
  }: FixedChargesSectionProps) => {
    const { translate } = useInternationalization()
    const hasAnyFixedCharge = !!formikProps.values.fixedCharges.length
    const [showAddFixedChargeCombobox, setShowAddFixedChargeCombobox] = useState(false)
    const newChargeId = useRef<string | null>(null)
    const removeChargeWarningDialogRef = useRef<RemoveChargeWarningDialogRef>(null)
    const [alreadyUsedAddOnIds, setAlreadyUsedAddOnIds] = useState<Map<string, number>>(new Map())
    const formFixedCharges = formikProps.values.fixedCharges
    const [
      getAddOnsForFixedChargesSection,
      { loading: addOnsForFixedChargesSectionLoading, data: addOnsForFixedChargesSectionData },
    ] = useGetAddOnsForFixedChargesSectionLazyQuery({
      variables: { limit: 20 },
    })

    const addOnsForFixedChargesSectionComboboxData = useMemo(() => {
      if (!addOnsForFixedChargesSectionData?.addOns?.collection?.length) return []

      return addOnsForFixedChargesSectionData?.addOns?.collection.map(({ id, name, code }) => {
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
        }
      })
    }, [addOnsForFixedChargesSectionData?.addOns?.collection])

    const onAddFixedCharge = useCallback(
      (newFixedChargeId: string): void => {
        const previousCharges = [...formFixedCharges]
        const newId = getNewChargeId(newFixedChargeId, previousCharges.length)
        const localAddOn = addOnsForFixedChargesSectionData?.addOns?.collection.find(
          (bm) => bm.id === newFixedChargeId,
        )
        const newChargeIndex = formFixedCharges.length

        previousCharges.splice(newChargeIndex, 0, {
          addOn: {
            id: localAddOn?.id || '',
            name: localAddOn?.name || '',
            code: localAddOn?.code || '',
          },
          applyUnitsImmediately: false,
          chargeModel: FixedChargeChargeModelEnum.Standard,
          invoiceDisplayName: undefined,
          payInAdvance: false,
          properties: getPropertyShape({}),
          prorated: false,
          units: undefined,
          taxes: [],
        } satisfies LocalFixedChargeInput)

        formikProps.setFieldValue('fixedCharges', previousCharges)
        setShowAddFixedChargeCombobox(false)
        newChargeId.current = newId
      },
      [addOnsForFixedChargesSectionData?.addOns?.collection, formFixedCharges, formikProps],
    )

    useEffect(() => {
      // When adding a new charge, scroll to the new charge element
      if (!!newChargeId.current) {
        const element = document.getElementById(newChargeId.current)
        const rootElement = document.getElementById('root')

        if (!element || !rootElement) return

        rootElement.scrollTo({ top: element.offsetTop - ACCORDION_HEIGHT - ACCORDION_PADDING })
      }
    }, [newChargeId])

    useEffect(() => {
      setAlreadyUsedAddOnIds(
        formFixedCharges?.reduce((prev, curr) => {
          const id = curr.addOn.id

          return prev.set(id, (prev.get(id) || 0) + 1)
        }, new Map()),
      )
    }, [formFixedCharges])

    if (!hasAnyFixedCharge && isInSubscriptionForm) {
      return null
    }

    const canApplyChargesMonthly = [PlanInterval.Semiannual, PlanInterval.Yearly].includes(
      formikProps.values.interval,
    )

    return (
      <>
        <Card>
          <div className="flex flex-col gap-2">
            <Typography variant="subhead1">{translate('text_176072970726728iw4tc8ucl')}</Typography>
            <Typography variant="caption">{translate('text_1760729707268c05r06ip8vg')}</Typography>
          </div>

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
            <div className="flex flex-col gap-4">
              {!!formFixedCharges?.length && (
                <div className="flex flex-col gap-6">
                  {formFixedCharges.map((fixedCharge: LocalFixedChargeInput, i) => {
                    const id = getNewChargeId(fixedCharge.addOn.id, i)
                    const isNew = !alreadyExistingFixedChargesIds?.includes(fixedCharge?.id || '')
                    const alreadyUsedChargeAlertMessage =
                      (alreadyUsedAddOnIds.get(fixedCharge.addOn.id) || 0) > 1
                        ? translate('text_1760729707268h378x60alri')
                        : undefined

                    return (
                      <FixedChargeAccordion
                        alreadyUsedChargeAlertMessage={alreadyUsedChargeAlertMessage}
                        currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
                        disabled={isEdition && !canBeEdited && !isNew}
                        editInvoiceDisplayNameDialogRef={editInvoiceDisplayNameDialogRef}
                        formikProps={formikProps}
                        id={id}
                        index={i}
                        isEdition={isEdition}
                        isInitiallyOpen={isInitiallyOpen}
                        isInSubscriptionForm={isInSubscriptionForm}
                        isUsedInSubscription={!isNew && !canBeEdited}
                        key={id}
                        premiumWarningDialogRef={premiumWarningDialogRef}
                        removeChargeWarningDialogRef={removeChargeWarningDialogRef}
                      />
                    )
                  })}
                </div>
              )}
              {showAddFixedChargeCombobox ? (
                <div className="flex items-center gap-3">
                  <ComboBox
                    containerClassName="flex-1"
                    className={SEARCH_ADD_ON_FOR_FIXED_CHARGES_SECTION_INPUT_CLASSNAME}
                    data={addOnsForFixedChargesSectionComboboxData}
                    searchQuery={getAddOnsForFixedChargesSection}
                    loading={addOnsForFixedChargesSectionLoading}
                    placeholder={translate('text_6435888d7cc86500646d8981')}
                    emptyText={translate('text_6246b6bc6b25f500b779aa7a')}
                    onChange={onAddFixedCharge}
                  />
                  <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                    <Button
                      icon="trash"
                      variant="quaternary"
                      onClick={() => {
                        setShowAddFixedChargeCombobox(false)
                      }}
                    />
                  </Tooltip>
                </div>
              ) : (
                !isInSubscriptionForm && (
                  <Button
                    fitContent
                    startIcon="plus"
                    variant="inline"
                    data-test="add-metered-charge"
                    onClick={() => {
                      setShowAddFixedChargeCombobox(true)
                      setTimeout(() => {
                        ;(
                          document.querySelector(
                            `.${SEARCH_ADD_ON_FOR_FIXED_CHARGES_SECTION_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                          ) as HTMLElement
                        )?.click()
                      }, 0)
                    }}
                  >
                    {translate('text_176072970726882uau5y69f1')}
                  </Button>
                )
              )}
            </div>
          )}
        </Card>

        <RemoveChargeWarningDialog ref={removeChargeWarningDialogRef} />
      </>
    )
  },
)

FixedChargesSection.displayName = 'FixedChargesSection'
