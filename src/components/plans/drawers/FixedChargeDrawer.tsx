import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { tw } from 'lago-design-system'
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { Drawer, DrawerRef } from '~/components/designSystem/Drawer'
import { Selector } from '~/components/designSystem/Selector'
import { Typography } from '~/components/designSystem/Typography'
import { ComboboxItem } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { ChargeModelSelector } from '~/components/plans/chargeAccordion/ChargeModelSelector'
import { ChargeWrapperSwitch } from '~/components/plans/chargeAccordion/ChargeWrapperSwitch'
import { ChargePayInAdvanceOption } from '~/components/plans/chargeAccordion/options/ChargePayInAdvanceOption'
import { PlanBillingPeriodInfoSection } from '~/components/plans/drawers/PlanBillingPeriodInfoSection'
import { RemoveChargeWarningDialogRef } from '~/components/plans/RemoveChargeWarningDialog'
import { LocalFixedChargeInput } from '~/components/plans/types'
import { TaxesSelectorSection } from '~/components/taxes/TaxesSelectorSection'
import { usePlanFormContext } from '~/contexts/PlanFormContext'
import { useDuplicatePlanVar } from '~/core/apolloClient'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_ADD_ON_IN_FIXED_CHARGE_DRAWER_INPUT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME,
} from '~/core/constants/form'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { validateChargeProperties } from '~/formValidation/chargePropertiesSchema'
import {
  AddOnForFixedChargesSectionFragment,
  FixedChargeChargeModelEnum,
  GraduatedChargeFragmentDoc,
  PropertiesInput,
  TaxForPlanAndChargesInPlanFormFragmentDoc,
  TaxForTaxesSelectorSectionFragment,
  useGetAddOnsForFixedChargesSectionLazyQuery,
  VolumeRangesFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useChargeForm } from '~/hooks/plans/useChargeForm'

