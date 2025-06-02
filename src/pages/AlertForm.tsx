import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { Chip } from 'lago-design-system'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import { array, boolean, number, object, string } from 'yup'

import AlertThresholds, { isThresholdValueValid } from '~/components/alerts/Thresholds'
import { Button, Typography } from '~/components/designSystem'
import { ComboBox, ComboBoxField, ComboboxItem, TextInputField } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, PLAN_SUBSCRIPTION_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount, serializeAmount } from '~/core/serializers/serializeAmount'
import {
  AlertThreshold,
  AlertTypeEnum,
  CreateSubscriptionAlertInput,
  CurrencyEnum,
  ThresholdInput,
  useCreateSubscriptionAlertMutation,
  useGetExistingAlertsOfSubscriptionQuery,
  useGetSubscriptionAlertToEditQuery,
  useGetSubscriptionBillableMetricsQuery,
  useGetSubscriptionInfosQuery,
  useUpdateSubscriptionAlertMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

const sortAndFormatThresholds = (
  thresholds: AlertThreshold[],
  currency: CurrencyEnum,
  shouldHandleUnits: boolean,
): AlertThreshold[] => {
  const formattedThresholds = thresholds.map((threshold) => ({
    ...threshold,
    value: shouldHandleUnits
      ? threshold.value.split('.')[0]
      : String(deserializeAmount(threshold.value, currency)),
  }))

  const recurringThreshold = formattedThresholds.find((threshold) => threshold.recurring)
  const nonRecurringThresholds = formattedThresholds.filter((threshold) => !threshold.recurring)

  // Sort the non-recurring thresholds by value
  const sortedNonRecurringThresholds = nonRecurringThresholds.sort((a, b) => {
    if (a.value && !b.value) return -1
    if (!a.value && b.value) return 1
    return 0
  })

  // Combine the recurring threshold with the sorted non-recurring thresholds
  return [...sortedNonRecurringThresholds, ...(!!recurringThreshold ? [recurringThreshold] : [])]
}

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
    alert(id: $id) {
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
    alerts(subscriptionExternalId: $subscriptionExternalId, limit: $limit) {
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
  const warningDirtyAttributesDialogRef = useRef<WarningDialogRef>(null)
  const isEdition = !!alertId

  const { data: subscriptionData, loading: subscriptionLoading } = useGetSubscriptionInfosQuery({
    variables: { id: subscriptionId },
  })

  const { data: alertData, loading: alertLoading } = useGetSubscriptionAlertToEditQuery({
    variables: { id: alertId },
    skip: !isEdition,
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
        (isEdition && alertData?.alert?.alertType === AlertTypeEnum.CurrentUsageAmount),
    })

  const isLoading =
    subscriptionLoading ||
    alertLoading ||
    existingAlertsLoading ||
    subscriptionBillableMetricsLoading

  const existingAlert = alertData?.alert
  const currency = subscriptionData?.subscription?.plan?.amountCurrency || CurrencyEnum.Usd

  const onLeave = useCallback(() => {
    if (!!customerId) {
      navigate(
        generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
          customerId,
          subscriptionId,
          tab: CustomerSubscriptionDetailsTabsOptionsEnum.alerts,
        }),
      )
    } else if (!!planId) {
      navigate(
        generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
          planId,
          subscriptionId,
          tab: CustomerSubscriptionDetailsTabsOptionsEnum.alerts,
        }),
      )
    }
  }, [customerId, navigate, planId, subscriptionId])

  const [updateAlert, { error: updateError }] = useUpdateSubscriptionAlertMutation({
    onCompleted({ updateSubscriptionAlert }) {
      if (!!updateSubscriptionAlert?.id) {
        addToast({
          severity: 'success',
          translateKey: 'text_1746623860224qwhtxyuophr',
        })

        onLeave()
      }
    },
  })

  const [createAlert, { error: createError }] = useCreateSubscriptionAlertMutation({
    onCompleted({ createSubscriptionAlert }) {
      if (!!createSubscriptionAlert?.id) {
        addToast({
          severity: 'success',
          translateKey: 'text_1746611635509ov7jepx55bz',
        })

        onLeave()
      }
    },
  })

  const formikProps = useFormik<CreateSubscriptionAlertInput>({
    initialValues: {
      name: existingAlert?.name || '',
      code: existingAlert?.code || '',
      // @ts-expect-error alertType is mandatory but default value should be empty string
      alertType: existingAlert?.alertType || '',
      billableMetricId: existingAlert?.billableMetric?.id || '',
      // Note: we need to sort the thresholds by value and recuring last.
      // We don't really know how the backend will return the thresholds as we don't check the order if they are saved via API
      thresholds: !!existingAlert?.thresholds?.length
        ? sortAndFormatThresholds(
            existingAlert?.thresholds,
            currency,
            existingAlert?.alertType === AlertTypeEnum.BillableMetricCurrentUsageUnits,
          )
        : [
            {
              code: '',
              recurring: false,
              value: '',
            },
          ],
    },
    validationSchema: object().shape({
      name: string(),
      code: string().required(''),
      alertType: string().required(''),
      billableMetricId: string(),
      thresholds: array()
        .of(
          object().shape({
            code: string(),
            recurring: boolean().required(''),
            value: number().required(''),
          }),
        )
        .nullable(),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async ({ billableMetricId, alertType, thresholds, ...values }) => {
      const formattedThresholds = thresholds?.map((threshold) => ({
        ...threshold,
        value:
          alertType === AlertTypeEnum.BillableMetricCurrentUsageUnits
            ? threshold.value.split('.')[0]
            : String(serializeAmount(threshold.value, currency)),
      }))

      // Edition
      if (!!existingAlert?.id) {
        await updateAlert({
          variables: {
            input: {
              ...values,
              id: existingAlert.id,
              billableMetricId: billableMetricId || undefined,
              thresholds: formattedThresholds || undefined,
            },
          },
        })
      } else {
        await createAlert({
          variables: {
            input: {
              ...values,
              alertType,
              subscriptionId: subscriptionId,
              billableMetricId: billableMetricId || undefined,
              thresholds: formattedThresholds || undefined,
            },
          },
        })
      }
    },
  })

  useEffect(() => {
    if (hasDefinedGQLError('ValueAlreadyExist', createError || updateError)) {
      formikProps.setFieldError('code', 'text_632a2d437e341dcc76817556')
      const rootElement = document.getElementById('root')

      if (!rootElement) return
      rootElement.scrollTo({ top: 0 })
    }

    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createError, formikProps.setFieldError, updateError])

  const showThresholdTable = useMemo(
    () =>
      formikProps.values.alertType === AlertTypeEnum.CurrentUsageAmount ||
      formikProps.values.alertType === AlertTypeEnum.LifetimeUsageAmount ||
      ((formikProps.values.alertType === AlertTypeEnum.BillableMetricCurrentUsageUnits ||
        formikProps.values.alertType === AlertTypeEnum.BillableMetricCurrentUsageAmount) &&
        !!formikProps.values.billableMetricId),
    [formikProps.values.alertType, formikProps.values.billableMetricId],
  )

  const comboboxData = useMemo(() => {
    return (subscriptionBillableMetricsData?.billableMetrics?.collection || []).map((item) => {
      const { id, code, name } = item

      const hasAlertOnBillableMetric = existingAlertsData?.alerts.collection.some(
        (alert) =>
          alert.billableMetricId === id && alert.alertType === formikProps.values.alertType,
      )

      return {
        label: `${name} (${code})`,
        value: id,
        disabled: hasAlertOnBillableMetric,
        labelNode: (
          <ComboboxItem className="flex flex-col items-start">
            <Typography color="grey700" noWrap>
              {name}
            </Typography>
            <Typography color="textPrimary" noWrap>
              ({code})
            </Typography>
          </ComboboxItem>
        ),
      }
    })
  }, [
    subscriptionBillableMetricsData?.billableMetrics?.collection,
    existingAlertsData?.alerts.collection,
    formikProps.values.alertType,
  ])

  const { hasUsageAmountAlert, hasLifetimeUsageAmountAlert } = useMemo(() => {
    if (!existingAlertsData?.alerts.collection.length) {
      return { hasUsageAmountAlert: false }
    }

    const localHasUsageAmountAlert = existingAlertsData?.alerts.collection.some(
      (alert) => alert.alertType === AlertTypeEnum.CurrentUsageAmount,
    )

    const localHasLifetimeUsageAmountAlert = existingAlertsData?.alerts.collection.some(
      (alert) => alert.alertType === AlertTypeEnum.LifetimeUsageAmount,
    )

    return {
      hasUsageAmountAlert: localHasUsageAmountAlert,
      hasLifetimeUsageAmountAlert: localHasLifetimeUsageAmountAlert,
    }
  }, [existingAlertsData?.alerts.collection])

  const hasAnyNonRecurringThresholdError = useMemo(() => {
    const localNonRecurringThresholds = formikProps.values.thresholds.filter(
      (threshold) => !threshold.recurring,
    )

    return localNonRecurringThresholds.some((threshold, i) =>
      isThresholdValueValid(i, threshold.value, localNonRecurringThresholds),
    )
  }, [formikProps.values.thresholds])

  const setThresholds = (thresholds: ThresholdInput[]) => {
    formikProps.setFieldValue('thresholds', thresholds)
  }

  const setThresholdValue = ({
    index,
    key,
    newValue,
  }: {
    index: number
    key: keyof ThresholdInput
    newValue: unknown
  }) => {
    formikProps.setFieldValue(`thresholds.${index}.${key}`, newValue)
  }

  return (
    <>
      <CenteredPage.Wrapper>
        <CenteredPage.Header>
          <div className="flex gap-2">
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
            onClick={() =>
              formikProps.dirty ? warningDirtyAttributesDialogRef.current?.openDialog() : onLeave()
            }
          />
        </CenteredPage.Header>

        <CenteredPage.Container>
          {isLoading && <FormLoadingSkeleton id="create-alert" />}
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
                <section className="pb-12 shadow-b not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead">
                      {translate('text_1746629929876zz4937djyc8')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1746629929876gdgxt1v86eq')}
                    </Typography>
                  </div>
                  <div className="flex gap-6 *:flex-1">
                    <TextInputField
                      name="name"
                      label={translate('text_1732286530467zstzwbegfiq')}
                      placeholder={translate('text_62876e85e32e0300e1803121')}
                      formikProps={formikProps}
                    />
                    <TextInputField
                      name="code"
                      label={translate('text_62876e85e32e0300e1803127')}
                      placeholder={translate('text_623b42ff8ee4e000ba87d0c4')}
                      formikProps={formikProps}
                      error={formikProps.errors.code}
                    />
                  </div>
                </section>

                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead">
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
                      value={formikProps.values.alertType}
                      data={[
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
                          label: translate('text_1746631350478l8lfdopffh1'),
                          value: AlertTypeEnum.BillableMetricCurrentUsageAmount,
                        },
                        {
                          label: translate('text_1746631350478bwa1swfpwkw'),
                          value: AlertTypeEnum.CurrentUsageAmount,
                          disabled: hasUsageAmountAlert,
                        },
                      ]}
                      onChange={(value) => {
                        const newFormikValues = {
                          ...formikProps.values,
                          alertType: value as AlertTypeEnum,
                          // Reset billableMetricId when alertType is changed
                          billableMetricId: '',
                        }

                        formikProps.setValues(newFormikValues)
                      }}
                    />

                    {(formikProps.values.alertType ===
                      AlertTypeEnum.BillableMetricCurrentUsageAmount ||
                      formikProps.values.alertType ===
                        AlertTypeEnum.BillableMetricCurrentUsageUnits) && (
                      <>
                        <ComboBoxField
                          name="billableMetricId"
                          label={translate('text_1746780648463scppfjbhd1b')}
                          placeholder={translate('text_1746780648463n39xfvr772k')}
                          disabled={isEdition}
                          data={comboboxData}
                          formikProps={formikProps}
                        />
                      </>
                    )}

                    {showThresholdTable && (
                      <AlertThresholds
                        thresholds={formikProps.values.thresholds}
                        setThresholds={setThresholds}
                        setThresholdValue={setThresholdValue}
                        currency={currency}
                        shouldHandleUnits={
                          formikProps.values.alertType ===
                          AlertTypeEnum.BillableMetricCurrentUsageUnits
                        }
                      />
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </CenteredPage.Container>

        <CenteredPage.StickyFooter>
          <Button
            variant="quaternary"
            size="large"
            onClick={() =>
              formikProps.dirty ? warningDirtyAttributesDialogRef.current?.openDialog() : onLeave()
            }
          >
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <Button
            variant="primary"
            size="large"
            disabled={
              !formikProps.isValid ||
              !formikProps.dirty ||
              isLoading ||
              hasAnyNonRecurringThresholdError
            }
            onClick={formikProps.submitForm}
          >
            {translate(
              isEdition ? 'text_17432414198706rdwf76ek3u' : 'text_1747917472538el8fg31n3i8',
            )}
          </Button>
        </CenteredPage.StickyFooter>
      </CenteredPage.Wrapper>

      <WarningDialog
        ref={warningDirtyAttributesDialogRef}
        title={translate('text_6244277fe0975300fe3fb940')}
        description={translate('text_1746623860224gh7o1exyjch')}
        continueText={translate('text_6244277fe0975300fe3fb94c')}
        onContinue={onLeave}
      />
    </>
  )
}

export default AlertForm
