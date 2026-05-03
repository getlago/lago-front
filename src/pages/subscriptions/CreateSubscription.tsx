import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  generatePath,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { SubscriptionDatesOffsetHelperComponent } from '~/components/customers/subscriptions/SubscriptionDatesOffsetHelperComponent'
import { Alert } from '~/components/designSystem/Alert'
import { Avatar } from '~/components/designSystem/Avatar'
import { Button } from '~/components/designSystem/Button'
import { Selector } from '~/components/designSystem/Selector'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { WarningDialog, WarningDialogRef } from '~/components/designSystem/WarningDialog'
import { BasicComboBoxData, ComboboxItem } from '~/components/form'
import { toInvoiceCustomSectionReference } from '~/components/invoceCustomFooter/utils'
import {
  EditInvoiceDisplayNameDialog,
  EditInvoiceDisplayNameDialogRef,
} from '~/components/invoices/EditInvoiceDisplayNameDialog'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PaymentMethodsInvoiceSettings } from '~/components/paymentMethodsInvoiceSettings/PaymentMethodsInvoiceSettings'
import {
  PaymentMethodsInvoiceSettingsProps,
  ViewTypeEnum,
} from '~/components/paymentMethodsInvoiceSettings/types'
import { CommitmentsSection } from '~/components/plans/CommitmentsSection'
import { FixedChargesSection } from '~/components/plans/form/FixedChargesSection'
import { PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { SubscriptionFeeSection } from '~/components/plans/SubscriptionFeeSection'
import { LocalUsageChargeInput } from '~/components/plans/types'
import { UsageChargesSection } from '~/components/plans/UsageChargesSection'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { FeatureEntitlementSection } from '~/components/subscriptions/FeatureEntitlementSection'
import { ProgressiveBillingSection } from '~/components/subscriptions/ProgressiveBillingSection'
import { REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE } from '~/components/subscriptions/SubscriptionUsageLifetimeGraph'
import { PlanFormProvider } from '~/contexts/PlanFormContext'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  PLAN_SUBSCRIPTION_DETAILS_ROUTE,
} from '~/core/router'
import { DateFormat, getTimezoneConfig, intlFormatDateTime } from '~/core/timezone'
import {
  subscriptionFormSchema,
  SubscriptionFormValues,
} from '~/formValidation/subscriptionFormSchema'
import {
  AddSubscriptionPlanFragmentDoc,
  BillingTimeEnum,
  CurrencyEnum,
  FeatureEntitlementForPlanFragmentDoc,
  FeatureFlagEnum,
  GetSubscriptionForCreateSubscriptionQuery,
  PlanInterval,
  StatusTypeEnum,
  TimezoneEnum,
  useGetCustomerForCreateSubscriptionQuery,
  useGetPlansLazyQuery,
  useGetSubscriptionForCreateSubscriptionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAddSubscription } from '~/hooks/customer/useAddSubscription'
import { useAppForm } from '~/hooks/forms/useAppform'
import { usePlanForm } from '~/hooks/plans/usePlanForm'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useIframeConfig } from '~/hooks/useIframeConfig'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'
import { tw } from '~/styles/utils'

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

gql`
  fragment AddSubscriptionPlan on Plan {
    id
    name
    code
    interval

    ...FeatureEntitlementForPlan
  }

  query getPlans($page: Int, $limit: Int, $searchTerm: String) {
    plans(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        ...AddSubscriptionPlan
      }
    }
  }

  query getCustomerForCreateSubscription($id: ID!) {
    customer(id: $id) {
      id
      applicableTimezone
      name
      displayName
      externalId
    }
  }

  query getSubscriptionForCreateSubscription($id: ID!) {
    subscription(id: $id) {
      id
      name
      externalId
      subscriptionAt
      endingAt
      billingTime
      periodEndDate
      status
      startedAt
      paymentMethodType
      paymentMethod {
        id
      }
      skipInvoiceCustomSections
      selectedInvoiceCustomSections {
        id
        name
        code
      }
      plan {
        id
        parent {
          id
        }
        ...AddSubscriptionPlan
      }
    }
  }

  ${AddSubscriptionPlanFragmentDoc}
  ${FeatureEntitlementForPlanFragmentDoc}
`

