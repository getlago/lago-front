import { gql } from '@apollo/client'
import { useMediaQuery } from '@mui/material'
import { useFormik } from 'formik'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useLocation, useNavigate, useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { object, string } from 'yup'

import { SubscriptionDatesOffsetHelperComponent } from '~/components/customers/subscriptions/SubscriptionDatesOffsetHelperComponent'
import { computeCustomerName } from '~/components/customers/utils'
import {
  Alert,
  Avatar,
  Button,
  Icon,
  Selector,
  SELECTOR_HEIGHT,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import {
  BasicComboBoxData,
  ButtonSelectorField,
  ComboBoxField,
  DatePickerField,
  TextInputField,
} from '~/components/form'
import { Item } from '~/components/form/ComboBox/ComboBoxItem'
import {
  EditInvoiceDisplayName,
  EditInvoiceDisplayNameRef,
} from '~/components/invoices/EditInvoiceDisplayName'
import { ChargesSection } from '~/components/plans/ChargesSection'
import { CommitmentsSection } from '~/components/plans/CommitmentsSection'
import { FixedFeeSection } from '~/components/plans/FixedFeeSection'
import { PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { ProgressiveBillingSection } from '~/components/plans/ProgressiveBillingSection'
import { LocalChargeInput } from '~/components/plans/types'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { dateErrorCodes, FORM_TYPE_ENUM } from '~/core/constants/form'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { getTimezoneConfig } from '~/core/timezone'
import {
  AddSubscriptionPlanFragmentDoc,
  BillingTimeEnum,
  CreateSubscriptionInput,
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
import { BREAKPOINT_LG, Card, NAV_HEIGHT, PageHeader, theme } from '~/styles'

gql`
  fragment AddSubscriptionPlan on Plan {
    id
    name
    code
    interval
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
`

const LoadingSkeleton = () => {
  const { translate } = useInternationalization()

  return (
    <FormPlanWrapper>
      <SectionWrapper>
        <Typography variant="headline">{translate('text_6335e8900c69f8ebdfef5312')}</Typography>
        <Card>
          <div>
            <Skeleton variant="text" height={12} width={160} marginBottom={theme.spacing(3)} />
            <Skeleton variant="text" height={12} width={384} />
          </div>
        </Card>
      </SectionWrapper>

      <SectionWrapper>
        <SectionTitle>
          <Typography variant="headline">{translate('text_642d5eb2783a2ad10d67031a')}</Typography>
          <Typography variant="body">{translate('text_66630368f4333b00795b0e1c')}</Typography>
        </SectionTitle>
        <Card>
          <AccordionSkeleton>
            <Icon name="chevron-right" />
            <Skeleton variant="text" height={12} width={160} />
          </AccordionSkeleton>
        </Card>
      </SectionWrapper>
      <SectionWrapper>
        <SectionTitle>
          <Typography variant="headline">{translate('text_6661fc17337de3591e29e3e7')}</Typography>
          <Typography variant="body">{translate('text_66630368f4333b00795b0e2d')}</Typography>
        </SectionTitle>
        <Section>
          <Card>
            <div>
              <Skeleton variant="text" height={12} width={160} marginBottom={theme.spacing(3)} />
              <Skeleton variant="text" height={12} width={384} />
            </div>
            {Array(3)
              .fill('')
              .map((_, skeletonIndex) => (
                <AccordionSkeleton key={`loading-skeleton-${skeletonIndex}`}>
                  <Icon name="chevron-right" />
                  <Skeleton variant="text" height={12} width={160} />
                </AccordionSkeleton>
              ))}
          </Card>
          <Card>
            <div>
              <Skeleton variant="text" height={12} width={160} marginBottom={theme.spacing(3)} />
              <Skeleton variant="text" height={12} width={384} />
            </div>
            {Array(2)
              .fill('')
              .map((_, skeletonIndex) => (
                <AccordionSkeleton key={`loading-skeleton-${skeletonIndex}`}>
                  <Icon name="chevron-right" />
                  <Skeleton variant="text" height={12} width={160} />
                </AccordionSkeleton>
              ))}
          </Card>
        </Section>
      </SectionWrapper>
    </FormPlanWrapper>
  )
}

const EmptyState = () => {
  const { translate } = useInternationalization()

  return (
    <CenteredEmptyState>
      <ThinkingManeki />
      <Typography variant="body">{translate('text_65118a52df984447c1869469')}</Typography>
    </CenteredEmptyState>
  )
}

const CreateSubscription = () => {
  let location = useLocation()
  const navigate = useNavigate()
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const { customerId, subscriptionId } = useParams()
  const { isRunningInSalesForceIframe } = useSalesForceConfig()

  const editInvoiceDisplayNameRef = useRef<EditInvoiceDisplayNameRef>(null)
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
  const { formatTimeOrgaTZ } = useOrganizationInfos()

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
  const {
    errorCode: planErrorCode,
    formikProps: planFormikProps,
    plan,
  } = usePlanForm({
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

    const localPlanCollection = [...planData?.plans?.collection]

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
          label: `${name} - (${code})`,
          labelNode: (
            <Item>
              <Typography color="grey700" noWrap>
                {name}
              </Typography>
              &nbsp;
              <Typography color="textPrimary" noWrap>
                ({code})
              </Typography>
            </Item>
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
        return billingTime === BillingTimeEnum.Calendar
          ? translate('text_62ea7cd44cd4b14bb9ac1d92')
          : formattedCurrentDate === february29
            ? translate('text_62ea7cd44cd4b14bb9ac1d9a')
            : translate('text_62ea7cd44cd4b14bb9ac1d96', { date: currentDate.toFormat('LLL. dd') })

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
          {formType === FORM_TYPE_ENUM.creation
            ? translate('text_65118a52df984447c1869463')
            : formType === FORM_TYPE_ENUM.edition
              ? translate('text_62d7f6178ec94cd09370e63c')
              : translate('text_65118a52df984447c18694c6')}
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

  const customerName = computeCustomerName(customer)

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
    <PageContainer>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {pageHeaderTitle}
        </Typography>
        {!isRunningInSalesForceIframe && (
          <Button
            variant="quaternary"
            icon="close"
            onClick={() =>
              subscriptionFormikProps.dirty || planFormikProps.dirty
                ? warningDialogRef.current?.openDialog()
                : navigate(
                    generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId as string }),
                  )
            }
            data-test="close-create-subscription-button"
          />
        )}
      </PageHeader>
      <Container>
        <SubscriptionAside
          $isResponsive={isResponsive}
          $hasPlanId={!!subscriptionFormikProps?.values?.planId}
        >
          <Typography variant="subhead">{pageHeaderTitle}</Typography>

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
                    subscriptionEndDate: formatTimeOrgaTZ(subscription?.periodEndDate as string),
                  })}
                </Alert>
              )}
              {subscription?.status === StatusTypeEnum.Pending && (
                <Alert type="info">
                  {translate('text_6335e50b0b089e1d8ed508da', {
                    subscriptionAt: formatTimeOrgaTZ(subscription?.startedAt as string),
                  })}
                </Alert>
              )}
            </>
          )}

          {!isResponsive && <SubmitButton />}
        </SubscriptionAside>
        {(!isResponsive || (!!isResponsive && !!subscriptionFormikProps?.values?.planId)) && (
          <PlanFormContainer>
            {!!subscriptionLoading && formType === FORM_TYPE_ENUM.edition ? (
              <LoadingSkeleton />
            ) : !!subscriptionFormikProps?.values?.planId ? (
              <FormPlanWrapper data-test="create-subscription-form-wrapper">
                {!subscription?.plan.parent && formType === FORM_TYPE_ENUM.edition && (
                  <Alert type="info">{translate('text_652525609f420d00b83dd602')}</Alert>
                )}
                <SectionWrapper>
                  <Typography variant="headline">
                    {translate('text_6335e8900c69f8ebdfef5312')}
                  </Typography>
                  <Card>
                    {!!shouldDisplaySubscriptionExternalId && (
                      <InlineFieldWithDelete>
                        <TextInputField
                          disabled={formType !== FORM_TYPE_ENUM.creation}
                          name="externalId"
                          formikProps={subscriptionFormikProps}
                          label={translate('text_642a94e522316cd9e1875224')}
                          placeholder={translate('text_642ac1d1407baafb9e4390ee')}
                          helperText={translate('text_642ac28c65c2180085afe31a')}
                        />
                        <InlineFieldTooltip
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
                        </InlineFieldTooltip>
                      </InlineFieldWithDelete>
                    )}

                    {!!shouldDisplaySubscriptionName && (
                      <InlineFieldWithDelete>
                        <TextInputField
                          name="name"
                          formikProps={subscriptionFormikProps}
                          label={translate('text_62d7f6178ec94cd09370e2b9')}
                          placeholder={translate('text_62d7f6178ec94cd09370e2cb')}
                          helperText={translate('text_62d7f6178ec94cd09370e2d9')}
                        />
                        <InlineFieldTooltip
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
                        </InlineFieldTooltip>
                      </InlineFieldWithDelete>
                    )}

                    {(!shouldDisplaySubscriptionExternalId || !shouldDisplaySubscriptionName) && (
                      <InlineAddButtonsActions>
                        {!shouldDisplaySubscriptionExternalId && (
                          <Button
                            startIcon="plus"
                            disabled={formType !== FORM_TYPE_ENUM.creation}
                            variant="quaternary"
                            onClick={() => setShouldDisplaySubscriptionExternalId(true)}
                            data-test="show-external-id"
                          >
                            {translate('text_65118a52df984447c1869472')}
                          </Button>
                        )}
                        {!shouldDisplaySubscriptionName && (
                          <Button
                            startIcon="plus"
                            variant="quaternary"
                            onClick={() => setShouldDisplaySubscriptionName(true)}
                            data-test="show-name"
                          >
                            {translate('text_65118a52df984447c186947c')}
                          </Button>
                        )}
                      </InlineAddButtonsActions>
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
                              label:
                                selectedPlan?.interval === PlanInterval.Yearly
                                  ? translate('text_62ebd597d5d5130a03ced107')
                                  : selectedPlan?.interval === PlanInterval.Weekly
                                    ? translate('text_62ebd597d5d5130a03ced101')
                                    : selectedPlan?.interval === PlanInterval.Quarterly
                                      ? translate('text_64d6357b00dea100ad1cba27')
                                      : translate('text_62ea7cd44cd4b14bb9ac1db9'),
                              value: BillingTimeEnum.Calendar,
                            },
                            {
                              label: translate('text_62ea7cd44cd4b14bb9ac1dbb'),
                              value: BillingTimeEnum.Anniversary,
                            },
                          ]}
                        />

                        <div>
                          <InlineFields>
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
                          </InlineFields>
                          {!subscriptionFormikProps.errors.endingAt &&
                            !subscriptionFormikProps.errors.subscriptionAt && (
                              <LocalSubscriptionDatesOffsetHelperComponent
                                customerTimezone={customer?.applicableTimezone}
                                subscriptionAt={subscriptionFormikProps.values.subscriptionAt}
                                endingAt={subscriptionFormikProps.values.endingAt}
                              />
                            )}
                        </div>
                      </>
                    )}
                  </Card>
                </SectionWrapper>

                {!isPremium ? (
                  <FreemiumCard>
                    <FreemiumCardLeft>
                      <FreemiumCardLeftTitleContainer>
                        <Icon name="sparkles" />
                        <Typography variant="subhead">
                          {translate('text_65118a52df984447c18694d0')}
                        </Typography>
                      </FreemiumCardLeftTitleContainer>
                      <Typography variant="body">
                        {translate('text_65118a52df984447c18694da')}
                      </Typography>
                    </FreemiumCardLeft>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        premiumWarningDialogRef.current?.openDialog()
                      }}
                    >
                      {translate('text_65118a52df984447c18694d0')}
                    </Button>
                  </FreemiumCard>
                ) : formType !== FORM_TYPE_ENUM.edition || !subscription?.plan.parent?.id ? (
                  <OverridePlanSeparatorTypography variant="captionHl" color="grey500">
                    {translate('text_65118a52df984447c18694d0')}
                  </OverridePlanSeparatorTypography>
                ) : null}

                <PlanFormConditionalWrapper $isPremium={isPremium}>
                  <SectionWrapper>
                    <SectionTitle>
                      <Typography variant="headline">
                        {translate('text_642d5eb2783a2ad10d67031a')}
                      </Typography>
                      <Typography variant="body">
                        {translate('text_66630368f4333b00795b0e1c')}
                      </Typography>
                    </SectionTitle>
                    <PlanSettingsSection
                      isInSubscriptionForm={isInSubscriptionForm}
                      subscriptionFormType={formType}
                      errorCode={planErrorCode}
                      formikProps={planFormikProps}
                    />
                  </SectionWrapper>
                  <SectionWrapper>
                    <SectionTitle>
                      <Typography variant="headline">
                        {translate('text_6661fc17337de3591e29e3e7')}
                      </Typography>
                      <Typography variant="body">
                        {translate('text_66630368f4333b00795b0e2d')}
                      </Typography>
                    </SectionTitle>

                    <Section>
                      <FixedFeeSection
                        isInSubscriptionForm={isInSubscriptionForm}
                        subscriptionFormType={formType}
                        formikProps={planFormikProps}
                        editInvoiceDisplayNameRef={editInvoiceDisplayNameRef}
                      />

                      <ChargesSection
                        isInSubscriptionForm={isInSubscriptionForm}
                        subscriptionFormType={formType}
                        formikProps={planFormikProps}
                        premiumWarningDialogRef={premiumWarningDialogRef}
                        alreadyExistingCharges={plan?.charges as LocalChargeInput[]}
                        editInvoiceDisplayNameRef={editInvoiceDisplayNameRef}
                      />
                    </Section>
                  </SectionWrapper>
                  <SectionWrapper>
                    <SectionTitle>
                      <Typography variant="headline">
                        {translate('text_6661fc17337de3591e29e44d')}
                      </Typography>
                      <Typography variant="body">
                        {translate('text_66676ed0d8c3d481637e99b7')}
                      </Typography>
                    </SectionTitle>
                    <Card $childSpacing={8}>
                      <ProgressiveBillingSection
                        formikProps={planFormikProps}
                        isInSubscriptionForm={isInSubscriptionForm}
                      />
                      <CommitmentsSection
                        formikProps={planFormikProps}
                        premiumWarningDialogRef={premiumWarningDialogRef}
                        editInvoiceDisplayNameRef={editInvoiceDisplayNameRef}
                      />
                    </Card>
                  </SectionWrapper>
                </PlanFormConditionalWrapper>
              </FormPlanWrapper>
            ) : (
              <EmptyState />
            )}
          </PlanFormContainer>
        )}
        {!!isResponsive && (
          <ResponsiveButtonWrapper>
            <SubmitButton />
          </ResponsiveButtonWrapper>
        )}
      </Container>

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_65118a52df984447c18694ee')}
        description={translate('text_65118a52df984447c18694fe')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={() => {
          navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId as string }))
        }}
      />

      <EditInvoiceDisplayName ref={editInvoiceDisplayNameRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </PageContainer>
  )
}

