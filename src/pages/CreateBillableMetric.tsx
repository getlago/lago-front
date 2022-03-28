import { useState } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import { object, string } from 'yup'

import { theme, PageHeader, NAV_HEIGHT } from '~/styles'
import { Typography, Button } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { BILLABLE_METRICS_ROUTE } from '~/core/router'
import { CodeSnippet } from '~/components/CodeSnippet'
import { TextInputField, ComboBoxField } from '~/components/form'
import { useCreateBillableMetricMutation, AggregationTypeEnum } from '~/generated/graphql'
import EmojiParty from '~/public/images/party.png'

gql`
  mutation createBillableMetric($input: CreateBillableMetricInput!) {
    createBillableMetric(input: $input) {
      id
    }
  }
`

const CreateBillableMetric = () => {
  const { translate } = useI18nContext()
  const [isCreated, setIsCreated] = useState<boolean>(false)
  let navigate = useNavigate()
  const [create] = useCreateBillableMetricMutation({
    onCompleted({ createBillableMetric }) {
      if (!!createBillableMetric) {
        setIsCreated(true)
      }
    },
  })
  const formikProps = useFormik({
    initialValues: {
      name: '',
      code: '',
      description: '',
      aggregationType: '',
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      aggregationType: string().required(''),
    }),
    validateOnMount: true,
    onSubmit: async (values) => {
      await create({
        variables: {
          input: {
            name: values.name,
            code: values.code,
            description: values.description,
            aggregationType: values.aggregationType as AggregationTypeEnum,
          },
        },
      })
    },
  })

  return (
    <Page>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_623b42ff8ee4e000ba87d0ae')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() => navigate(BILLABLE_METRICS_ROUTE)}
        />
      </PageHeader>
      {isCreated ? (
        <SuccessCard>
          <img src={EmojiParty} alt="success emoji" />
          <SuccessTitle variant="subhead">
            {translate('text_623dfd731788a100ec660f14')}
          </SuccessTitle>
          <SuccessDescription>{translate('text_623dfd731788a100ec660f16')}</SuccessDescription>
          <div>
            <Button
              variant="secondary"
              onClick={() => {
                formikProps.resetForm()
                setIsCreated(false)
              }}
            >
              {translate('text_623dfd731788a100ec660f18')}
            </Button>
            <Button variant="secondary" onClick={() => navigate(BILLABLE_METRICS_ROUTE)}>
              {translate('text_623dfd731788a100ec660f1a')}
            </Button>
          </div>
        </SuccessCard>
      ) : (
        <Container>
          <Content>
            <Main>
              <Title variant="headline">{translate('text_623b42ff8ee4e000ba87d0b0')}</Title>
              <Subtitle>{translate('text_623b42ff8ee4e000ba87d0b4')}</Subtitle>
              <Card>
                <SectionTitle variant="subhead">
                  {translate('text_623b42ff8ee4e000ba87d0b8')}
                </SectionTitle>

                <Line>
                  <TextInputField
                    name="name"
                    label={translate('text_623b42ff8ee4e000ba87d0be')}
                    placeholder={translate('text_6241cc759211e600ea57f4c7')}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    formikProps={formikProps}
                  />
                  <TextInputField
                    name="code"
                    label={translate('text_623b42ff8ee4e000ba87d0c0')}
                    placeholder={translate('text_623b42ff8ee4e000ba87d0c4')}
                    formikProps={formikProps}
                  />
                </Line>
                <TextInputField
                  name="description"
                  label={translate('text_623b42ff8ee4e000ba87d0c8')}
                  placeholder={translate('text_623b42ff8ee4e000ba87d0ca')}
                  rows="3"
                  multiline
                  formikProps={formikProps}
                />
              </Card>
              <Card>
                <SectionTitle variant="subhead">
                  {translate('text_623b42ff8ee4e000ba87d0cc')}
                </SectionTitle>

                <ComboBoxField
                  name="aggregationType"
                  label={translate('text_623b42ff8ee4e000ba87d0ce')}
                  placeholder={translate('text_623b42ff8ee4e000ba87d0d0')}
                  data={[
                    {
                      label: translate('text_623c4a8c599213014cacc9de'),
                      value: AggregationTypeEnum.CountAgg,
                    },
                  ]}
                  helperText={
                    formikProps.values?.aggregationType === AggregationTypeEnum.CountAgg
                      ? translate('text_6241cc759211e600ea57f4f1')
                      : translate('text_623b42ff8ee4e000ba87d0d2')
                  }
                  formikProps={formikProps}
                />
              </Card>
              <MobileOnly>
                <CodeSnippet />
              </MobileOnly>
              <ButtonContainer>
                <SubmitButton
                  disabled={!formikProps.isValid}
                  fullWidth
                  size="large"
                  onClick={formikProps.submitForm}
                >
                  {translate('text_623b42ff8ee4e000ba87d0d4')}
                </SubmitButton>
              </ButtonContainer>
            </Main>
            <Space></Space>
          </Content>
          <Side>
            <CodeSnippet />
          </Side>
        </Container>
      )}
    </Page>
  )
}

export default CreateBillableMetric

const Page = styled.div`
  height: 100vh;
`

const Container = styled.div`
  overflow: hidden;
  max-width: 1056px;
  margin: auto;
  width: 100%;
  position: relative;
  height: calc(100vh - ${NAV_HEIGHT}px);
  min-height: 524px;
`

const Content = styled.div`
  padding-top: ${theme.spacing(12)};
  display: flex;
  justify-content: space-around;
  box-sizing: border-box;
  padding: 0 ${theme.spacing(4)};
  height: calc(100vh - ${NAV_HEIGHT}px);
  min-height: 524px;
  overflow: auto;

  > * {
    max-width: 100%;
  }
`

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

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
  padding: 0 ${theme.spacing(8)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
  padding: 0 ${theme.spacing(8)};
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

const SectionTitle = styled(Typography)`
  margin-bottom: ${theme.spacing(6)};
`

const MobileOnly = styled(Card)`
  display: none;

  ${theme.breakpoints.down('md')} {
    display: block;
  }
`

const Side = styled(Card)`
  width: 408px;
  position: absolute;
  right: ${theme.spacing(4)};
  top: ${theme.spacing(12)};

  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const Space = styled.div`
  width: 408px;

  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const SubmitButton = styled(Button)`
  margin-bottom: ${theme.spacing(20)};
`

const ButtonContainer = styled.div`
  margin: 0 ${theme.spacing(6)};
`
