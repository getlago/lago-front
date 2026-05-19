import { useStore } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { Dispatch, SetStateAction, useMemo } from 'react'

import { SubscriptionDatesOffsetHelperComponent } from '~/components/customers/subscriptions/SubscriptionDatesOffsetHelperComponent'
import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { DateFormat, getTimezoneConfig, intlFormatDateTime } from '~/core/timezone'
import {
  BillingTimeEnum,
  GetSubscriptionForCreateSubscriptionQuery,
  PlanInterval,
  StatusTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { buildSubscriptionDefaultValues } from './buildSubscriptionDefaultValues'

const getBillingTimeSelectorTranslationKey = (planInterval?: PlanInterval) => {
  switch (planInterval) {
    case PlanInterval.Yearly:
      return 'text_62ebd597d5d5130a03ced107'
    case PlanInterval.Weekly:
      return 'text_62ebd597d5d5130a03ced101'
    case PlanInterval.Quarterly:
      return 'text_64d6357b00dea100ad1cba27'
    default:
      return 'text_62ea7cd44cd4b14bb9ac1db9'
  }
}

interface SubscriptionInformationFormSectionExtraProps {
  formType: string
  subscription: GetSubscriptionForCreateSubscriptionQuery['subscription'] | undefined
  customerTimezone?: TimezoneEnum | null
  shouldDisplaySubscriptionExternalId: boolean
  setShouldDisplaySubscriptionExternalId: Dispatch<SetStateAction<boolean>>
  shouldDisplaySubscriptionName: boolean
  setShouldDisplaySubscriptionName: Dispatch<SetStateAction<boolean>>
  selectedPlanInterval?: PlanInterval
}

const subscriptionInformationDefaultProps: SubscriptionInformationFormSectionExtraProps = {
  formType: FORM_TYPE_ENUM.creation,
  subscription: undefined,
  customerTimezone: undefined,
  shouldDisplaySubscriptionExternalId: false,
  setShouldDisplaySubscriptionExternalId: () => {},
  shouldDisplaySubscriptionName: false,
  setShouldDisplaySubscriptionName: () => {},
  selectedPlanInterval: undefined,
}

const TYPING_PLACEHOLDER_DATE = '2026-01-01'

export const SubscriptionInformationFormSection = withForm({
  defaultValues: buildSubscriptionDefaultValues(
    undefined,
    FORM_TYPE_ENUM.creation,
    TYPING_PLACEHOLDER_DATE,
  ),
  props: subscriptionInformationDefaultProps,
  render: function SubscriptionInformationFormSection({
    form,
    formType,
    subscription,
    customerTimezone,
    shouldDisplaySubscriptionExternalId,
    setShouldDisplaySubscriptionExternalId,
    shouldDisplaySubscriptionName,
    setShouldDisplaySubscriptionName,
    selectedPlanInterval,
  }) {
    const { translate } = useInternationalization()

    const subscriptionBillingTime = useStore(form.store, (state) => state.values.billingTime)
    const subscriptionAt = useStore(form.store, (state) => state.values.subscriptionAt)

    const billingTimeHelper = useMemo(() => {
      const billingTime = subscriptionBillingTime
      const currentDate = subscriptionAt
        ? DateTime.fromISO(subscriptionAt)
        : DateTime.now().setLocale('en-gb')
      const formattedCurrentDate = currentDate.toFormat('LL/dd/yyyy')
      const february29 = `02/29/${DateTime.now().year}`
      const currentDay = currentDate.get('day')

      if (!selectedPlanInterval) return undefined

      switch (selectedPlanInterval) {
        case PlanInterval.Monthly:
          if (billingTime === BillingTimeEnum.Calendar)
            return translate('text_62ea7cd44cd4b14bb9ac1d7e')

          if (currentDay <= 28) {
            return translate('text_62ea7cd44cd4b14bb9ac1d82', { day: currentDay })
          } else if (currentDay === 29) {
            return translate('text_62ea7cd44cd4b14bb9ac1d86')
          } else if (currentDay === 30) {
            return translate('text_62ea7cd44cd4b14bb9ac1d8a')
          }
          return translate('text_62ea7cd44cd4b14bb9ac1d8e')

        case PlanInterval.Yearly:
          if (billingTime === BillingTimeEnum.Calendar)
            return translate('text_62ea7cd44cd4b14bb9ac1d92')

          if (formattedCurrentDate === february29) return translate('text_62ea7cd44cd4b14bb9ac1d9a')

          return translate('text_62ea7cd44cd4b14bb9ac1d96', {
            date: intlFormatDateTime(currentDate.toISO() || '', {
              formatDate: DateFormat.DATE_MED_SHORT,
            }).date,
          })

        case PlanInterval.Semiannual:
          return billingTime === BillingTimeEnum.Calendar
            ? translate('text_1757502242292q05inkc09vq')
            : translate('text_1757504174992y39ailqcch0', {
                date: intlFormatDateTime(currentDate.toISO() || '', {
                  formatDate: DateFormat.DATE_MED_SHORT,
                }).date,
              })

        case PlanInterval.Quarterly:
          if (billingTime === BillingTimeEnum.Calendar)
            return translate('text_64d6357b00dea100ad1cba34')

          if (currentDay <= 28) {
            return translate('text_64d6357b00dea100ad1cba36', { day: currentDay })
          } else if (currentDay === 29) {
            return translate('text_64d63ec2f6bd3f41a6e353ac')
          } else if (currentDay === 30) {
            return translate('text_64d63ec2f6bd3f41a6e353b0')
          }
          return translate('text_64d63ec2f6bd3f41a6e353b4')

        case PlanInterval.Weekly:
        default:
          return billingTime === BillingTimeEnum.Calendar
            ? translate('text_62ea7cd44cd4b14bb9ac1d9e')
            : translate('text_62ea7cd44cd4b14bb9ac1da2', { day: currentDate.weekdayLong })
      }
    }, [subscriptionBillingTime, subscriptionAt, selectedPlanInterval, translate])

    return (
      <CenteredPage.PageSection>
        {!subscription?.plan.parent && formType === FORM_TYPE_ENUM.edition && (
          <Alert type="info">{translate('text_652525609f420d00b83dd602')}</Alert>
        )}

        <CenteredPage.PageSectionTitle
          title={translate('text_17791987800304a3fihrighy')}
          description={translate('text_66630368f4333b00795b0e1c')}
        />

        <div className="flex flex-col gap-6" data-test="create-subscription-form-wrapper">
          {!!shouldDisplaySubscriptionExternalId && (
            <div className="flex flex-row gap-3 [&>*:first-child]:flex-1">
              <form.AppField name="externalId">
                {(field) => (
                  <field.TextInputField
                    disabled={formType !== FORM_TYPE_ENUM.creation}
                    label={translate('text_642a94e522316cd9e1875224')}
                    placeholder={translate('text_642ac1d1407baafb9e4390ee')}
                    helperText={translate('text_642ac28c65c2180085afe31a')}
                  />
                )}
              </form.AppField>
              <Tooltip
                className="mt-7 h-fit"
                disableHoverListener={formType !== FORM_TYPE_ENUM.creation}
                placement="top-end"
                title={translate('text_63aa085d28b8510cd46443ff')}
              >
                <Button
                  icon="trash"
                  disabled={formType !== FORM_TYPE_ENUM.creation}
                  variant="quaternary"
                  onClick={() => {
                    form.setFieldValue('externalId', '')
                    setShouldDisplaySubscriptionExternalId(false)
                  }}
                />
              </Tooltip>
            </div>
          )}

          {!!shouldDisplaySubscriptionName && (
            <div className="flex flex-row gap-3 [&>*:first-child]:flex-1">
              <form.AppField name="name">
                {(field) => (
                  <field.TextInputField
                    label={translate('text_62d7f6178ec94cd09370e2b9')}
                    placeholder={translate('text_62d7f6178ec94cd09370e2cb')}
                    helperText={translate('text_62d7f6178ec94cd09370e2d9')}
                  />
                )}
              </form.AppField>
              <Tooltip
                className="mt-7 h-fit"
                disableHoverListener={formType !== FORM_TYPE_ENUM.creation}
                placement="top-end"
                title={translate('text_63aa085d28b8510cd46443ff')}
              >
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    form.setFieldValue('name', '')
                    setShouldDisplaySubscriptionName(false)
                  }}
                />
              </Tooltip>
            </div>
          )}

          {(!shouldDisplaySubscriptionExternalId || !shouldDisplaySubscriptionName) && (
            <div className="flex items-center gap-4">
              {!shouldDisplaySubscriptionExternalId && (
                <Button
                  startIcon="plus"
                  disabled={formType !== FORM_TYPE_ENUM.creation}
                  variant="inline"
                  onClick={() => setShouldDisplaySubscriptionExternalId(true)}
                  data-test="show-external-id"
                >
                  {translate('text_65118a52df984447c1869472')}
                </Button>
              )}
              {!shouldDisplaySubscriptionName && (
                <Button
                  startIcon="plus"
                  variant="inline"
                  onClick={() => setShouldDisplaySubscriptionName(true)}
                  data-test="show-name"
                >
                  {translate('text_65118a52df984447c186947c')}
                </Button>
              )}
            </div>
          )}

          {formType !== FORM_TYPE_ENUM.upgradeDowngrade && (
            <>
              <form.AppField name="billingTime">
                {(field) => (
                  <field.ButtonSelectorField
                    disabled={formType !== FORM_TYPE_ENUM.creation}
                    label={translate('text_62ea7cd44cd4b14bb9ac1db7')}
                    helperText={billingTimeHelper}
                    options={[
                      {
                        label: translate(
                          getBillingTimeSelectorTranslationKey(selectedPlanInterval),
                        ),
                        value: BillingTimeEnum.Calendar,
                      },
                      {
                        label: translate('text_62ea7cd44cd4b14bb9ac1dbb'),
                        value: BillingTimeEnum.Anniversary,
                      },
                    ]}
                  />
                )}
              </form.AppField>

              <div>
                <div className="flex items-start gap-6 [&>*]:flex-1">
                  <form.AppField name="subscriptionAt">
                    {(field) => (
                      <field.DatePickerField
                        disabled={
                          formType !== FORM_TYPE_ENUM.creation &&
                          subscription?.status !== StatusTypeEnum.Pending
                        }
                        placement="auto"
                        label={translate('text_64ef55a730b88e3d2117b3c4')}
                        defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="endingAt">
                    {(field) => (
                      <field.DatePickerField
                        disablePast
                        placement="auto"
                        label={translate('text_64ef55a730b88e3d2117b3cc')}
                        defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                        inputProps={{ cleanable: true }}
                      />
                    )}
                  </form.AppField>
                </div>
                <form.Subscribe
                  selector={(state) => ({
                    endingAtErrors: state.fieldMeta.endingAt?.errors,
                    subscriptionAtErrors: state.fieldMeta.subscriptionAt?.errors,
                    endingAtValue: state.values.endingAt,
                    subscriptionAtValue: state.values.subscriptionAt,
                  })}
                >
                  {({ endingAtErrors, subscriptionAtErrors, endingAtValue, subscriptionAtValue }) =>
                    !endingAtErrors?.length &&
                    !subscriptionAtErrors?.length && (
                      <SubscriptionDatesOffsetHelperComponent
                        className="mt-1"
                        customerTimezone={customerTimezone}
                        subscriptionAt={subscriptionAtValue}
                        endingAt={endingAtValue}
                      />
                    )
                  }
                </form.Subscribe>
              </div>
            </>
          )}
        </div>
      </CenteredPage.PageSection>
    )
  },
})
