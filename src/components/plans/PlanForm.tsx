import { ReactNode, useRef, useEffect, useState } from 'react'
import { useFormik } from 'formik'
import { object, string, number, array } from 'yup'
import styled from 'styled-components'

import { ChargeAccordion } from '~/components/plans/ChargeAccordion'
import { EditPlanFragment } from '~/generated/graphql'
import { PlanInterval, CurrencyEnum, ChargeModelEnum } from '~/generated/graphql'
import { TextInputField, ButtonSelectorField, ComboBoxField, SwitchField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  Typography,
  Button,
  Skeleton,
  Icon,
  Tooltip,
  IconSizeEnum,
} from '~/components/designSystem'
import { theme, NAV_HEIGHT, Card } from '~/styles'
import { AddChargeDialog, AddChargeDialogRef } from '~/components/plans/AddChargeDialog'
import { PlanCodeSnippet } from '~/components/plans/PlanCodeSnippet'

import { PlanFormInput, LocalChargeInput } from './types'

interface PlanFormProps {
  plan?: EditPlanFragment
  isEdition?: boolean
  loading?: boolean
  children?: ReactNode
  onSave: (values: PlanFormInput) => Promise<void>
}

const getNewChargeId = (id: string, index: number) => `plan-charge-${id}-${index}`

