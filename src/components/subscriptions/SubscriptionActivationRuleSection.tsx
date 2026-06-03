import InputAdornment from '@mui/material/InputAdornment'
import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { useDisplayedPaymentMethod } from '~/components/paymentMethodSelection/useDisplayedPaymentMethod'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { ActivationRuleFormTypeEnum } from '~/core/constants/subscriptionActivationRules'
import { PaymentMethodTypeEnum, StatusTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'
import { withForm } from '~/hooks/forms/useAppform'

import {
  buildSubscriptionDefaultValues,
  SubscriptionFormType,
} from './form/buildSubscriptionDefaultValues'

interface SubscriptionActivationRuleSectionExtraProps {
  customerExternalId?: string | null
  customerHasPaymentProvider?: boolean
  formType: SubscriptionFormType
  subscriptionStatus?: StatusTypeEnum | null
}

const TYPING_PLACEHOLDER_DATE = '2026-01-01'

const subscriptionActivationRuleDefaultProps: SubscriptionActivationRuleSectionExtraProps = {
  customerExternalId: undefined,
  customerHasPaymentProvider: false,
  formType: FORM_TYPE_ENUM.creation,
  subscriptionStatus: undefined,
}

export const SubscriptionActivationRuleSection = withForm({
  defaultValues: buildSubscriptionDefaultValues(
    undefined,
    FORM_TYPE_ENUM.creation,
    TYPING_PLACEHOLDER_DATE,
  ),
  props: subscriptionActivationRuleDefaultProps,
  render: function SubscriptionActivationRuleSection({
    form,
    customerExternalId,
    customerHasPaymentProvider,
    formType,
    subscriptionStatus,
  }) {
    const { translate } = useInternationalization()

    const paymentMethod = useStore(form.store, (state) => state.values.paymentMethod)
    const activationRuleType = useStore(form.store, (state) => state.values.activationRuleType)

    const {
      data: paymentMethodsList,
      loading: paymentMethodsLoading,
      error: paymentMethodsError,
    } = usePaymentMethodsList({
      externalCustomerId: customerExternalId || '',
      withDeleted: false,
      skip: !customerExternalId,
    })

    const displayedPaymentMethod = useDisplayedPaymentMethod(paymentMethod, paymentMethodsList)
    const hasResolvedPaymentMethods = !paymentMethodsLoading || paymentMethodsError

    const isExplicitManualPaymentMethod =
      paymentMethod?.paymentMethodType === PaymentMethodTypeEnum.Manual

    const isPaymentActivationUnavailable =
      isExplicitManualPaymentMethod ||
      (!customerHasPaymentProvider &&
        (!customerExternalId || (hasResolvedPaymentMethods && displayedPaymentMethod.isManual)))

    const isEditable = useMemo(() => {
      return (
        formType === FORM_TYPE_ENUM.creation ||
        formType === FORM_TYPE_ENUM.upgradeDowngrade ||
        (formType === FORM_TYPE_ENUM.edition && subscriptionStatus === StatusTypeEnum.Pending)
      )
    }, [formType, subscriptionStatus])

    useEffect(() => {
      if (
        isPaymentActivationUnavailable &&
        activationRuleType === ActivationRuleFormTypeEnum.OnPayment
      ) {
        form.setFieldValue('activationRuleType', ActivationRuleFormTypeEnum.Immediately)
      }
    }, [activationRuleType, form, isPaymentActivationUnavailable])

    return (
      <div className="flex flex-col gap-6" data-test="subscription-activation-rule-section">
        <div className="flex flex-col gap-2">
          <CenteredPage.SubsectionTitle title={translate('text_17798820214653y71jn6hh2s')} />
          <form.AppField name="activationRuleType">
            {(field) => (
              <field.RadioGroupField
                optionsGapSpacing={3}
                optionLabelVariant="body"
                disabled={!isEditable}
                options={[
                  {
                    value: ActivationRuleFormTypeEnum.Immediately,
                    label: translate('text_1779882021465z73glv4ru42'),
                    sublabel: translate('text_1779882021465b4cvr8upxvp'),
                  },
                  {
                    value: ActivationRuleFormTypeEnum.OnPayment,
                    label: translate('text_17798820214653lthtne1wrc'),
                    sublabel: translate('text_17798820214653qiqu79w4hp'),
                    disabled: isPaymentActivationUnavailable,
                  },
                ]}
              />
            )}
          </form.AppField>
        </div>

        {isPaymentActivationUnavailable && isEditable && (
          <Typography variant="caption" color="grey600">
            {translate('text_177988202146608wxqmm26tb')}
          </Typography>
        )}

        {activationRuleType === ActivationRuleFormTypeEnum.OnPayment && (
          <form.AppField name="activationRuleTimeoutHours">
            {(field) => (
              <field.TextInputField
                disabled={!isEditable || isPaymentActivationUnavailable}
                label={translate('text_1779882021465u30p886nhn9')}
                description={translate('text_1779882021466w4zlmq76sk3')}
                beforeChangeFormatter={['positiveNumber', 'int']}
                placeholder="0"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="caption" color="grey600">
                        {translate('text_1779882021466zksievk0gq7')}
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          </form.AppField>
        )}
      </div>
    )
  },
})
