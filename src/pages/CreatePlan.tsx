import { useRef, useEffect, useState } from 'react'
import { useFormik } from 'formik'
import { object, string, number } from 'yup'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { ChargeAccordion } from '~/components/plans/ChargeAccordion'
import {
  PlanInterval,
  CurrencyEnum,
  ChargeModelEnum,
  ChargeAccordionFragmentDoc,
  PropertiesInput,
  PlanSettingsSectionFragmentDoc,
  FixedFeeSectionFragmentDoc,
} from '~/generated/graphql'
import { SwitchField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import {
  Typography,
  Button,
  Skeleton,
  Icon,
  Tooltip,
  IconSizeEnum,
} from '~/components/designSystem'
import { theme, Card, PageHeader } from '~/styles'
import { AddChargeDialog, AddChargeDialogRef } from '~/components/plans/AddChargeDialog'
import { PlanCodeSnippet } from '~/components/plans/PlanCodeSnippet'
import { usePlanForm, PLAN_FORM_TYPE_ENUM, FORM_ERRORS_ENUM } from '~/hooks/plans/usePlanForm'
import { chargeSchema } from '~/formValidation/chargeSchema'
import {
  Main,
  Content,
  Title,
  Subtitle,
  Side,
  SkeletonHeader,
  ButtonContainer,
} from '~/styles/mainObjectsForm'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { PlanSettingsSection } from '~/components/plans/PlanSettingsSection'
import { FixedFeeSection } from '~/components/plans/FixedFeeSection'

import { PlanFormInput, LocalChargeInput } from '../components/plans/types'

gql`
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
    charges {
      id
      billableMetric {
        id
        code
      }
      ...ChargeAccordion
      chargeModel
    }

    ...PlanSettingsSection
    ...FixedFeeSection
  }

  ${ChargeAccordionFragmentDoc}
  ${PlanSettingsSectionFragmentDoc}
  ${FixedFeeSectionFragmentDoc}
`

const getNewChargeId = (id: string, index: number) => `plan-charge-${id}-${index}`

const getPropertyShape = (properties: PropertiesInput) => {
  return {
    amount: properties?.amount || undefined,
    packageSize:
      properties?.packageSize === null || properties?.packageSize === undefined
        ? 10
        : properties?.packageSize,
    fixedAmount: properties?.fixedAmount || undefined,
    freeUnitsPerEvents: properties?.freeUnitsPerEvents || undefined,
    freeUnitsPerTotalAggregation: properties?.freeUnitsPerTotalAggregation || undefined,
    freeUnits: properties?.freeUnits || 0,
    graduatedRanges: properties?.graduatedRanges || undefined,
    volumeRanges: properties?.volumeRanges || undefined,
    rate: properties?.rate || undefined,
  }
}

const CreatePlan = () => {
  const { loading, type, plan, parentPlanName, errorCode, onSave, onClose } = usePlanForm()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const { translate } = useInternationalization()
  const containerRef = useRef<HTMLDivElement>(null)
  const addChargeDialogRef = useRef<AddChargeDialogRef>(null)
  const [newChargeId, setNewChargeId] = useState<string | null>(null)
  const isEdition = type === PLAN_FORM_TYPE_ENUM.edition
  const formikProps = useFormik<PlanFormInput>({
    initialValues: {
      name: plan?.name || '',
      code: plan?.code || '',
      description: plan?.description || '',
      interval: plan?.interval || PlanInterval.Monthly,
      payInAdvance: plan?.payInAdvance || false,
      // @ts-ignore
      amountCents: isNaN(plan?.amountCents)
        ? undefined
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
      // @ts-ignore
      charges: plan?.charges
        ? plan?.charges.map(({ properties, groupProperties, ...charge }) => ({
            properties:
              properties && !charge.billableMetric.flatGroups?.length
                ? getPropertyShape(properties)
                : undefined,
            groupProperties:
              groupProperties?.length && !!charge.billableMetric.flatGroups?.length
                ? groupProperties?.map((prop) => {
                    return {
                      groupId: prop.groupId,
                      values: getPropertyShape(prop.values),
                    }
                  })
                : undefined,
            ...charge,
          }))
        : ([] as LocalChargeInput[]),
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      interval: string().required(''),
      amountCents: string().required(''),
      trialPeriod: number().typeError(translate('text_624ea7c29103fd010732ab7d')),
      amountCurrency: string().required(''),
      charges: chargeSchema,
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })

  const canBeEdited = !plan?.subscriptionsCount

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
    // When adding a new charge, scroll to the new charge element
    if (!!newChargeId) {
      const element = document.getElementById(newChargeId)
      const rootElement = document.getElementById('root')

      if (!element || !rootElement) return

      rootElement.scrollTo({ top: element.offsetTop - 72 - 16 })
    }
  }, [newChargeId])

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
        />
      </PageHeader>

      <Content>
        <Main>
          <div>
            {loading ? (
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
                        : 'text_624453d52e945301380e498e'
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
                  errorCode={errorCode}
                  formikProps={formikProps}
                  isEdition={isEdition}
                />

                <Card ref={containerRef}>
                  <SectionTitle variant="subhead">
                    <div>{translate('text_624453d52e945301380e49ce')}</div>
                    <Typography>{translate('text_624453d52e945301380e49d0')}</Typography>
                  </SectionTitle>

                  {!!formikProps.values.charges.length && (
                    <Charges>
                      {formikProps.values.charges.map((charge, i) => {
                        const id = getNewChargeId(charge.billableMetric.id, i)
                        const isNew = !plan?.charges?.find(
                          (chargeFetched) => chargeFetched?.id === charge.id
                        )

                        return (
                          <ChargeAccordion
                            id={id}
                            key={id}
                            isUsedInSubscription={!isNew && !canBeEdited}
                            currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
                            index={i}
                            disabled={isEdition && !canBeEdited && !isNew}
                            formikProps={formikProps}
                          />
                        )
                      })}
                    </Charges>
                  )}
                  <ChargeFooter>
                    <Button
                      startIcon="plus"
                      variant="quaternary"
                      data-test="add-charge"
                      onClick={() => addChargeDialogRef.current?.openDialog()}
                    >
                      {translate('text_624453d52e945301380e49d2')}
                    </Button>
                    {!!formikProps.values.charges.length &&
                      formikProps.values.interval === PlanInterval.Yearly && (
                        <ChargeInvoiceLine>
                          <SwitchField
                            labelPosition="left"
                            label={translate('text_62a30bc79dae432fb055330b')}
                            name="billChargesMonthly"
                            disabled={isEdition && !canBeEdited}
                            formikProps={formikProps}
                          />
                          <ChargeInvoiceTooltip
                            title={translate('text_62a30bc79dae432fb055330f')}
                            placement="top-end"
                          >
                            <Icon name="info-circle" />
                          </ChargeInvoiceTooltip>
                        </ChargeInvoiceLine>
                      )}
                  </ChargeFooter>
                </Card>

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

                <AddChargeDialog
                  ref={addChargeDialogRef}
                  addedBillableMetricCodes={
                    formikProps.values.charges.length
                      ? formikProps.values.charges.map((c) => c.billableMetric.code)
                      : []
                  }
                  onConfirm={(newCharge) => {
                    const previousCharges = [...formikProps.values.charges]
                    const newId = getNewChargeId(newCharge.id, previousCharges.length)

                    formikProps.setFieldValue('charges', [
                      ...previousCharges,
                      {
                        billableMetric: newCharge,
                        properties: !newCharge.flatGroups?.length
                          ? getPropertyShape({})
                          : undefined,
                        groupProperties: newCharge.flatGroups?.length
                          ? newCharge?.flatGroups.map((group) => {
                              return {
                                groupId: group.id,
                                values: getPropertyShape({}),
                              }
                            })
                          : undefined,
                        chargeModel: ChargeModelEnum.Standard,
                        amountCents: undefined,
                      },
                    ])
                    setNewChargeId(newId)
                  }}
                />
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

const Charges = styled.div`
  > * {
    margin-bottom: ${theme.spacing(6)};
  }
`

const SectionTitle = styled(Typography)`
  > div:first-child {
    margin-bottom: ${theme.spacing(3)};
  }
`

const ChargeFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
`

const ChargeInvoiceLine = styled.div`
  display: flex;
  align-items: center;
  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }
`

const ChargeInvoiceTooltip = styled(Tooltip)`
  height: ${IconSizeEnum.medium};
`

export default CreatePlan
