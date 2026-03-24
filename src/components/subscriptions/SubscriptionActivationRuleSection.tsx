import InputAdornment from '@mui/material/InputAdornment'
import { FormikProps } from 'formik'
import { useEffect } from 'react'

import { RadioGroupField, TextInputField } from '~/components/form'
import { useDisplayedPaymentMethod } from '~/components/paymentMethodSelection/useDisplayedPaymentMethod'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { StatusTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'

import { ActivationRuleFormEnum, SubscriptionFormInput } from '../../pages/subscriptions/types'

export const ACTIVATION_RULE_RADIO_GROUP_TEST_ID = 'activation-rule-radio-group'
export const ACTIVATION_RULE_TIMEOUT_INPUT_TEST_ID = 'activation-rule-timeout-input'

type SubscriptionActivationRuleSectionProps = {
  formikProps: FormikProps<SubscriptionFormInput>
  customerExternalId: string
  formType: keyof typeof FORM_TYPE_ENUM
  subscriptionStatus?: StatusTypeEnum | null
}

export const SubscriptionActivationRuleSection = ({
  formikProps,
  customerExternalId,
  formType,
  subscriptionStatus,
}: SubscriptionActivationRuleSectionProps) => {
  const { translate } = useInternationalization()

  const { data: paymentMethodsList } = usePaymentMethodsList({
    externalCustomerId: customerExternalId,
    withDeleted: false,
  })

  const displayedPaymentMethod = useDisplayedPaymentMethod(
    formikProps.values.paymentMethod ?? {},
    paymentMethodsList,
  )
  const isActivationRuleDisabled = displayedPaymentMethod.isManual

  useEffect(() => {
    if (isActivationRuleDisabled) {
      formikProps.setFieldValue('activationRuleType', ActivationRuleFormEnum.Immediately)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActivationRuleDisabled])

  const isEditable =
    formType === FORM_TYPE_ENUM.creation ||
    (formType === FORM_TYPE_ENUM.edition && subscriptionStatus === StatusTypeEnum.Pending) ||
    formType === FORM_TYPE_ENUM.upgradeDowngrade

  return (
    <>
      <div className="[&_legend]:mb-3" data-test={ACTIVATION_RULE_RADIO_GROUP_TEST_ID}>
        <RadioGroupField
          name="activationRuleType"
          formikProps={formikProps}
          label={translate('text_1774274555758yn0kztg160u')}
          disabled={isActivationRuleDisabled || !isEditable}
          options={[
            {
              value: ActivationRuleFormEnum.Immediately,
              label: translate('text_1774274555759oo1rqvg33iz'),
              sublabel: translate('text_17742745557593possf8huc3'),
            },
            {
              value: ActivationRuleFormEnum.OnPayment,
              label: translate('text_17742745557597vai37evtbt'),
              sublabel: translate('text_1774274555759vljy79w32sw'),
            },
          ]}
        />
      </div>

      {formikProps.values.activationRuleType === ActivationRuleFormEnum.OnPayment && (
        <TextInputField
          name="activationRuleTimeoutHours"
          formikProps={formikProps}
          label={translate('text_17742745557593afwzzmtgnb')}
          helperText={translate('text_1774274555759s8j4kpfuyci')}
          placeholder="24"
          beforeChangeFormatter={['positiveNumber', 'int']}
          disabled={!isEditable}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {translate('text_17742745557598h0labk74v1')}
              </InputAdornment>
            ),
          }}
        />
      )}
    </>
  )
}