const PageContainer = styled.div`
  width: 100%;
  height: fit-content;
  display: grid;
  grid-template-rows: min-content 1fr;
`

const Container = styled.div`
  height: 100%;
  position: relative;
  display: grid;
  grid-template-columns: 544px 1fr;
  min-height: calc(100vh - ${NAV_HEIGHT}px);

  ${theme.breakpoints.down('lg')} {
    grid-template-columns: 1fr;
    grid-template-rows: min-content;
  }
`

const SubscriptionAside = styled.aside<{ $isResponsive: boolean; $hasPlanId: boolean }>`
  height: fit-content;
  padding: ${theme.spacing(12)};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(6)};
  box-sizing: border-box;

  ${({ $isResponsive }) =>
    !$isResponsive &&
    css`
      position: sticky;
      top: ${NAV_HEIGHT}px;
    `};

  ${({ $isResponsive, $hasPlanId }) =>
    $isResponsive &&
    !$hasPlanId &&
    css`
      padding-bottom: ${theme.spacing(3)};
      box-shadow: none;
    `};
`

const PlanFormContainer = styled.div`
  height: 100%;
  padding: ${theme.spacing(12)};
  box-sizing: border-box;
  background-color: ${theme.palette.grey[100]};
`

const FormPlanWrapper = styled.div`
  height: 100%;
  max-width: ${theme.spacing(180)};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(12)};

  ${theme.breakpoints.down('lg')} {
    max-width: 100%;
  }
`

