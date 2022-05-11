import { ReactNode, useRef, useEffect, useState } from 'react'
import { useFormik } from 'formik'
import { object, string, number, array } from 'yup'
import styled from 'styled-components'

import { ChargeAccordion } from '~/components/plans/ChargeAccordion'
import { EditPlanFragment } from '~/generated/graphql'
import { PlanInterval, CurrencyEnum } from '~/generated/graphql'
import {
  TextInputField,
  ButtonSelectorField,
  ComboBoxField,
  SwitchField,
  AmountField,
} from '~/components/form'
import { useI18nContext } from '~/core/I18nContext'
import { Typography, Button, Skeleton } from '~/components/designSystem'
import { theme, NAV_HEIGHT } from '~/styles'
import { AddChargeDialog, AddChargeDialogRef } from '~/components/plans/AddChargeDialog'
import { ChargeModelEnum } from '~/generated/graphql'
import { CodeSnippet } from '~/components/CodeSnippet'

import { PlanFormInput, LocalChargeInput } from './types'

interface PlanFormProps {
  plan?: EditPlanFragment
  isEdition?: boolean
  loading?: boolean
  children?: ReactNode
  onSave: (values: PlanFormInput) => Promise<void>
}

// TODO Update the snippet
const code = `[
  {
    "customerID": "{{customer_id}}",
    "meterApiName": "",
    "meterValue": 1,
    "meterTimeInMillis": 18593875774,
  }
]`

