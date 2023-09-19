import { gql } from '@apollo/client'
import { useRef } from 'react'

import { Button, Skeleton, Typography } from '~/components/designSystem'
import {
  EditInvoiceDisplayName,
  EditInvoiceDisplayNameRef,
} from '~/components/invoices/EditInvoiceDisplayName'
import { ChargesSection } from '~/components/plans/ChargesSection'
import { FixedFeeSection } from '~/components/plans/FixedFeeSection'
import { PlanCodeSnippet } from '~/components/plans/PlanCodeSnippet'
import { PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { PLAN_FORM_TYPE_ENUM } from '~/core/apolloClient'
import {
  ChargeAccordionFragmentDoc,
  PlanForChargeAccordionFragmentDoc,
  PlanForFixedFeeSectionFragmentDoc,
  PlanForSettingsSectionFragmentDoc,
  PropertiesInput,
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

gql`
  # Might need to be removed
  fragment TaxForPlanAndChargesInPlanForm on Tax {
    id
    code
    name
    rate
  }

  fragment billableMetricForPlan on BillableMetric {
    id
    name
    code
    aggregationType
    recurring
    flatGroups {
      id
      key
      value
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
        ...billableMetricForPlan
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

export const getPropertyShape = (properties: PropertiesInput | undefined) => {
  return {
    amount: properties?.amount || undefined,
    packageSize:
      properties?.packageSize === null || properties?.packageSize === undefined
        ? 10
        : properties?.packageSize,
    fixedAmount: properties?.fixedAmount || undefined,
    freeUnitsPerEvents: properties?.freeUnitsPerEvents || undefined,
    freeUnitsPerTotalAggregation: properties?.freeUnitsPerTotalAggregation || undefined,
    perTransactionMinAmount: properties?.perTransactionMinAmount || undefined,
    perTransactionMaxAmount: properties?.perTransactionMaxAmount || undefined,
    freeUnits: properties?.freeUnits || 0,
    graduatedRanges: properties?.graduatedRanges || undefined,
    graduatedPercentageRanges: properties?.graduatedPercentageRanges || undefined,
    volumeRanges: properties?.volumeRanges || undefined,
    rate: properties?.rate || undefined,
  }
}

const CreatePlan = () => {
  const { errorCode, formikProps, isEdition, loading, parentPlanName, plan, type, onClose } =
    usePlanForm()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const editInvoiceDisplayNameRef = useRef<EditInvoiceDisplayNameRef>(null)
  const { translate } = useInternationalization()

  const canBeEdited = !plan?.subscriptionsCount

  return (
    <div>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {type === PLAN_FORM_TYPE_ENUM.override
            ? translate('text_6329fd60c32c30152678a6e8', { planName: parentPlanName })
            : translate(
                isEdition ? 'text_625fd165963a7b00c8f59767' : 'text_624453d52e945301380e4988'
              )}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() => (formikProps.dirty ? warningDialogRef.current?.openDialog() : onClose())}
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
                    {type === PLAN_FORM_TYPE_ENUM.override
                      ? translate('text_6329fd60c32c30152678a6f4', { planName: parentPlanName })
                      : translate(
                          isEdition
                            ? 'text_625fd165963a7b00c8f59771'
                            : 'text_624453d52e945301380e498a'
                        )}
                  </Title>
                  <Subtitle>
                    {translate(
                      type === PLAN_FORM_TYPE_ENUM.override
                        ? 'text_6329fd60c32c30152678a6f6'
                        : type === PLAN_FORM_TYPE_ENUM.edition
                        ? 'text_625fd165963a7b00c8f5977b'
                        : 'text_642d5eb2783a2ad10d670318'
                    )}
                  </Subtitle>
                </div>

                <PlanSettingsSection
                  canBeEdited={canBeEdited}
                  errorCode={errorCode}
                  formikProps={formikProps}
                  type={type}
                />

                <FixedFeeSection
                  type={type}
                  canBeEdited={canBeEdited}
                  formikProps={formikProps}
                  isEdition={isEdition}
                  editInvoiceDisplayNameRef={editInvoiceDisplayNameRef}
                />

                <ChargesSection
                  canBeEdited={canBeEdited}
                  isEdition={isEdition}
                  formikProps={formikProps}
                  alreadyExistingCharges={plan?.charges}
                  getPropertyShape={getPropertyShape}
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
                      type === PLAN_FORM_TYPE_ENUM.override
                        ? 'text_6329fd60c32c30152678a73c'
                        : type === PLAN_FORM_TYPE_ENUM.edition
                        ? 'text_625fd165963a7b00c8f598aa'
                        : 'text_62ff5d01a306e274d4ffcc75'
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
          isEdition ? 'text_625fd165963a7b00c8f59777' : 'text_624454dd67656e00c534bc35'
        )}
        description={translate(
          isEdition ? 'text_625fd165963a7b00c8f59781' : 'text_624454dd67656e00c534bc3b'
        )}
        continueText={translate(
          isEdition ? 'text_625fd165963a7b00c8f59795' : 'text_624454dd67656e00c534bc41'
        )}
        onContinue={onClose}
      />

      <EditInvoiceDisplayName ref={editInvoiceDisplayNameRef} />
    </div>
  )
}

export default CreatePlan
