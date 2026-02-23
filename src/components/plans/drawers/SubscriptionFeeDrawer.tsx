import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { Drawer, DrawerRef } from '~/components/designSystem/Drawer'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PlanBillingPeriodInfoSection } from '~/components/plans/drawers/PlanBillingPeriodInfoSection'
import { usePlanFormContext } from '~/contexts/PlanFormContext'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export interface SubscriptionFeeFormValues {
  amountCents: string
  payInAdvance: boolean
  trialPeriod: number
  invoiceDisplayName?: string
}

const subscriptionFeeSchema = z.object({
  amountCents: z.string().min(1, 'text_1771342994699klxu2paz7g8'),
  payInAdvance: z.boolean(),
  trialPeriod: z.number(),
  invoiceDisplayName: z.string().optional(),
})

const DEFAULT_VALUES: SubscriptionFeeFormValues = {
  amountCents: '',
  payInAdvance: false,
  trialPeriod: 0,
  invoiceDisplayName: undefined,
}

const SUBSCRIPTION_FEE_FORM_ID = 'subscription-fee-drawer-form'

export interface SubscriptionFeeDrawerRef {
  openDrawer: (values: SubscriptionFeeFormValues) => void
  closeDrawer: () => void
}

interface SubscriptionFeeDrawerProps {
  canBeEdited?: boolean
  isInSubscriptionForm?: boolean
  subscriptionFormType?: keyof typeof FORM_TYPE_ENUM
  isEdition?: boolean
  onSave: (values: SubscriptionFeeFormValues) => void
}

export const SubscriptionFeeDrawer = forwardRef<
  SubscriptionFeeDrawerRef,
  SubscriptionFeeDrawerProps
>(({ canBeEdited, isInSubscriptionForm, subscriptionFormType, isEdition, onSave }, ref) => {
  const { translate } = useInternationalization()
  const { currency } = usePlanFormContext()
  const drawerRef = useRef<DrawerRef>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  const focusAmount = useCallback(() => {
    amountRef.current?.focus()
  }, [])

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: subscriptionFeeSchema,
    },
    onSubmit: async ({ value }) => {
      onSave({
        ...value,
        trialPeriod: Number(value.trialPeriod) || 0,
        invoiceDisplayName: value.invoiceDisplayName || undefined,
      })
      drawerRef.current?.closeDrawer()
    },
  })

  useImperativeHandle(ref, () => ({
    openDrawer: (values: SubscriptionFeeFormValues) => {
      form.reset(
        {
          ...values,
          trialPeriod: values.trialPeriod ?? 0,
        },
        { keepDefaultValues: true },
      )
      drawerRef.current?.openDrawer()
    },
    closeDrawer: () => {
      drawerRef.current?.closeDrawer()
    },
  }))

  const isDirty = useStore(form.store, (state) => state.isDirty)

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  return (
    <Drawer
      ref={drawerRef}
      title={translate('text_642d5eb2783a2ad10d670336')}
      showCloseWarningDialog={isDirty}
      onEntered={focusAmount}
      onClose={() => {
        form.reset()
      }}
      stickyBottomBar={({ closeDrawer }) => (
        <div className="flex justify-end gap-3">
          <Button variant="quaternary" onClick={closeDrawer}>
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <form.Subscribe selector={({ canSubmit }) => canSubmit}>
            {(canSubmit) => (
              <Button
                data-test="subscription-fee-drawer-save"
                onClick={handleFormSubmit}
                disabled={!canSubmit}
              >
                {translate('text_17295436903260tlyb1gp1i7')}
              </Button>
            )}
          </form.Subscribe>
        </div>
      )}
      stickyBottomBarClassName="md:py-0 flex items-center justify-end gap-3"
    >
      <form id={SUBSCRIPTION_FEE_FORM_ID} onSubmit={handleFormSubmit}>
        <button type="submit" hidden aria-hidden="true" />
        <CenteredPage.SectionWrapper>
          <CenteredPage.PageTitle
            title={translate('text_642d5eb2783a2ad10d670336')}
            description={translate('text_1770063200028xc3xmcvi7bw')}
          />

          <CenteredPage.SubsectionWrapper>
            <CenteredPage.PageSection>
              <CenteredPage.PageSectionTitle title={translate('text_177196303346655qni6k55jr')} />

              <form.AppField name="amountCents">
                {(field) => (
                  <field.AmountInputField
                    currency={currency}
                    beforeChangeFormatter={['positiveNumber']}
                    label={translate('text_624453d52e945301380e49b6')}
                    InputProps={{
                      inputRef: amountRef,
                      endAdornment: (
                        <InputAdornment position="end">
                          {getCurrencySymbol(currency || CurrencyEnum.Usd)}
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              </form.AppField>
            </CenteredPage.PageSection>

            <CenteredPage.PageSection>
              <CenteredPage.PageSectionTitle title={translate('text_17423672025282dl7iozy1ru')} />

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

              <form.AppField name="payInAdvance">
                {(field) => (
                  <field.RadioGroupField
                    disabled={isInSubscriptionForm || (isEdition && !canBeEdited)}
                    label={translate('text_6682c52081acea90520743a8')}
                    description={translate('text_6682c52081acea90520743aa')}
                    optionLabelVariant="body"
                    options={[
                      {
                        label: translate('text_6682c52081acea90520743ac'),
                        value: false,
                      },
                      {
                        label: translate('text_6682c52081acea90520743ae'),
                        value: true,
                      },
                    ]}
                  />
                )}
              </form.AppField>

              <form.AppField
                name="trialPeriod"
                listeners={{
                  onChange: ({ value, fieldApi }) => {
                    // beforeChangeFormatter int produces NaN when cleared (parseInt(""))
                    // and may produce a string if the formatter is ever removed
                    if (typeof value !== 'number' || Number.isNaN(value)) {
                      fieldApi.setValue(0)
                    }
                  },
                }}
              >
                {(field) => (
                  <field.TextInputField
                    beforeChangeFormatter={['positiveNumber', 'int']}
                    className="flex-1"
                    description={translate('text_6661fc17337de3591e29e403')}
                    disabled={
                      subscriptionFormType === FORM_TYPE_ENUM.edition || (isEdition && !canBeEdited)
                    }
                    label={translate('text_624453d52e945301380e49c2')}
                    placeholder={translate('text_62824f0e5d93bc008d268d00')}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {translate('text_624453d52e945301380e49c6')}
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              </form.AppField>
            </CenteredPage.PageSection>
          </CenteredPage.SubsectionWrapper>
        </CenteredPage.SectionWrapper>
      </form>
    </Drawer>
  )
})

SubscriptionFeeDrawer.displayName = 'SubscriptionFeeDrawer'
