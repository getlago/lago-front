import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { Button, Skeleton, Typography } from '~/components/designSystem'
import {
  EditInvoiceDisplayName,
  EditInvoiceDisplayNameRef,
} from '~/components/invoices/EditInvoiceDisplayName'
import { ChargesSection } from '~/components/plans/ChargesSection'
import { CommitmentsSection } from '~/components/plans/CommitmentsSection'
import { FixedFeeSection } from '~/components/plans/FixedFeeSection'
import { PlanCodeSnippet } from '~/components/plans/PlanCodeSnippet'
import { PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { LocalChargeInput } from '~/components/plans/types'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { useDuplicatePlanVar } from '~/core/apolloClient'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { PLAN_DETAILS_ROUTE, PLANS_ROUTE } from '~/core/router'
import {
  ChargeAccordionFragmentDoc,
  PlanForChargeAccordionFragmentDoc,
  PlanForFixedFeeSectionFragmentDoc,
  PlanForSettingsSectionFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePlanForm } from '~/hooks/plans/usePlanForm'
import { Card, PageHeader, theme } from '~/styles'
import {
  ButtonContainer,
  Content,
  Main,
  Side,
  SkeletonHeader,
  Subtitle,
  Title,
} from '~/styles/mainObjectsForm'

import { PlanDetailsTabsOptionsEnum } from './PlanDetails'

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
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { errorCode, formikProps, isEdition, loading, plan, type } = usePlanForm({})
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const editInvoiceDisplayNameRef = useRef<EditInvoiceDisplayNameRef>(null)

  const canBeEdited = !plan?.subscriptionsCount

  const planCloseRedirection = () => {
    if (plan?.id && actionType !== FORM_TYPE_ENUM.duplicate) {
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
          <div>
            {loading && !plan ? (
              <>
                <SkeletonHeader>
                  <Skeleton
                    variant="text"
                    width={280}
                    height={12}
                    marginBottom={theme.spacing(5)}
                  />
                  <Skeleton
                    variant="text"
                    width="inherit"
                    height={12}
                    marginBottom={theme.spacing(4)}
                  />
                  <Skeleton variant="text" width={120} height={12} />
                </SkeletonHeader>

                {[0, 1, 2].map((skeletonCard) => (
                  <Card key={`skeleton-${skeletonCard}`}>
                    <Skeleton
                      variant="text"
                      width={280}
                      height={12}
                      marginBottom={theme.spacing(9)}
                    />
                    <Skeleton
                      variant="text"
                      width="inherit"
                      height={12}
                      marginBottom={theme.spacing(4)}
                    />
                    <Skeleton variant="text" width={120} height={12} />
                  </Card>
                ))}
              </>
            ) : (
              <>
                <div>
                  <Title variant="headline">
                    {translate(
                      isEdition ? 'text_625fd165963a7b00c8f59771' : 'text_624453d52e945301380e498a',
                    )}
                  </Title>
                  <Subtitle>
                    {translate(
                      type === FORM_TYPE_ENUM.edition
                        ? 'text_625fd165963a7b00c8f5977b'
                        : 'text_642d5eb2783a2ad10d670318',
                    )}
                  </Subtitle>
                </div>

                <PlanSettingsSection
                  canBeEdited={canBeEdited}
                  errorCode={errorCode}
                  formikProps={formikProps}
                  isEdition={isEdition}
                />

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

                <CommitmentsSection
                  formikProps={formikProps}
                  premiumWarningDialogRef={premiumWarningDialogRef}
                  editInvoiceDisplayNameRef={editInvoiceDisplayNameRef}
                />

                <ButtonContainer>
                  <Button
                    disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
                    fullWidth
                    size="large"
                    onClick={formikProps.submitForm}
                    data-test="submit"
                  >
                    {translate(
                      type === FORM_TYPE_ENUM.edition
                        ? 'text_625fd165963a7b00c8f598aa'
                        : 'text_62ff5d01a306e274d4ffcc75',
                    )}
                  </Button>
                </ButtonContainer>
              </>
            )}
          </div>
        </Main>
        <Side>
          <PlanCodeSnippet loading={loading} plan={formikProps.values} />
        </Side>
      </Content>

      <WarningDialog
        ref={warningDialogRef}
        title={translate(
          isEdition ? 'text_625fd165963a7b00c8f59777' : 'text_624454dd67656e00c534bc35',
        )}
        description={translate(
          isEdition ? 'text_625fd165963a7b00c8f59781' : 'text_624454dd67656e00c534bc3b',
        )}
        continueText={translate(
          isEdition ? 'text_625fd165963a7b00c8f59795' : 'text_624454dd67656e00c534bc41',
        )}
        onContinue={() => planCloseRedirection()}
      />

      <EditInvoiceDisplayName ref={editInvoiceDisplayNameRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </div>
  )
}

export default CreatePlan
