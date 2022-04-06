import { gql } from '@apollo/client'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useFormik } from 'formik'
import { object, string, number, array } from 'yup'

import { theme, PageHeader, NAV_HEIGHT } from '~/styles'
import { Typography, Button } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { PLANS_ROUTE } from '~/core/router'
import EmojiParty from '~/public/images/party.png'
import { CodeSnippet } from '~/components/CodeSnippet'
import { AddChargeDialog, AddChargeDialogRef } from '~/components/createPlan/AddChargeDialog'
import { ChargeAccordion } from '~/components/createPlan/ChargeAccordion'
import {
  PlanFrequency,
  BillingPeriodEnum,
  CurrencyEnum,
  useCreatePlanMutation,
  ChargeFrequency,
  ChargeModelEnum,
} from '~/generated/graphql'
import { TextInputField, ButtonSelectorField, ComboBoxField, SwitchField } from '~/components/form'
import { PlanForm, LocalChargeInput } from '~/components/createPlan/types'

gql`
  mutation createPlan($input: CreatePlanInput!) {
    createPlan(input: $input) {
      id
    }
  }
`

const CreatePlan = () => {
  const [isCreated, setIsCreated] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const addChargeDialogRef = useRef<AddChargeDialogRef>(null)
  const [create] = useCreatePlanMutation({
    onCompleted({ createPlan }) {
      if (!!createPlan) {
        setIsCreated(true)
      }
    },
  })
  const { translate } = useI18nContext()
  let navigate = useNavigate()
  const [newChargeId, setNewChargeId] = useState<string | null>(null)
  const formikProps = useFormik<PlanForm>({
    initialValues: {
      name: '',
      code: '',
      description: '',
      frequency: PlanFrequency.Monthly,
      billingPeriod: BillingPeriodEnum.BeginningOfPeriod,
      payInAdvance: false,
      // @ts-ignore
      amountCents: undefined,
      amountCurrency: CurrencyEnum.Usd,
      vatRate: 0,
      // @ts-ignore
      trialPeriod: undefined,
      proRata: true,
      charges: [] as LocalChargeInput[],
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      frequency: string().required(''),
      amountCents: number().required(''),
      amountCurrency: string().required(''),
      charges: array().of(
        object().shape({
          chargeModel: string().required(''),
          amountCents: string().required(''),
          amountCurrency: string().required(''),
          frequency: string().required(''),
        })
      ),
    }),
    validateOnMount: true,
    onSubmit: async ({ amountCents, trialPeriod, vatRate, charges, ...values }) => {
      await create({
        variables: {
          input: {
            amountCents: Number(amountCents),
            trialPeriod: Number(trialPeriod),
            vatRate: Number(vatRate),
            charges: charges.map(
              ({
                billableMetric,
                amountCents: chargeAmountCents,
                vatRate: chargeVatRate,
                ...charge
              }) => {
                return {
                  amountCents: Number(chargeAmountCents),
                  vatRate: Number(chargeVatRate),
                  billableMetricId: billableMetric.id,
                  ...charge,
                }
              }
            ),
            ...values,
          },
        },
      })
    },
  })

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
    <div>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_624453d52e945301380e4988')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() => warningDialogRef.current?.openDialog()}
        />
      </PageHeader>

      {isCreated ? (
        <SuccessCard>
          <img src={EmojiParty} alt="success emoji" />
          <SuccessTitle variant="subhead">
            {translate('text_624455d859b1b000a8e17bf3')}
          </SuccessTitle>
          <SuccessDescription>{translate('text_624455d859b1b000a8e17bf5')}</SuccessDescription>
          <div>
            <Button
              variant="secondary"
              onClick={() => {
                formikProps.resetForm()
                setIsCreated(false)
              }}
            >
              {translate('text_624455d859b1b000a8e17bf7')}
            </Button>
            <Button variant="secondary" onClick={() => navigate(PLANS_ROUTE)}>
              {translate('text_624455d859b1b000a8e17bf9')}
            </Button>
          </div>
        </SuccessCard>
      ) : (
        <Content>
          <div>
            <Main>
              <div>
                <Title variant="headline">{translate('text_624453d52e945301380e498a')}</Title>
                <Subtitle>{translate('text_624453d52e945301380e498e')}</Subtitle>
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
                  name="frequency"
                  label={translate('text_624c5eadff7db800acc4c9ad')}
                  infoText={translate('text_624d9adba93343010cd14ca3')}
                  formikProps={formikProps}
                  options={[
                    {
                      label: translate('text_624453d52e945301380e49aa'),
                      value: PlanFrequency.Monthly,
                    },
                    {
                      label: translate('text_624453d52e945301380e49ac'),
                      value: PlanFrequency.Yearly,
                    },
                  ]}
                />

                <ButtonSelectorField
                  name="billingPeriod"
                  label={translate('text_624d90e6a93343010cd14b34')}
                  infoText={translate('text_624d9adba93343010cd14ca5')}
                  formikProps={formikProps}
                  options={[
                    {
                      label: translate(
                        formikProps.values.frequency === PlanFrequency.Monthly
                          ? 'text_624453d52e945301380e49b0'
                          : 'text_62447c3648f57b0163ae3e62'
                      ),
                      value: BillingPeriodEnum.BeginningOfPeriod,
                    },
                    {
                      label: translate('text_624453d52e945301380e49b2'),
                      value: BillingPeriodEnum.SubscriptionDate,
                    },
                  ]}
                />

                <LineAmount>
                  <TextInputField
                    name="amountCents"
                    label={translate('text_624453d52e945301380e49b6')}
                    placeholder={translate('text_624453d52e945301380e49b8')}
                    type="number"
                    formikProps={formikProps}
                  />
                  <ComboBoxField
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
                  <SwitchField name="payInAdvance" formikProps={formikProps} />
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
                  name="vatRate"
                  label={translate('text_624453d52e945301380e49bc')}
                  placeholder={translate('text_624453d52e945301380e49be')}
                  formikProps={formikProps}
                  type="number"
                  InputProps={{
                    endAdornment: (
                      <InputEnd color="textSecondary">
                        {translate('text_624453d52e945301380e49c0')}
                      </InputEnd>
                    ),
                  }}
                />

                <TextInputField
                  name="trialPeriod"
                  label={translate('text_624453d52e945301380e49c2')}
                  placeholder={translate('text_624453d52e945301380e49c4')}
                  type="number"
                  formikProps={formikProps}
                  InputProps={{
                    endAdornment: (
                      <InputEnd color="textSecondary">
                        {translate('text_624453d52e945301380e49c6')}
                      </InputEnd>
                    ),
                  }}
                />
                <SwitchBlock>
                  <SwitchField name="proRata" formikProps={formikProps} />
                  <div>
                    <Typography color="textSecondary">
                      {translate('text_624453d52e945301380e49c8')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_624453d52e945301380e49cc')}
                    </Typography>
                  </div>
                </SwitchBlock>
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
                          formikProps={formikProps}
                        />
                      )
                    })}
                  </Charges>
                )}

                <Button
                  startIcon="plus"
                  variant="quaternary"
                  onClick={() => addChargeDialogRef.current?.openDialog()}
                >
                  {translate('text_624453d52e945301380e49d2')}
                </Button>
              </Card>
              <MobileOnly>
                <CodeSnippet />
              </MobileOnly>
              <ButtonContainer>
                <Button
                  disabled={!formikProps.isValid}
                  fullWidth
                  size="large"
                  onClick={formikProps.submitForm}
                >
                  {translate('text_624453d52e945301380e49d4')}
                </Button>
              </ButtonContainer>
            </Main>
            <Side>
              <Card>
                <CodeSnippet />
              </Card>
            </Side>
          </div>
        </Content>
      )}

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
              frequency: ChargeFrequency.Recurring,
              proRata: false,
              vatRate: 0,
            },
          ])

          setNewChargeId(newCharge.id)
        }}
      />

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_624454dd67656e00c534bc35')}
        description={translate('text_624454dd67656e00c534bc3b')}
        continueText={translate('text_624454dd67656e00c534bc41')}
        onContinue={() => navigate(PLANS_ROUTE)}
      />
    </div>
  )
}

