import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { Drawer, DrawerRef } from '~/components/designSystem/Drawer'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { usePlanFormContext } from '~/contexts/PlanFormContext'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, PlanInterval } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export interface SubscriptionFeeFormValues {
  amountCents: string
  interval: PlanInterval
  payInAdvance: boolean
  trialPeriod: string
  invoiceDisplayName: string
}

const subscriptionFeeSchema = z.object({
  amountCents: z.string().min(1),
  interval: z.nativeEnum(PlanInterval),
  payInAdvance: z.boolean(),
  trialPeriod: z.string(),
  invoiceDisplayName: z.string(),
})

const DEFAULT_VALUES: SubscriptionFeeFormValues = {
  amountCents: '',
  interval: PlanInterval.Monthly,
  payInAdvance: false,
  trialPeriod: '',
  invoiceDisplayName: '',
}

export interface SubscriptionFeeDrawerRef {
  openDrawer: (values: SubscriptionFeeFormValues) => void
  closeDrawer: () => void
}

interface SubscriptionFeeDrawerProps {
  disableBillingTiming?: boolean
  onSave: (values: SubscriptionFeeFormValues) => void
}

export const SubscriptionFeeDrawer = forwardRef<
  SubscriptionFeeDrawerRef,
  SubscriptionFeeDrawerProps
>(({ disableBillingTiming, onSave }, ref) => {
  const { translate } = useInternationalization()
  const { currency } = usePlanFormContext()
  const drawerRef = useRef<DrawerRef>(null)
  // defaultValues must be state so the React adapter's formApi.update(opts)
  // on every render doesn't overwrite what form.reset(values) set.
  const [formDefaultValues, setFormDefaultValues] =
    useState<SubscriptionFeeFormValues>(DEFAULT_VALUES)

  const form = useAppForm({
    defaultValues: formDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: subscriptionFeeSchema,
    },
  })

  useImperativeHandle(ref, () => ({
    openDrawer: (values: SubscriptionFeeFormValues) => {
      setFormDefaultValues(values)
      form.reset(values)
      drawerRef.current?.openDrawer()
    },
    closeDrawer: () => {
      drawerRef.current?.closeDrawer()
    },
  }))

  const isDirty = useStore(form.store, (state) => state.isDirty)

  const handleSave = () => {
    onSave(form.state.values)
    drawerRef.current?.closeDrawer()
  }

  return (
    <Drawer
      stickyBottomBarSmall
      ref={drawerRef}
      title={translate('text_642d5eb2783a2ad10d670336')}
      showCloseWarningDialog={isDirty}
      onClose={() => {
        form.reset()
      }}
      stickyBottomBar={({ closeDrawer }) => (
        <div className="flex justify-end gap-3">
          <Button variant="quaternary" onClick={closeDrawer}>
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <Button data-test="subscription-fee-drawer-save" onClick={handleSave}>
            {translate('text_17295436903260tlyb1gp1i7')}
          </Button>
        </div>
      )}
      stickyBottomBarClassName="md:py-0 flex items-center justify-end gap-3"
    >
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

            <form.AppField name="interval">
              {(field) => (
                <field.ButtonSelectorField
                  label={translate('text_6661fc17337de3591e29e3d1')}
                  description={translate('text_6661fc17337de3591e29e3d3')}
                  options={[
                    {
                      label: translate(getIntervalTranslationKey[PlanInterval.Weekly]),
                      value: PlanInterval.Weekly,
                    },
                    {
                      label: translate(getIntervalTranslationKey[PlanInterval.Monthly]),
                      value: PlanInterval.Monthly,
                    },
                    {
                      label: translate(getIntervalTranslationKey[PlanInterval.Quarterly]),
                      value: PlanInterval.Quarterly,
                    },
                    {
                      label: translate(getIntervalTranslationKey[PlanInterval.Semiannual]),
                      value: PlanInterval.Semiannual,
                    },
                    {
                      label: translate(getIntervalTranslationKey[PlanInterval.Yearly]),
                      value: PlanInterval.Yearly,
                    },
                  ]}
                />
              )}
            </form.AppField>

            <form.AppField name="payInAdvance">
              {(field) => (
                <field.RadioGroupField
                  disabled={disableBillingTiming}
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

            <form.AppField name="trialPeriod">
              {(field) => (
                <field.TextInputField
                  beforeChangeFormatter={['positiveNumber', 'int']}
                  className="flex-1"
                  description={translate('text_6661fc17337de3591e29e403')}
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
    </Drawer>
  )
})

SubscriptionFeeDrawer.displayName = 'SubscriptionFeeDrawer'
