import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic } from '@tanstack/react-form'
import { tw } from 'lago-design-system'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { useDrawer } from '~/components/drawers/useDrawer'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PlanBillingPeriodInfoSection } from '~/components/plans/drawers/common/PlanBillingPeriodInfoSection'
import { TaxesSelectorSection } from '~/components/taxes/TaxesSelectorSection'
import { PlanFormProvider, usePlanFormContext } from '~/contexts/PlanFormContext'
import { SEARCH_TAX_INPUT_FOR_MIN_COMMITMENT_CLASSNAME } from '~/core/constants/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, TaxForPlanAndChargesInPlanFormFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export const MINIMUM_COMMITMENT_DRAWER_SAVE_TEST_ID = 'minimum-commitment-drawer-save'

export interface MinimumCommitmentFormValues {
  amountCents: string
  invoiceDisplayName?: string
  taxes: TaxForPlanAndChargesInPlanFormFragment[]
}

const minimumCommitmentSchema = z.object({
  amountCents: z
    .string()
    .min(1, 'text_1771342994699klxu2paz7g8')
    .refine((val) => Number(val) > 0, 'text_632d68358f1fedc68eed3e91'),
  invoiceDisplayName: z.string().optional(),
  taxes: z.array(z.custom<TaxForPlanAndChargesInPlanFormFragment>()),
})

const DEFAULT_VALUES: MinimumCommitmentFormValues = {
  amountCents: '',
  invoiceDisplayName: undefined,
  taxes: [],
}

export interface MinimumCommitmentDrawerRef {
  openDrawer: (values?: MinimumCommitmentFormValues) => void
  closeDrawer: () => void
}

interface MinimumCommitmentDrawerProps {
  onSave: (values: MinimumCommitmentFormValues) => void
  onDelete?: () => void
}

export const MinimumCommitmentDrawer = forwardRef<
  MinimumCommitmentDrawerRef,
  MinimumCommitmentDrawerProps
>(({ onSave, onDelete }, ref) => {
  const { translate } = useInternationalization()
  const { currency, interval } = usePlanFormContext()
  const minimumCommitmentDrawer = useDrawer()
  const isAddModeRef = useRef(false)

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: minimumCommitmentSchema,
    },
    onSubmit: ({ value }) => {
      onSave({
        ...value,
        invoiceDisplayName: value.invoiceDisplayName || undefined,
      })
      minimumCommitmentDrawer.close()
    },
  })

  const handleFormSubmit = (event?: React.FormEvent) => {
    event?.preventDefault()
    form.handleSubmit()
  }

  const openMinimumCommitmentDrawer = () => {
    const showDelete = !isAddModeRef.current && !!onDelete

    const handleDelete = () => {
      minimumCommitmentDrawer.close()
      onDelete?.()
    }

    minimumCommitmentDrawer.open({
      title: translate('text_65d601bffb11e0f9d1d9f569'),
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      onEntered: () => {
        const firstInput = document.querySelector(
          '[data-test="base-drawer-paper"]:last-child input',
        ) as HTMLInputElement

        firstInput?.focus()
      },
      children: (
        <PlanFormProvider currency={currency} interval={interval}>
          <form onSubmit={handleFormSubmit}>
            <button type="submit" hidden aria-hidden="true" />
            <CenteredPage.SectionWrapper>
              <CenteredPage.PageTitle
                title={translate('text_65d601bffb11e0f9d1d9f569')}
                description={translate('text_177334593394555w48sxw5na')}
              />

              <CenteredPage.SubsectionWrapper>
                <CenteredPage.PageSection>
                  <CenteredPage.PageSectionTitle
                    title={translate('text_1773346168045bj2x1626228')}
                  />

                  <PlanBillingPeriodInfoSection />

                  <form.AppField name="amountCents">
                    {(field) => (
                      <field.AmountInputField
                        currency={currency}
                        beforeChangeFormatter={['positiveNumber']}
                        label={translate('text_65d601bffb11e0f9d1d9f571')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              {getCurrencySymbol(currency || CurrencyEnum.Usd)}
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  </form.AppField>
                </CenteredPage.PageSection>

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

                  <form.Subscribe selector={(state) => state.values.taxes}>
                    {(taxes) => (
                      <TaxesSelectorSection
                        title={translate('text_1760729707267seik64l67k8')}
                        description={translate('text_1773346168045bj2x1626229')}
                        taxes={taxes || []}
                        comboboxSelector={SEARCH_TAX_INPUT_FOR_MIN_COMMITMENT_CLASSNAME}
                        onUpdate={(newTaxArray) => {
                          form.setFieldValue('taxes', newTaxArray)
                        }}
                      />
                    )}
                  </form.Subscribe>
                </CenteredPage.PageSection>
              </CenteredPage.SubsectionWrapper>
            </CenteredPage.SectionWrapper>
          </form>
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
            <Button variant="quaternary" onClick={() => minimumCommitmentDrawer.close()}>
              {translate('text_6411e6b530cb47007488b027')}
            </Button>
            <form.Subscribe selector={({ canSubmit }) => canSubmit}>
              {(canSubmit) => (
                <Button
                  data-test={MINIMUM_COMMITMENT_DRAWER_SAVE_TEST_ID}
                  onClick={handleFormSubmit}
                  disabled={!canSubmit}
                >
                  {translate(
                    isAddModeRef.current
                      ? 'text_1775225915210r5vkxkn0mvx'
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
    openDrawer: (values?: MinimumCommitmentFormValues) => {
      isAddModeRef.current = !values
      if (values) {
        form.reset(
          {
            ...values,
            taxes: values.taxes ?? [],
          },
          { keepDefaultValues: true },
        )
      } else {
        form.reset(DEFAULT_VALUES, { keepDefaultValues: true })
      }

      openMinimumCommitmentDrawer()
    },
    closeDrawer: () => {
      minimumCommitmentDrawer.close()
    },
  }))

  return null
})

MinimumCommitmentDrawer.displayName = 'MinimumCommitmentDrawer'