const Card = styled.div`
  padding: ${theme.spacing(8)};
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  box-sizing: border-box;
`

const SuccessCard = styled(Card)`
  max-width: 672px;
  margin: ${theme.spacing(12)} auto 0;

  > img {
    width: 40px;
    height: 40px;
    margin-bottom: ${theme.spacing(5)};
  }

  > *:last-child {
    display: flex;
    > *:first-child {
      margin-right: ${theme.spacing(3)};
    }
  }
`

const SuccessTitle = styled(Typography)`
  margin-bottom: ${theme.spacing(3)};
`

const SuccessDescription = styled(Typography)`
  margin-bottom: ${theme.spacing(5)};
`

const Main = styled.div`
  margin-right: ${theme.spacing(8)};
  flex: 1;
  padding-top: ${theme.spacing(12)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }

  ${theme.breakpoints.down('md')} {
    margin-right: 0;
  }
`

const Side = styled.div`
  width: 408px;
  position: relative;

  > div {
    position: sticky;
    top: calc(${NAV_HEIGHT}px + ${theme.spacing(12)});
  }

  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const Content = styled.div`
  > div {
    display: flex;
    max-width: 1024px;
    padding: ${theme.spacing(4)};
    margin: auto;

    ${theme.breakpoints.down('md')} {
      max-width: calc(100vw - ${theme.spacing(8)});

      > div {
        max-width: inherit;
      }
    }
  }

  ${theme.breakpoints.down('md')} {
    max-width: 100vw;
  }
`

const MobileOnly = styled(Card)`
  display: none;

  ${theme.breakpoints.down('md')} {
    display: block;
  }
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
  padding: 0 ${theme.spacing(8)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
  padding: 0 ${theme.spacing(8)};
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

export default CreatePlan