export const PlanForm = ({ loading, plan, children, onSave, isEdition }: PlanFormProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const addChargeDialogRef = useRef<AddChargeDialogRef>(null)
  const { translate } = useInternationalization()
  const [newChargeId, setNewChargeId] = useState<string | null>(null)
  const formikProps = useFormik<PlanFormInput>({
    initialValues: {
      name: plan?.name || '',
      code: plan?.code || '',
      description: plan?.description || '',
      interval: plan?.interval || PlanInterval.Monthly,
      payInAdvance: plan?.payInAdvance || false,
      // @ts-ignore
      amountCents: isNaN(plan?.amountCents) ? undefined : plan?.amountCents / 100,
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
        ? plan?.charges.map(
            ({
              amount,
              fixedAmount,
              freeUnitsPerEvents,
              freeUnitsPerTotalAggregation,
              graduatedRanges,
              volumeRanges,
              packageSize,
              rate,
              ...charge
            }) => ({
              // Amount can be null and this breaks the validation
              amount: amount || undefined,
              packageSize:
                packageSize === null || packageSize === undefined ? undefined : packageSize,
              fixedAmount: fixedAmount || undefined,
              freeUnitsPerEvents: freeUnitsPerEvents || undefined,
              freeUnitsPerTotalAggregation: freeUnitsPerTotalAggregation || undefined,
              graduatedRanges: !graduatedRanges ? null : graduatedRanges,
              volumeRanges: !volumeRanges ? null : volumeRanges,
              rate: rate || undefined,
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
      trialPeriod: number().typeError(translate('text_624ea7c29103fd010732ab7d')),
      amountCurrency: string().required(''),
      charges: array().of(
        object().shape({
          chargeModel: string().required(''),
          amount: number().when('chargeModel', {
            is: (chargeModel: ChargeModelEnum) =>
              !!chargeModel &&
              [ChargeModelEnum.Standard, ChargeModelEnum.Package].includes(chargeModel),
            then: number().typeError(translate('text_624ea7c29103fd010732ab7d')).required(''),
          }),
          packageSize: number().when('chargeModel', {
            is: (chargeModel: ChargeModelEnum) =>
              !!chargeModel && ChargeModelEnum.Package === chargeModel,
            then: number()
              .min(1, 'text_6282085b4f283b0102655888')
              .required('text_6282085b4f283b0102655888'),
          }),
          rate: number().when('chargeModel', {
            is: (chargeModel: ChargeModelEnum) =>
              !!chargeModel && ChargeModelEnum.Percentage === chargeModel,
            then: number().min(0.001, 'text_62a0b7107afa2700a65ef70e').required(''),
          }),
          fixedAmount: number().when('chargeModel', {
            is: (chargeModel: ChargeModelEnum) =>
              !!chargeModel && ChargeModelEnum.Percentage === chargeModel,
            then: number().min(0.001, 'text_62a0b7107afa2700a65ef70e'),
          }),
          freeUnitsPerEvents: number().when('chargeModel', {
            is: (chargeModel: ChargeModelEnum) =>
              !!chargeModel && ChargeModelEnum.Percentage === chargeModel,
            then: number(),
          }),
          freeUnitsPerTotalAggregation: number().when('chargeModel', {
            is: (chargeModel: ChargeModelEnum) =>
              !!chargeModel && ChargeModelEnum.Percentage === chargeModel,
            then: number(),
          }),
          graduatedRanges: array()
            .when('chargeModel', {
              is: (chargeModel: ChargeModelEnum) =>
                !!chargeModel && chargeModel === ChargeModelEnum.Graduated,
              then: array()
                .test({
                  test: (graduatedRange) => {
                    let isValid = true

                    graduatedRange?.every(
                      ({ fromValue, toValue, perUnitAmount, flatAmount }, i) => {
                        if (isNaN(Number(perUnitAmount)) && isNaN(Number(flatAmount))) {
                          isValid = false
                          return false
                        }

                        if (
                          i < graduatedRange.length - 1 &&
                          (typeof fromValue !== 'number' || (fromValue || 0) > toValue)
                        ) {
                          isValid = false
                          return false
                        }

                        return true
                      }
                    )

                    return isValid
                  },
                })
                .min(2)
                .required(''),
            })
            .nullable(),
          volumeRanges: array()
            .when('chargeModel', {
              is: (chargeModel: ChargeModelEnum) =>
                !!chargeModel && chargeModel === ChargeModelEnum.Volume,
              then: array()
                .test({
                  test: (volumeRange) => {
                    let isValid = true

                    volumeRange?.every(({ fromValue, toValue, perUnitAmount, flatAmount }, i) => {
                      if (isNaN(Number(perUnitAmount)) && isNaN(Number(flatAmount))) {
                        isValid = false
                        return false
                      }

                      if (
                        i < volumeRange.length - 1 &&
                        (typeof fromValue !== 'number' || (fromValue || 0) > toValue)
                      ) {
                        isValid = false
                        return false
                      }

                      return true
                    })

                    return isValid
                  },
                })
                .min(2)
                .required(''),
            })
            .nullable(),
        })
      ),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })
  const chargeEditIndexLimit = plan?.charges?.length || 0

  useEffect(() => {
    // When adding a new charge, scroll to the new charge element
    if (!!newChargeId) {
      const element = document.getElementById(newChargeId)
      const rootElement = document.getElementById('root')

      if (!element || !rootElement) return

      rootElement.scrollTo({ top: element.offsetTop - 72 - 16, behavior: 'smooth' })
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
    <>
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
                    {translate(
                      isEdition ? 'text_625fd165963a7b00c8f59771' : 'text_624453d52e945301380e498a'
                    )}
                  </Title>
                  <Subtitle>
                    {translate(
                      isEdition ? 'text_625fd165963a7b00c8f5977b' : 'text_624453d52e945301380e498e'
                    )}
                  </Subtitle>
                </div>
                <Card>
                  <SectionTitle variant="subhead">
                    {translate('text_624453d52e945301380e4992')}
                  </SectionTitle>

                  <Line>
                    <TextInputField
                      name="name"
                      label={translate('text_624453d52e945301380e4998')}
                      placeholder={translate('text_624453d52e945301380e499c')}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                      formikProps={formikProps}
                    />
                    <TextInputField
                      name="code"
                      beforeChangeFormatter="code"
                      disabled={isEdition && !plan?.canBeDeleted}
                      label={translate('text_624453d52e945301380e499a')}
                      placeholder={translate('text_624453d52e945301380e499e')}
                      formikProps={formikProps}
                      infoText={translate('text_624d9adba93343010cd14ca1')}
                    />
                  </Line>
                  <TextInputField
                    name="description"
                    label={translate('text_624c5eadff7db800acc4c99f')}
                    placeholder={translate('text_624453d52e945301380e49a2')}
                    rows="3"
                    multiline
                    formikProps={formikProps}
                  />
                </Card>
                <Card>
                  <SectionTitle variant="subhead">
                    {translate('text_624453d52e945301380e49a6')}
                  </SectionTitle>
                  <ButtonSelectorField
                    disabled={isEdition && !plan?.canBeDeleted}
                    name="interval"
                    label={translate('text_624c5eadff7db800acc4c9ad')}
                    infoText={translate('text_624d9adba93343010cd14ca3')}
                    formikProps={formikProps}
                    options={[
                      {
                        label: translate('text_624453d52e945301380e49aa'),
                        value: PlanInterval.Monthly,
                      },
                      {
                        label: translate('text_624453d52e945301380e49ac'),
                        value: PlanInterval.Yearly,
                      },
                      {
                        label: translate('text_62b32ec6b0434070791c2d4c'),
                        value: PlanInterval.Weekly,
                      },
                    ]}
                  />

                  <LineAmount>
                    <TextInputField
                      name="amountCents"
                      beforeChangeFormatter={['positiveNumber', 'decimal']}
                      disabled={isEdition && !plan?.canBeDeleted}
                      label={translate('text_624453d52e945301380e49b6')}
                      placeholder={translate('text_624453d52e945301380e49b8')}
                      formikProps={formikProps}
                    />
                    <ComboBoxField
                      disabled={isEdition && !plan?.canBeDeleted}
                      name="amountCurrency"
                      data={Object.values(CurrencyEnum).map((currencyType) => ({
                        value: currencyType,
                      }))}
                      disableClearable
                      formikProps={formikProps}
                    />
                  </LineAmount>

                  <SwitchField
                    name="payInAdvance"
                    disabled={isEdition && !plan?.canBeDeleted}
                    label={translate('text_624d90e6a93343010cd14b40')}
                    subLabel={translate('text_624d90e6a93343010cd14b4c')}
                    formikProps={formikProps}
                  />

                  <TextInputField
                    name="trialPeriod"
                    disabled={isEdition && !plan?.canBeDeleted}
                    label={translate('text_624453d52e945301380e49c2')}
                    beforeChangeFormatter={['positiveNumber', 'decimal']}
                    placeholder={translate('text_624453d52e945301380e49c4')}
                    formikProps={formikProps}
                    InputProps={{
                      endAdornment: (
                        <InputEnd color={!plan?.canBeDeleted ? 'textPrimary' : 'textSecondary'}>
                          {translate('text_624453d52e945301380e49c6')}
                        </InputEnd>
                      ),
                    }}
                  />
                </Card>
                <Card ref={containerRef}>
                  <SectionTitle variant="subhead">
                    <div>{translate('text_624453d52e945301380e49ce')}</div>
                    <Typography>{translate('text_624453d52e945301380e49d0')}</Typography>
                  </SectionTitle>

                  {!!formikProps.values.charges.length && (
                    <Charges>
                      {formikProps.values.charges.map((charge, i) => {
                        const id = getNewChargeId(charge.billableMetric.id, i)

                        return (
                          <ChargeAccordion
                            id={id}
                            key={id}
                            currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
                            index={i}
                            disabled={isEdition && !plan?.canBeDeleted && chargeEditIndexLimit > i}
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
                            disabled={isEdition && !plan?.canBeDeleted}
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
                {children}
                <ButtonContainer>
                  <Button
                    disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
                    fullWidth
                    size="large"
                    onClick={formikProps.submitForm}
                  >
                    {translate(
                      isEdition ? 'text_625fd165963a7b00c8f598aa' : 'text_62ff5d01a306e274d4ffcc75'
                    )}
                  </Button>
                </ButtonContainer>

                <AddChargeDialog
                  ref={addChargeDialogRef}
                  onConfirm={(newCharge) => {
                    const previousCharges = [...formikProps.values.charges]
                    const newId = getNewChargeId(newCharge.id, previousCharges.length)

                    formikProps.setFieldValue('charges', [
                      ...previousCharges,
                      {
                        billableMetric: newCharge,
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
    </>
  )
}

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
  padding: 0 ${theme.spacing(8)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
  padding: 0 ${theme.spacing(8)};
`

const InputEnd = styled(Typography)`
  margin-right: ${theme.spacing(4)};
`

const ButtonContainer = styled.div`
  margin: 0 ${theme.spacing(6)} ${theme.spacing(20)} ${theme.spacing(6)};
`

const Charges = styled.div`
  > * {
    margin-bottom: ${theme.spacing(6)};
  }
`

const LineAmount = styled.div`
  display: flex;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
    flex: 1;
  }

  > *:last-child {
    max-width: 120px;
    margin-top: 24px;
  }
`

const SectionTitle = styled(Typography)`
  > div:first-child {
    margin-bottom: ${theme.spacing(3)};
  }
`

const Line = styled.div`
  display: flex;
  margin: -${theme.spacing(3)} -${theme.spacing(3)} ${theme.spacing(3)} -${theme.spacing(3)};
  flex-wrap: wrap;

  > * {
    flex: 1;
    margin: ${theme.spacing(3)};
    min-width: 110px;
  }
`

const Side = styled.div`
  width: 40%;
  position: relative;
  background-color: ${theme.palette.grey[100]};

  > div {
    position: sticky;
    top: ${NAV_HEIGHT}px;
    height: calc(100vh - ${NAV_HEIGHT}px);
  }

  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const Content = styled.div`
  display: flex;
`

const Main = styled.div`
  width: 60%;
  box-sizing: border-box;
  padding: ${theme.spacing(12)} ${theme.spacing(12)} 0 ${theme.spacing(12)};

  > div {
    max-width: 720px;

    > *:not(:last-child) {
      margin-bottom: ${theme.spacing(8)};
    }
  }

  ${theme.breakpoints.down('md')} {
    width: 100%;
    padding: ${theme.spacing(12)} ${theme.spacing(4)} 0;
  }
`

const SkeletonHeader = styled.div`
  padding: 0 ${theme.spacing(8)};
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