gql`
  fragment AddOnForFixedChargesSection on AddOn {
    id
    name
    code
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

export interface FixedChargeDrawerFormValues {
  addOnId: string
  addOn: AddOnForFixedChargesSectionFragment
  applyUnitsImmediately: boolean
  chargeModel: FixedChargeChargeModelEnum
  id?: string
  invoiceDisplayName: string
  payInAdvance: boolean
  properties: PropertiesInput
  prorated: boolean
  taxes: TaxForTaxesSelectorSectionFragment[]
  units: string
}

const fixedChargeDrawerSchema = z
  .object({
    addOnId: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
    addOn: z.custom<AddOnForFixedChargesSectionFragment>(),
    applyUnitsImmediately: z.boolean(),
    chargeModel: z.enum(FixedChargeChargeModelEnum),
    id: z.string().optional(),
    invoiceDisplayName: z.string(),
    payInAdvance: z.boolean(),
    properties: z.record(z.string(), z.unknown()),
    prorated: z.boolean(),
    taxes: z.array(
      z.object({ id: z.string(), code: z.string(), name: z.string(), rate: z.number() }),
    ),
    units: z
      .string()
      .min(1, { message: 'text_624ea7c29103fd010732ab7d' })
      .refine((val) => !Number.isNaN(Number(val)), {
        message: 'text_624ea7c29103fd010732ab7d',
      }),
  })
  .superRefine((data, ctx) => {
    validateChargeProperties(data.chargeModel, data.properties, ctx, ['properties'])
  })

const DEFAULT_VALUES: FixedChargeDrawerFormValues = {
  addOnId: '',
  addOn: { id: '', name: '', code: '' },
  applyUnitsImmediately: false,
  chargeModel: FixedChargeChargeModelEnum.Standard,
  id: undefined,
  invoiceDisplayName: '',
  payInAdvance: false,
  properties: getPropertyShape({}),
  prorated: false,
  taxes: [],
  units: '',
}

const FIXED_CHARGE_DRAWER_FORM_ID = 'fixed-charge-drawer-form'

export interface FixedChargeDrawerRef {
  openDrawer: (
    charge?: LocalFixedChargeInput,
    index?: number,
    options?: { alreadyUsedChargeAlertMessage?: string; isUsedInSubscription?: boolean },
  ) => void
  closeDrawer: () => void
}

interface FixedChargeDrawerProps {
  disabled?: boolean
  isEdition?: boolean
  isInSubscriptionForm?: boolean
  onSave: (charge: LocalFixedChargeInput, index: number | null) => void
  onDelete?: (index: number) => void
  removeChargeWarningDialogRef?: React.RefObject<RemoveChargeWarningDialogRef>
}

export const FixedChargeDrawer = forwardRef<FixedChargeDrawerRef, FixedChargeDrawerProps>(
  (
    { disabled, isEdition, isInSubscriptionForm, onSave, onDelete, removeChargeWarningDialogRef },
    ref,
  ) => {
    const { translate } = useInternationalization()
    const { currency } = usePlanFormContext()
    const { type: actionType } = useDuplicatePlanVar()
    const drawerRef = useRef<DrawerRef>(null)
    const editIndexRef = useRef<number>(-1)
    const alertMessageRef = useRef<string | undefined>(undefined)
    const [isCreateMode, setIsCreateMode] = useState(false)
    const isUsedInSubscriptionRef = useRef(false)
    const shouldFocusComboBoxRef = useRef(false)

    const focusComboBox = useCallback(() => {
      if (!shouldFocusComboBoxRef.current) return
      shouldFocusComboBoxRef.current = false
      ;(
        document.querySelector(
          `.${SEARCH_ADD_ON_IN_FIXED_CHARGE_DRAWER_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
        ) as HTMLElement
      )?.click()
    }, [])

    const [getAddOnsForFixedChargesSection, { loading: addOnsLoading, data: addOnsData }] =
      useGetAddOnsForFixedChargesSectionLazyQuery({
        variables: { limit: 1000 },
      })

    const addOnsComboboxData = useMemo(() => {
      if (!addOnsData?.addOns?.collection?.length) return []

      return addOnsData.addOns.collection.map(({ id, name, code }) => ({
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
      }))
    }, [addOnsData?.addOns?.collection])

    const {
      getFixedChargeModelComboboxData,
      getIsPayInAdvanceOptionDisabledForFixedCharge,
      getIsProRatedOptionDisabledForFixedCharge,
    } = useChargeForm()

    const form = useAppForm({
      defaultValues: DEFAULT_VALUES,
      validationLogic: revalidateLogic(),
      validators: {
        onDynamic: fixedChargeDrawerSchema,
      },
      onSubmit: ({ value }) => {
        const localFixedCharge: LocalFixedChargeInput = {
          addOn: value.addOn,
          applyUnitsImmediately: value.applyUnitsImmediately,
          chargeModel: value.chargeModel,
          id: value.id,
          invoiceDisplayName: value.invoiceDisplayName || undefined,
          payInAdvance: value.payInAdvance,
          properties: value.properties,
          prorated: value.prorated,
          taxes: value.taxes,
          units: value.units,
        }

        onSave(localFixedCharge, isCreateMode ? null : editIndexRef.current)
        drawerRef.current?.closeDrawer()
      },
    })

    useImperativeHandle(ref, () => ({
      openDrawer: (charge?, index?, options?) => {
        if (charge && index !== undefined) {
          // Edit mode
          setIsCreateMode(false)
          editIndexRef.current = index
          alertMessageRef.current = options?.alreadyUsedChargeAlertMessage
          isUsedInSubscriptionRef.current = options?.isUsedInSubscription || false
          form.reset(
            {
              addOnId: charge.addOn.id,
              addOn: charge.addOn,
              applyUnitsImmediately: charge.applyUnitsImmediately || false,
              chargeModel: charge.chargeModel,
              id: charge.id,
              invoiceDisplayName: charge.invoiceDisplayName || '',
              payInAdvance: charge.payInAdvance || false,
              properties: charge.properties || getPropertyShape({}),
              prorated: charge.prorated || false,
              taxes: charge.taxes || [],
              units: charge.units || '',
            },
            { keepDefaultValues: true },
          )
        } else {
          // Create mode
          setIsCreateMode(true)
          editIndexRef.current = -1
          alertMessageRef.current = undefined
          isUsedInSubscriptionRef.current = false
          form.reset(DEFAULT_VALUES, { keepDefaultValues: true })

          // Pre-fetch add-ons data so it's ready when the ComboBox is focused
          getAddOnsForFixedChargesSection()
          shouldFocusComboBoxRef.current = true
        }

        drawerRef.current?.openDrawer()
      },
      closeDrawer: () => {
        drawerRef.current?.closeDrawer()
      },
    }))

    const isDirty = useStore(form.store, (state) => state.isDirty)
    const formValues = useStore(form.store, (state) => state.values)

    const isCreatePickerScreen = isCreateMode && !formValues.addOnId

    const chargeModelComboboxData = useMemo(
      () => getFixedChargeModelComboboxData(),
      [getFixedChargeModelComboboxData],
    )

    const isPayInAdvanceOptionDisabled = useMemo(
      () =>
        getIsPayInAdvanceOptionDisabledForFixedCharge({
          chargeModel: formValues.chargeModel,
          isProrated: formValues.prorated,
        }),
      [getIsPayInAdvanceOptionDisabledForFixedCharge, formValues.chargeModel, formValues.prorated],
    )

    const isProratedOptionDisabled = useMemo(
      () =>
        getIsProRatedOptionDisabledForFixedCharge({
          chargeModel: formValues.chargeModel,
          isPayInAdvance: formValues.payInAdvance,
        }),
      [getIsProRatedOptionDisabledForFixedCharge, formValues.chargeModel, formValues.payInAdvance],
    )

    const handleChargeModelUpdate = useCallback(
      (name: string, value: unknown) => {
        if (name === 'chargeModel') {
          if (value === form.getFieldValue('chargeModel')) return

          form.reset(
            {
              ...form.state.values,
              chargeModel: value as FixedChargeChargeModelEnum,
              payInAdvance: false,
              prorated: false,
              properties: getPropertyShape({}),
              taxes: [],
            },
            { keepDefaultValues: true },
          )
          return
        }

        form.setFieldValue(
          name as keyof FixedChargeDrawerFormValues,
          value as FixedChargeDrawerFormValues[keyof FixedChargeDrawerFormValues],
        )
      },
      [form],
    )

    const handleFormSubmit = (event: React.FormEvent) => {
      event.preventDefault()
      form.handleSubmit()
    }

    const showDelete = !isCreateMode && !isInSubscriptionForm && !!onDelete

    const handleDelete = () => {
      const deleteCharge = () => {
        onDelete?.(editIndexRef.current)
      }

      drawerRef.current?.closeDrawer()

      if (actionType !== 'duplicate' && isUsedInSubscriptionRef.current) {
        removeChargeWarningDialogRef?.current?.openDialog({ callback: deleteCharge })
      } else {
        deleteCharge()
      }
    }

    const stickyBottomBar = ({ closeDrawer }: { closeDrawer: () => void }) => (
      <div
        className={tw(
          'flex items-center gap-3',
          showDelete ? 'w-full justify-between' : 'justify-end',
        )}
      >
        {showDelete && (
          <Button danger variant="quaternary" onClick={handleDelete}>
            {translate('text_63ea0f84f400488553caa786')}
          </Button>
        )}
        <div className="flex items-center gap-3">
          <Button variant="quaternary" onClick={closeDrawer}>
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <form.Subscribe selector={({ canSubmit }) => canSubmit}>
            {(canSubmit) => (
              <Button
                data-test="fixed-charge-drawer-save"
                onClick={handleFormSubmit}
                disabled={!canSubmit}
              >
                {translate('text_17295436903260tlyb1gp1i7')}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>
    )

    return (
      <Drawer
        ref={drawerRef}
        title={translate('text_1772133285141kidk35mbh3o')}
        onEntered={focusComboBox}
        showCloseWarningDialog={isDirty}
        onClose={() => {
          form.reset()
        }}
        stickyBottomBar={stickyBottomBar}
        stickyBottomBarClassName="md:py-0 flex items-center gap-3"
      >
        <form id={FIXED_CHARGE_DRAWER_FORM_ID} onSubmit={handleFormSubmit}>
          <button type="submit" hidden aria-hidden="true" />
          <CenteredPage.SectionWrapper>
            <CenteredPage.PageTitle
              title={translate('text_1772133285141kidk35mbh3o')}
              description={translate('text_1760729707268c05r06ip8vg')}
            />

            {isCreatePickerScreen ? (
              <CenteredPage.PageSection>
                <CenteredPage.PageSectionTitle
                  title={translate('text_1772133285141caubzimuyr0')}
                  description={translate('text_17727389218359nvq0qjg447')}
                />

                <form.AppField
                  name="addOnId"
                  listeners={{
                    onChange: ({ value }) => {
                      const selectedAddOn = addOnsData?.addOns?.collection.find(
                        (a) => a.id === value,
                      )

                      if (selectedAddOn) {
                        form.setFieldValue('addOn', {
                          id: selectedAddOn.id,
                          name: selectedAddOn.name,
                          code: selectedAddOn.code,
                        })
                      }
                    },
                  }}
                >
                  {(field) => (
                    <field.ComboBoxField
                      className={SEARCH_ADD_ON_IN_FIXED_CHARGE_DRAWER_INPUT_CLASSNAME}
                      data={addOnsComboboxData}
                      searchQuery={getAddOnsForFixedChargesSection}
                      loading={addOnsLoading}
                      placeholder={translate('text_6453819268763979024ad0ad')}
                      emptyText={translate('text_655633c844bc8a00577061b0')}
                    />
                  )}
                </form.AppField>
              </CenteredPage.PageSection>
            ) : (
              <CenteredPage.SubsectionWrapper>
                {/* Selected add-on (read-only) */}
                <CenteredPage.PageSection>
                  <CenteredPage.PageSectionTitle
                    title={translate('text_1772133285141caubzimuyr0')}
                  />

                  <Selector
                    icon="puzzle"
                    title={formValues.addOn.name}
                    subtitle={formValues.addOn.code}
                  />
                </CenteredPage.PageSection>

                {/* Pricing settings */}
                <CenteredPage.PageSection>
                  <CenteredPage.PageSectionTitle
                    title={translate('text_1772133285141xbpuxbd4vrk')}
                  />

                  <ChargeModelSelector
                    alreadyUsedChargeAlertMessage={alertMessageRef.current}
                    isInSubscriptionForm={isInSubscriptionForm}
                    disabled={disabled}
                    localCharge={formValues as unknown as LocalFixedChargeInput}
                    chargeModelComboboxData={chargeModelComboboxData}
                    handleUpdate={handleChargeModelUpdate}
                  />

                  <ChargeWrapperSwitch
                    chargeType="fixed"
                    chargePricingUnitShortName={undefined}
                    currency={currency}
                    disabled={disabled}
                    form={form}
                    isEdition={isEdition || false}
                    localCharge={formValues as unknown as LocalFixedChargeInput}
                    propertyCursor="properties"
                  />

                  <form.AppField name="units">
                    {(field) => (
                      <field.TextInputField
                        label={translate('text_65771fa3f4ab9a00720726ce')}
                        placeholder={translate('text_643e592657fc1ba5ce110c80')}
                        beforeChangeFormatter={['positiveNumber', 'sextDecimal']}
                        disabled={disabled}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              {translate('text_6282085b4f283b0102655884')}
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  </form.AppField>

                  {(isEdition || false) && (
                    <form.AppField name="applyUnitsImmediately">
                      {(field) => (
                        <field.SwitchField
                          label={translate('text_1760721761361octnb0dfqm5')}
                          subLabel={translate('text_1760721761361lqhc17vjr2b')}
                          disabled={disabled}
                        />
                      )}
                    </form.AppField>
                  )}
                </CenteredPage.PageSection>

                {/* Invoicing settings */}
                <CenteredPage.PageSection>
                  <CenteredPage.PageSectionTitle
                    title={translate('text_17423672025282dl7iozy1ru')}
                  />

                  <form.AppField name="invoiceDisplayName">
                    {(field) => (
                      <field.TextInputField
                        label={translate('text_65a6b4e2cb38d9b70ec53d39')}
                        description={translate('text_1771963033467yduu33x3qw9')}
                        placeholder={translate('text_65a6b4e2cb38d9b70ec53d41')}
                      />
                    )}
                  </form.AppField>

                  <PlanBillingPeriodInfoSection />

                  <ChargePayInAdvanceOption
                    chargePayInAdvanceDescription={undefined}
                    disabled={isInSubscriptionForm || disabled}
                    isPayInAdvanceOptionDisabled={isPayInAdvanceOptionDisabled}
                    payInAdvance={formValues.payInAdvance}
                    handleUpdate={({ payInAdvance }) => {
                      form.setFieldValue('payInAdvance', payInAdvance)
                    }}
                  />

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <CenteredPage.PageSectionTitle
                        title={translate('text_17607297072670cl4jl071yy')}
                      />
                    </div>

                    <form.AppField name="prorated">
                      {(field) => (
                        <field.SwitchField
                          label={translate('text_17607297072670cl4jl071yy')}
                          disabled={isInSubscriptionForm || disabled || isProratedOptionDisabled}
                        />
                      )}
                    </form.AppField>
                  </div>

                  <TaxesSelectorSection
                    title={translate('text_1760729707267seik64l67k8')}
                    description={translate('text_17607297072672w5hid8gl1i')}
                    taxes={formValues.taxes}
                    comboboxSelector={SEARCH_TAX_INPUT_FOR_CHARGE_CLASSNAME}
                    onUpdate={(newTaxArray) => {
                      form.setFieldValue('taxes', newTaxArray)
                    }}
                  />
                </CenteredPage.PageSection>
              </CenteredPage.SubsectionWrapper>
            )}
          </CenteredPage.SectionWrapper>
        </form>
      </Drawer>
    )
  },
)

FixedChargeDrawer.displayName = 'FixedChargeDrawer'
