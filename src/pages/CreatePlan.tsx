import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { useEffect, useRef } from 'react'
import { number, object, string } from 'yup'

import { Button, Skeleton, Typography } from '~/components/designSystem'
import { ChargesSection } from '~/components/plans/ChargesSection'
import { FixedFeeSection } from '~/components/plans/FixedFeeSection'
import { PlanCodeSnippet } from '~/components/plans/PlanCodeSnippet'
import { PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { PLAN_FORM_TYPE_ENUM } from '~/core/apolloClient'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { chargeSchema } from '~/formValidation/chargeSchema'
import {
  ChargeAccordionFragmentDoc,
  CurrencyEnum,
  PlanForChargeAccordionFragmentDoc,
  PlanForFixedFeeSectionFragmentDoc,
  PlanForSettingsSectionFragmentDoc,
  PlanInterval,
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

import { LocalChargeInput, PlanFormInput } from '../components/plans/types'

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
  const { loading, type, plan, parentPlanName, errorCode, onSave, onClose } = usePlanForm()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const { translate } = useInternationalization()
  const isEdition = type === PLAN_FORM_TYPE_ENUM.edition
  const formikProps = useFormik<PlanFormInput>({
    initialValues: {
      name: plan?.name || '',
      code: plan?.code || '',
      description: plan?.description || '',
      interval: plan?.interval || PlanInterval.Monthly,
      taxes: plan?.taxes || [],
      payInAdvance: plan?.payInAdvance || false,
      amountCents: isNaN(plan?.amountCents)
        ? ''
        : String(
            deserializeAmount(plan?.amountCents || 0, plan?.amountCurrency || CurrencyEnum.Usd)
          ),
      amountCurrency: plan?.amountCurrency || CurrencyEnum.Usd,
      trialPeriod:
        plan?.trialPeriod === null || plan?.trialPeriod === undefined
          ? isEdition
            ? 0
            : undefined
          : plan?.trialPeriod,
      billChargesMonthly: plan?.billChargesMonthly || undefined,
      charges: plan?.charges
        ? plan?.charges.map(
            ({ taxes, properties, groupProperties, minAmountCents, payInAdvance, ...charge }) => ({
              taxes: taxes || [],
              minAmountCents: isNaN(minAmountCents)
                ? undefined
                : String(
                    deserializeAmount(minAmountCents || 0, plan.amountCurrency || CurrencyEnum.Usd)
                  ),
              payInAdvance: payInAdvance || false,
              properties: properties ? getPropertyShape(properties) : undefined,
              groupProperties: groupProperties?.length
                ? groupProperties?.map((prop) => {
                    return {
                      groupId: prop.groupId,
                      values: getPropertyShape(prop.values),
                    }
                  })
                : [],
              ...charge,
            })
          )
        : ([] as LocalChargeInput[]),
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      interval: string().required(''),
      amountCents: string().required(''),
      trialPeriod: number().typeError(translate('text_624ea7c29103fd010732ab7d')).nullable(),
      amountCurrency: string().required(''),
      charges: chargeSchema,
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })

  const canBeEdited = !plan?.subscriptionsCount
  const hasAnyMeteredCharge = formikProps.values.charges.some((c) => !c.billableMetric.recurring)
  const hasAnyRecurringCharge = formikProps.values.charges.some((c) => !!c.billableMetric.recurring)

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      formikProps.setFieldError('code', 'text_632a2d437e341dcc76817556')
      const rootElement = document.getElementById('root')

      if (!rootElement) return
      rootElement.scrollTo({ top: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  useEffect(() => {
    if (
      (!formikProps.values.charges ||
        !formikProps.values.charges.length ||
        formikProps.values.interval !== PlanInterval.Yearly) &&
      !!formikProps.values.billChargesMonthly
    ) {
      formikProps.setFieldValue('billChargesMonthly', false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formikProps.values.charges,
    formikProps.values.billChargesMonthly,
    formikProps.values.interval,
  ])

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
                  canBeEdited={canBeEdited}
                  formikProps={formikProps}
                  isEdition={isEdition}
                />

                <ChargesSection
                  canBeEdited={canBeEdited}
                  isEdition={isEdition}
                  formikProps={formikProps}
                  alreadyExistingCharges={plan?.charges}
                  getPropertyShape={getPropertyShape}
                  hasAnyMeteredCharge={hasAnyMeteredCharge}
                  hasAnyRecurringCharge={hasAnyRecurringCharge}
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
    </div>
  )
}

export default CreatePlan
