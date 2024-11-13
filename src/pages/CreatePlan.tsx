import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useRef } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { Button, Skeleton, Typography } from '~/components/designSystem'
import {
  EditInvoiceDisplayName,
  EditInvoiceDisplayNameRef,
} from '~/components/invoices/EditInvoiceDisplayName'
import { ChargesSection } from '~/components/plans/ChargesSection'
import { CommitmentsSection } from '~/components/plans/CommitmentsSection'
import { FixedFeeSection } from '~/components/plans/FixedFeeSection'
import {
  ImpactOverridenSubscriptionsDialog,
  ImpactOverridenSubscriptionsDialogRef,
} from '~/components/plans/ImpactOverridenSubscriptionsDialog'
import { PlanCodeSnippet } from '~/components/plans/PlanCodeSnippet'
import { PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { ProgressiveBillingSection } from '~/components/plans/ProgressiveBillingSection'
import { LocalChargeInput } from '~/components/plans/types'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE } from '~/components/subscriptions/SubscriptionUsageLifetimeGraph'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { useDuplicatePlanVar } from '~/core/apolloClient'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import {
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  PLAN_DETAILS_ROUTE,
  PLAN_SUBSCRIPTION_DETAILS_ROUTE,
  PLANS_ROUTE,
} from '~/core/router'
import {
  ChargeAccordionFragmentDoc,
  PlanForChargeAccordionFragmentDoc,
  PlanForFixedFeeSectionFragmentDoc,
  PlanForSettingsSectionFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePlanForm } from '~/hooks/plans/usePlanForm'
import { Card, NAV_HEIGHT, PageHeader, theme } from '~/styles'
import { Content, Main, MAIN_PADDING, Side, SkeletonHeader } from '~/styles/mainObjectsForm'

import { PlanDetailsTabsOptionsEnum } from './PlanDetails'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from './SubscriptionDetails'

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
      taxes {
        ...TaxForPlanAndChargesInPlanForm
      }
      billableMetric {
        id
        code
        ...BillableMetricForPlan
      }
      ...ChargeAccordion
      chargeModel
    }
    usageThresholds {
      id
      amountCents
      recurring
      thresholdDisplayName
    }

    ...PlanForChargeAccordion
    ...PlanForSettingsSection
    ...PlanForFixedFeeSection
  }

  ${ChargeAccordionFragmentDoc}
  ${PlanForChargeAccordionFragmentDoc}
  ${PlanForSettingsSectionFragmentDoc}
  ${PlanForFixedFeeSectionFragmentDoc}
`

const CreatePlan = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { type: actionType } = useDuplicatePlanVar()
  const [searchParams] = useSearchParams()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { errorCode, formikProps, isEdition, loading, plan, type } = usePlanForm({})
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const impactOverridenSubscriptionsDialogRef = useRef<ImpactOverridenSubscriptionsDialogRef>(null)
  const editInvoiceDisplayNameRef = useRef<EditInvoiceDisplayNameRef>(null)

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
      <PageHeader>
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
      </PageHeader>
      <Content>
        <Main>
          <MainMinimumContent>
            {loading && !plan ? (
              <>
                <SkeletonHeader>
                  <Skeleton variant="text" width={280} marginBottom={theme.spacing(5)} />
                  <Skeleton variant="text" width="inherit" marginBottom={theme.spacing(4)} />
                  <Skeleton variant="text" width={120} />
                </SkeletonHeader>

                {[0, 1, 2].map((skeletonCard) => (
                  <Card key={`skeleton-${skeletonCard}`}>
                    <Skeleton variant="text" width={280} marginBottom={theme.spacing(9)} />
                    <Skeleton variant="text" width="inherit" marginBottom={theme.spacing(4)} />
                    <Skeleton variant="text" width={120} />
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
                    errorCode={errorCode}
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
                    <FixedFeeSection
                      isInitiallyOpen={type === FORM_TYPE_ENUM.creation}
                      canBeEdited={canBeEdited}
                      formikProps={formikProps}
                      isEdition={isEdition}
                      editInvoiceDisplayNameRef={editInvoiceDisplayNameRef}
                    />

                    <ChargesSection
                      canBeEdited={canBeEdited}
                      isEdition={isEdition}
                      formikProps={formikProps}
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
                      {translate('text_6667029c1051a60107146e35')}
                    </Typography>
                  </SectionTitle>

                  <Card $childSpacing={8}>
                    <ProgressiveBillingSection formikProps={formikProps} />
                    <CommitmentsSection
                      formikProps={formikProps}
                      premiumWarningDialogRef={premiumWarningDialogRef}
                      editInvoiceDisplayNameRef={editInvoiceDisplayNameRef}
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
      </Content>
      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_665deda4babaf700d603ea13')}
        description={translate('text_665dedd557dc3c00c62eb83d')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={() => planCloseRedirection()}
      />

      <ImpactOverridenSubscriptionsDialog ref={impactOverridenSubscriptionsDialogRef} />
      <EditInvoiceDisplayName ref={editInvoiceDisplayNameRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </div>
  )
}

export default CreatePlan

const SectionWrapper = styled.div`
  > div:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
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

const FOOTER_HEIGHT = 80
const FOOTER_MARGIN = 80

const MainMinimumContent = styled.div`
  min-height: calc(
    100vh - ${NAV_HEIGHT}px - ${FOOTER_HEIGHT}px - ${FOOTER_MARGIN}px - ${MAIN_PADDING}
  );
`

const SectionFooter = styled.div`
  height: ${FOOTER_HEIGHT}px;
  position: sticky;
  bottom: 0;
  background-color: ${theme.palette.background.paper};
  margin-top: ${FOOTER_MARGIN}px;
  border-top: 1px solid ${theme.palette.grey[200]};
  max-width: initial !important;
  // Negative margin to compensate for the padding of the parent
  margin-left: -${MAIN_PADDING};
  margin-right: -${MAIN_PADDING};
  padding: 0 ${MAIN_PADDING};
  z-index: ${theme.zIndex.navBar};

  ${theme.breakpoints.down('md')} {
    width: 100%;
    padding: 0 ${theme.spacing(4)};
    margin-left: -${theme.spacing(4)};
    margin-right: -${theme.spacing(4)};
  }
`

const SectionFooterWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  max-width: 720px;
`
