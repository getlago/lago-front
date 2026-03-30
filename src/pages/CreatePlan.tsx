import { gql } from '@apollo/client'
import { debounce } from 'lodash'
import { useCallback, useMemo, useRef } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { WarningDialog, WarningDialogRef } from '~/components/designSystem/WarningDialog'
import {
  EditInvoiceDisplayNameDialog,
  EditInvoiceDisplayNameDialogRef,
} from '~/components/invoices/EditInvoiceDisplayNameDialog'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { CommitmentsSection } from '~/components/plans/CommitmentsSection'
import { FeatureEntitlementFormValues } from '~/components/plans/drawers/FeatureEntitlementDrawer'
import { MinimumCommitmentFormValues } from '~/components/plans/drawers/MinimumCommitmentDrawer'
import { ProgressiveBillingFormValues } from '~/components/plans/drawers/progressiveBilling/constants'
import { SubscriptionFeeFormValues } from '~/components/plans/drawers/SubscriptionFeeDrawer'
import { FeatureEntitlementSection } from '~/components/plans/FeatureEntitlementSection'
import { FixedChargesSection } from '~/components/plans/form/FixedChargesSection'
import {
  ImpactOverridenSubscriptionsDialog,
  ImpactOverridenSubscriptionsDialogRef,
} from '~/components/plans/ImpactOverridenSubscriptionsDialog'
import { PlanSettingsFormValues, PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { ProgressiveBillingSection } from '~/components/plans/ProgressiveBillingSection'
import { SubscriptionFeeSection } from '~/components/plans/SubscriptionFeeSection'
import { LocalUsageChargeInput } from '~/components/plans/types'
import { UsageChargesSection } from '~/components/plans/UsageChargesSection'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE } from '~/components/subscriptions/SubscriptionUsageLifetimeGraph'
import { PlanFormProvider } from '~/contexts/PlanFormContext'
import { useDuplicatePlanVar } from '~/core/apolloClient'
import { FORM_ERRORS_ENUM, FORM_TYPE_ENUM } from '~/core/constants/form'
import {
  CustomerSubscriptionDetailsTabsOptionsEnum,
  PlanDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import {
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  PLAN_DETAILS_ROUTE,
  PLAN_SUBSCRIPTION_DETAILS_ROUTE,
  PLANS_ROUTE,
} from '~/core/router'
import {
  CommitmentTypeEnum,
  CurrencyEnum,
  FeatureEntitlementForPlanFragmentDoc,
  FixedChargesOnPlanFormFragmentDoc,
  PlanForSettingsSectionFragmentDoc,
  PlanForSubscriptionFeeSectionFragmentDoc,
  PlanForUsageChargeAccordionFragmentDoc,
  PlanInterval,
  UsageChargeForDrawerFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePlanForm } from '~/hooks/plans/usePlanForm'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

gql`
  fragment TaxForPlanAndChargesInPlanForm on Tax {
    id
    code
    name
    rate
  }

  fragment BillableMetricForPlan on BillableMetric {
    id
    name
    code
    aggregationType
    recurring
    filters {
      id
      key
      values
    }
  }

  fragment EditPlan on Plan {
    id
    name
    code
    description
    interval
    payInAdvance
    invoiceDisplayName
    amountCents
    amountCurrency
    trialPeriod
    subscriptionsCount
    billChargesMonthly
    hasOverriddenPlans
    minimumCommitment {
      amountCents
      commitmentType
      invoiceDisplayName
      taxes {
        id
        ...TaxForPlanAndChargesInPlanForm
      }
    }
    taxes {
      ...TaxForPlanAndChargesInPlanForm
    }
    charges {
      id
      minAmountCents
      payInAdvance
      chargeModel
      appliedPricingUnit {
        conversionRate
        pricingUnit {
          id
          code
          name
          shortName
        }
      }
      taxes {
        ...TaxForPlanAndChargesInPlanForm
      }
      billableMetric {
        id
        code
        ...BillableMetricForPlan
      }

      ...UsageChargeForDrawer
    }

    usageThresholds {
      id
      amountCents
      recurring
      thresholdDisplayName
    }

    ...PlanForUsageChargeAccordion
    ...PlanForSettingsSection
    ...PlanForSubscriptionFeeSection
    ...FeatureEntitlementForPlan
    ...FixedChargesOnPlanForm
  }

  ${UsageChargeForDrawerFragmentDoc}
  ${PlanForUsageChargeAccordionFragmentDoc}
  ${PlanForSettingsSectionFragmentDoc}
  ${PlanForSubscriptionFeeSectionFragmentDoc}
  ${FeatureEntitlementForPlanFragmentDoc}
  ${FixedChargesOnPlanFormFragmentDoc}
`

const CreatePlan = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { type: actionType } = useDuplicatePlanVar()
  const [searchParams] = useSearchParams()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { formikProps, errorCode, isEdition, loading, plan, type } = usePlanForm({})
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const impactOverridenSubscriptionsDialogRef = useRef<ImpactOverridenSubscriptionsDialogRef>(null)
  const editInvoiceDisplayNameDialogRef = useRef<EditInvoiceDisplayNameDialogRef>(null)

  const canBeEdited = !plan?.subscriptionsCount
  const alreadyExistingFixedChargesIds =
    plan?.fixedCharges?.map((fixedCharge) => fixedCharge.id) || []

  const planCloseRedirection = useCallback(() => {
    const origin = searchParams.get('origin')
    const originSubscriptionId = searchParams.get('subscriptionId')
    const originCustomerId = searchParams.get('customerId')

    if (origin === REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE && originSubscriptionId && plan?.id) {
      if (!!originCustomerId) {
        navigate(
          generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
            customerId: originCustomerId,
            subscriptionId: originSubscriptionId,
            tab: CustomerSubscriptionDetailsTabsOptionsEnum.usage,
          }),
        )
      } else {
        navigate(
          generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
            planId: plan?.id,
            subscriptionId: originSubscriptionId,
            tab: CustomerSubscriptionDetailsTabsOptionsEnum.usage,
          }),
        )
      }
    } else if (plan?.id && actionType !== FORM_TYPE_ENUM.duplicate) {
      navigate(
        generatePath(PLAN_DETAILS_ROUTE, {
          planId: plan.id,
          tab: PlanDetailsTabsOptionsEnum.overview,
        }),
      )
    } else {
      navigate(PLANS_ROUTE)
    }
  }, [navigate, plan?.id, searchParams, actionType])

  const onLeave = useCallback(() => {
    if (formikProps.dirty) {
      return warningDialogRef.current?.openDialog()
    }

    return planCloseRedirection()
  }, [formikProps.dirty, planCloseRedirection])

  const pageTitle = useMemo(() => {
    if (isEdition) {
      return translate('text_625fd165963a7b00c8f59767')
    }

    return translate('text_624453d52e945301380e4988')
  }, [isEdition, translate])

  const planSettingsInitialValues = useMemo<PlanSettingsFormValues>(
    () => ({
      name: formikProps.initialValues.name ?? '',
      code: formikProps.initialValues.code ?? '',
      description: formikProps.initialValues.description ?? '',
      interval: formikProps.initialValues.interval ?? PlanInterval.Monthly,
      amountCurrency: formikProps.initialValues.amountCurrency ?? CurrencyEnum.Usd,
      taxes: formikProps.initialValues.taxes ?? [],
    }),
    [formikProps.initialValues],
  )

  // Have to debounce update to formik to avoid form slowness for now.
  // While tanstack works very fast, formik code is still there and would affect the rendering so better to delay it a bit.
  // We accumulate partial changes in a ref so that synchronous calls (e.g. name + code
  // from NameAndCodeGroup) are batched before the debounced flush fires.
  const pendingSettingsChangesRef = useRef<Partial<PlanSettingsFormValues>>({})

  const handlePlanSettingsChange = useMemo(() => {
    const flush = debounce(() => {
      const changes = { ...pendingSettingsChangesRef.current }

      pendingSettingsChangesRef.current = {}
      Object.entries(changes).forEach(([key, value]) => {
        formikProps.setFieldValue(key, value)
      })
    }, 100)

    return (changes: Partial<PlanSettingsFormValues>) => {
      Object.assign(pendingSettingsChangesRef.current, changes)
      flush()
    }
  }, [formikProps])

  const handleSubscriptionFeeSave = (values: SubscriptionFeeFormValues) => {
    formikProps.setValues({
      ...formikProps.values,
      ...values,
    })
  }

  const handleMinimumCommitmentSave = (values: MinimumCommitmentFormValues) => {
    formikProps.setFieldValue('minimumCommitment', {
      ...formikProps.values.minimumCommitment,
      ...values,
      commitmentType: CommitmentTypeEnum.MinimumCommitment,
    })
  }

  const handleProgressiveBillingSave = (values: ProgressiveBillingFormValues) => {
    formikProps.setFieldValue('nonRecurringUsageThresholds', values.nonRecurringUsageThresholds)
    formikProps.setFieldValue('recurringUsageThreshold', values.recurringUsageThreshold)
  }

  const handleEntitlementDrawerSave = (values: FeatureEntitlementFormValues) => {
    const current = formikProps.values.entitlements || []
    const existingIndex = current.findIndex((e) => e.featureCode === values.featureCode)

    if (existingIndex >= 0) {
      const updated = [...current]

      updated[existingIndex] = {
        featureId: values.featureId,
        featureName: values.featureName,
        featureCode: values.featureCode,
        privileges: values.privileges,
      }
      formikProps.setFieldValue('entitlements', updated)
    } else {
      formikProps.setFieldValue('entitlements', [
        ...current,
        {
          featureId: values.featureId,
          featureName: values.featureName,
          featureCode: values.featureCode,
          privileges: values.privileges,
        },
      ])
    }
  }

  return (
    <PlanFormProvider
      currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
      interval={formikProps.values.interval || PlanInterval.Monthly}
    >
      <CenteredPage.Wrapper>
        <CenteredPage.Header>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {pageTitle}
          </Typography>
          <Button
            variant="quaternary"
            icon="close"
            onClick={onLeave}
            data-test="close-create-plan-button"
          />
        </CenteredPage.Header>

        <CenteredPage.Container className="gap-20">
          {loading && <FormLoadingSkeleton id="create-plan" />}
          {!loading && (
            <>
              <CenteredPage.SectionWrapper>
                <CenteredPage.PageTitle
                  title={pageTitle}
                  description={translate('text_1770063200028ww5znt6yree')}
                />

                <PlanSettingsSection
                  canBeEdited={canBeEdited}
                  isEdition={isEdition}
                  initialValuesFromFormik={planSettingsInitialValues}
                  onSettingsChange={handlePlanSettingsChange}
                  codeError={
                    errorCode === FORM_ERRORS_ENUM.existingCode
                      ? 'text_632a2d437e341dcc76817556'
                      : undefined
                  }
                />
              </CenteredPage.SectionWrapper>

              <CenteredPage.SectionWrapper>
                <CenteredPage.PageTitle
                  title={translate('text_6661fc17337de3591e29e3e7')}
                  description={translate('text_6661fc17337de3591e29e3e9')}
                />

                <CenteredPage.SubsectionWrapper>
                  <SubscriptionFeeSection
                    canBeEdited={canBeEdited}
                    formikProps={formikProps}
                    isEdition={isEdition}
                    onDrawerSave={handleSubscriptionFeeSave}
                  />

                  <FixedChargesSection
                    alreadyExistingFixedChargesIds={alreadyExistingFixedChargesIds}
                    canBeEdited={canBeEdited}
                    formikProps={formikProps}
                    isEdition={isEdition}
                  />

                  <UsageChargesSection
                    canBeEdited={canBeEdited}
                    isEdition={isEdition}
                    formikProps={formikProps}
                    premiumWarningDialogRef={premiumWarningDialogRef}
                    alreadyExistingCharges={plan?.charges as LocalUsageChargeInput[]}
                  />
                </CenteredPage.SubsectionWrapper>
              </CenteredPage.SectionWrapper>

              <CenteredPage.SectionWrapper>
                <CenteredPage.PageTitle
                  title={translate('text_6661fc17337de3591e29e44d')}
                  description={translate('text_6667029c1051a60107146e35')}
                />

                <CenteredPage.SubsectionWrapper>
                  <CommitmentsSection
                    formikProps={formikProps}
                    onDrawerSave={handleMinimumCommitmentSave}
                  />

                  <ProgressiveBillingSection
                    formikProps={formikProps}
                    onDrawerSave={handleProgressiveBillingSave}
                  />

                  <FeatureEntitlementSection
                    formikProps={formikProps}
                    isEdition={isEdition}
                    onDrawerSave={handleEntitlementDrawerSave}
                  />
                </CenteredPage.SubsectionWrapper>
              </CenteredPage.SectionWrapper>
            </>
          )}
        </CenteredPage.Container>

        {(!loading || plan) && (
          <CenteredPage.StickyFooter>
            <Button variant="quaternary" onClick={onLeave}>
              {translate('text_6411e6b530cb47007488b027')}
            </Button>
            <Button
              disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
              loading={formikProps.isSubmitting}
              onClick={() => {
                if (plan?.hasOverriddenPlans && isEdition) {
                  return impactOverridenSubscriptionsDialogRef.current?.openDialog({
                    onSave: async (cascadeUpdates) => {
                      await formikProps.setFieldValue('cascadeUpdates', cascadeUpdates)

                      return formikProps.submitForm()
                    },
                  })
                }

                return formikProps.submitForm()
              }}
              data-test="submit"
            >
              {translate(
                type === FORM_TYPE_ENUM.edition
                  ? 'text_6661fc17337de3591e29e461'
                  : 'text_6661ffe746c680007e2df0e2',
              )}
            </Button>
          </CenteredPage.StickyFooter>
        )}
      </CenteredPage.Wrapper>

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_665deda4babaf700d603ea13')}
        description={translate('text_665dedd557dc3c00c62eb83d')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={() => planCloseRedirection()}
      />
      <ImpactOverridenSubscriptionsDialog ref={impactOverridenSubscriptionsDialogRef} />
      <EditInvoiceDisplayNameDialog ref={editInvoiceDisplayNameDialogRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </PlanFormProvider>
  )
}

export default CreatePlan
