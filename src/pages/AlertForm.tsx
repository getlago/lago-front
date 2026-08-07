import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { Icon } from 'lago-design-system'
import { useCallback, useMemo } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { AlertNameAndCodeSection } from '~/components/alerts/AlertNameAndCodeSection'
import AlertThresholds, { isThresholdValueValid } from '~/components/alerts/Thresholds'
import { useAlertFormLeaveGuards } from '~/components/alerts/useAlertFormLeaveGuards'
import { createThresholdSetters, setCodeAlreadyExistsError } from '~/components/alerts/utils'
import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import { ComboBox, ComboboxItem } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  PLAN_SUBSCRIPTION_DETAILS_ROUTE,
  useNavigate,
} from '~/core/router'
import {
  AlertTypeEnum,
  CurrencyEnum,
  LagoApiError,
  useCreateSubscriptionAlertMutation,
  useGetExistingAlertsOfSubscriptionQuery,
  useGetSubscriptionAlertToEditQuery,
  useGetSubscriptionBillableMetricsQuery,
  useGetSubscriptionInfosQuery,
  useUpdateSubscriptionAlertMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import {
  mapFormToCreateInput,
  mapFormToUpdateInput,
  mapFromApiToForm,
} from '~/pages/alertForm/mappers'
import {
  isAlertTypePremiumLocked,
  isBillableMetricAlertType,
  isUnitsAlertType,
} from '~/pages/alertForm/utils'
import { subscriptionAlertValidationSchema } from '~/pages/alertForm/validationSchema'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

const SUBSCRIPTION_ALERT_FORM_ID = 'create-alert'

export const SUBSCRIPTION_ALERT_FORM_TEST_ID = 'subscription-alert-form'
export const SUBSCRIPTION_ALERT_TYPE_COMBOBOX_TEST_ID = 'subscription-alert-type-combobox'
export const SUBSCRIPTION_ALERT_TYPE_PREMIUM_OPTION_TEST_ID =
  'subscription-alert-type-premium-option'
export const CLOSE_SUBSCRIPTION_ALERT_BUTTON_TEST_ID = 'close-subscription-alert-button'
export const SUBMIT_SUBSCRIPTION_ALERT_TEST_ID = 'submit-subscription-alert'

gql`
  query getSubscriptionInfos($id: ID!) {
    subscription(id: $id) {
      id
      externalId
      plan {
        id
        amountCurrency
      }
    }
  }

  query getSubscriptionAlertToEdit($id: ID!) {
    subscriptionAlert(id: $id) {
      id
      alertType
      billableMetric {
        id
        code
        name
      }
      code
      name
      thresholds {
        code
        recurring
        value
      }
    }
  }

  query getExistingAlertsOfSubscription($subscriptionExternalId: String!, $limit: Int) {
    subscriptionAlerts(subscriptionExternalId: $subscriptionExternalId, limit: $limit) {
      collection {
        id
        alertType
        billableMetricId
      }
    }
  }

  query getSubscriptionBillableMetrics($page: Int, $limit: Int, $searchTerm: String, $planId: ID) {
    billableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm, planId: $planId) {
      collection {
        id
        code
        name
      }
    }
  }

  mutation createSubscriptionAlert($input: CreateSubscriptionAlertInput!) {
    createSubscriptionAlert(input: $input) {
      id
    }
  }

  mutation updateSubscriptionAlert($input: UpdateSubscriptionAlertInput!) {
    updateSubscriptionAlert(input: $input) {
      id
    }
  }
`

const AlertForm = () => {
  const { alertId = '', customerId = '', planId = '', subscriptionId = '' } = useParams()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()
  const { open: openPremiumWarningDialog } = usePremiumWarningDialog()
  const isEdition = !!alertId

  const { data: subscriptionData, loading: subscriptionLoading } = useGetSubscriptionInfosQuery({
    variables: { id: subscriptionId },
  })

  const {
    data: alertData,
    loading: alertLoading,
    error: alertError,
  } = useGetSubscriptionAlertToEditQuery({
    variables: { id: alertId },
    skip: !isEdition,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  const { data: existingAlertsData, loading: existingAlertsLoading } =
    useGetExistingAlertsOfSubscriptionQuery({
      variables: {
        subscriptionExternalId: subscriptionData?.subscription?.externalId || '',
        limit: 99999,
      },
      skip: isEdition || !subscriptionData?.subscription?.externalId,
      fetchPolicy: 'network-only',
    })

  const { data: subscriptionBillableMetricsData, loading: subscriptionBillableMetricsLoading } =
    useGetSubscriptionBillableMetricsQuery({
      variables: {
        page: 1,
        limit: 20,
        searchTerm: '',
        planId: subscriptionData?.subscription?.plan?.id,
      },
      skip:
        !subscriptionData?.subscription?.plan?.id ||
        (isEdition &&
          (alertLoading ||
            !alertData?.subscriptionAlert ||
            alertData.subscriptionAlert.alertType === AlertTypeEnum.CurrentUsageAmount ||
            alertData.subscriptionAlert.alertType === AlertTypeEnum.LifetimeUsageAmount)),
    })

  const isLoading =
    subscriptionLoading ||
    alertLoading ||
    existingAlertsLoading ||
    subscriptionBillableMetricsLoading

  const existingAlert = alertData?.subscriptionAlert
  const currency = subscriptionData?.subscription?.plan?.amountCurrency || CurrencyEnum.Usd

  const onLeave = useCallback(
    ({ replace = false }: { replace?: boolean } = {}) => {
      if (!!customerId) {
        navigate(
          generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
            customerId,
            subscriptionId,
            tab: CustomerSubscriptionDetailsTabsOptionsEnum.alerts,
          }),
          { replace },
        )
      } else if (!!planId) {
        navigate(
          generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
            planId,
            subscriptionId,
            tab: CustomerSubscriptionDetailsTabsOptionsEnum.alerts,
          }),
          { replace },
        )
      }
    },
    [customerId, navigate, planId, subscriptionId],
  )

  const { openDirtyAttributesWarning } = useAlertFormLeaveGuards({
    isEdition,
    alertLoading,
    alertError,
    onLeave,
  })

  const [updateAlert] = useUpdateSubscriptionAlertMutation({
    context: { silentErrorDetails: [LagoApiError.ValueAlreadyExist] },
  })
  const [createAlert] = useCreateSubscriptionAlertMutation({
    context: { silentErrorDetails: [LagoApiError.ValueAlreadyExist] },
  })

  const defaultValues = useMemo(
    () =>
      mapFromApiToForm({
        currency,
        alert: existingAlert,
      }),
    [currency, existingAlert],
  )

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: subscriptionAlertValidationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const { alertType: valueAlertType } = value

      // Guaranteed by the schema, narrows the type for the mappers
      if (!valueAlertType) return

      const validatedValues = { ...value, alertType: valueAlertType }

      if (!!existingAlert?.id) {
        const { data: updateData, errors } = await updateAlert({
          variables: {
            input: mapFormToUpdateInput(validatedValues, existingAlert.id, currency),
          },
        })

        if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
          setCodeAlreadyExistsError(formApi)

          return
        }

        if (!updateData?.updateSubscriptionAlert?.id) return

        addToast({
          severity: 'success',
          translateKey: 'text_1746623860224qwhtxyuophr',
        })
      } else {
        const { data: createData, errors } = await createAlert({
          variables: {
            input: mapFormToCreateInput(validatedValues, subscriptionId, currency),
          },
        })

        if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
          setCodeAlreadyExistsError(formApi)

          return
        }

        if (!createData?.createSubscriptionAlert?.id) return

        addToast({
          severity: 'success',
          translateKey: 'text_1746611635509ov7jepx55bz',
        })
      }

      onLeave()
    },
  })

  const isDirty = useStore(form.store, (state) => state.isDirty)
  const alertType = useStore(form.store, (state) => state.values.alertType)
  const billableMetricId = useStore(form.store, (state) => state.values.billableMetricId)
  const thresholds = useStore(form.store, (state) => state.values.thresholds)

  const showThresholdTable = useMemo(
    () =>
      alertType === AlertTypeEnum.CurrentUsageAmount ||
      alertType === AlertTypeEnum.LifetimeUsageAmount ||
      (isBillableMetricAlertType(alertType) && !!billableMetricId),
    [alertType, billableMetricId],
  )

  const comboboxData = useMemo(() => {
    return (subscriptionBillableMetricsData?.billableMetrics?.collection || []).map((item) => {
      const { id, code, name } = item

      const hasAlertOnBillableMetric = existingAlertsData?.subscriptionAlerts?.collection.some(
        (alert) => alert.billableMetricId === id && alert.alertType === alertType,
      )

      return {
        label: `${name} (${code})`,
        value: id,
        disabled: hasAlertOnBillableMetric,
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
      }
    })
  }, [
    subscriptionBillableMetricsData?.billableMetrics?.collection,
    existingAlertsData?.subscriptionAlerts?.collection,
    alertType,
  ])

  const { hasUsageAmountAlert, hasLifetimeUsageAmountAlert } = useMemo(() => {
    if (!existingAlertsData?.subscriptionAlerts?.collection.length) {
      return { hasUsageAmountAlert: false, hasLifetimeUsageAmountAlert: false }
    }

    const localHasUsageAmountAlert = existingAlertsData?.subscriptionAlerts?.collection.some(
      (alert) => alert.alertType === AlertTypeEnum.CurrentUsageAmount,
    )

    const localHasLifetimeUsageAmountAlert =
      existingAlertsData?.subscriptionAlerts?.collection.some(
        (alert) => alert.alertType === AlertTypeEnum.LifetimeUsageAmount,
      )

    return {
      hasUsageAmountAlert: localHasUsageAmountAlert,
      hasLifetimeUsageAmountAlert: localHasLifetimeUsageAmountAlert,
    }
  }, [existingAlertsData?.subscriptionAlerts?.collection])

  const alertTypeComboboxData = useMemo(() => {
    const options = [
      {
        label: translate('text_1748418710304kqjnk1owpeq'),
        value: AlertTypeEnum.LifetimeUsageAmount,
        disabled: hasLifetimeUsageAmountAlert,
      },
      {
        label: translate('text_1748358376584w0qzazvifco'),
        value: AlertTypeEnum.BillableMetricCurrentUsageUnits,
      },
      {
        label: translate('text_1774295657000uwtohmkfqaom'),
        value: AlertTypeEnum.BillableMetricLifetimeUsageUnits,
      },
      {
        label: translate('text_1746631350478l8lfdopffh1'),
        value: AlertTypeEnum.BillableMetricCurrentUsageAmount,
      },
      {
        label: translate('text_1746631350478bwa1swfpwkw'),
        value: AlertTypeEnum.CurrentUsageAmount,
        disabled: hasUsageAmountAlert,
      },
    ]

    // Premium-gated types stay listed, flagged with the sparkles affordance;
    // picking one opens the premium dialog instead of applying the value
    return options.map((option) => {
      if (!isAlertTypePremiumLocked(option.value, premiumIntegrations)) return option

      return {
        ...option,
        labelNode: (
          <span
            className="flex items-center gap-2"
            data-test={`${SUBSCRIPTION_ALERT_TYPE_PREMIUM_OPTION_TEST_ID}-${option.value}`}
          >
            {option.label}
            <Icon name="sparkles" />
          </span>
        ),
      }
    })
  }, [translate, hasLifetimeUsageAmountAlert, hasUsageAmountAlert, premiumIntegrations])

  const onAlertTypeChange = (value: string): void => {
    const newAlertType = value as AlertTypeEnum

    if (isAlertTypePremiumLocked(newAlertType, premiumIntegrations)) {
      openPremiumWarningDialog()

      return
    }

    form.setFieldValue('alertType', newAlertType)
    // Reset billableMetricId when alertType is changed
    form.setFieldValue('billableMetricId', '')
  }

  const hasAnyNonRecurringThresholdError = useMemo(() => {
    const localNonRecurringThresholds = thresholds.filter((threshold) => !threshold.recurring)

    return localNonRecurringThresholds.some((threshold, i) =>
      isThresholdValueValid(i, threshold.value, localNonRecurringThresholds),
    )
  }, [thresholds])

  const { setThresholds, setThresholdValue } = useMemo(() => createThresholdSetters(form), [form])

  const onAbort = () => (isDirty ? openDirtyAttributesWarning() : onLeave())

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  return (
    <CenteredPage.Wrapper>
      <form
        id={SUBSCRIPTION_ALERT_FORM_ID}
        className="flex size-full min-h-full flex-col overflow-auto"
        onSubmit={handleSubmit}
        data-test={SUBSCRIPTION_ALERT_FORM_TEST_ID}
      >
        <CenteredPage.Header>
          <div className="flex gap-3">
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {translate(
                isEdition ? 'text_1746623860224seuc6r7gdlc' : 'text_1746623860224049f02r3xcf',
              )}
            </Typography>
            <Chip size="small" label={translate('text_65d8d71a640c5400917f8a13')} />
          </div>
          <Button
            variant="quaternary"
            icon="close"
            onClick={onAbort}
            data-test={CLOSE_SUBSCRIPTION_ALERT_BUTTON_TEST_ID}
          />
        </CenteredPage.Header>

        <CenteredPage.Container>
          {isLoading && <FormLoadingSkeleton id={SUBSCRIPTION_ALERT_FORM_ID} />}
          {!isLoading && (
            <>
              <div className="not-last-child:mb-1">
                <Typography variant="headline" color="grey700">
                  {translate('text_17466299298753ff4t9izbty')}
                </Typography>
                <Typography variant="body" color="grey600">
                  {translate('text_17465238490260r2325jwada')}
                </Typography>
              </div>

              <div className="flex flex-col gap-12">
                <AlertNameAndCodeSection
                  form={form}
                  fields={{ name: 'name', code: 'code' }}
                  nameLabel={translate('text_1732286530467zstzwbegfiq')}
                  hasExistingCode={!!existingAlert?.code}
                />

                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead1">
                      {translate('text_17466299298762alw9zr25tb')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1746631350477wjvnr6ty57q')}
                    </Typography>
                  </div>
                  <div className="flex flex-col gap-6 *:flex-1">
                    <ComboBox
                      name="alertType"
                      label={translate('text_1746631350478jqk347d5dy4')}
                      placeholder={translate('text_1746631350478bwa1swfpwky')}
                      disabled={isEdition}
                      disableClearable={isEdition}
                      value={alertType}
                      data={alertTypeComboboxData}
                      onChange={onAlertTypeChange}
                      data-test={SUBSCRIPTION_ALERT_TYPE_COMBOBOX_TEST_ID}
                    />

                    {isBillableMetricAlertType(alertType) && (
                      <form.AppField name="billableMetricId">
                        {(field) => (
                          <field.ComboBoxField
                            label={translate('text_1746780648463scppfjbhd1b')}
                            placeholder={translate('text_1746780648463n39xfvr772k')}
                            disabled={isEdition}
                            data={comboboxData}
                          />
                        )}
                      </form.AppField>
                    )}

                    {showThresholdTable && (
                      <AlertThresholds
                        thresholds={thresholds}
                        setThresholds={setThresholds}
                        setThresholdValue={setThresholdValue}
                        currency={currency}
                        shouldHandleUnits={isUnitsAlertType(alertType)}
                      />
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </CenteredPage.Container>

        <CenteredPage.StickyFooter>
          <Button variant="quaternary" onClick={onAbort}>
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <form.AppForm>
            <form.SubmitButton
              variant="primary"
              disabled={isLoading || hasAnyNonRecurringThresholdError}
              dataTest={SUBMIT_SUBSCRIPTION_ALERT_TEST_ID}
            >
              {translate(
                isEdition ? 'text_17432414198706rdwf76ek3u' : 'text_1747917472538el8fg31n3i8',
              )}
            </form.SubmitButton>
          </form.AppForm>
        </CenteredPage.StickyFooter>
      </form>
    </CenteredPage.Wrapper>
  )
}

export default AlertForm