const InlineFields = styled.div`
  display: flex;
  gap: ${theme.spacing(6)};
  align-items: flex-start;

  > * {
    flex: 1;
  }
`

const LocalSubscriptionDatesOffsetHelperComponent = styled(SubscriptionDatesOffsetHelperComponent)`
  margin-top: ${theme.spacing(1)};
`

const InlineFieldWithDelete = styled.div`
  display: flex;
  gap: ${theme.spacing(3)};

  > *:first-child {
    flex: 1;
  }
`

const InlineFieldTooltip = styled(Tooltip)`
  height: fit-content;
  margin-top: ${theme.spacing(7)};
`

const InlineAddButtonsActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`

const CenteredEmptyState = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(6)};
  margin: 0 auto auto;

  svg {
    height: 104px;
  }
`

const ResponsiveButtonWrapper = styled.div`
  height: fit-content;
  background-color: ${theme.palette.common.white};
  padding: ${theme.spacing(3)} ${theme.spacing(12)};
`

const FreemiumCard = styled(Card)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${theme.spacing(3)};

  /* Reset <Card> style */
  > * {
    margin-bottom: 0 !important;
  }
`

const FreemiumCardLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(1)};
`

const FreemiumCardLeftTitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(2)};
`

const PlanFormConditionalWrapper = styled.div<{ $isPremium: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(12)};

  ${({ $isPremium }) =>
    !$isPremium &&
    css`
      pointer-events: none;
      opacity: 0.4;
    `}
`

const SectionWrapper = styled.div`
  > div:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }
`

const SectionTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(1)};
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`

const AccordionSkeleton = styled.div`
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: ${theme.spacing(4)};
  gap: ${theme.spacing(3)};
  height: ${SELECTOR_HEIGHT}px;
  border-radius: 12px;
  border: 1px solid ${theme.palette.grey[400]};
`

const OverridePlanSeparatorTypography = styled(Typography)`
  display: flex;
  align-items: center;
  white-space: nowrap;
  text-transform: uppercase;
  gap: ${theme.spacing(4)};

  &::before,
  &::after {
    content: '';
    display: inline-block;
    height: 2px;
    width: 100%;
    background-color: ${theme.palette.grey[300]};
  }
`

export default CreateSubscription
