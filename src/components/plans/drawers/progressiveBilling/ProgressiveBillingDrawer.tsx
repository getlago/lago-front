import { revalidateLogic } from '@tanstack/react-form'
import { tw } from 'lago-design-system'
import { forwardRef, useImperativeHandle, useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useDrawer } from '~/components/drawers/useDrawer'
import { PlanFormProvider, usePlanFormContext } from '~/contexts/PlanFormContext'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { DEFAULT_VALUES, ProgressiveBillingFormValues, progressiveBillingSchema } from './constants'
import { ProgressiveBillingDrawerContent } from './ProgressiveBillingDrawerContent'

export const PROGRESSIVE_BILLING_DRAWER_SAVE_TEST_ID = 'progressive-billing-drawer-save'

export interface ProgressiveBillingDrawerRef {
  openDrawer: (values?: ProgressiveBillingFormValues) => void
  closeDrawer: () => void
}

interface ProgressiveBillingDrawerProps {
  onSave: (values: ProgressiveBillingFormValues) => void
  onDelete?: () => void
}

export const ProgressiveBillingDrawer = forwardRef<
  ProgressiveBillingDrawerRef,
  ProgressiveBillingDrawerProps
>(({ onSave, onDelete }, ref) => {
  const { translate } = useInternationalization()
  const { currency, interval } = usePlanFormContext()
  const progressiveBillingDrawer = useDrawer()
  const isEditModeRef = useRef(false)

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: progressiveBillingSchema,
    },
    onSubmit: ({ value }) => {
      onSave(value)
      progressiveBillingDrawer.close()
    },
  })

  const handleFormSubmit = () => {
    form.handleSubmit()
  }

  const handleDelete = () => {
    progressiveBillingDrawer.close()
    onDelete?.()
  }

  const openDrawer = (values?: ProgressiveBillingFormValues) => {
    const resetValues = values ?? DEFAULT_VALUES

    isEditModeRef.current = !!values

    form.reset(resetValues, { keepDefaultValues: true })

    const showDelete = isEditModeRef.current && !!onDelete

    progressiveBillingDrawer.open({
      title: translate('text_1724179887722baucvj7bvc1'),
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      onEntered: () => {
        // Focus the first amount input in the threshold table
        const firstInput = document.querySelector(
          '[data-test="base-drawer-paper"]:last-child input',
        ) as HTMLInputElement

        firstInput?.focus()
      },
      children: (
        <PlanFormProvider currency={currency} interval={interval}>
          <ProgressiveBillingDrawerContent
            form={form}
            initialDisplayRecurring={!!resetValues.recurringUsageThreshold}
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
            <Button variant="quaternary" onClick={() => progressiveBillingDrawer.close()}>
              {translate('text_6411e6b530cb47007488b027')}
            </Button>
            <form.Subscribe selector={({ canSubmit }) => canSubmit}>
              {(canSubmit) => (
                <Button
                  data-test={PROGRESSIVE_BILLING_DRAWER_SAVE_TEST_ID}
                  onClick={handleFormSubmit}
                  disabled={!canSubmit}
                >
                  {translate('text_17295436903260tlyb1gp1i7')}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      ),
    })
  }

  useImperativeHandle(ref, () => ({
    openDrawer,
    closeDrawer: () => {
      progressiveBillingDrawer.close()
    },
  }))

  return null
})

ProgressiveBillingDrawer.displayName = 'ProgressiveBillingDrawer'
