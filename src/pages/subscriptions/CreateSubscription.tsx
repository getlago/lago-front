import { gql } from '@apollo/client'
import { useMediaQuery } from '@mui/material'
import { useFormik } from 'formik'
import { Avatar, Icon } from 'lago-design-system'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  generatePath,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { object, string } from 'yup'

import { SubscriptionDatesOffsetHelperComponent } from '~/components/customers/subscriptions/SubscriptionDatesOffsetHelperComponent'
import {
  Alert,
  Button,
  Card,
  Selector,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import {
  BasicComboBoxData,
  ButtonSelectorField,
  ComboBoxField,
  ComboboxItem,
  DatePickerField,
  TextInputField,
} from '~/components/form'
import {
  EditInvoiceDisplayNameDialog,
  EditInvoiceDisplayNameDialogRef,
} from '~/components/invoices/EditInvoiceDisplayNameDialog'
import { CommitmentsSection } from '~/components/plans/CommitmentsSection'
import { PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { ProgressiveBillingSection } from '~/components/plans/ProgressiveBillingSection'
import { SubscriptionFeeSection } from '~/components/plans/SubscriptionFeeSection'
import { LocalUsageChargeInput } from '~/components/plans/types'
import { UsageChargesSection } from '~/components/plans/UsageChargesSection'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE } from '~/components/subscriptions/SubscriptionUsageLifetimeGraph'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { dateErrorCodes, FORM_TYPE_ENUM } from '~/core/constants/form'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  PLAN_SUBSCRIPTION_DETAILS_ROUTE,
} from '~/core/router'
import { getTimezoneConfig } from '~/core/timezone'
import {
  AddSubscriptionPlanFragmentDoc,
  BillingTimeEnum,
  CreateSubscriptionInput,
  FeatureEntitlementForPlanFragmentDoc,
  PlanInterval,
  StatusTypeEnum,
  TimezoneEnum,
  useGetCustomerForCreateSubscriptionQuery,
  useGetPlansLazyQuery,
  useGetSubscriptionForCreateSubscriptionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAddSubscription } from '~/hooks/customer/useAddSubscription'
import { usePlanForm } from '~/hooks/plans/usePlanForm'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { useSalesForceConfig } from '~/hooks/useSalesForceConfig'
import ThinkingManeki from '~/public/images/maneki/thinking.svg'
import { BREAKPOINT_LG, PageHeader } from '~/styles'
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

