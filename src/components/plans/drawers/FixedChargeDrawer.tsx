import { revalidateLogic } from '@tanstack/react-form'
import { tw } from 'lago-design-system'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { useDrawer } from '~/components/drawers/useDrawer'
import { RemoveChargeWarningDialogRef } from '~/components/plans/RemoveChargeWarningDialog'
import { LocalFixedChargeInput } from '~/components/plans/types'
import { PlanFormProvider, usePlanFormContext } from '~/contexts/PlanFormContext'
import { useDuplicatePlanVar } from '~/core/apolloClient'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_ADD_ON_IN_FIXED_CHARGE_DRAWER_INPUT_CLASSNAME,
} from '~/core/constants/form'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { validateChargeProperties } from '~/formValidation/chargePropertiesSchema'
import {
  AddOnForFixedChargesSectionFragment,
  FixedChargeChargeModelEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { DEFAULT_VALUES, type FixedChargeDrawerFormValues } from './fixedChargeConstants'
import { FixedChargeDrawerContent } from './FixedChargeDrawerContent'

export { type FixedChargeDrawerFormValues, DEFAULT_VALUES } from './fixedChargeConstants'

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
    const { currency, interval } = usePlanFormContext()
    const { type: actionType } = useDuplicatePlanVar()
    const fixedChargeDrawer = useDrawer()
    const editIndexRef = useRef<number>(-1)
    const alertMessageRef = useRef<string | undefined>(undefined)
    const isCreateModeRef = useRef(false)
    const isUsedInSubscriptionRef = useRef(false)
    const shouldFocusComboBoxRef = useRef(false)

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

        onSave(localFixedCharge, isCreateModeRef.current ? null : editIndexRef.current)
        fixedChargeDrawer.close()
      },
    })

    const handleFormSubmit = () => {
      form.handleSubmit()
    }

    const openFixedChargeDrawer = () => {
      const showDelete = !isCreateModeRef.current && !isInSubscriptionForm && !!onDelete

      const handleDelete = () => {
        const deleteCharge = () => {
          onDelete?.(editIndexRef.current)
        }

        fixedChargeDrawer.close()

        if (actionType !== 'duplicate' && isUsedInSubscriptionRef.current) {
          removeChargeWarningDialogRef?.current?.openDialog({ callback: deleteCharge })
        } else {
          deleteCharge()
        }
      }

      fixedChargeDrawer.open({
        title: translate('text_1772133285141kidk35mbh3o'),
        shouldPromptOnClose: () => form.state.isDirty,
        onClose: () => form.reset(),
        onEntered: () => {
          if (!shouldFocusComboBoxRef.current) return
          shouldFocusComboBoxRef.current = false
          ;(
            document.querySelector(
              `.${SEARCH_ADD_ON_IN_FIXED_CHARGE_DRAWER_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
            ) as HTMLElement
          )?.click()
        },
        children: (
          <PlanFormProvider currency={currency} interval={interval}>
            <FixedChargeDrawerContent
              form={form}
              isCreateMode={isCreateModeRef.current}
              isEdition={isEdition || false}
              isInSubscriptionForm={isInSubscriptionForm || false}
              disabled={disabled || false}
              alertMessage={alertMessageRef.current}
            />
          </PlanFormProvider>
        ),
        actions: (
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
              <Button variant="quaternary" onClick={() => fixedChargeDrawer.close()}>
                {translate('text_6411e6b530cb47007488b027')}
              </Button>
              <form.Subscribe selector={({ canSubmit }) => canSubmit}>
                {(canSubmit) => (
                  <Button
                    data-test="fixed-charge-drawer-save"
                    onClick={handleFormSubmit}
                    disabled={!canSubmit}
                  >
                    {translate(
                      isCreateModeRef.current
                        ? 'text_1775225915209vpdyh1dvrm5'
                        : 'text_17295436903260tlyb1gp1i7',
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </div>
        ),
      })
    }

    useImperativeHandle(ref, () => ({
      openDrawer: (charge?, index?, options?) => {
        if (charge && index !== undefined) {
          // Edit mode
          isCreateModeRef.current = false
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
          isCreateModeRef.current = true
          editIndexRef.current = -1
          alertMessageRef.current = undefined
          isUsedInSubscriptionRef.current = false
          form.reset(DEFAULT_VALUES, { keepDefaultValues: true })
          shouldFocusComboBoxRef.current = true
        }

        openFixedChargeDrawer()
      },
      closeDrawer: () => {
        fixedChargeDrawer.close()
      },
    }))

    return null
  },
)

FixedChargeDrawer.displayName = 'FixedChargeDrawer'
