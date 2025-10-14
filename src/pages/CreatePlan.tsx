import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { FC, PropsWithChildren, useRef } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'

import { Button, Card, Skeleton, Typography } from '~/components/designSystem'
import {
  EditInvoiceDisplayNameDialog,
  EditInvoiceDisplayNameDialogRef,
} from '~/components/invoices/EditInvoiceDisplayNameDialog'
import { CommitmentsSection } from '~/components/plans/CommitmentsSection'
import { FeatureEntitlementSection } from '~/components/plans/FeatureEntitlementSection'
import {
  ImpactOverridenSubscriptionsDialog,
  ImpactOverridenSubscriptionsDialogRef,
} from '~/components/plans/ImpactOverridenSubscriptionsDialog'
import { PlanCodeSnippet } from '~/components/plans/PlanCodeSnippet'
import { PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { ProgressiveBillingSection } from '~/components/plans/ProgressiveBillingSection'
import { SubscriptionFeeSection } from '~/components/plans/SubscriptionFeeSection'
import { LocalUsageChargeInput } from '~/components/plans/types'
import { UsageChargesSection } from '~/components/plans/UsageChargesSection'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE } from '~/components/subscriptions/SubscriptionUsageLifetimeGraph'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { useDuplicatePlanVar } from '~/core/apolloClient'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
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
  FeatureEntitlementForPlanFragmentDoc,
  PlanForSettingsSectionFragmentDoc,
  PlanForSubscriptionFeeSectionFragmentDoc,
  PlanForUsageChargeAccordionFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePlanForm } from '~/hooks/plans/usePlanForm'
import { PageHeader } from '~/styles'
import { Main, Side } from '~/styles/mainObjectsForm'

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

      ...UsageChargeAccordion
      chargeModel
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
  }

  ${PlanForUsageChargeAccordionFragmentDoc}
  ${PlanForSettingsSectionFragmentDoc}
  ${PlanForSubscriptionFeeSectionFragmentDoc}
  ${FeatureEntitlementForPlanFragmentDoc}
`

const CreatePlan = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { type: actionType } = useDuplicatePlanVar()
  const [searchParams] = useSearchParams()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { formikProps, isEdition, loading, plan, type } = usePlanForm({})
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const impactOverridenSubscriptionsDialogRef = useRef<ImpactOverridenSubscriptionsDialogRef>(null)
  const editInvoiceDisplayNameDialogRef = useRef<EditInvoiceDisplayNameDialogRef>(null)

  const canBeEdited = !plan?.subscriptionsCount

  const planCloseRedirection = () => {
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
  }

  return (
    <div>
      <PageHeader.Wrapper>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(isEdition ? 'text_625fd165963a7b00c8f59767' : 'text_624453d52e945301380e4988')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            formikProps.dirty ? warningDialogRef.current?.openDialog() : planCloseRedirection()
          }
          data-test="close-create-plan-button"
        />
      </PageHeader.Wrapper>
      <div className="min-height-minus-nav flex">
        <Main>
          <MainMinimumContent>
            {loading && !plan ? (
              <>
                <div className="px-8">
                  <Skeleton variant="text" className="mb-5 w-70" />
                  <Skeleton variant="text" className="mb-4" />
                  <Skeleton variant="text" className="w-30" />
                </div>

                {[0, 1, 2].map((skeletonCard) => (
                  <Card key={`skeleton-${skeletonCard}`}>
                    <Skeleton variant="text" className="w-70" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" className="w-30" />
                  </Card>
                ))}
              </>
            ) : (
              <Stack width="100%" gap={12}>
                <SectionWrapper>
                  <SectionTitle>
                    <Typography variant="headline">
                      {translate('text_642d5eb2783a2ad10d67031a')}
                    </Typography>
                    <Typography variant="body">
                      {translate('text_6661fc17337de3591e29e3c1')}
                    </Typography>
                  </SectionTitle>

                  <PlanSettingsSection
                    canBeEdited={canBeEdited}
                    formikProps={formikProps}
                    isEdition={isEdition}
                  />
                </SectionWrapper>
                <SectionWrapper>
                  <SectionTitle>
                    <Typography variant="headline">
                      {translate('text_6661fc17337de3591e29e3e7')}
                    </Typography>
                    <Typography variant="body">
                      {translate('text_6661fc17337de3591e29e3e9')}
                    </Typography>
                  </SectionTitle>

                  <Section>
                    <SubscriptionFeeSection
                      isInitiallyOpen={type === FORM_TYPE_ENUM.creation}
                      canBeEdited={canBeEdited}
                      formikProps={formikProps}
                      isEdition={isEdition}
                      editInvoiceDisplayNameDialogRef={editInvoiceDisplayNameDialogRef}
                    />

                    <UsageChargesSection
                      canBeEdited={canBeEdited}
                      isEdition={isEdition}
                      formikProps={formikProps}
                      premiumWarningDialogRef={premiumWarningDialogRef}
                      alreadyExistingCharges={plan?.charges as LocalUsageChargeInput[]}
                      editInvoiceDisplayNameDialogRef={editInvoiceDisplayNameDialogRef}
                    />
                  </Section>
                </SectionWrapper>
                <SectionWrapper>
                  <SectionTitle>
                    <Typography variant="headline">
                      {translate('text_6661fc17337de3591e29e44d')}
                    </Typography>
                    <Typography variant="body">
                      {translate('text_6667029c1051a60107146e35')}
                    </Typography>
                  </SectionTitle>

                  <Card className="gap-8">
                    <ProgressiveBillingSection formikProps={formikProps} />
                    <CommitmentsSection
                      formikProps={formikProps}
                      premiumWarningDialogRef={premiumWarningDialogRef}
                      editInvoiceDisplayNameDialogRef={editInvoiceDisplayNameDialogRef}
                    />

                    <FeatureEntitlementSection
                      formikProps={formikProps}
                      isEdition={isEdition}
                      premiumWarningDialogRef={premiumWarningDialogRef}
                    />
                  </Card>
                </SectionWrapper>
              </Stack>
            )}
          </MainMinimumContent>

          {(!loading || plan) && (
            <SectionFooter>
              <SectionFooterWrapper>
                <Button
                  disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
                  loading={formikProps.isSubmitting}
                  size="large"
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
              </SectionFooterWrapper>
            </SectionFooter>
          )}
        </Main>
        <Side>
          <PlanCodeSnippet loading={loading} plan={formikProps.values} />
        </Side>
      </div>
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
    </div>
  )
}

export default CreatePlan

const SectionWrapper: FC<PropsWithChildren> = ({ children }) => (
  <div className="not-last-child:mb-6">{children}</div>
)

const SectionTitle: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex flex-col gap-1">{children}</div>
)

const Section: FC<PropsWithChildren> = ({ children }) => (
  <section className="flex flex-col gap-4">{children}</section>
)

const MainMinimumContent: FC<PropsWithChildren> = ({ children }) => (
  <div className="min-height-minus-nav-footer-formMainPadding">{children}</div>
)

const SectionFooter: FC<PropsWithChildren> = ({ children }) => (
  <div className="sticky bottom-0 z-navBar -mx-4 mt-20 h-20 !max-w-none border-t border-solid border-grey-200 bg-white px-4 py-0 md:-mx-12 md:px-12">
    {children}
  </div>
)

const SectionFooterWrapper: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex h-full items-center justify-end">{children}</div>
)