type SubscriptionData = GetSubscriptionForCreateSubscriptionQuery['subscription']

const buildSubscriptionDefaultValues = (
  sub: SubscriptionData,
  ft: string,
  currentDate: string,
): SubscriptionFormValues => ({
  planId: ft !== FORM_TYPE_ENUM.upgradeDowngrade ? sub?.plan?.id || '' : '',
  name: ft !== FORM_TYPE_ENUM.upgradeDowngrade ? sub?.name || '' : '',
  externalId: sub?.externalId || '',
  subscriptionAt: sub?.subscriptionAt || currentDate,
  endingAt: sub?.endingAt || undefined,
  billingTime: sub?.billingTime || BillingTimeEnum.Calendar,
  paymentMethod: {
    paymentMethodType: sub?.paymentMethodType,
    paymentMethodId: sub?.paymentMethod?.id,
  },
  invoiceCustomSection: {
    invoiceCustomSections: sub?.selectedInvoiceCustomSections || [],
    skipInvoiceCustomSections: sub?.skipInvoiceCustomSections || false,
  },
})

const CreateSubscription = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const { customerId, subscriptionId } = useParams()
  const { hasFeatureFlag, intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { isRunningInSalesForceIframe, isRunningInIframeContext } = useIframeConfig()

  const editInvoiceDisplayNameDialogRef = useRef<EditInvoiceDisplayNameDialogRef>(null)
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const [showCurrencyError, setShowCurrencyError] = useState<boolean>(false)
  const hasAccessToMultiPaymentFlow = hasFeatureFlag(FeatureFlagEnum.MultiplePaymentMethods)

  const [getPlans, { loading: planLoading, data: planData }] = useGetPlansLazyQuery({
    variables: { limit: 1000 },
  })
  const { data: customerData } = useGetCustomerForCreateSubscriptionQuery({
    variables: { id: customerId as string },
  })
  const customer = customerData?.customer
  const { data: subscriptionData, loading: subscriptionLoading } =
    useGetSubscriptionForCreateSubscriptionQuery({
      variables: { id: subscriptionId as string },
      skip: !subscriptionId,
    })

  const subscription = subscriptionData?.subscription

  const GMT = getTimezoneConfig(TimezoneEnum.TzUtc).name
  const currentDateRef = useRef<string>(DateTime.now().setZone(GMT).startOf('day').toISO())
  const isInSubscriptionForm = location.pathname.includes('/subscription')

  const { onSave, formType } = useAddSubscription({ existingSubscription: subscription })

  const subscriptionForm = useAppForm({
    defaultValues: buildSubscriptionDefaultValues(
      subscription,
      formType,
      currentDateRef.current || '',
    ),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: subscriptionFormSchema,
    },
    onSubmit: async ({ value }) => {
      const { invoiceCustomSection, ...restValues } = value

      const localValues = {
        id: formType === FORM_TYPE_ENUM.edition ? subscription?.id : undefined,
        ...restValues,
        invoiceCustomSection: toInvoiceCustomSectionReference(invoiceCustomSection),
      }
      const rootElement = document.getElementById('root')
      const errorsString = await onSave(
        customerId as string,
        localValues,
        planForm.state.values,
        planFormIsDirty,
      )

      if (errorsString === 'CurrenciesDoesNotMatch') {
        rootElement?.scrollTo({ top: 0, behavior: 'smooth' })
        return setShowCurrencyError(true)
      } else if (errorsString === 'ValueAlreadyExist') {
        rootElement?.scrollTo({ top: 0, behavior: 'smooth' })
        subscriptionForm.setFieldMeta('externalId', (prev) => ({
          ...prev,
          errorMap: {
            ...prev.errorMap,
            onSubmit: translate('text_668513bb1906740145e06abe'),
          },
        }))
      }
    },
  })

  // Reactive subscriptions for render — never read form.state.* directly in JSX
  const subscriptionPlanId = useStore(subscriptionForm.store, (s) => s.values.planId)
  const subscriptionIsDirty = useStore(subscriptionForm.store, (s) => s.isDirty)
  const subscriptionCanSubmit = useStore(subscriptionForm.store, (s) => s.canSubmit)
  const subscriptionIsSubmitting = useStore(subscriptionForm.store, (s) => s.isSubmitting)

  const { form: planForm, plan } = usePlanForm({
    planIdToFetch: subscriptionPlanId,
    isUsedInSubscriptionForm: true,
  })

  const alreadyExistingPlanFixedChargesIds =
    plan?.fixedCharges?.map((fixedCharge) => fixedCharge.id) || []

  const planFormIsDirty = useStore(planForm.store, (s) => s.isDirty)
  const planFormCanSubmit = useStore(planForm.store, (s) => s.canSubmit)

  // Replace enableReinitialize — reset form when subscription data changes
  const prevSubscriptionRef = useRef(subscription)

  useEffect(() => {
    if (subscription && subscription !== prevSubscriptionRef.current) {
      subscriptionForm.reset(
        buildSubscriptionDefaultValues(subscription, formType, currentDateRef.current || ''),
        { keepDefaultValues: false },
      )
      prevSubscriptionRef.current = subscription
    }
  }, [subscription, formType, subscriptionForm, currentDateRef])

  const [shouldDisplaySubscriptionExternalId, setShouldDisplaySubscriptionExternalId] =
    useState<boolean>(!!subscription?.externalId)
  const [shouldDisplaySubscriptionName, setShouldDisplaySubscriptionName] = useState<boolean>(
    !!(formType !== FORM_TYPE_ENUM.upgradeDowngrade && subscription?.name),
  )

  useEffect(() => {
    setShouldDisplaySubscriptionExternalId(!!subscription?.externalId)
  }, [subscription?.externalId])

  useEffect(() => {
    setShouldDisplaySubscriptionName(
      !!(formType !== FORM_TYPE_ENUM.upgradeDowngrade && subscription?.name),
    )
  }, [subscription?.name, formType])

  // Remove currency error is value changes
  useEffect(() => {
    setShowCurrencyError(false)
  }, [planForm.state.values.amountCurrency])

  const selectedPlan = useMemo(() => {
    if (!planData?.plans?.collection || !subscriptionPlanId) return undefined

    return (planData?.plans?.collection || []).find((p) => p.id === subscriptionPlanId)
  }, [planData?.plans?.collection, subscriptionPlanId])

  const comboboxPlansData = useMemo(() => {
    if (!planData?.plans?.collection?.length) return []

    const localPlanCollection = [...(planData?.plans?.collection || {})]

    // If sub plan is not part of the plans collection, add it
    if (!localPlanCollection.find((p) => p.id === subscription?.plan.id) && !!subscription?.plan) {
      localPlanCollection.unshift(subscription?.plan)
    }

    return localPlanCollection.reduce<BasicComboBoxData[]>((acc, { id, name, code }) => {
      // Hide parent plan
      if (formType === FORM_TYPE_ENUM.upgradeDowngrade && id === subscription?.plan?.parent?.id) {
        return acc
      }

      return [
        ...acc,
        {
          label: `${name} (${code})`,
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
          value: id,
          disabled:
            formType === FORM_TYPE_ENUM.upgradeDowngrade &&
            !!subscription?.plan.id &&
            subscription?.plan.id === id,
        },
      ]
    }, [])
  }, [formType, planData?.plans?.collection, subscription?.plan])

  const subscriptionBillingTime = useStore(subscriptionForm.store, (s) => s.values.billingTime)
  const subscriptionAt = useStore(subscriptionForm.store, (s) => s.values.subscriptionAt)

  const billingTimeHelper = useMemo(() => {
    const billingTime = subscriptionBillingTime
    const currentDate = subscriptionAt
      ? DateTime.fromISO(subscriptionAt)
      : DateTime.now().setLocale('en-gb')
    const formattedCurrentDate = currentDate.toFormat('LL/dd/yyyy')
    const february29 = `02/29/${DateTime.now().year}`
    const currentDay = currentDate.get('day')

    if (!selectedPlan) return undefined

    switch (selectedPlan?.interval) {
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
  }, [subscriptionBillingTime, subscriptionAt, selectedPlan, translate])

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    subscriptionForm.handleSubmit()
  }

  // NOTE: useCallback here is needed
  // It handles the case where the user clicks on the button while being focused on a plan's input
  const SubmitButton = useCallback(() => {
    const buttonLabel = () => {
      if (formType === FORM_TYPE_ENUM.creation) return translate('text_65118a52df984447c1869463')
      if (formType === FORM_TYPE_ENUM.edition) return translate('text_62d7f6178ec94cd09370e63c')
      return translate('text_65118a52df984447c18694c6')
    }

    return (
      <Button
        type="submit"
        disabled={
          !subscriptionCanSubmit ||
          !planFormCanSubmit ||
          (formType === FORM_TYPE_ENUM.edition && !subscriptionIsDirty && !planFormIsDirty)
        }
        loading={subscriptionIsSubmitting}
        data-test="submit"
      >
        <Typography color="inherit" noWrap>
          {buttonLabel()}
        </Typography>
      </Button>
    )
  }, [
    formType,
    planFormIsDirty,
    planFormCanSubmit,
    subscriptionIsDirty,
    subscriptionCanSubmit,
    subscriptionIsSubmitting,
    translate,
  ])

  const customerName = customer?.displayName

  const navigateBack = useCallback(() => {
    const origin = searchParams.get('origin')
    const originSubscriptionId = searchParams.get('subscriptionId')
    const originCustomerId = searchParams.get('customerId')

    if (
      origin === REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE &&
      originSubscriptionId &&
      !!originCustomerId
    ) {
      navigate(
        generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
          customerId: originCustomerId,
          subscriptionId: originSubscriptionId,
          tab: CustomerSubscriptionDetailsTabsOptionsEnum.usage,
        }),
      )
    } else if (
      origin === REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE &&
      !!originSubscriptionId &&
      plan?.id
    ) {
      navigate(
        generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
          planId: plan?.id,
          subscriptionId: originSubscriptionId,
          tab: CustomerSubscriptionDetailsTabsOptionsEnum.usage,
        }),
      )
    } else {
      navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId as string }))
    }
  }, [searchParams, navigate, plan?.id, customerId])

  const handleClose = useCallback(() => {
    if (subscriptionIsDirty || planFormIsDirty) {
      warningDialogRef.current?.openDialog()
    } else {
      navigateBack()
    }
  }, [subscriptionIsDirty, planFormIsDirty, navigateBack])

  const pageHeaderTitle = useMemo(() => {
    if (formType === FORM_TYPE_ENUM.edition) {
      return translate('text_62d7f6178ec94cd09370e63c')
    } else if (formType === FORM_TYPE_ENUM.upgradeDowngrade) {
      return translate('text_65118a52df984447c18694c6')
    }
    return translate('text_17761091520516p9xpb0v574')
  }, [formType, translate])

  return (
    <>
      <form className="contents" onSubmit={handleFormSubmit}>
        <CenteredPage.Wrapper>
          <CenteredPage.Header>
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {pageHeaderTitle}
            </Typography>
            {!isRunningInSalesForceIframe && !isRunningInIframeContext && (
              <Button
                variant="quaternary"
                icon="close"
                onClick={handleClose}
                data-test="close-create-subscription-button"
              />
            )}
          </CenteredPage.Header>

          <CenteredPage.Container>
            {!!subscriptionLoading && formType === FORM_TYPE_ENUM.edition ? (
              <FormLoadingSkeleton id="create-subscription" length={3} />
            ) : (
              <>
                <CenteredPage.PageTitle
                  title={pageHeaderTitle}
                  description={translate('text_1776109152051su5xz1qh1xj')}
                />

                <CenteredPage.SubsectionWrapper>
                  {/* Section: Assign a plan */}
                  <CenteredPage.PageSection>
                    {formType !== FORM_TYPE_ENUM.edition && (
                      <CenteredPage.PageSectionTitle
                        title={translate('text_65118a52df984447c186940f', {
                          customerName: customerName || customer?.externalId || '',
                        })}
                        description={translate('text_65118a52df984447c1869469')}
                      />
                    )}

                    <Selector
                      icon={<Avatar size="big" variant="user" identifier={customerName || ''} />}
                      title={customerName || ''}
                      subtitle={customer?.externalId}
                    />

                    <subscriptionForm.AppField name="planId">
                      {(field) => (
                        <field.ComboBoxField
                          disabled={formType === FORM_TYPE_ENUM.edition}
                          disableClearable={formType === FORM_TYPE_ENUM.edition}
                          label={translate('text_625434c7bb2cb40124c81a29')}
                          data={comboboxPlansData}
                          loading={planLoading}
                          searchQuery={getPlans}
                          placeholder={translate('text_625434c7bb2cb40124c81a31')}
                          emptyText={translate('text_625434c7bb2cb40124c81a37')}
                          PopperProps={{ displayInDialog: true }}
                        />
                      )}
                    </subscriptionForm.AppField>

                    {!!showCurrencyError ? (
                      <Alert type="danger">{translate('text_632dbaf1d577afb32ae751f5')}</Alert>
                    ) : (
                      <>
                        {formType === FORM_TYPE_ENUM.upgradeDowngrade && (
                          <Alert type="info">
                            {translate('text_6328e70de459381ed4ba50d6', {
                              subscriptionEndDate: subscription?.periodEndDate
                                ? intlFormatDateTimeOrgaTZ(subscription.periodEndDate).date
                                : '-',
                            })}
                          </Alert>
                        )}
                        {subscription?.status === StatusTypeEnum.Pending && (
                          <Alert type="info">
                            {translate('text_6335e50b0b089e1d8ed508da', {
                              subscriptionAt: subscription?.startedAt
                                ? intlFormatDateTimeOrgaTZ(subscription.startedAt).date
                                : '-',
                            })}
                          </Alert>
                        )}
                      </>
                    )}
                  </CenteredPage.PageSection>

                  {!!subscriptionPlanId && (
                    <>
                      {/* Section: Subscription settings */}
                      <CenteredPage.PageSection>
                        {!subscription?.plan.parent && formType === FORM_TYPE_ENUM.edition && (
                          <Alert type="info">{translate('text_652525609f420d00b83dd602')}</Alert>
                        )}

                        <CenteredPage.PageSectionTitle
                          title={translate('text_6335e8900c69f8ebdfef5312')}
                          description={translate('text_66630368f4333b00795b0e1c')}
                        />

                        <div
                          className="flex flex-col gap-6"
                          data-test="create-subscription-form-wrapper"
                        >
                          {!!shouldDisplaySubscriptionExternalId && (
                            <div className="flex flex-row gap-3 [&>*:first-child]:flex-1">
                              <subscriptionForm.AppField name="externalId">
                                {(field) => (
                                  <field.TextInputField
                                    disabled={formType !== FORM_TYPE_ENUM.creation}
                                    label={translate('text_642a94e522316cd9e1875224')}
                                    placeholder={translate('text_642ac1d1407baafb9e4390ee')}
                                    helperText={translate('text_642ac28c65c2180085afe31a')}
                                  />
                                )}
                              </subscriptionForm.AppField>
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
                                    subscriptionForm.setFieldValue('externalId', '')
                                    setShouldDisplaySubscriptionExternalId(false)
                                  }}
                                />
                              </Tooltip>
                            </div>
                          )}

                          {!!shouldDisplaySubscriptionName && (
                            <div className="flex flex-row gap-3 [&>*:first-child]:flex-1">
                              <subscriptionForm.AppField name="name">
                                {(field) => (
                                  <field.TextInputField
                                    label={translate('text_62d7f6178ec94cd09370e2b9')}
                                    placeholder={translate('text_62d7f6178ec94cd09370e2cb')}
                                    helperText={translate('text_62d7f6178ec94cd09370e2d9')}
                                  />
                                )}
                              </subscriptionForm.AppField>
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
                                    subscriptionForm.setFieldValue('name', '')
                                    setShouldDisplaySubscriptionName(false)
                                  }}
                                />
                              </Tooltip>
                            </div>
                          )}

                          {(!shouldDisplaySubscriptionExternalId ||
                            !shouldDisplaySubscriptionName) && (
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
                              <subscriptionForm.AppField name="billingTime">
                                {(field) => (
                                  <field.ButtonSelectorField
                                    disabled={formType !== FORM_TYPE_ENUM.creation}
                                    label={translate('text_62ea7cd44cd4b14bb9ac1db7')}
                                    helperText={billingTimeHelper}
                                    options={[
                                      {
                                        label: translate(
                                          getBillingTimeSelectorTranslationKey(
                                            selectedPlan?.interval,
                                          ),
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
                              </subscriptionForm.AppField>

                              <div>
                                <div className="flex items-start gap-6 [&>*]:flex-1">
                                  <subscriptionForm.AppField name="subscriptionAt">
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
                                  </subscriptionForm.AppField>
                                  <subscriptionForm.AppField name="endingAt">
                                    {(field) => (
                                      <field.DatePickerField
                                        disablePast
                                        placement="auto"
                                        label={translate('text_64ef55a730b88e3d2117b3cc')}
                                        defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                                        inputProps={{ cleanable: true }}
                                      />
                                    )}
                                  </subscriptionForm.AppField>
                                </div>
                                <subscriptionForm.Subscribe
                                  selector={(s) => ({
                                    endingAtErrors: s.fieldMeta.endingAt?.errors,
                                    subscriptionAtErrors: s.fieldMeta.subscriptionAt?.errors,
                                    endingAtValue: s.values.endingAt,
                                    subscriptionAtValue: s.values.subscriptionAt,
                                  })}
                                >
                                  {({
                                    endingAtErrors,
                                    subscriptionAtErrors,
                                    endingAtValue,
                                    subscriptionAtValue,
                                  }) =>
                                    !endingAtErrors?.length &&
                                    !subscriptionAtErrors?.length && (
                                      <SubscriptionDatesOffsetHelperComponent
                                        className="mt-1"
                                        customerTimezone={customer?.applicableTimezone}
                                        subscriptionAt={subscriptionAtValue}
                                        endingAt={endingAtValue}
                                      />
                                    )
                                  }
                                </subscriptionForm.Subscribe>
                              </div>
                            </>
                          )}
                        </div>
                      </CenteredPage.PageSection>

                      {/* Section: Invoicing & payments */}
                      {hasAccessToMultiPaymentFlow && (customer?.externalId || customer?.id) && (
                        <CenteredPage.PageSection>
                          <CenteredPage.PageSectionTitle
                            title={translate('text_1762862388271au34vz50g8i')}
                          />
                          <PaymentMethodsInvoiceSettings
                            customer={customer}
                            formikProps={
                              {
                                values: subscriptionForm.state.values,
                                setFieldValue: subscriptionForm.setFieldValue,
                              } as PaymentMethodsInvoiceSettingsProps<ViewTypeEnum.Subscription>['formikProps']
                            }
                            viewType={ViewTypeEnum.Subscription}
                          />
                        </CenteredPage.PageSection>
                      )}
                    </>
                  )}
                </CenteredPage.SubsectionWrapper>

                {!!subscriptionPlanId && (
                  <>
                    {/* Premium "Override plan" full-width divider */}
                    <div className="relative my-20 flex flex-col items-center gap-3">
                      <div className="absolute left-1/2 top-0 h-[2px] w-[100vw] -translate-x-1/2 bg-purple-100" />
                      <div className="rounded-b bg-purple-100 px-4 py-1">
                        <Typography variant="captionHl" color="info600">
                          {translate('text_65118a52df984447c18694d0')}
                        </Typography>
                      </div>
                    </div>

                    {/* Premium upsell (non-premium users) */}
                    {!isPremium && (
                      <PremiumFeature
                        feature={translate('text_65118a52df984447c18694d0')}
                        title={translate('text_65118a52df984447c18694d0')}
                        description={translate('text_65118a52df984447c18694da')}
                      />
                    )}

                    {/* Premium-gated plan override sections */}
                    <div
                      className={tw(
                        'flex flex-col',
                        !isPremium &&
                          '[mask-image:linear-gradient(to_bottom,black_0%,transparent_100%)]',
                      )}
                      {...(!isPremium && { inert: '' })}
                    >
                      <CenteredPage.SubsectionWrapper>
                        <PlanSettingsSection
                          form={planForm}
                          isInSubscriptionForm={isInSubscriptionForm}
                          subscriptionFormType={formType}
                        />

                        {isPremium && (
                          <PlanFormProvider
                            currency={planForm.state.values.amountCurrency || CurrencyEnum.Usd}
                            interval={planForm.state.values.interval || PlanInterval.Monthly}
                          >
                            <div className="flex flex-col gap-12">
                              <CenteredPage.PageTitle
                                title={translate('text_6661fc17337de3591e29e3e7')}
                                description={translate('text_66630368f4333b00795b0e2d')}
                              />

                              <CenteredPage.SubsectionWrapper>
                                <SubscriptionFeeSection
                                  form={planForm}
                                  isInSubscriptionForm={isInSubscriptionForm}
                                  subscriptionFormType={formType}
                                />

                                <FixedChargesSection
                                  alreadyExistingFixedChargesIds={
                                    alreadyExistingPlanFixedChargesIds
                                  }
                                  canBeEdited={formType === FORM_TYPE_ENUM.edition}
                                  form={planForm}
                                  isEdition={formType === FORM_TYPE_ENUM.edition}
                                  isInSubscriptionForm={isInSubscriptionForm}
                                />

                                <UsageChargesSection
                                  alreadyExistingCharges={plan?.charges as LocalUsageChargeInput[]}
                                  form={planForm}
                                  isEdition={formType === FORM_TYPE_ENUM.edition}
                                  isInSubscriptionForm={isInSubscriptionForm}
                                  premiumWarningDialogRef={premiumWarningDialogRef}
                                  subscriptionFormType={formType}
                                />
                              </CenteredPage.SubsectionWrapper>
                            </div>

                            <div className="flex flex-col gap-12">
                              <CenteredPage.PageTitle
                                title={translate('text_6661fc17337de3591e29e44d')}
                                description={translate('text_66676ed0d8c3d481637e99b7')}
                              />

                              <CenteredPage.SubsectionWrapper>
                                <CommitmentsSection form={planForm} />

                                {formType === FORM_TYPE_ENUM.creation && (
                                  <>
                                    <ProgressiveBillingSection />
                                    <FeatureEntitlementSection />
                                  </>
                                )}
                              </CenteredPage.SubsectionWrapper>
                            </div>
                          </PlanFormProvider>
                        )}
                      </CenteredPage.SubsectionWrapper>
                    </div>
                  </>
                )}
              </>
            )}
          </CenteredPage.Container>

          <CenteredPage.StickyFooter>
            <Button variant="quaternary" onClick={handleClose}>
              {translate('text_6411e6b530cb47007488b027')}
            </Button>
            <SubmitButton />
          </CenteredPage.StickyFooter>
        </CenteredPage.Wrapper>
      </form>

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_65118a52df984447c18694ee')}
        description={translate('text_65118a52df984447c18694fe')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={() => navigateBack()}
      />

      <EditInvoiceDisplayNameDialog ref={editInvoiceDisplayNameDialogRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default CreateSubscription