const LoadingSkeleton = () => {
  const { translate } = useInternationalization()

  return (
    <div className="flex h-full max-w-full flex-col gap-12 lg:max-w-[720px]">
      <div className="not-last-child:mb-8">
        <Typography variant="headline">{translate('text_6335e8900c69f8ebdfef5312')}</Typography>
        <Card>
          <div>
            <Skeleton variant="text" className="mb-3 w-40" />
            <Skeleton variant="text" className="w-96" />
          </div>
        </Card>
      </div>
      <div className="not-last-child:mb-8">
        <div className="flex flex-col gap-1">
          <Typography variant="headline">{translate('text_642d5eb2783a2ad10d67031a')}</Typography>
          <Typography variant="body">{translate('text_66630368f4333b00795b0e1c')}</Typography>
        </div>
        <Card>
          <div className="flex h-18 items-center gap-3 rounded-xl border border-grey-400 p-4">
            <Icon name="chevron-right" />
            <Skeleton variant="text" className="w-40" />
          </div>
        </Card>
      </div>
      <div className="not-last-child:mb-8">
        <div className="flex flex-col gap-1">
          <Typography variant="headline">{translate('text_6661fc17337de3591e29e3e7')}</Typography>
          <Typography variant="body">{translate('text_66630368f4333b00795b0e2d')}</Typography>
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <div>
              <Skeleton variant="text" className="mb-3 w-40" />
              <Skeleton variant="text" className="w-96" />
            </div>
            {Array(3)
              .fill('')
              .map((_, skeletonIndex) => (
                <div
                  className="flex h-18 items-center gap-3 rounded-xl border border-grey-400 p-4"
                  key={`loading-skeleton-${skeletonIndex}`}
                >
                  <Icon name="chevron-right" />
                  <Skeleton variant="text" className="w-40" />
                </div>
              ))}
          </Card>
          <Card>
            <div>
              <Skeleton variant="text" className="mb-3 w-40" />
              <Skeleton variant="text" className="w-96" />
            </div>
            {Array(2)
              .fill('')
              .map((_, skeletonIndex) => (
                <div
                  className="flex h-18 items-center gap-3 rounded-xl border border-grey-400 p-4"
                  key={`loading-skeleton-${skeletonIndex}`}
                >
                  <Icon name="chevron-right" />
                  <Skeleton variant="text" className="w-40" />
                </div>
              ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

const EmptyState = () => {
  const { translate } = useInternationalization()

  return (
    <div className="mx-auto mb-auto flex flex-col gap-6 text-center">
      <ThinkingManeki className="h-[104px]" />
      <Typography variant="body">{translate('text_65118a52df984447c1869469')}</Typography>
    </div>
  )
}

const CreateSubscription = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const { customerId, subscriptionId } = useParams()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { isRunningInSalesForceIframe } = useSalesForceConfig()

  const editInvoiceDisplayNameDialogRef = useRef<EditInvoiceDisplayNameDialogRef>(null)
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const [showCurrencyError, setShowCurrencyError] = useState<boolean>(false)
  const isResponsive = useMediaQuery(`(max-width:${BREAKPOINT_LG - 1}px)`)

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

  const subscriptionFormikProps = useFormik<Omit<CreateSubscriptionInput, 'customerId'>>({
    initialValues: {
      planId: formType !== FORM_TYPE_ENUM.upgradeDowngrade ? subscription?.plan?.id || '' : '',
      name: subscription?.name || '',
      externalId: subscription?.externalId || '',
      subscriptionAt: subscription?.subscriptionAt || currentDateRef?.current,
      endingAt: subscription?.endingAt || undefined,
      billingTime: subscription?.billingTime || BillingTimeEnum.Calendar,
    },
    validationSchema: object().shape({
      planId: string().required(''),
      subscriptionAt: string().required(''),
      endingAt: string()
        .test({
          test: function (value, { from, path }) {
            // Value can be undefined
            if (!value) {
              return true
            }

            // Make sure value has correct format
            if (!DateTime.fromISO(value).isValid) {
              return this.createError({
                path,
                message: dateErrorCodes.wrongFormat,
              })
            }

            // If subscription at is present
            if (from && from[0] && from[0].value && from[0].value.subscriptionAt) {
              const subscriptionAt = DateTime.fromISO(from[0].value.subscriptionAt)
              const endingAt = DateTime.fromISO(value)

              // Make sure endingAt is set later than subscriptionAt and in the future
              if (endingAt <= subscriptionAt || DateTime.now().diff(endingAt, 'days').days >= 0) {
                return this.createError({
                  path,
                  message: dateErrorCodes.shouldBeFutureAndBiggerThanSubscriptionAt,
                })
              }
            }

            return true
          },
        })
        .nullable(),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values, formikBag) => {
      const localValues = {
        id: formType === FORM_TYPE_ENUM.edition ? subscription?.id : undefined,
        ...values,
      }
      const rootElement = document.getElementById('root')
      const errorsString = await onSave(
        customerId as string,
        localValues,
        planFormikProps.values,
        planFormikProps.dirty,
      )

      if (errorsString === 'CurrenciesDoesNotMatch') {
        isResponsive && rootElement?.scrollTo({ top: 0, behavior: 'smooth' })
        return setShowCurrencyError(true)
      } else if (errorsString === 'ValueAlreadyExist') {
        rootElement?.scrollTo({ top: 0, behavior: 'smooth' })
        formikBag.setErrors({
          externalId: translate('text_668513bb1906740145e06abe'),
        })
      }
    },
  })
  const { formikProps: planFormikProps, plan } = usePlanForm({
    planIdToFetch: subscriptionFormikProps.values.planId,
    isUsedInSubscriptionForm: true,
  })

  const subscriptionPlanId = subscriptionFormikProps.values.planId

  const [shouldDisplaySubscriptionExternalId, setShouldDisplaySubscriptionExternalId] =
    useState<boolean>(!!subscriptionFormikProps.initialValues.externalId)
  const [shouldDisplaySubscriptionName, setShouldDisplaySubscriptionName] = useState<boolean>(
    !!subscriptionFormikProps.initialValues.name,
  )

  useEffect(() => {
    setShouldDisplaySubscriptionExternalId(!!subscriptionFormikProps.initialValues.externalId)
  }, [subscriptionFormikProps.initialValues.externalId])

  useEffect(() => {
    setShouldDisplaySubscriptionName(!!subscriptionFormikProps.initialValues.name)
  }, [subscriptionFormikProps.initialValues.name])
  // Remove currency error is value changes
  useEffect(() => {
    setShowCurrencyError(false)
  }, [planFormikProps.values.amountCurrency])

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

  const billingTimeHelper = useMemo(() => {
    const billingTime = subscriptionFormikProps?.values?.billingTime
    const currentDate = subscriptionFormikProps?.values?.subscriptionAt
      ? DateTime.fromISO(subscriptionFormikProps?.values?.subscriptionAt)
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

        return translate('text_62ea7cd44cd4b14bb9ac1d96', { date: currentDate.toFormat('LLL. dd') })

      case PlanInterval.Semiannual:
        return billingTime === BillingTimeEnum.Calendar
          ? translate('text_1757502242292q05inkc09vq')
          : translate('text_1757504174992y39ailqcch0', { date: currentDate.toFormat('LLL. dd') })

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
  }, [
    subscriptionFormikProps?.values?.billingTime,
    subscriptionFormikProps?.values?.subscriptionAt,
    selectedPlan,
    translate,
  ])

  // NOTE: useCallback here is needed
  // is handles the case where the user clicks on the button while being focused on a plan's input
  const SubmitButton = useCallback(() => {
    const buttonLabel = () => {
      if (formType === FORM_TYPE_ENUM.creation) return translate('text_65118a52df984447c1869463')
      if (formType === FORM_TYPE_ENUM.edition) return translate('text_62d7f6178ec94cd09370e63c')
      return translate('text_65118a52df984447c18694c6')
    }

    return (
      <Button
        size="large"
        fullWidth
        disabled={
          !subscriptionFormikProps.isValid ||
          !planFormikProps.isValid ||
          (!subscriptionFormikProps.dirty && !planFormikProps.dirty)
        }
        loading={subscriptionFormikProps.isSubmitting}
        onClick={subscriptionFormikProps.submitForm}
        data-test="submit"
      >
        <Typography color="inherit" noWrap>
          {buttonLabel()}
        </Typography>
      </Button>
    )
  }, [
    formType,
    planFormikProps.dirty,
    planFormikProps.isValid,
    subscriptionFormikProps.dirty,
    subscriptionFormikProps.isSubmitting,
    subscriptionFormikProps.isValid,
    subscriptionFormikProps.submitForm,
    translate,
  ])

  const customerName = customer?.displayName

  const pageHeaderTitle = useMemo(() => {
    if (formType === FORM_TYPE_ENUM.edition) {
      return translate('text_62d7f6178ec94cd09370e63c')
    } else if (formType === FORM_TYPE_ENUM.upgradeDowngrade) {
      return translate('text_65118a52df984447c18694c6')
    }
    return translate('text_65118a52df984447c186940f', {
      customerName: customerName || '',
    })
  }, [customerName, formType, translate])

  return (
    <div className="grid h-fit w-full grid-rows-[min-content,1fr]">
      <PageHeader.Wrapper>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {pageHeaderTitle}
        </Typography>
        {!isRunningInSalesForceIframe && (
          <Button
            variant="quaternary"
            icon="close"
            onClick={() => {
              if (subscriptionFormikProps.dirty || planFormikProps.dirty) {
                warningDialogRef.current?.openDialog()
              } else {
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
                  navigate(
                    generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId as string }),
                  )
                }
              }
            }}
            data-test="close-create-subscription-button"
          />
        )}
      </PageHeader.Wrapper>
      <div className="relative grid h-full min-h-[calc(100vh-theme(space.nav))] grid-cols-1 grid-rows-[min-content] lg:grid-cols-[544px,1fr] lg:grid-rows-none">
        <aside
          className={tw(
            'box-border flex h-fit flex-col gap-6 px-4 py-12 md:px-12',
            !isResponsive && 'sticky top-nav',
            isResponsive && !!subscriptionFormikProps?.values?.planId && 'shadow-none',
          )}
        >
          <Typography variant="subhead1">{pageHeaderTitle}</Typography>

          <Selector
            icon={<Avatar size="big" variant="user" identifier={customerName || ''} />}
            title={customerName || ''}
            subtitle={customer?.externalId}
          />

          <ComboBoxField
            name="planId"
            formikProps={subscriptionFormikProps}
            disabled={formType === FORM_TYPE_ENUM.edition}
            disableClearable={formType === FORM_TYPE_ENUM.edition}
            label={translate('text_625434c7bb2cb40124c81a29')}
            data={comboboxPlansData}
            loading={planLoading}
            isEmptyNull={false}
            searchQuery={getPlans}
            placeholder={translate('text_625434c7bb2cb40124c81a31')}
            emptyText={translate('text_625434c7bb2cb40124c81a37')}
            PopperProps={{ displayInDialog: true }}
          />

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

          {!isResponsive && <SubmitButton />}
        </aside>
        {(!isResponsive || (!!isResponsive && !!subscriptionFormikProps?.values?.planId)) && (
          <div className="h-full bg-grey-100 px-4 py-12 md:px-12">
            {!!subscriptionLoading && formType === FORM_TYPE_ENUM.edition && <LoadingSkeleton />}
            {!subscriptionLoading && (
              <>
                {!subscriptionFormikProps?.values?.planId && <EmptyState />}
                {!!subscriptionFormikProps?.values?.planId && (
                  <>
                    <div
                      className="flex h-full max-w-full flex-col gap-12 lg:max-w-[720px]"
                      data-test="create-subscription-form-wrapper"
                    >
                      {!subscription?.plan.parent && formType === FORM_TYPE_ENUM.edition && (
                        <Alert type="info">{translate('text_652525609f420d00b83dd602')}</Alert>
                      )}
                      <div className="not-last-child:mb-8">
                        <Typography variant="headline">
                          {translate('text_6335e8900c69f8ebdfef5312')}
                        </Typography>
                        <Card>
                          {!!shouldDisplaySubscriptionExternalId && (
                            <div className="flex flex-row gap-3 [&>*:first-child]:flex-1">
                              <TextInputField
                                disabled={formType !== FORM_TYPE_ENUM.creation}
                                name="externalId"
                                formikProps={subscriptionFormikProps}
                                label={translate('text_642a94e522316cd9e1875224')}
                                placeholder={translate('text_642ac1d1407baafb9e4390ee')}
                                helperText={translate('text_642ac28c65c2180085afe31a')}
                              />
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
                                    subscriptionFormikProps.setFieldValue('externalId', '')
                                    setShouldDisplaySubscriptionExternalId(false)
                                  }}
                                />
                              </Tooltip>
                            </div>
                          )}

                          {!!shouldDisplaySubscriptionName && (
                            <div className="flex flex-row gap-3 [&>*:first-child]:flex-1">
                              <TextInputField
                                name="name"
                                formikProps={subscriptionFormikProps}
                                label={translate('text_62d7f6178ec94cd09370e2b9')}
                                placeholder={translate('text_62d7f6178ec94cd09370e2cb')}
                                helperText={translate('text_62d7f6178ec94cd09370e2d9')}
                              />
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
                                    subscriptionFormikProps.setFieldValue('name', '')
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
                              <ButtonSelectorField
                                name="billingTime"
                                disabled={formType !== FORM_TYPE_ENUM.creation}
                                label={translate('text_62ea7cd44cd4b14bb9ac1db7')}
                                formikProps={subscriptionFormikProps}
                                helperText={billingTimeHelper}
                                options={[
                                  {
                                    label: translate(
                                      getBillingTimeSelectorTranslationKey(selectedPlan?.interval),
                                    ),
                                    value: BillingTimeEnum.Calendar,
                                  },
                                  {
                                    label: translate('text_62ea7cd44cd4b14bb9ac1dbb'),
                                    value: BillingTimeEnum.Anniversary,
                                  },
                                ]}
                              />

                              <div>
                                <div className="flex items-start gap-6 [&>*]:flex-1">
                                  <DatePickerField
                                    name="subscriptionAt"
                                    disabled={
                                      formType !== FORM_TYPE_ENUM.creation &&
                                      subscription?.status !== StatusTypeEnum.Pending
                                    }
                                    placement="auto"
                                    label={translate('text_64ef55a730b88e3d2117b3c4')}
                                    defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                                    formikProps={subscriptionFormikProps}
                                  />
                                  <DatePickerField
                                    disablePast
                                    name="endingAt"
                                    placement="auto"
                                    label={translate('text_64ef55a730b88e3d2117b3cc')}
                                    defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                                    formikProps={subscriptionFormikProps}
                                    error={
                                      subscriptionFormikProps.errors.endingAt ===
                                      dateErrorCodes.shouldBeFutureAndBiggerThanSubscriptionAt
                                        ? translate('text_64ef55a730b88e3d2117b3d4')
                                        : undefined
                                    }
                                    inputProps={{ cleanable: true }}
                                  />
                                </div>
                                {!subscriptionFormikProps.errors.endingAt &&
                                  !subscriptionFormikProps.errors.subscriptionAt && (
                                    <SubscriptionDatesOffsetHelperComponent
                                      className="mt-1"
                                      customerTimezone={customer?.applicableTimezone}
                                      subscriptionAt={subscriptionFormikProps.values.subscriptionAt}
                                      endingAt={subscriptionFormikProps.values.endingAt}
                                    />
                                  )}
                              </div>
                            </>
                          )}
                        </Card>
                      </div>

                      {!isPremium && (
                        <Card className="flex-row items-center justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Icon name="sparkles" />
                              <Typography variant="subhead1">
                                {translate('text_65118a52df984447c18694d0')}
                              </Typography>
                            </div>
                            <Typography variant="body">
                              {translate('text_65118a52df984447c18694da')}
                            </Typography>
                          </div>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              premiumWarningDialogRef.current?.openDialog()
                            }}
                          >
                            {translate('text_65118a52df984447c18694d0')}
                          </Button>
                        </Card>
                      )}
                      {isPremium &&
                        (formType !== FORM_TYPE_ENUM.edition || !subscription?.plan.parent?.id) && (
                          <Typography
                            className="flex items-center gap-4 uppercase before:inline-block before:h-[2px] before:w-full before:bg-grey-300 before:content-[''] after:inline-block after:h-[2px] after:w-full after:bg-grey-300 after:content-['']"
                            noWrap
                            variant="captionHl"
                            color="grey500"
                          >
                            {translate('text_65118a52df984447c18694d0')}
                          </Typography>
                        )}

                      <div
                        className={tw(
                          'flex flex-col gap-12',
                          !isPremium && 'pointer-events-none opacity-40',
                        )}
                      >
                        <div className="not-last-child:mb-8">
                          <div className="flex flex-col gap-1">
                            <Typography variant="headline">
                              {translate('text_642d5eb2783a2ad10d67031a')}
                            </Typography>
                            <Typography variant="body">
                              {translate('text_66630368f4333b00795b0e1c')}
                            </Typography>
                          </div>
                          <PlanSettingsSection
                            isInSubscriptionForm={isInSubscriptionForm}
                            subscriptionFormType={formType}
                            formikProps={planFormikProps}
                          />
                        </div>
                        <div className="not-last-child:mb-8">
                          <div className="flex flex-col gap-1">
                            <Typography variant="headline">
                              {translate('text_6661fc17337de3591e29e3e7')}
                            </Typography>
                            <Typography variant="body">
                              {translate('text_66630368f4333b00795b0e2d')}
                            </Typography>
                          </div>

                          <div className="flex flex-col gap-4">
                            <SubscriptionFeeSection
                              isInSubscriptionForm={isInSubscriptionForm}
                              subscriptionFormType={formType}
                              formikProps={planFormikProps}
                              editInvoiceDisplayNameDialogRef={editInvoiceDisplayNameDialogRef}
                            />

                            <UsageChargesSection
                              isInSubscriptionForm={isInSubscriptionForm}
                              subscriptionFormType={formType}
                              formikProps={planFormikProps}
                              isEdition={formType === FORM_TYPE_ENUM.edition}
                              premiumWarningDialogRef={premiumWarningDialogRef}
                              alreadyExistingCharges={plan?.charges as LocalUsageChargeInput[]}
                              editInvoiceDisplayNameDialogRef={editInvoiceDisplayNameDialogRef}
                            />
                          </div>
                        </div>
                        <div className="not-last-child:mb-8">
                          <div className="flex flex-col gap-1">
                            <Typography variant="headline">
                              {translate('text_6661fc17337de3591e29e44d')}
                            </Typography>
                            <Typography variant="body">
                              {translate('text_66676ed0d8c3d481637e99b7')}
                            </Typography>
                          </div>
                          <Card className="gap-8">
                            <ProgressiveBillingSection
                              formikProps={planFormikProps}
                              isInSubscriptionForm={isInSubscriptionForm}
                            />
                            <CommitmentsSection
                              formikProps={planFormikProps}
                              premiumWarningDialogRef={premiumWarningDialogRef}
                              editInvoiceDisplayNameDialogRef={editInvoiceDisplayNameDialogRef}
                            />
                          </Card>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
        {!!isResponsive && (
          <div className="h-fit bg-white px-4 py-3 md:px-12">
            <SubmitButton />
          </div>
        )}
      </div>

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_65118a52df984447c18694ee')}
        description={translate('text_65118a52df984447c18694fe')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={() => {
          navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId as string }))
        }}
      />

      <EditInvoiceDisplayNameDialog ref={editInvoiceDisplayNameDialogRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </div>
  )
}

export default CreateSubscription
