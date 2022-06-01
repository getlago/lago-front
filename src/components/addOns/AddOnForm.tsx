import { useFormik } from 'formik'
import { object, string, number } from 'yup'
import styled from 'styled-components'

import { CreateAddOnInput, CurrencyEnum, EditAddOnFragment } from '~/generated/graphql'
import { theme, NAV_HEIGHT } from '~/styles'
import { Typography, Button, Skeleton } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { TextInputField, ComboBoxField } from '~/components/form'

// import { CouponCodeSnippet } from './CouponCodeSnippet'

interface AddOnFormProps {
  addOn?: EditAddOnFragment
  loading?: boolean
  isEdition?: boolean
  onSave: (values: CreateAddOnInput) => Promise<void>
}

export const AddOnForm = ({ isEdition, loading, addOn, onSave }: AddOnFormProps) => {
  const { translate } = useI18nContext()
  const formikProps = useFormik<CreateAddOnInput>({
    initialValues: {
      name: addOn?.name || '',
      code: addOn?.code || '',
      description: addOn?.description || '',
      // @ts-ignore
      amountCents: addOn?.amountCents ? addOn?.amountCents / 100 : addOn?.amountCents || undefined,
      amountCurrency: addOn?.amountCurrency || CurrencyEnum.Usd,
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      amountCents: number().min(1, 'text_62978ebe99054a011fc189e0').required(''),
      amountCurrency: string().required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })

  return (
    <Content>
      <Main>
        <div>
          {loading ? (
            <>
              <SkeletonHeader>
                <Skeleton variant="text" width={280} height={12} marginBottom={theme.spacing(5)} />
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
                    isEdition ? 'text_629728388c4d2300e2d38041' : 'text_629728388c4d2300e2d3803d'
                  )}
                </Title>
                <Subtitle>
                  {translate(
                    isEdition ? 'text_629728388c4d2300e2d38065' : 'text_629728388c4d2300e2d38061'
                  )}
                </Subtitle>
              </div>
              <Card>
                <SectionTitle variant="subhead">
                  {translate('text_629728388c4d2300e2d38079')}
                </SectionTitle>

                <Line>
                  <TextInputField
                    name="name"
                    label={translate('text_629728388c4d2300e2d38091')}
                    placeholder={translate('text_629728388c4d2300e2d380a5')}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    formikProps={formikProps}
                  />
                  <TextInputField
                    name="code"
                    beforeChangeFormatter="code"
                    label={translate('text_629728388c4d2300e2d380b7')}
                    placeholder={translate('text_629728388c4d2300e2d380d9')}
                    formikProps={formikProps}
                    infoText={translate('text_629778b2a517d100c19bc524')}
                  />
                </Line>
                <TextInputField
                  name="description"
                  label={translate('text_629728388c4d2300e2d380f1')}
                  placeholder={translate('text_629728388c4d2300e2d38103')}
                  rows="3"
                  multiline
                  formikProps={formikProps}
                />
              </Card>
              <Card>
                <SectionTitle variant="subhead">
                  {translate('text_629728388c4d2300e2d38117')}
                </SectionTitle>

                <LineAmount>
                  <TextInputField
                    name="amountCents"
                    beforeChangeFormatter={['positiveNumber', 'decimal']}
                    label={translate('text_629728388c4d2300e2d3812d')}
                    placeholder={translate('text_629728388c4d2300e2d3813d')}
                    formikProps={formikProps}
                  />
                  <ComboBoxField
                    name="amountCurrency"
                    data={Object.values(CurrencyEnum).map((currencyType) => ({
                      value: currencyType,
                    }))}
                    disableClearable
                    formikProps={formikProps}
                  />
                </LineAmount>
              </Card>

              <ButtonContainer>
                <SubmitButton
                  disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
                  fullWidth
                  size="large"
                  loading={formikProps.isSubmitting}
                  onClick={formikProps.submitForm}
                >
                  {translate(
                    isEdition ? 'text_629728388c4d2300e2d38170' : 'text_629728388c4d2300e2d38179'
                  )}
                </SubmitButton>
              </ButtonContainer>
            </>
          )}
        </div>
      </Main>
      <Side>{/* <CouponCodeSnippet loading={loading} coupon={formikProps.values} /> */}</Side>
    </Content>
  )
}

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

const Content = styled.div`
  display: flex;
  min-height: calc(100vh - ${NAV_HEIGHT}px);
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
  padding: 0 ${theme.spacing(8)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
  padding: 0 ${theme.spacing(8)};
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

const Card = styled.div`
  padding: ${theme.spacing(8)};
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  box-sizing: border-box;

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const SkeletonHeader = styled.div`
  padding: 0 ${theme.spacing(8)};
`

const SubmitButton = styled(Button)`
  margin-bottom: ${theme.spacing(20)};
`

const SectionTitle = styled(Typography)`
  margin-bottom: ${theme.spacing(6)};
`

const ButtonContainer = styled.div`
  margin: 0 ${theme.spacing(6)};
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