export const PlanForm = ({ loading, plan, children, onSave, isEdition }: PlanFormProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const addChargeDialogRef = useRef<AddChargeDialogRef>(null)
  const { translate } = useI18nContext()
  const [newChargeId, setNewChargeId] = useState<string | null>(null)
  const formikProps = useFormik<PlanFormInput>({
    initialValues: {
      name: '',
      code: '',
      description: '',
      interval: PlanInterval.Monthly,
      payInAdvance: false,
      // @ts-ignore
      amountCents: undefined,
      amountCurrency: CurrencyEnum.Usd,
      // @ts-ignore
      trialPeriod: undefined,
      charges: [] as LocalChargeInput[],
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      interval: string().required(''),
      amountCents: number().typeError(translate('text_624ea7c29103fd010732ab7d')).required(''),
      trialPeriod: number().typeError(translate('text_624ea7c29103fd010732ab7d')),
      amountCurrency: string().required(''),
      charges: array().of(
        object().shape({
          chargeModel: string().required(''),
          amountCents: string().required(''),
          amountCurrency: string().required(''),
        })
      ),
    }),
    validateOnMount: true,
    onSubmit: onSave,
  })

  useEffect(() => {
    if (!!plan && !!plan.code) {
      formikProps.setValues({
        name: plan?.name ?? '',
        code: plan?.code ?? '',
        description: plan?.description ?? '',
        interval: plan?.interval ?? PlanInterval.Monthly,
        payInAdvance: plan?.payInAdvance ?? false,
        // @ts-ignore
        amountCents: plan?.amountCents ?? undefined,
        amountCurrency: plan?.amountCurrency ?? CurrencyEnum.Usd,
        // @ts-ignore
        trialPeriod: plan?.trialPeriod ?? undefined,
        charges: plan?.charges ?? ([] as LocalChargeInput[]),
      })
    }
  }, [plan])

  useEffect(() => {
    // When adding a new charge, scroll to the new charge element
    if (!!newChargeId) {
      const element = document.getElementById(newChargeId)
      const rootElement = document.getElementById('root')

      if (!element || !rootElement) return

      rootElement.scrollTo({ top: element.offsetTop - 72 - 16, behavior: 'smooth' })
    }
  }, [newChargeId])

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
                      replace={{ toReplace: ' ', by: '_' }}
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
                <CardSection>
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
                    ]}
                  />

                  <LineAmount>
                    <AmountField
                      name="amountCents"
                      disabled={isEdition && !plan?.canBeDeleted}
                      label={translate('text_624453d52e945301380e49b6')}
                      placeholder={translate('text_624453d52e945301380e49b8')}
                      formikProps={formikProps}
                    />
                    <ComboBoxField
                      disabled={isEdition && !plan?.canBeDeleted}
                      name="amountCurrency"
                      data={[
                        {
                          label: translate('text_624453d52e945301380e49ba'),
                          value: CurrencyEnum.Usd,
                        },
                        {
                          label: 'EUR', // TODO
                          value: CurrencyEnum.Eur,
                        },
                      ]}
                      disableClearable
                      formikProps={formikProps}
                    />
                  </LineAmount>

                  <SwitchBlock>
                    <SwitchField
                      name="payInAdvance"
                      disabled={isEdition && !plan?.canBeDeleted}
                      formikProps={formikProps}
                    />
                    <div>
                      <Typography color="textSecondary">
                        {translate('text_624d90e6a93343010cd14b40')}
                      </Typography>
                      <Typography variant="caption">
                        {translate('text_624d90e6a93343010cd14b4c')}
                      </Typography>
                    </div>
                  </SwitchBlock>

                  <TextInputField
                    name="trialPeriod"
                    disabled={isEdition && !plan?.canBeDeleted}
                    label={translate('text_624453d52e945301380e49c2')}
                    type="number"
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
                </CardSection>
                <Card ref={containerRef}>
                  <SectionTitle variant="subhead">
                    <div>{translate('text_624453d52e945301380e49ce')}</div>
                    <Typography>{translate('text_624453d52e945301380e49d0')}</Typography>
                  </SectionTitle>

                  {!!formikProps.values.charges.length && (
                    <Charges>
                      {formikProps.values.charges.map((charge, i) => {
                        return (
                          <ChargeAccordion
                            id={charge.billableMetric.id}
                            key={`plan-charge-${charge.billableMetric.id}`}
                            currency={formikProps.values.amountCurrency}
                            index={i}
                            disabled={isEdition && !plan?.canBeDeleted}
                            formikProps={formikProps}
                          />
                        )
                      })}
                    </Charges>
                  )}

                  <Button
                    startIcon="plus"
                    variant="quaternary"
                    disabled={isEdition && !plan?.canBeDeleted}
                    onClick={() => addChargeDialogRef.current?.openDialog()}
                  >
                    {translate('text_624453d52e945301380e49d2')}
                  </Button>
                </Card>
                {children}
                <ButtonContainer>
                  <Button
                    disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
                    fullWidth
                    size="large"
                    loading={formikProps.isSubmitting}
                    onClick={formikProps.submitForm}
                  >
                    {translate(
                      isEdition ? 'text_625fd165963a7b00c8f598aa' : 'text_624453d52e945301380e49d4'
                    )}
                  </Button>
                </ButtonContainer>

                <AddChargeDialog
                  ref={addChargeDialogRef}
                  disabledItems={formikProps.values.charges.map((c) => c.billableMetric.id)}
                  onConfirm={(newCharge) => {
                    const previousCharges = [...formikProps.values.charges]

                    formikProps.setFieldValue('charges', [
                      ...previousCharges,
                      {
                        billableMetric: newCharge,
                        chargeModel: ChargeModelEnum.Standard,
                        amountCents: undefined,
                        amountCurrency: formikProps.values.amountCurrency, // TODO
                      },
                    ])

                    setNewChargeId(newCharge.id)
                  }}
                />
              </>
            )}
          </div>
        </Main>
        <Side>
          <div>
            <CodeSnippet loading={loading} language="bash" code={code} />
          </div>
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

const Card = styled.div`
  padding: ${theme.spacing(8)};
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  box-sizing: border-box;
`

const InputEnd = styled(Typography)`
  margin-right: ${theme.spacing(4)};
`

const SwitchBlock = styled.div`
  display: flex;
  align-items: center;
  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const ButtonContainer = styled.div`
  margin: 0 ${theme.spacing(6)} ${theme.spacing(20)} ${theme.spacing(6)};
`

const Charges = styled.div`
  > * {
    margin-bottom: ${theme.spacing(6)};
  }
`

const CardSection = styled(Card)`
  > *:not(:first-child):not(:last-child) {
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
  margin-bottom: ${theme.spacing(6)};

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
